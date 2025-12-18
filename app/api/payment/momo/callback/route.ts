import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getMoMoService } from "@/lib/momo"
import { notifyDepositApproved, notifyDepositRejected } from "@/lib/notification-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    const momoService = getMoMoService()
    const isValid = momoService.verifySignature(queryParams)

    if (!isValid) {
      return NextResponse.redirect(new URL("/dashboard/deposit?status=error&message=Invalid signature", request.url))
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const orderId = queryParams.orderId
    const resultCode = queryParams.resultCode
    const amount = Number.parseInt(queryParams.amount)

    const { data: deposit } = await supabase
      .from("deposits")
      .select("*, payment_methods(name)")
      .eq("payment_code", orderId)
      .single()

    if (!deposit) {
      return NextResponse.redirect(new URL("/dashboard/deposit?status=error&message=Deposit not found", request.url))
    }

    if (resultCode === "0") {
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", deposit.user_id).single()

      if (profile) {
        const newBalance = Number.parseFloat(profile.balance.toString()) + amount

        await supabase.from("profiles").update({ balance: newBalance }).eq("id", deposit.user_id)

        await supabase
          .from("deposits")
          .update({
            status: "completed",
            verified_at: new Date().toISOString(),
            payment_data: queryParams,
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
      }

      return NextResponse.redirect(new URL("/dashboard/deposit?status=success", request.url))
    } else {
      await supabase
        .from("deposits")
        .update({
          status: "failed",
          payment_data: queryParams,
        })
        .eq("id", deposit.id)

      await notifyDepositRejected(deposit.user_id, amount, "Thanh toán không thành công")

      return NextResponse.redirect(new URL("/dashboard/deposit?status=failed", request.url))
    }
  } catch (error) {
    console.error("[v0] MoMo callback error:", error)
    return NextResponse.redirect(new URL("/dashboard/deposit?status=error", request.url))
  }
}
