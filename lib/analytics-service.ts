/**
 * Analytics Service
 * Tracks provider performance, cost optimization, and system metrics
 */

import { createClient } from "@supabase/supabase-js"

interface ProviderAnalytics {
  provider: string
  date: string
  totalOrders: number
  successfulOrders: number
  failedOrders: number
  totalRevenue: number
  avgResponseTimeMs: number
  availabilityScore: number
  errorRate: number
}

interface ServiceAnalytics {
  serviceId: string
  countryId: string
  date: string
  totalOrders: number
  successfulOrders: number
  failedOrders: number
  avgPrice: number
  avgDeliveryTimeSeconds: number
}

interface CostOptimization {
  orderId: string
  orderType: "rental" | "multi_service" | "long_term"
  providerSelected: string
  providerCost: number
  alternativeProviders?: Array<{ provider: string; cost: number }>
  savingsAmount?: number
  savingsPercentage?: number
  selectionReason?: string
}

export class AnalyticsService {
  private supabase

  constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  /**
   * Log cost optimization decision
   */
  async logCostOptimization(data: CostOptimization): Promise<void> {
    try {
      await this.supabase.from("cost_optimization_logs").insert({
        order_id: data.orderId,
        order_type: data.orderType,
        provider_selected: data.providerSelected,
        provider_cost: data.providerCost,
        alternative_providers: data.alternativeProviders || [],
        savings_amount: data.savingsAmount || 0,
        savings_percentage: data.savingsPercentage || 0,
        selection_reason: data.selectionReason || "",
      })
    } catch (error) {
      console.error("[Analytics] Error logging cost optimization:", error)
    }
  }

  /**
   * Update provider analytics
   */
  async updateProviderAnalytics(
    provider: string,
    success: boolean,
    responseTimeMs: number,
    revenue?: number,
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0]

    try {
      const { data: existing } = await this.supabase
        .from("provider_analytics")
        .select("*")
        .eq("provider", provider)
        .eq("date", today)
        .single()

      if (existing) {
        // Update existing record
        const totalOrders = existing.total_orders + 1
        const successfulOrders = existing.successful_orders + (success ? 1 : 0)
        const failedOrders = existing.failed_orders + (success ? 0 : 1)
        const totalRevenue = existing.total_revenue + (revenue || 0)
        const avgResponseTime = Math.round(
          (existing.avg_response_time_ms * existing.total_orders + responseTimeMs) / totalOrders,
        )
        const errorRate = ((failedOrders / totalOrders) * 100).toFixed(2)

        await this.supabase
          .from("provider_analytics")
          .update({
            total_orders: totalOrders,
            successful_orders: successfulOrders,
            failed_orders: failedOrders,
            total_revenue: totalRevenue,
            avg_response_time_ms: avgResponseTime,
            error_rate: Number.parseFloat(errorRate),
            updated_at: new Date().toISOString(),
          })
          .eq("provider", provider)
          .eq("date", today)
      } else {
        // Create new record
        await this.supabase.from("provider_analytics").insert({
          provider,
          date: today,
          total_orders: 1,
          successful_orders: success ? 1 : 0,
          failed_orders: success ? 0 : 1,
          total_revenue: revenue || 0,
          avg_response_time_ms: responseTimeMs,
          error_rate: success ? 0 : 100,
        })
      }
    } catch (error) {
      console.error("[Analytics] Error updating provider analytics:", error)
    }
  }

  /**
   * Get provider performance comparison
   */
  async getProviderComparison(days = 7): Promise<ProviderAnalytics[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from("provider_analytics")
      .select("*")
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false })

    if (error) throw error

    return (
      data?.map((d) => ({
        provider: d.provider,
        date: d.date,
        totalOrders: d.total_orders,
        successfulOrders: d.successful_orders,
        failedOrders: d.failed_orders,
        totalRevenue: Number.parseFloat(d.total_revenue),
        avgResponseTimeMs: d.avg_response_time_ms,
        availabilityScore: Number.parseFloat(d.availability_score),
        errorRate: Number.parseFloat(d.error_rate),
      })) || []
    )
  }

  /**
   * Get cost savings report
   */
  async getCostSavingsReport(days = 30): Promise<{
    totalSavings: number
    avgSavingsPercentage: number
    optimizationCount: number
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from("cost_optimization_logs")
      .select("*")
      .gte("created_at", startDate.toISOString())

    if (error) throw error

    const totalSavings = data?.reduce((sum, log) => sum + Number.parseFloat(log.savings_amount || 0), 0) || 0
    const avgSavingsPercentage =
      data?.reduce((sum, log) => sum + Number.parseFloat(log.savings_percentage || 0), 0) / (data?.length || 1) || 0

    return {
      totalSavings: Number.parseFloat(totalSavings.toFixed(2)),
      avgSavingsPercentage: Number.parseFloat(avgSavingsPercentage.toFixed(2)),
      optimizationCount: data?.length || 0,
    }
  }

  /**
   * Get top performing services
   */
  async getTopServices(limit = 10): Promise<ServiceAnalytics[]> {
    const { data, error } = await this.supabase
      .from("service_analytics")
      .select("*")
      .order("successful_orders", { ascending: false })
      .limit(limit)

    if (error) throw error

    return (
      data?.map((d) => ({
        serviceId: d.service_id,
        countryId: d.country_id,
        date: d.date,
        totalOrders: d.total_orders,
        successfulOrders: d.successful_orders,
        failedOrders: d.failed_orders,
        avgPrice: Number.parseFloat(d.avg_price),
        avgDeliveryTimeSeconds: d.avg_delivery_time_seconds,
      })) || []
    )
  }
}

// Singleton
let analyticsServiceInstance: AnalyticsService | null = null

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService()
  }
  return analyticsServiceInstance
}

// Convenience function
export async function logCostOptimization(data: CostOptimization): Promise<void> {
  const service = getAnalyticsService()
  await service.logCostOptimization(data)
}

export async function trackProviderPerformance(
  provider: string,
  success: boolean,
  responseTimeMs: number,
  revenue?: number,
): Promise<void> {
  const service = getAnalyticsService()
  await service.updateProviderAnalytics(provider, success, responseTimeMs, revenue)
}
