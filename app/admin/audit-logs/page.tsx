import { requireAdminAuth } from "@/lib/auth/admin-check"
import { getAuditLogs, getSecurityLogs } from "@/lib/security/audit-logger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, Database, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export default async function AuditLogsPage() {
  await requireAdminAuth()

  const [auditLogs, securityLogs] = await Promise.all([getAuditLogs({ limit: 100 }), getSecurityLogs({ limit: 100 })])

  const suspiciousLogs = securityLogs.logs.filter((log) =>
    ["login_failed", "suspicious_activity", "rate_limit_exceeded"].includes(log.event_type),
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs & Security</h1>
        <p className="text-muted-foreground">Theo dõi tất cả các hoạt động và thay đổi hệ thống</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Audit Logs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Thay đổi dữ liệu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Logs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityLogs.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sự kiện bảo mật</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cảnh báo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{suspiciousLogs.length}</div>
            <p className="text-xs text-muted-foreground">Hoạt động đáng ngờ</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList>
          <TabsTrigger value="audit">Database Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="suspicious">
            Cảnh báo
            {suspiciousLogs.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {suspiciousLogs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Changes</CardTitle>
              <CardDescription>Lịch sử thay đổi dữ liệu quan trọng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.logs.map((log: any) => (
                  <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.action === "DELETE" ? "destructive" : "secondary"}>{log.action}</Badge>
                        <span className="font-medium">{log.table_name}</span>
                        <span className="text-sm text-muted-foreground">#{log.record_id.slice(0, 8)}</span>
                      </div>
                      {log.changed_fields && log.changed_fields.length > 0 && (
                        <div className="text-sm text-muted-foreground">Thay đổi: {log.changed_fields.join(", ")}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Lịch sử các sự kiện bảo mật</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityLogs.logs.map((log: any) => (
                  <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.event_type === "login_failed" || log.event_type === "suspicious_activity"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {log.event_type}
                        </Badge>
                        {log.ip_address && (
                          <span className="text-sm font-mono text-muted-foreground">{log.ip_address}</span>
                        )}
                      </div>
                      {log.details && (
                        <div className="text-sm text-muted-foreground">
                          {typeof log.details === "object" ? JSON.stringify(log.details, null, 2) : String(log.details)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động đáng ngờ</CardTitle>
              <CardDescription>Các sự kiện cần được xem xét</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Không có hoạt động đáng ngờ</div>
              ) : (
                <div className="space-y-3">
                  {suspiciousLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{log.event_type}</Badge>
                          {log.ip_address && (
                            <span className="text-sm font-mono text-muted-foreground">{log.ip_address}</span>
                          )}
                        </div>
                        {log.details && (
                          <div className="text-sm text-muted-foreground">
                            {typeof log.details === "object"
                              ? JSON.stringify(log.details, null, 2)
                              : String(log.details)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
