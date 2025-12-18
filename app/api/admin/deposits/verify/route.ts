import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notifyDepositApproved, notifyDepositRejected } from "@/lib/notification-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deposit_id, action, admin_notes } = body

    if (!deposit_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

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

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .select("*, payment_method:payment_methods(name)")
      .eq("id", deposit_id)
      .single()

    if (depositError || !deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 })
    }

    if (deposit.status !== "pending") {
      return NextResponse.json({ error: `Deposit is already ${deposit.status}. Cannot modify.` }, { status: 400 })
    }

    if (action === "approve") {
      const { data: updateResult, error: balanceError } = await supabase.rpc("update_balance_atomic", {
        p_user_id: deposit.user_id,
        p_amount: deposit.amount,
        p_transaction_type: "deposit",
        p_description: `Deposit approved - ${deposit.payment_method.name} - ${deposit.payment_code}`,
      })

      if (balanceError) {
        console.error("[v0] Error updating balance:", balanceError)
        return NextResponse.json({ error: "Failed to update user balance" }, { status: 500 })
      }

      await supabase
        .from("deposits")
        .update({
          status: "completed",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          notes: admin_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit_id)

      await notifyDepositApproved(deposit.user_id, deposit.amount, deposit.payment_method?.name || "Unknown")

      return NextResponse.json({
        success: true,
        message: "Deposit approved successfully",
        new_balance: updateResult[0].new_balance,
      })
    } else {
      await supabase
        .from("deposits")
        .update({
          status: "failed",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          notes: admin_notes || "Rejected by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit_id)

      await notifyDepositRejected(deposit.user_id, deposit.amount, admin_notes)

      return NextResponse.json({
        success: true,
        message: "Deposit rejected successfully",
      })
    }
  } catch (error) {
    console.error("[v0] Error verifying deposit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
