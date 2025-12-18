import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Mail, Phone, Calendar, Shield } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/lib/types"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Thông tin tài khoản</CardTitle>
          <CardDescription>Chi tiết tài khoản và thông tin cá nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Họ và tên</p>
                <p className="font-medium">{(profile as Profile).full_name || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{(profile as Profile).email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium">{(profile as Profile).phone_number || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Vai trò</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={(profile as Profile).role === "admin" ? "default" : "secondary"}>
                    {(profile as Profile).role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </Badge>
                  <Badge variant={(profile as Profile).is_active ? "default" : "destructive"}>
                    {(profile as Profile).is_active ? "Đang hoạt động" : "Đã khóa"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                <p className="font-medium">
                  {new Date((profile as Profile).created_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Để cập nhật thông tin tài khoản, vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
