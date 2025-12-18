import { requireAdminAuth } from "@/lib/auth/admin-check"
import { getSecurityMetrics, getSystemHealthMetrics } from "@/lib/security/security-metrics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, Ban, Activity, Clock, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export default async function SecurityMonitorPage() {
  await requireAdminAuth()

  const [securityMetrics, healthMetrics] = await Promise.all([getSecurityMetrics(), getSystemHealthMetrics()])

  const threatLevel =
    securityMetrics.suspiciousActivities > 10 || securityMetrics.failedLogins > 50
      ? "high"
      : securityMetrics.suspiciousActivities > 5 || securityMetrics.failedLogins > 20
        ? "medium"
        : "low"

  const threatColor =
    threatLevel === "high" ? "text-red-600" : threatLevel === "medium" ? "text-yellow-600" : "text-green-600"
  const threatBg = threatLevel === "high" ? "bg-red-50" : threatLevel === "medium" ? "bg-yellow-50" : "bg-green-50"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Security Monitoring</h1>
        <p className="text-muted-foreground">Giám sát bảo mật và sức khỏe hệ thống real-time</p>
      </div>

      {/* Threat Level Alert */}
      <Card className={`border-2 ${threatBg}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${threatBg}`}>
                <Shield className={`h-8 w-8 ${threatColor}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mức độ nguy hiểm</h2>
                <p className="text-muted-foreground">Đánh giá dựa trên hoạt động 24h qua</p>
              </div>
            </div>
            <Badge
              variant={threatLevel === "high" ? "destructive" : "secondary"}
              className={`text-2xl px-6 py-2 ${threatColor}`}
            >
              {threatLevel === "high" ? "CAO" : threatLevel === "medium" ? "TRUNG BÌNH" : "THẤP"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đăng nhập thất bại</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">24 giờ qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động đáng ngờ</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics.suspiciousActivities}</div>
            <p className="text-xs text-muted-foreground">24 giờ qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Exceeded</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.rateLimitExceeded}</div>
            <p className="text-xs text-muted-foreground">24 giờ qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP bị chặn</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.blockedIps}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.avgResponseTime}ms</div>
            <Progress value={Math.min((healthMetrics.avgResponseTime / 1000) * 100, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Trung bình 1h qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.errorRate}%</div>
            <Progress
              value={Number.parseFloat(healthMetrics.errorRate)}
              className="mt-2"
              indicatorClassName={Number.parseFloat(healthMetrics.errorRate) > 5 ? "bg-red-500" : "bg-green-500"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {healthMetrics.errorRequests}/{healthMetrics.totalRequests} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">1 giờ qua</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Failed Login IPs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Failed Login IPs</CardTitle>
            <CardDescription>IP có nhiều lần đăng nhập thất bại (7 ngày qua)</CardDescription>
          </CardHeader>
          <CardContent>
            {securityMetrics.topFailedIps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Không có dữ liệu</div>
            ) : (
              <div className="space-y-3">
                {securityMetrics.topFailedIps.map((item: any, index: number) => (
                  <div key={item.ip} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-mono text-sm">{item.ip}</span>
                    </div>
                    <Badge variant="destructive">{item.count} lần</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>Sự kiện bảo mật gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {securityMetrics.recentEvents.slice(0, 10).map((event: any) => (
                <div key={event.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                  <div className="space-y-1">
                    <Badge
                      variant={
                        event.event_type === "login_failed" || event.event_type === "suspicious_activity"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {event.event_type}
                    </Badge>
                    {event.ip_address && (
                      <div className="text-xs font-mono text-muted-foreground">{event.ip_address}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
