import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getVNPayService } from "@/lib/vnpay"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, paymentMethodId } = body

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

    // Create pending deposit
    const orderId = `DEP${Date.now()}`
    const { data: deposit } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        payment_method_id: paymentMethodId,
        amount,
        fee: 0,
        total_amount: amount,
        status: "pending",
        payment_code: orderId,
        transfer_content: `Nap tien ${orderId}`,
      })
      .select()
      .single()

    if (!deposit) {
      return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 })
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddr = forwarded ? forwarded.split(",")[0] : "127.0.0.1"

    const vnpayService = getVNPayService()
    const paymentUrl = vnpayService.createPaymentUrl({
      amount,
      orderId,
      orderInfo: `Nap tien tai khoan ${user.email}`,
      ipAddr,
      locale: "vn",
    })

    return NextResponse.json({
      success: true,
      paymentUrl,
      depositId: deposit.id,
    })
  } catch (error) {
    console.error("[v0] VNPay payment creation error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
