import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, History, Phone, TrendingUp, Sparkles, ArrowRight, Clock } from "lucide-react"
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

  const { count: completedRentals } = await supabase
    .from("phone_rentals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")

  const isNewUser = !totalRentals || totalRentals === 0
  const hasLowBalance = (profile as Profile)?.balance < 10000

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      <Card className="border-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl">
        <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6 px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">
                  {isNewUser ? "Bắt đầu thuê số điện thoại ảo ngay!" : "Sẵn sàng thuê số mới?"}
                </h2>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm lg:text-base leading-relaxed">
                {isNewUser
                  ? "Chọn từ hàng trăm dịch vụ và quốc gia. Nhận OTP trong vài giây!"
                  : "Chọn dịch vụ và quốc gia để bắt đầu thuê số điện thoại ảo"}
              </p>
              {hasLowBalance && (
                <p className="text-yellow-200 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Số dư thấp - Nạp thêm tiền để tiếp tục sử dụng dịch vụ</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2.5 lg:gap-2 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg min-h-[52px] sm:min-h-[56px] group w-full sm:w-auto"
              >
                <Link href="/dashboard/rent" className="flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  <span className="text-base">Thuê số mới</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              {hasLowBalance && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 min-h-[52px] bg-transparent w-full sm:w-auto"
                >
                  <Link href="/dashboard/deposit" className="flex items-center justify-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <span>Nạp tiền ngay</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Đang thuê</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{activeRentals || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
              {activeRentals ? "Số đang hoạt động" : "Chưa có số nào"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng lượt</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{totalRentals || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
              {totalRentals ? "Tất cả" : "Chưa có lượt thuê"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Thành công</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{completedRentals || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
              {completedRentals ? "Đã nhận OTP" : "Chưa có giao dịch"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2">
          <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Số dư tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                  {((profile as Profile)?.balance || 0).toLocaleString("vi-VN")}đ
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {hasLowBalance ? "Nên nạp thêm để tiếp tục" : "Đủ để thuê số điện thoại"}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
                <Button asChild variant="default" className="min-h-[48px] sm:min-h-[44px] w-full sm:w-auto">
                  <Link href="/dashboard/deposit" className="flex items-center justify-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Nạp tiền</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="min-h-[48px] sm:min-h-[44px] bg-transparent w-full sm:w-auto"
                >
                  <Link href="/dashboard/transactions" className="flex items-center justify-center gap-2">
                    <History className="h-4 w-4" />
                    <span>Lịch sử</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
          <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-2 px-4 pb-4 sm:px-6 sm:pb-6">
            <Button variant="ghost" asChild className="w-full justify-start h-auto py-3 sm:py-3 min-h-[48px]">
              <Link href="/dashboard/history" className="flex items-center gap-2.5">
                <History className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Lịch sử thuê số</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start h-auto py-3 sm:py-3 min-h-[48px]">
              <Link href="/dashboard/transactions" className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Giao dịch</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {recentRentals && recentRentals.length > 0 ? (
        <Card>
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Lịch sử gần đây</CardTitle>
            <CardDescription className="text-xs sm:text-sm">5 lượt thuê số gần nhất của bạn</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {recentRentals.map((rental: PhoneRental) => (
                <div
                  key={rental.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 sm:pb-4 last:border-0 gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base leading-tight">
                      {rental.service?.name} - {rental.country?.name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                      {rental.phone_number}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(rental.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 flex-shrink-0">
                    <StatusBadge status={rental.status} />
                    <p className="text-sm sm:text-base font-medium whitespace-nowrap">
                      {rental.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 min-h-[52px] bg-transparent text-sm" asChild>
              <Link href="/dashboard/history">Xem tất cả lịch sử</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-center px-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Phone className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Chưa có lịch sử thuê số</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md leading-relaxed px-4">
              Bạn chưa thuê số điện thoại nào. Hãy bắt đầu bằng cách chọn dịch vụ và quốc gia phù hợp!
            </p>
            <Button asChild size="lg" className="min-h-[52px] w-full sm:w-auto px-8">
              <Link href="/dashboard/rent" className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>Thuê số đầu tiên</span>
              </Link>
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
