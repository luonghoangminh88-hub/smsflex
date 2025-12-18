import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getMoMoService } from "@/lib/momo"
import { notifyDepositApproved, notifyDepositRejected } from "@/lib/notification-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] MoMo IPN received:", body)

    const momoService = getMoMoService()
    const isValid = momoService.verifySignature(body)

    if (!isValid) {
      console.error("[v0] Invalid MoMo IPN signature")
      return NextResponse.json({ resultCode: 97, message: "Invalid signature" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const orderId = body.orderId
    const resultCode = body.resultCode
    const amount = Number.parseInt(body.amount)

    const { data: deposit } = await supabase
      .from("deposits")
      .select("*, payment_methods(name)")
      .eq("payment_code", orderId)
      .single()

    if (!deposit) {
      console.error("[v0] Deposit not found for MoMo IPN:", orderId)
      return NextResponse.json({ resultCode: 99, message: "Deposit not found" }, { status: 404 })
    }

    if (deposit.status === "completed") {
      console.log("[v0] Deposit already processed:", orderId)
      return NextResponse.json({ resultCode: 0, message: "Already processed" })
    }

    if (resultCode === 0) {
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", deposit.user_id).single()

      if (profile) {
        const newBalance = Number.parseFloat(profile.balance.toString()) + amount

        await supabase.from("profiles").update({ balance: newBalance }).eq("id", deposit.user_id)

        await supabase
          .from("deposits")
          .update({
            status: "completed",
            verified_at: new Date().toISOString(),
            payment_data: body,
          })
          .eq("id", deposit.id)

        await supabase.from("transactions").insert({
          user_id: deposit.user_id,
          type: "deposit",
          amount,
          balance_before: profile.balance,
          balance_after: newBalance,
          status: "completed",
          description: `Nạp tiền qua ${deposit.payment_methods?.name || "MoMo"} - ${orderId}`,
        })

        await notifyDepositApproved(deposit.user_id, amount, deposit.payment_methods?.name || "MoMo")

        console.log("[v0] MoMo deposit processed successfully:", orderId)
      }
    } else {
      await supabase
        .from("deposits")
        .update({
          status: "failed",
          payment_data: body,
        })
        .eq("id", deposit.id)

      await notifyDepositRejected(deposit.user_id, amount, `MoMo error code: ${resultCode}`)

      console.log("[v0] MoMo deposit failed:", orderId, resultCode)
    }

    return NextResponse.json({ resultCode: 0, message: "Success" })
  } catch (error) {
    console.error("[v0] MoMo IPN processing error:", error)
    return NextResponse.json({ resultCode: 99, message: "Internal error" }, { status: 500 })
  }
}
