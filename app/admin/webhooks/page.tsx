import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Activity } from "lucide-react"

export default async function WebhooksPage() {
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

  const { data: webhookLogs } = await supabase
    .from("webhook_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  const stats = {
    total: webhookLogs?.length || 0,
    success: webhookLogs?.filter((w) => w.processing_status === "success").length || 0,
    failed: webhookLogs?.filter((w) => w.processing_status === "failed").length || 0,
    pending: webhookLogs?.filter((w) => w.processing_status === "pending").length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webhook Logs</h1>
        <p className="text-muted-foreground">Theo dõi và debug các webhook từ payment gateways</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành công</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử Webhook</CardTitle>
          <CardDescription>100 webhook gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {webhookLogs && webhookLogs.length > 0 ? (
            <div className="space-y-3">
              {webhookLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={log.provider === "vnpay" ? "default" : "secondary"}>{log.provider}</Badge>
                      <Badge
                        variant={
                          log.processing_status === "success"
                            ? "default"
                            : log.processing_status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {log.processing_status}
                      </Badge>
                      {log.signature_valid !== null && (
                        <Badge variant={log.signature_valid ? "default" : "destructive"}>
                          {log.signature_valid ? "Signature OK" : "Invalid Signature"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{log.event_type}</p>
                    {log.error_message && <p className="text-sm text-red-600 mb-2">{log.error_message}</p>}
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">Xem payload</summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(log.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Chưa có webhook nào</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
