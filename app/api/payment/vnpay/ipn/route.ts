import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getVNPayService } from "@/lib/vnpay"
import { notifyDepositApproved, notifyDepositRejected } from "@/lib/notification-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    console.log("[v0] VNPay IPN received:", queryParams)

    const vnpayService = getVNPayService()
    const { isValid, data } = vnpayService.verifyReturnUrl(queryParams)

    if (!isValid) {
      console.error("[v0] Invalid VNPay IPN signature")
      return NextResponse.json({ RspCode: "97", Message: "Invalid signature" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const orderId = data.vnp_TxnRef
    const responseCode = data.vnp_ResponseCode
    const amount = Number.parseInt(data.vnp_Amount) / 100

    const { data: deposit } = await supabase
      .from("deposits")
      .select("*, payment_methods(name)")
      .eq("payment_code", orderId)
      .single()

    if (!deposit) {
      console.error("[v0] Deposit not found for VNPay IPN:", orderId)
      return NextResponse.json({ RspCode: "99", Message: "Deposit not found" }, { status: 404 })
    }

    if (deposit.status === "completed") {
      console.log("[v0] Deposit already processed:", orderId)
      return NextResponse.json({ RspCode: "00", Message: "Already processed" })
    }

    if (responseCode === "00") {
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", deposit.user_id).single()

      if (profile) {
        const newBalance = Number.parseFloat(profile.balance.toString()) + amount

        await supabase.from("profiles").update({ balance: newBalance }).eq("id", deposit.user_id)

        await supabase
          .from("deposits")
          .update({
            status: "completed",
            verified_at: new Date().toISOString(),
            payment_data: data,
          })
          .eq("id", deposit.id)

        await supabase.from("transactions").insert({
          user_id: deposit.user_id,
          type: "deposit",
          amount,
          balance_before: profile.balance,
          balance_after: newBalance,
          status: "completed",
          description: `Nạp tiền qua ${deposit.payment_methods?.name || "VNPay"} - ${orderId}`,
        })

        await notifyDepositApproved(deposit.user_id, amount, deposit.payment_methods?.name || "VNPay")

        console.log("[v0] VNPay deposit processed successfully:", orderId)
      }
    } else {
      await supabase
        .from("deposits")
        .update({
          status: "failed",
          payment_data: data,
        })
        .eq("id", deposit.id)

      await notifyDepositRejected(deposit.user_id, amount, `VNPay error code: ${responseCode}`)

      console.log("[v0] VNPay deposit failed:", orderId, responseCode)
    }

    return NextResponse.json({ RspCode: "00", Message: "Success" })
  } catch (error) {
    console.error("[v0] VNPay IPN processing error:", error)
    return NextResponse.json({ RspCode: "99", Message: "Internal error" }, { status: 500 })
  }
}
