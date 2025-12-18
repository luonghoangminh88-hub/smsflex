import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cancelActivation } from "@/lib/multi-provider-client"
import type { Provider } from "@/lib/multi-provider-client"

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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get rental
    const { data: rental } = await supabase
      .from("phone_rentals")
      .select("*")
      .eq("id", rental_id)
      .eq("user_id", user.id)
      .single()

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    // Can only cancel active rentals without OTP
    if (rental.status !== "active" || rental.otp_code) {
      return NextResponse.json({ error: "Cannot cancel this rental" }, { status: 400 })
    }

    const provider = (rental.provider || "sms-activate") as Provider
    console.log(`[v0] Cancelling rental ${rental_id} with provider: ${provider}`)

    await cancelActivation(rental.activation_id, provider)

    // Update rental status
    await supabase
      .from("phone_rentals")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rental_id)

    // Refund partial amount (50% refund on cancellation)
    const refundAmount = Number.parseFloat(rental.price.toString()) * 0.5

    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()

    if (profile) {
      const newBalance = Number.parseFloat(profile.balance.toString()) + refundAmount

      await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      // Create refund transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        rental_id: rental.id,
        type: "refund",
        amount: refundAmount,
        balance_before: profile.balance,
        balance_after: newBalance,
        status: "completed",
        description: `Refund for cancelled rental (50%) - ${provider}`,
      })
    }

    return NextResponse.json({
      success: true,
      refund_amount: refundAmount,
      message: "Rental cancelled and 50% refunded",
    })
  } catch (error) {
    console.error("[v0] Error cancelling rental:", error)
    return NextResponse.json({ error: "Failed to cancel rental" }, { status: 500 })
  }
}
