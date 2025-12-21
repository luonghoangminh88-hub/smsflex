/**
 * Provider Health Tracking and Monitoring
 * Tracks success rates, response times, and provider availability
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type ProviderStatus = "healthy" | "degraded" | "unavailable"
export type Provider = "sms-activate" | "5sim"
export type RequestType = "purchase" | "check_status" | "cancel" | "finish"

export interface ProviderHealth {
  provider: Provider
  status: ProviderStatus
  success_rate: number
  avg_response_time_ms: number
  total_requests: number
  successful_requests: number
  failed_requests: number
  last_success_at?: string
  last_failure_at?: string
  last_checked_at: string
}

export interface ProviderPreferences {
  preferred_provider: "sms-activate" | "5sim" | "auto"
  fallback_enabled: boolean
  min_success_rate: number
  max_response_time_ms: number
  retry_attempts: number
  retry_delay_ms: number
}

/**
 * Record a provider request for analytics
 */
export async function recordProviderRequest(params: {
  provider: Provider
  requestType: RequestType
  success: boolean
  responseTimeMs: number
  errorMessage?: string
  countryCode?: string
  serviceCode?: string
  rentalId?: string
}): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase.from("provider_requests").insert({
      provider: params.provider,
      request_type: params.requestType,
      success: params.success,
      response_time_ms: params.responseTimeMs,
      error_message: params.errorMessage,
      country_code: params.countryCode,
      service_code: params.serviceCode,
      rental_id: params.rentalId,
    })

    // Update provider health metrics
    await updateProviderHealth(params.provider)
  } catch (error) {
    console.error("[Provider Health] Failed to record request:", error)
  }
}

/**
 * Update provider health metrics based on recent requests
 */
export async function updateProviderHealth(provider: Provider): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Calculate metrics from last 100 requests
    const { data: recentRequests } = await supabase
      .from("provider_requests")
      .select("success, response_time_ms, created_at")
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .limit(100)

    if (!recentRequests || recentRequests.length === 0) {
      return
    }

    const totalRequests = recentRequests.length
    const successfulRequests = recentRequests.filter((r) => r.success).length
    const failedRequests = totalRequests - successfulRequests
    const successRate = (successfulRequests / totalRequests) * 100

    const avgResponseTime = recentRequests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / totalRequests

    // Determine status
    let status: ProviderStatus = "healthy"
    if (successRate < 50) {
      status = "unavailable"
    } else if (successRate < 90 || avgResponseTime > 5000) {
      status = "degraded"
    }

    // Get last success and failure timestamps
    const lastSuccess = recentRequests.find((r) => r.success)
    const lastFailure = recentRequests.find((r) => !r.success)

    // Upsert health record
    await supabase
      .from("provider_health")
      .upsert(
        {
          provider,
          status,
          success_rate: successRate,
          avg_response_time_ms: Math.round(avgResponseTime),
          total_requests: totalRequests,
          successful_requests: successfulRequests,
          failed_requests: failedRequests,
          last_success_at: lastSuccess?.created_at,
          last_failure_at: lastFailure?.created_at,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "provider",
        },
      )
      .select()
  } catch (error) {
    console.error("[Provider Health] Failed to update health:", error)
  }
}

/**
 * Get current health status for a provider
 */
export async function getProviderHealth(provider: Provider): Promise<ProviderHealth | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const { data, error } = await supabase.from("provider_health").select("*").eq("provider", provider).single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    console.error("[Provider Health] Failed to get health:", error)
    return null
  }
}

/**
 * Get health status for all providers
 */
export async function getAllProviderHealth(): Promise<ProviderHealth[]> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const { data, error } = await supabase.from("provider_health").select("*").order("provider")

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Provider Health] Failed to get all health:", error)
    return []
  }
}

/**
 * Get provider preferences
 */
export async function getProviderPreferences(): Promise<ProviderPreferences> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const { data } = await supabase.from("provider_preferences").select("*").single()

    if (data) {
      return data
    }
  } catch (error) {
    console.error("[Provider Health] Failed to get preferences:", error)
  }

  // Return defaults
  return {
    preferred_provider: "auto",
    fallback_enabled: true,
    min_success_rate: 90,
    max_response_time_ms: 5000,
    retry_attempts: 2,
    retry_delay_ms: 1000,
  }
}

/**
 * Determine optimal provider based on health metrics and preferences
 */
export async function selectOptimalProvider(smsActivateStock: number, fiveSimStock: number): Promise<Provider> {
  const preferences = await getProviderPreferences()

  // If user has specific preference and stock is available
  if (preferences.preferred_provider !== "auto") {
    if (preferences.preferred_provider === "sms-activate" && smsActivateStock > 0) {
      return "sms-activate"
    }
    if (preferences.preferred_provider === "5sim" && fiveSimStock > 0) {
      return "5sim"
    }
  }

  // Auto mode: select based on health and availability
  const smsActivateHealth = await getProviderHealth("sms-activate")
  const fiveSimHealth = await getProviderHealth("5sim")

  // If one provider is unavailable, use the other
  if (smsActivateHealth?.status === "unavailable" && fiveSimHealth?.status !== "unavailable" && fiveSimStock > 0) {
    return "5sim"
  }

  if (fiveSimHealth?.status === "unavailable" && smsActivateHealth?.status !== "unavailable" && smsActivateStock > 0) {
    return "sms-activate"
  }

  // Compare success rates
  const smsActivateScore = calculateProviderScore(smsActivateHealth, smsActivateStock)
  const fiveSimScore = calculateProviderScore(fiveSimHealth, fiveSimStock)

  return smsActivateScore >= fiveSimScore ? "sms-activate" : "5sim"
}

function calculateProviderScore(health: ProviderHealth | null, stock: number): number {
  if (!health) return stock > 0 ? 50 : 0

  let score = health.success_rate // Base score from success rate (0-100)

  // Adjust for response time
  if (health.avg_response_time_ms < 2000) score += 10
  else if (health.avg_response_time_ms > 5000) score -= 10

  // Adjust for stock availability
  if (stock > 100) score += 10
  else if (stock < 10) score -= 10
  else if (stock === 0) score = 0

  // Adjust for recency of success
  if (health.last_success_at) {
    const hoursSinceSuccess = (Date.now() - new Date(health.last_success_at).getTime()) / (1000 * 60 * 60)
    if (hoursSinceSuccess < 1) score += 5
    else if (hoursSinceSuccess > 24) score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Check if provider meets minimum quality standards
 */
export async function isProviderHealthy(provider: Provider): Promise<boolean> {
  const health = await getProviderHealth(provider)
  const preferences = await getProviderPreferences()

  if (!health) return true // Assume healthy if no data

  if (health.status === "unavailable") return false
  if (health.success_rate < preferences.min_success_rate) return false
  if (health.avg_response_time_ms > preferences.max_response_time_ms) return false

  return true
}
