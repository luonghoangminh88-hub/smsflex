import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface RefundPolicy {
  id: string
  name: string
  description: string
  refund_percentage: number
  condition_type: "no_otp" | "partial_otp" | "expired" | "custom"
  is_active: boolean
}

export interface RefundCalculation {
  original_amount: number
  refund_amount: number
  refund_percentage: number
  policy_id: string
  reason: string
}

export async function getRefundPolicies(): Promise<RefundPolicy[]> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  const { data } = await supabase
    .from("refund_policies")
    .select("*")
    .eq("is_active", true)
    .order("refund_percentage", { ascending: false })

  return data || []
}

export async function calculateRefund(rental: any): Promise<RefundCalculation> {
  const policies = await getRefundPolicies()
  const originalAmount = Number.parseFloat(rental.price.toString())

  let selectedPolicy: RefundPolicy | null = null
  let reason = ""

  // Determine which policy applies
  if (!rental.otp_code) {
    // No OTP received - best refund
    selectedPolicy = policies.find((p) => p.condition_type === "no_otp") || null
    reason = "Hủy trước khi nhận OTP"
  } else if (rental.status === "expired") {
    // Expired
    selectedPolicy = policies.find((p) => p.condition_type === "expired") || null
    reason = "Hết hạn không nhận được OTP"
  } else {
    // Has OTP - partial refund
    selectedPolicy = policies.find((p) => p.condition_type === "partial_otp") || null
    reason = "Hủy sau khi nhận OTP"
  }

  // Default to 0% if no policy found
  const refundPercentage = selectedPolicy?.refund_percentage || 0
  const refundAmount = (originalAmount * refundPercentage) / 100

  return {
    original_amount: originalAmount,
    refund_amount: refundAmount,
    refund_percentage: refundPercentage,
    policy_id: selectedPolicy?.id || "",
    reason,
  }
}

export async function processRefund(
  userId: string,
  rentalId: string,
  refundCalculation: RefundCalculation,
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  try {
    // Get current balance
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", userId).single()

    if (!profile) {
      return { success: false, error: "Profile not found" }
    }

    const currentBalance = Number.parseFloat(profile.balance.toString())
    const newBalance = currentBalance + refundCalculation.refund_amount

    // Update balance using atomic operation
    const { error: balanceError } = await supabase.rpc("update_balance_atomic", {
      p_user_id: userId,
      p_amount: refundCalculation.refund_amount,
    })

    if (balanceError) {
      console.error("[v0] Balance update error:", balanceError)
      return { success: false, error: "Failed to update balance" }
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        rental_id: rentalId,
        type: "refund",
        amount: refundCalculation.refund_amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        status: "completed",
        description: `${refundCalculation.reason} - Hoàn ${refundCalculation.refund_percentage}%`,
      })
      .select()
      .single()

    if (transactionError) {
      console.error("[v0] Transaction error:", transactionError)
      return { success: false, error: "Failed to create transaction" }
    }

    // Create refund history record
    await supabase.from("refund_history").insert({
      rental_id: rentalId,
      user_id: userId,
      transaction_id: transaction.id,
      original_amount: refundCalculation.original_amount,
      refund_amount: refundCalculation.refund_amount,
      refund_percentage: refundCalculation.refund_percentage,
      reason: refundCalculation.reason,
      policy_id: refundCalculation.policy_id || null,
    })

    return { success: true, transaction_id: transaction.id }
  } catch (error) {
    console.error("[v0] Refund processing error:", error)
    return { success: false, error: "Unexpected error during refund" }
  }
}
