import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, Activity } from "lucide-react"

export default async function SecurityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fraud logs
  const { data: fraudLogs } = await supabase
    .from("fraud_logs")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50)

  const suspiciousCount = fraudLogs?.filter((log) => log.is_suspicious).length || 0

  // Rate limit stats
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: rateLimitLogs } = await supabase.from("rate_limit_logs").select("action").gte("created_at", oneHourAgo)

  const actionCounts: Record<string, number> = {}
  rateLimitLogs?.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bảo mật hệ thống</h1>
        <p className="text-muted-foreground">Theo dõi các hoạt động đáng ngờ và rate limiting</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động đáng ngờ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{suspiciousCount}</div>
            <p className="text-xs text-muted-foreground">50 logs gần nhất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls (1h)</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimitLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Trong 1 giờ qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Hoạt động</div>
            <p className="text-xs text-muted-foreground">Rate limiter & Fraud detection</p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động API (1 giờ qua)</CardTitle>
          <CardDescription>Số lượng request theo loại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(actionCounts).map(([action, count]) => (
              <div key={action} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium capitalize">{action}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fraud Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs phát hiện gian lận</CardTitle>
          <CardDescription>50 kiểm tra gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {fraudLogs && fraudLogs.length > 0 ? (
            <div className="space-y-3">
              {fraudLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg ${
                    log.is_suspicious ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{log.profiles?.full_name || "Unknown"}</span>
                      <Badge variant="outline">{log.action}</Badge>
                      {log.is_suspicious && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Đáng ngờ
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Risk Score: <span className="font-semibold">{log.risk_score}/100</span>
                    </p>
                    {log.flags && log.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {log.flags.map((flag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("vi-VN")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Chưa có logs nào</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
