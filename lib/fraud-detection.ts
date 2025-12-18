import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface FraudCheckResult {
  isSuspicious: boolean
  reason?: string
  riskScore: number
  flags: string[]
}

export async function detectFraudulentDeposit(
  userId: string,
  amount: number,
  ipAddress: string,
): Promise<FraudCheckResult> {
  const flags: string[] = []
  let riskScore = 0

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Check 1: Unusual amount
    if (amount > 10000000) {
      // > 10M VND
      flags.push("unusually_high_amount")
      riskScore += 30
    }

    // Check 2: Frequent deposits
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentDeposits } = await supabase
      .from("deposits")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo)

    if (recentDeposits && recentDeposits.length >= 3) {
      flags.push("multiple_deposits_short_period")
      riskScore += 25
    }

    // Check 3: New account making large deposit
    const { data: profile } = await supabase.from("profiles").select("created_at, balance").eq("id", userId).single()

    if (profile) {
      const accountAge = Date.now() - new Date(profile.created_at).getTime()
      const isNewAccount = accountAge < 24 * 60 * 60 * 1000 // Less than 24 hours

      if (isNewAccount && amount > 1000000) {
        flags.push("new_account_large_deposit")
        riskScore += 35
      }
    }

    // Check 4: Multiple IPs in short period
    const { data: recentLogs } = await supabase
      .from("rate_limit_logs")
      .select("ip_address")
      .eq("identifier", `user:${userId}`)
      .gte("created_at", oneHourAgo)

    if (recentLogs) {
      const uniqueIps = new Set(recentLogs.map((log) => log.ip_address).filter(Boolean))
      if (uniqueIps.size >= 3) {
        flags.push("multiple_ips")
        riskScore += 20
      }
    }

    // Check 5: Failed deposits before success
    const { data: failedDeposits } = await supabase
      .from("deposits")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "failed")
      .gte("created_at", oneHourAgo)

    if (failedDeposits && failedDeposits.length >= 3) {
      flags.push("multiple_failed_attempts")
      riskScore += 20
    }

    const isSuspicious = riskScore >= 50
    const reason = isSuspicious ? `Risk score: ${riskScore}, Flags: ${flags.join(", ")}` : undefined

    return {
      isSuspicious,
      reason,
      riskScore,
      flags,
    }
  } catch (error) {
    console.error("[v0] Fraud detection error:", error)
    return {
      isSuspicious: false,
      riskScore: 0,
      flags: [],
    }
  }
}

export async function detectFraudulentRental(userId: string): Promise<FraudCheckResult> {
  const flags: string[] = []
  let riskScore = 0

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Check 1: Too many active rentals
    const { data: activeRentals } = await supabase
      .from("phone_rentals")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")

    if (activeRentals && activeRentals.length >= 5) {
      flags.push("too_many_active_rentals")
      riskScore += 30
    }

    // Check 2: Rapid rental creation
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentRentals } = await supabase
      .from("phone_rentals")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", fiveMinutesAgo)

    if (recentRentals && recentRentals.length >= 3) {
      flags.push("rapid_rental_creation")
      riskScore += 35
    }

    // Check 3: High cancellation rate
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: allRentals } = await supabase
      .from("phone_rentals")
      .select("status")
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo)

    if (allRentals && allRentals.length >= 5) {
      const cancelledCount = allRentals.filter((r) => r.status === "cancelled").length
      const cancellationRate = cancelledCount / allRentals.length

      if (cancellationRate > 0.7) {
        flags.push("high_cancellation_rate")
        riskScore += 25
      }
    }

    const isSuspicious = riskScore >= 50
    const reason = isSuspicious ? `Risk score: ${riskScore}, Flags: ${flags.join(", ")}` : undefined

    return {
      isSuspicious,
      reason,
      riskScore,
      flags,
    }
  } catch (error) {
    console.error("[v0] Rental fraud detection error:", error)
    return {
      isSuspicious: false,
      riskScore: 0,
      flags: [],
    }
  }
}

export async function logFraudCheck(
  userId: string,
  action: string,
  result: FraudCheckResult,
  metadata?: any,
): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase.from("fraud_logs").insert({
      user_id: userId,
      action,
      risk_score: result.riskScore,
      is_suspicious: result.isSuspicious,
      flags: result.flags,
      metadata,
    })
  } catch (error) {
    console.error("[v0] Fraud log error:", error)
  }
}
