/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by automatically detecting and isolating failing providers
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type CircuitState = "closed" | "open" | "half_open"
export type ProviderStatus = "healthy" | "degraded" | "down"

interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  successThreshold: number // Number of successes in half-open before closing
  timeout: number // Time in ms before attempting to close circuit
  monitoringWindow: number // Time window for calculating failure rate
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  successThreshold: 2, // Close circuit after 2 consecutive successes
  timeout: 60000, // Try again after 60 seconds
  monitoringWindow: 300000, // 5 minutes window
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if provider is available for requests
   */
  async canMakeRequest(provider: "sms-activate" | "5sim"): Promise<boolean> {
    const health = await this.getProviderHealth(provider)

    if (!health) {
      // No health record, allow request (fail open)
      return true
    }

    // If circuit is open, check if timeout has passed
    if (health.circuit_state === "open") {
      if (!health.circuit_opened_at) {
        return false
      }

      const timeSinceOpen = Date.now() - new Date(health.circuit_opened_at).getTime()
      if (timeSinceOpen > this.config.timeout) {
        // Move to half-open state
        await this.transitionToHalfOpen(provider)
        return true
      }
      return false
    }

    // Circuit is closed or half-open, allow request
    return true
  }

  /**
   * Record a successful request
   */
  async recordSuccess(provider: "sms-activate" | "5sim", responseTime: number): Promise<void> {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const health = await this.getProviderHealth(provider)

    if (!health) {
      return
    }

    const updates: any = {
      consecutive_failures: 0,
      failure_count: 0,
      last_success_at: new Date().toISOString(),
      total_requests: health.total_requests + 1,
      successful_requests: health.successful_requests + 1,
      updated_at: new Date().toISOString(),
    }

    // Update average response time
    if (health.average_response_time) {
      updates.average_response_time = Math.round((health.average_response_time + responseTime) / 2)
    } else {
      updates.average_response_time = responseTime
    }

    // If circuit was half-open and we got success, close it
    if (health.circuit_state === "half_open") {
      updates.circuit_state = "closed"
      updates.status = "healthy"
      console.log(`[CircuitBreaker] Provider ${provider} circuit closed (recovered)`)
    }

    await supabase.from("provider_health").update(updates).eq("provider", provider)
  }

  /**
   * Record a failed request
   */
  async recordFailure(provider: "sms-activate" | "5sim", errorType: string): Promise<void> {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const health = await this.getProviderHealth(provider)

    if (!health) {
      return
    }

    const consecutiveFailures = health.consecutive_failures + 1
    const updates: any = {
      consecutive_failures: consecutiveFailures,
      failure_count: health.failure_count + 1,
      last_failure_at: new Date().toISOString(),
      total_requests: health.total_requests + 1,
      failed_requests: health.failed_requests + 1,
      updated_at: new Date().toISOString(),
    }

    // Determine new status based on failure count
    if (consecutiveFailures >= this.config.failureThreshold) {
      updates.circuit_state = "open"
      updates.circuit_opened_at = new Date().toISOString()
      updates.status = "down"
      console.error(`[CircuitBreaker] Provider ${provider} circuit opened (${consecutiveFailures} failures)`)
    } else if (consecutiveFailures >= this.config.failureThreshold / 2) {
      updates.status = "degraded"
    }

    await supabase.from("provider_health").update(updates).eq("provider", provider)
  }

  /**
   * Get provider health status
   */
  private async getProviderHealth(provider: "sms-activate" | "5sim") {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const { data } = await supabase.from("provider_health").select("*").eq("provider", provider).single()

    return data
  }

  /**
   * Transition circuit to half-open state
   */
  private async transitionToHalfOpen(provider: "sms-activate" | "5sim"): Promise<void> {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase
      .from("provider_health")
      .update({
        circuit_state: "half_open",
        status: "degraded",
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)

    console.log(`[CircuitBreaker] Provider ${provider} circuit half-opened (testing recovery)`)
  }

  /**
   * Get all provider health statuses
   */
  async getAllProviderHealth(): Promise<any[]> {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const { data } = await supabase.from("provider_health").select("*").order("provider")

    return data || []
  }

  /**
   * Reset circuit breaker for a provider (admin function)
   */
  async resetCircuit(provider: "sms-activate" | "5sim"): Promise<void> {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase
      .from("provider_health")
      .update({
        circuit_state: "closed",
        status: "healthy",
        consecutive_failures: 0,
        failure_count: 0,
        circuit_opened_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)

    console.log(`[CircuitBreaker] Provider ${provider} circuit manually reset`)
  }
}

// Export singleton instance
let circuitBreakerInstance: CircuitBreaker | null = null

export function getCircuitBreaker(): CircuitBreaker {
  if (!circuitBreakerInstance) {
    circuitBreakerInstance = new CircuitBreaker()
  }
  return circuitBreakerInstance
}
