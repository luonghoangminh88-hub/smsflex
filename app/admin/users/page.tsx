import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const supabase = await createAdminClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
        <p className="text-muted-foreground mt-2">Danh sách tất cả người dùng trong hệ thống</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Hiển thị 50 người dùng gần nhất - Tổng số: {users?.length || 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Tìm kiếm theo email hoặc tên..." />
          </div>
          <div className="space-y-4">
            {users && users.length > 0 ? (
              users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.full_name || "Chưa cập nhật"}</p>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                      {!user.is_active && <Badge variant="destructive">Đã khóa</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Tham gia: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{user.balance.toLocaleString("vi-VN")}đ</p>
                    <p className="text-xs text-muted-foreground">Số dư</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Không có người dùng nào</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
