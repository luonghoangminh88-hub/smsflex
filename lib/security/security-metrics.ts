import { createClient } from "@/lib/supabase/server"

export async function getSecurityMetrics() {
  const supabase = await createClient()
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Failed login attempts (last 24h)
  const { count: failedLogins } = await supabase
    .from("security_logs")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "login_failed")
    .gte("created_at", last24h.toISOString())

  // Suspicious activities (last 24h)
  const { count: suspiciousActivities } = await supabase
    .from("security_logs")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "suspicious_activity")
    .gte("created_at", last24h.toISOString())

  // Rate limit exceeded (last 24h)
  const { count: rateLimitExceeded } = await supabase
    .from("rate_limit_violations")
    .select("*", { count: "exact", head: true })
    .gte("created_at", last24h.toISOString())

  // Blocked IPs
  const { count: blockedIps } = await supabase
    .from("blocked_ips")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Top failed login IPs (last 7 days)
  const { data: topFailedIps } = await supabase
    .from("security_logs")
    .select("ip_address")
    .eq("event_type", "login_failed")
    .gte("created_at", last7d.toISOString())
    .not("ip_address", "is", null)

  const ipCounts: { [key: string]: number } = {}
  topFailedIps?.forEach((log: any) => {
    if (log.ip_address) {
      ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1
    }
  })

  const topIps = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  // Recent security events
  const { data: recentEvents } = await supabase
    .from("security_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  // Failed login trend (last 7 days by day)
  const { data: loginTrend } = await supabase
    .from("security_logs")
    .select("created_at")
    .eq("event_type", "login_failed")
    .gte("created_at", last7d.toISOString())
    .order("created_at", { ascending: true })

  const trendByDay: { [key: string]: number } = {}
  loginTrend?.forEach((log: any) => {
    const day = new Date(log.created_at).toISOString().split("T")[0]
    trendByDay[day] = (trendByDay[day] || 0) + 1
  })

  const trend = Object.entries(trendByDay).map(([date, count]) => ({ date, count }))

  return {
    failedLogins: failedLogins || 0,
    suspiciousActivities: suspiciousActivities || 0,
    rateLimitExceeded: rateLimitExceeded || 0,
    blockedIps: blockedIps || 0,
    topFailedIps: topIps,
    recentEvents: recentEvents || [],
    loginTrend: trend,
  }
}

export async function getSystemHealthMetrics() {
  const supabase = await createClient()

  const now = new Date()
  const last1h = new Date(now.getTime() - 60 * 60 * 1000)

  // API response times (from logs)
  const { data: apiLogs } = await supabase
    .from("api_logs")
    .select("response_time")
    .gte("created_at", last1h.toISOString())
    .limit(1000)

  const avgResponseTime =
    apiLogs && apiLogs.length > 0
      ? apiLogs.reduce((sum: number, log: any) => sum + (log.response_time || 0), 0) / apiLogs.length
      : 0

  // Error rate
  const { count: totalRequests } = await supabase
    .from("api_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", last1h.toISOString())

  const { count: errorRequests } = await supabase
    .from("api_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", last1h.toISOString())
    .gte("status_code", 400)

  const errorRate = totalRequests && totalRequests > 0 ? ((errorRequests || 0) / totalRequests) * 100 : 0

  return {
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: errorRate.toFixed(2),
    totalRequests: totalRequests || 0,
    errorRequests: errorRequests || 0,
  }
}
