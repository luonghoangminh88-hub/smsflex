import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { checkStatus, finishActivation } from "@/lib/multi-provider-client"
import type { Provider } from "@/lib/multi-provider-client"
import { notifyOtpReceived, notifyRentalExpired } from "@/lib/notification-service"
import { calculateRefund, processRefund } from "@/lib/refund"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rental_id } = body

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: rental } = await supabase
      .from("phone_rentals")
      .select("*")
      .eq("id", rental_id)
      .eq("user_id", user.id)
      .single()

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    if (rental.otp_code) {
      return NextResponse.json({
        success: true,
        otp_code: rental.otp_code,
        status: "completed",
      })
    }

    if (new Date(rental.expires_at) < new Date()) {
      await supabase.from("phone_rentals").update({ status: "expired" }).eq("id", rental_id)

      const refundCalculation = await calculateRefund(rental)
      const refundResult = await processRefund(user.id, rental_id, refundCalculation)

      if (refundResult.success) {
        await notifyRentalExpired(user.id, rental.phone_number, refundCalculation.refund_amount)
      }

      return NextResponse.json({
        success: false,
        status: "expired",
        message: "Rental has expired",
        refund_amount: refundCalculation.refund_amount,
      })
    }

    const provider = (rental.provider || "sms-activate") as Provider
    console.log(`[v0] Checking OTP status for rental ${rental_id} with provider: ${provider}`)

    const status = await checkStatus(rental.activation_id, provider)

    if (status.status === "completed" && status.code) {
      await supabase
        .from("phone_rentals")
        .update({
          otp_code: status.code,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rental_id)

      await finishActivation(rental.activation_id, provider)

      await notifyOtpReceived(user.id, rental.phone_number, status.code)

      return NextResponse.json({
        success: true,
        otp_code: status.code,
        status: "completed",
      })
    }

    if (status.status === "cancelled") {
      await supabase.from("phone_rentals").update({ status: "cancelled" }).eq("id", rental_id)

      return NextResponse.json({
        success: false,
        status: "cancelled",
        message: "Activation was cancelled",
      })
    }

    return NextResponse.json({
      success: false,
      status: "waiting",
      message: "Waiting for OTP...",
    })
  } catch (error) {
    console.error("[v0] Error checking OTP:", error)
    return NextResponse.json({ error: "Failed to check OTP status" }, { status: 500 })
  }
}
