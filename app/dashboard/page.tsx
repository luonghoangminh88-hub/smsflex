import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, History, Phone, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { Profile, PhoneRental } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: recentRentals, count: totalRentals } = await supabase
    .from("phone_rentals")
    .select(
      `
      *,
      service:services(*),
      country:countries(*)
    `,
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { count: activeRentals } = await supabase
    .from("phone_rentals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["waiting", "active"])

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Balance Card */}
      <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Số dư tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold">{((profile as Profile)?.balance || 0).toLocaleString("vi-VN")}đ</div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/deposit">Nạp tiền</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/history">Lịch sử giao dịch</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang thuê</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRentals || 0}</div>
            <p className="text-xs text-muted-foreground">Số đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt thuê</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentals || 0}</div>
            <p className="text-xs text-muted-foreground">Tất cả thời gian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành công</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentRentals?.filter((r: PhoneRental) => r.status === "completed").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Nhận được OTP</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Thuê số ngay</CardTitle>
          <CardDescription>Chọn dịch vụ và quốc gia để bắt đầu thuê số điện thoại ảo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard/rent">Thuê số mới</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Rentals */}
      {recentRentals && recentRentals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử gần đây</CardTitle>
            <CardDescription>5 lượt thuê số gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRentals.map((rental: PhoneRental) => (
                <div key={rental.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {rental.service?.name} - {rental.country?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{rental.phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rental.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={rental.status} />
                    <p className="text-sm font-medium mt-1">{rental.price.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
              <Link href="/dashboard/history">Xem tất cả</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    waiting: {
      label: "Đang chờ",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    active: { label: "Đang hoạt động", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    completed: {
      label: "Hoàn thành",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
    expired: { label: "Hết hạn", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
