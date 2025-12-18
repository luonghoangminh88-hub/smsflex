import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Lock, Globe } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt</h1>
          <p className="text-muted-foreground mt-2">Quản lý tùy chọn và thiết lập tài khoản</p>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Thông báo
            </CardTitle>
            <CardDescription>Cấu hình các thông báo bạn muốn nhận</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif">Thông báo qua Email</Label>
                <p className="text-sm text-muted-foreground">Nhận thông báo về giao dịch và hoạt động</p>
              </div>
              <Switch id="email-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="otp-notif">Thông báo OTP</Label>
                <p className="text-sm text-muted-foreground">Thông báo khi có OTP mới</p>
              </div>
              <Switch id="otp-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promo-notif">Khuyến mãi</Label>
                <p className="text-sm text-muted-foreground">Nhận thông báo về ưu đãi và khuyến mãi</p>
              </div>
              <Switch id="promo-notif" />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Bảo mật
            </CardTitle>
            <CardDescription>Cài đặt bảo mật cho tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đổi mật khẩu</Label>
                <p className="text-sm text-muted-foreground">Cập nhật mật khẩu của bạn</p>
              </div>
              <Button variant="outline" size="sm" disabled className="bg-transparent">
                Đổi mật khẩu
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa">Xác thực 2 bước</Label>
                <p className="text-sm text-muted-foreground">Thêm lớp bảo mật cho tài khoản</p>
              </div>
              <Switch id="2fa" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Tùy chọn
            </CardTitle>
            <CardDescription>Tùy chỉnh trải nghiệm của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ngôn ngữ</Label>
                <p className="text-sm text-muted-foreground">Chọn ngôn ngữ hiển thị</p>
              </div>
              <Button variant="outline" size="sm" disabled className="bg-transparent">
                Tiếng Việt
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Chế độ tối</Label>
                <p className="text-sm text-muted-foreground">Chuyển sang giao diện tối</p>
              </div>
              <Switch id="dark-mode" disabled />
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Một số tính năng đang trong quá trình phát triển và sẽ sớm được kích hoạt.
        </p>
      </div>
    </div>
  )
}
