import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { WebhookPayload } from "@/lib/sms-activate"
import { notifyOtpReceived } from "@/lib/notification-service"

/**
 * SMS-Activate Webhook Handler
 * Documentation: https://sms-activate.io/api2#webhookInfo
 *
 * Receives real-time OTP notifications when SMS arrives
 * Expected webhook format:
 * {
 *   "activationId": 123456,
 *   "service": "wa",
 *   "text": "Your verification code is 123456",
 *   "code": "123456",
 *   "country": 2,
 *   "receivedAt": "2023-01-01 12:00:00"
 * }
 *
 * Webhook IP whitelist: 188.42.218.183, 142.91.156.119
 */

const WEBHOOK_ALLOWED_IPS = ["188.42.218.183", "142.91.156.119"]

function getClientIP(request: Request): string | null {
  // Check various headers for client IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP.trim()
  }

  return null
}

function isIPAllowed(ip: string | null): boolean {
  if (!ip) return false

  // In development, allow all IPs
  if (process.env.NODE_ENV === "development") {
    return true
  }

  return WEBHOOK_ALLOWED_IPS.includes(ip)
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let webhookLogId: string | null = null

  try {
    // Verify IP whitelist
    const clientIP = getClientIP(request)
    console.log(`[SMS-Activate Webhook] Request from IP: ${clientIP}`)

    if (!isIPAllowed(clientIP)) {
      console.warn(`[SMS-Activate Webhook] Blocked request from unauthorized IP: ${clientIP}`)
      return NextResponse.json({ error: "Unauthorized IP address" }, { status: 403 })
    }

    const payload: WebhookPayload = await request.json()
    console.log(`[SMS-Activate Webhook] Received payload:`, payload)

    // Validate payload structure
    if (!payload.activationId || !payload.code) {
      console.error("[SMS-Activate Webhook] Invalid payload structure")
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Log webhook receipt
    const { data: webhookLog } = await supabase
      .from("webhook_logs")
      .insert({
        provider: "sms-activate",
        event_type: "otp_received",
        payload: payload as any,
        signature_valid: true,
        processing_status: "pending",
      })
      .select("id")
      .single()

    if (webhookLog) {
      webhookLogId = webhookLog.id
    }

    // Find rental by activation_id
    const { data: rental, error: rentalError } = await supabase
      .from("phone_rentals")
      .select("id, user_id, phone_number, status, otp_code")
      .eq("activation_id", payload.activationId.toString())
      .eq("provider", "sms-activate")
      .single()

    if (rentalError || !rental) {
      console.error(`[SMS-Activate Webhook] Rental not found for activation: ${payload.activationId}`)

      // Update webhook log
      if (webhookLogId) {
        await supabase
          .from("webhook_logs")
          .update({
            processing_status: "failed",
            error_message: "Rental not found",
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLogId)
      }

      // Still return 200 to prevent retries
      return NextResponse.json({
        received: true,
        warning: "Rental not found",
      })
    }

    // Check if OTP already exists
    if (rental.otp_code) {
      console.log(`[SMS-Activate Webhook] OTP already exists for rental ${rental.id}`)

      if (webhookLogId) {
        await supabase
          .from("webhook_logs")
          .update({
            processing_status: "success",
            rental_id: rental.id,
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLogId)
      }

      return NextResponse.json({ received: true, duplicate: true })
    }

    // Update rental with OTP code
    const { error: updateError } = await supabase
      .from("phone_rentals")
      .update({
        otp_code: payload.code,
        status: "completed",
        webhook_delivered: true,
        webhook_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", rental.id)

    if (updateError) {
      console.error("[SMS-Activate Webhook] Failed to update rental:", updateError)

      if (webhookLogId) {
        await supabase
          .from("webhook_logs")
          .update({
            processing_status: "failed",
            error_message: updateError.message,
            rental_id: rental.id,
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLogId)
      }

      throw updateError
    }

    // Send notification to user
    try {
      await notifyOtpReceived(rental.user_id, rental.phone_number, payload.code)
    } catch (notifyError) {
      console.error("[SMS-Activate Webhook] Failed to send notification:", notifyError)
      // Don't fail webhook if notification fails
    }

    // Mark activation as finished
    try {
      const { getSmsActivateClient } = await import("@/lib/sms-activate")
      const client = getSmsActivateClient()
      await client.finishActivation(payload.activationId.toString())
    } catch (finishError) {
      console.error("[SMS-Activate Webhook] Failed to finish activation:", finishError)
      // Don't fail webhook if finish fails
    }

    // Update webhook log
    if (webhookLogId) {
      await supabase
        .from("webhook_logs")
        .update({
          processing_status: "success",
          rental_id: rental.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLogId)
    }

    const processingTime = Date.now() - startTime
    console.log(`[SMS-Activate Webhook] Successfully processed in ${processingTime}ms`)

    // Return 200 to confirm receipt
    return NextResponse.json({
      received: true,
      processingTime: `${processingTime}ms`,
    })
  } catch (error) {
    console.error("[SMS-Activate Webhook] Error processing webhook:", error)

    // Update webhook log with error
    if (webhookLogId) {
      try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              get: (name: string) => cookieStore.get(name)?.value,
              set: () => {},
              remove: () => {},
            },
          },
        )

        await supabase
          .from("webhook_logs")
          .update({
            processing_status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLogId)
      } catch (logError) {
        console.error("[SMS-Activate Webhook] Failed to update webhook log:", logError)
      }
    }

    // Return 200 even on error to prevent excessive retries
    // SMS-Activate will retry up to 8 times over 2 hours
    return NextResponse.json(
      {
        received: true,
        error: "Processing failed, will retry",
      },
      { status: 200 },
    )
  }
}

// Return 405 for non-POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. This endpoint only accepts POST requests." }, { status: 405 })
}
