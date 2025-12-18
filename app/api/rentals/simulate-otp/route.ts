import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { rentalId } = await request.json()

    if (!rentalId) {
      return NextResponse.json({ error: "Rental ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if rental exists and belongs to user
    const { data: rental } = await supabase
      .from("phone_rentals")
      .select("*")
      .eq("id", rentalId)
      .eq("user_id", user.id)
      .single()

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    if (rental.otp_code) {
      return NextResponse.json({ error: "OTP already received" }, { status: 400 })
    }

    // Generate mock OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Update rental with OTP
    const { error: updateError } = await supabase
      .from("phone_rentals")
      .update({
        otp_code: otpCode,
        status: "completed",
      })
      .eq("id", rentalId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, otp_code: otpCode })
  } catch (error: unknown) {
    console.error("[v0] Error simulating OTP:", error)
    return NextResponse.json({ error: "Failed to simulate OTP" }, { status: 500 })
  }
}
