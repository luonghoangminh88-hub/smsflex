import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  History,
  Phone,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Shield,
  Star,
  MessageSquare,
} from "lucide-react"
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

  const { data: popularServices } = await supabase
    .from("services")
    .select("*")
    .in("code", ["telegram", "zalo", "facebook", "tiktok", "whatsapp", "viber"])
    .eq("is_active", true)
    .limit(6)

  const isNewUser = !totalRentals || totalRentals === 0
  const hasLowBalance = (profile as Profile)?.balance < 10000

  const servicePricing = {
    telegram: { price: 5000, popular: true },
    zalo: { price: 8000, popular: true },
    facebook: { price: 6000, popular: true },
    tiktok: { price: 7000, popular: true },
    whatsapp: { price: 5500, popular: false },
    viber: { price: 5500, popular: false },
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">
      <Card className="border-0 gradient-primary text-white shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <CardContent className="relative pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            <div className="space-y-3 sm:space-y-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 animate-pulse" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight">
                  {isNewUser ? "Chào mừng đến với OTP!" : "Sẵn sàng nhận mã xác thực?"}
                </h2>
                {!isNewUser && (
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 ml-auto lg:ml-0">
                    <Zap className="h-3 w-3 mr-1" />
                    Nhanh chóng
                  </Badge>
                )}
              </div>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                {isNewUser
                  ? "Thuê số điện thoại ảo để nhận OTP cho hàng trăm dịch vụ. An toàn, nhanh chóng và giá rẻ nhất thị trường!"
                  : "Hơn 100 quốc gia, 500+ dịch vụ. Nhận mã xác thực chỉ trong vài giây!"}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Shield className="h-4 w-4" />
                  <span>Bảo mật 100%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Zap className="h-4 w-4" />
                  <span>Nhận OTP trong 30s</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4" />
                  <span>Giá tốt nhất</span>
                </div>
              </div>
              {hasLowBalance && (
                <p className="text-yellow-200 text-xs sm:text-sm font-medium flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-3 py-2 rounded-lg w-fit">
                  <Clock className="h-4 w-4 flex-shrink-0 animate-pulse" />
                  <span>Số dư thấp - Nạp ngay để không bỏ lỡ!</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto lg:w-auto">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-xl min-h-[56px] sm:min-h-[60px] group w-full sm:w-auto text-base sm:text-lg"
              >
                <Link href="/dashboard/rent" className="flex items-center justify-center gap-2.5">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Thuê số ngay</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              {hasLowBalance && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 min-h-[52px] bg-transparent w-full sm:w-auto font-semibold"
                >
                  <Link href="/dashboard/deposit" className="flex items-center justify-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <span>Nạp tiền</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {popularServices && popularServices.length > 0 && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-4 px-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2 text-balance">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 fill-yellow-500" />
                  Dịch vụ phổ biến nhất
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1.5">
                  Các dịch vụ được người Việt sử dụng nhiều nhất
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Giá tốt nhất
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {popularServices.map((service: any) => {
                const pricing = servicePricing[service.code as keyof typeof servicePricing] || {
                  price: 5000,
                  popular: false,
                }
                return (
                  <Link
                    key={service.id}
                    href={`/dashboard/rent?service=${service.code}`}
                    className="service-card group"
                  >
                    <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {service.icon_url ? (
                            <img
                              src={service.icon_url || "/placeholder.svg"}
                              alt={service.name}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm sm:text-base text-balance leading-tight">
                              {service.name}
                            </h3>
                            {pricing.popular && (
                              <Badge variant="secondary" className="mt-1 text-[10px] sm:text-xs px-1.5 py-0">
                                Phổ biến
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                              {pricing.price.toLocaleString("vi-VN")}đ
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground ml-1">/số</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Nhận OTP nhanh chóng, độ thành công cao
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Button variant="outline" asChild className="w-full mt-4 min-h-[52px] bg-transparent text-sm font-semibold">
              <Link href="/dashboard/rent" className="flex items-center gap-2">
                <span>Xem tất cả {popularServices.length > 0 ? "500+" : ""} dịch vụ</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Đang thuê</CardTitle>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{activeRentals || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
              {activeRentals ? "Số đang hoạt động" : "Chưa có số nào"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng lượt</CardTitle>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl gradient-accent flex items-center justify-center shadow-md">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{totalRentals || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
              {totalRentals ? "Tất cả lượt thuê" : "Bắt đầu thuê ngay"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-2 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Thành công</CardTitle>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">{completedRentals || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
              {completedRentals ? "Đã nhận OTP" : "OTP đầu tiên"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance and Quick Actions */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 shadow-lg">
          <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Số dư tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-3xl sm:text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                  {((profile as Profile)?.balance || 0).toLocaleString("vi-VN")}đ
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {hasLowBalance ? "Nạp thêm để tiếp tục sử dụng" : "Đủ để thuê nhiều số điện thoại"}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  asChild
                  variant="default"
                  className="min-h-[48px] sm:min-h-[44px] w-full sm:w-auto font-semibold"
                >
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

        <Card className="border-2 gradient-accent text-white">
          <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-sm sm:text-base text-white">Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-2 px-4 pb-4 sm:px-6 sm:pb-6">
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start h-auto py-3 sm:py-3 min-h-[48px] text-white hover:bg-white/20"
            >
              <Link href="/dashboard/history" className="flex items-center gap-2.5">
                <History className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">Lịch sử thuê số</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start h-auto py-3 sm:py-3 min-h-[48px] text-white hover:bg-white/20"
            >
              <Link href="/dashboard/transactions" className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">Giao dịch</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rentals */}
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
                    <p className="font-medium text-sm sm:text-base text-balance leading-tight">
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
            <Button variant="outline" asChild className="w-full mt-4 min-h-[52px] bg-transparent text-sm font-semibold">
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
