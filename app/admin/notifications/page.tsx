import { requireAdminAuth } from "@/lib/auth/admin-check"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Check, Eye } from "lucide-react"
import { AdminNotificationsClient } from "@/components/admin-notifications-client"

export default async function AdminNotificationsPage() {
  await requireAdminAuth()
  const supabase = await createClient()

  // Get all notifications with user info
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[v0] Error fetching notifications:", error)
  }

  // Get statistics
  const { count: totalCount } = await supabase.from("notifications").select("*", { count: "exact", head: true })

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)

  const { count: readCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý thông báo</h1>
        <p className="text-muted-foreground mt-2">Xem và quản lý tất cả thông báo hệ thống</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thông báo</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tất cả thông báo trong hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa đọc</CardTitle>
            <Eye className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Thông báo chưa được đọc</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã đọc</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{readCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Thông báo đã được đọc</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
          <CardDescription>100 thông báo gần nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminNotificationsClient initialNotifications={notifications || []} />
        </CardContent>
      </Card>
    </div>
  )
}
