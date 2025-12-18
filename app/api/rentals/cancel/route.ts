import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cancelActivation } from "@/lib/multi-provider-client"
import type { Provider } from "@/lib/multi-provider-client"
import { calculateRefund, processRefund } from "@/lib/refund"
import { notifyRefundProcessed } from "@/lib/notification-service"

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

    if (rental.status !== "active") {
      return NextResponse.json({ error: "Cannot cancel this rental" }, { status: 400 })
    }

    const provider = (rental.provider || "sms-activate") as Provider
    console.log(`[v0] Cancelling rental ${rental_id} with provider: ${provider}`)

    await cancelActivation(rental.activation_id, provider)

    await supabase
      .from("phone_rentals")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rental_id)

    const refundCalculation = await calculateRefund(rental)
    const refundResult = await processRefund(user.id, rental_id, refundCalculation)

    if (!refundResult.success) {
      return NextResponse.json({ error: refundResult.error }, { status: 500 })
    }

    await notifyRefundProcessed(
      user.id,
      refundCalculation.refund_amount,
      refundCalculation.reason,
      refundCalculation.refund_percentage,
    )

    return NextResponse.json({
      success: true,
      refund_amount: refundCalculation.refund_amount,
      refund_percentage: refundCalculation.refund_percentage,
      reason: refundCalculation.reason,
      message: `Đã hủy và hoàn ${refundCalculation.refund_percentage}%`,
    })
  } catch (error) {
    console.error("[v0] Error cancelling rental:", error)
    return NextResponse.json({ error: "Failed to cancel rental" }, { status: 500 })
  }
}
