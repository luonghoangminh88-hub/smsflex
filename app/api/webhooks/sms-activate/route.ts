/**
 * SMS-Activate Webhook Handler
 * Receives real-time OTP updates from SMS-Activate
 * Documentation: https://sms-activate.io/api2
 */

import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import {
  validateWebhookSignature,
  validateWebhookIP,
  validateWebhookPayload,
  checkWebhookRateLimit,
  sanitizeWebhookPayload,
} from "@/lib/security/webhook-security"
import { notifyOtpReceived } from "@/lib/notification-service"
import { finishActivation } from "@/lib/multi-provider-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface SmsActivateWebhookPayload {
  activationId: string
  status: "STATUS_OK" | "STATUS_CANCEL" | "STATUS_WAIT_CODE" | "STATUS_WAIT_RETRY"
  code?: string
  phone?: string
  timestamp?: number
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let webhookLogId: string | undefined

  try {
    // Get request details
    const headersList = await headers()
    const requestIP = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const signature = headersList.get("x-sms-activate-signature") || ""

    // Read raw body for signature verification
    const rawBody = await request.text()
    let payload: SmsActivateWebhookPayload

    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error("[Webhook] Invalid JSON payload")
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Log webhook attempt (sanitized)
    console.log("[Webhook] Received:", {
      activationId: payload.activationId,
      status: payload.status,
      ip: requestIP,
      timestamp: payload.timestamp || Date.now(),
    })

    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Create webhook log entry
    const { data: logEntry } = await supabase
      .from("webhook_logs")
      .insert({
        provider: "sms-activate",
        event_type: payload.status,
        payload: sanitizeWebhookPayload(payload),
        ip_address: requestIP,
        processed: false,
      })
      .select("id")
      .single()

    webhookLogId = logEntry?.id

    // Security validations

    // 1. Validate IP address
    const ipValidation = validateWebhookIP(requestIP)
    if (!ipValidation.isValid) {
      console.warn("[Webhook] IP validation failed:", ipValidation.error)
      await updateWebhookLog(supabase, webhookLogId, false, ipValidation.error)
      return NextResponse.json({ error: "Unauthorized IP" }, { status: 403 })
    }

    // 2. Validate webhook signature
    const webhookSecret = process.env.SMS_ACTIVATE_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const signatureValidation = validateWebhookSignature(rawBody, signature, webhookSecret)
      if (!signatureValidation.isValid) {
        console.warn("[Webhook] Signature validation failed:", signatureValidation.error)
        await updateWebhookLog(supabase, webhookLogId, false, signatureValidation.error)
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
      }
    }

    // 3. Validate payload structure
    const payloadValidation = validateWebhookPayload(payload)
    if (!payloadValidation.isValid) {
      console.warn("[Webhook] Payload validation failed:", payloadValidation.error)
      await updateWebhookLog(supabase, webhookLogId, false, payloadValidation.error)
      return NextResponse.json({ error: payloadValidation.error }, { status: 400 })
    }

    // 4. Rate limiting per activation
    const rateLimitCheck = checkWebhookRateLimit(payload.activationId)
    if (!rateLimitCheck.isValid) {
      console.warn("[Webhook] Rate limit exceeded:", rateLimitCheck.error)
      await updateWebhookLog(supabase, webhookLogId, false, rateLimitCheck.error)
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Find the rental by activation_id
    const { data: rental, error: rentalError } = await supabase
      .from("phone_rentals")
      .select("*, profiles!inner(id)")
      .eq("activation_id", payload.activationId)
      .eq("provider", "sms-activate")
      .single()

    if (rentalError || !rental) {
      console.warn("[Webhook] Rental not found for activation:", payload.activationId)
      await updateWebhookLog(supabase, webhookLogId, false, "Rental not found")
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Check if already processed
    if (rental.status === "completed" && rental.otp_code) {
      console.log("[Webhook] Already processed:", payload.activationId)
      await updateWebhookLog(supabase, webhookLogId, true, "Already processed")
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    // Process webhook based on status
    if (payload.status === "STATUS_OK" && payload.code) {
      // OTP received!
      console.log("[Webhook] OTP received for:", payload.activationId)

      // Update rental record
      const { error: updateError } = await supabase
        .from("phone_rentals")
        .update({
          otp_code: payload.code,
          status: "completed",
          webhook_received_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rental.id)

      if (updateError) {
        console.error("[Webhook] Failed to update rental:", updateError)
        await updateWebhookLog(supabase, webhookLogId, false, updateError.message)
        return NextResponse.json({ error: "Failed to update rental" }, { status: 500 })
      }

      // Send notification to user
      try {
        await notifyOtpReceived(rental.user_id, rental.phone_number, payload.code)
      } catch (notifError) {
        console.error("[Webhook] Failed to send notification:", notifError)
        // Don't fail the webhook, notification is not critical
      }

      // Finish activation with provider
      try {
        await finishActivation(payload.activationId, "sms-activate")
      } catch (finishError) {
        console.error("[Webhook] Failed to finish activation:", finishError)
        // Don't fail the webhook, we already have the OTP
      }

      // Mark webhook as processed
      await updateWebhookLog(supabase, webhookLogId, true)

      const processingTime = Date.now() - startTime
      console.log(`[Webhook] Successfully processed in ${processingTime}ms`)

      return NextResponse.json({
        success: true,
        message: "OTP processed",
        processingTime,
      })
    }

    if (payload.status === "STATUS_CANCEL") {
      // Activation cancelled by provider
      console.log("[Webhook] Activation cancelled:", payload.activationId)

      await supabase
        .from("phone_rentals")
        .update({
          status: "cancelled",
          webhook_received_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rental.id)

      await updateWebhookLog(supabase, webhookLogId, true)

      return NextResponse.json({ success: true, message: "Cancellation processed" })
    }

    // Other statuses (STATUS_WAIT_CODE, STATUS_WAIT_RETRY)
    console.log("[Webhook] Status update:", payload.status)
    await updateWebhookLog(supabase, webhookLogId, true, `Status: ${payload.status}`)

    return NextResponse.json({ success: true, message: "Status received" })
  } catch (error) {
    console.error("[Webhook] Unexpected error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (webhookLogId) {
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
      await updateWebhookLog(supabase, webhookLogId, false, errorMessage)
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateWebhookLog(
  supabase: any,
  logId: string | undefined,
  processed: boolean,
  errorMessage?: string,
): Promise<void> {
  if (!logId) return

  try {
    await supabase
      .from("webhook_logs")
      .update({
        processed,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", logId)
  } catch (error) {
    console.error("[Webhook] Failed to update log:", error)
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "sms-activate-webhook",
    timestamp: new Date().toISOString(),
  })
}
