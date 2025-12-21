import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, History, Phone, TrendingUp, ArrowRight, Clock, Star, MessageSquare } from "lucide-react"
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

  const servicePricing = {
    telegram: { price: 5000, popular: true },
    zalo: { price: 8000, popular: true },
    facebook: { price: 6000, popular: true },
    tiktok: { price: 7000, popular: true },
    whatsapp: { price: 5500, popular: false },
    viber: { price: 5500, popular: false },
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-5">
      {/* Row 1: Balance Card (left) + Quick Access (right) */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 shadow-lg">
          <CardHeader className="pb-3 px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Wallet className="h-5 w-5 text-blue-600" />
              Số dư tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex-1">
                <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2 tabular-nums">
                  {((profile as Profile)?.balance || 0).toLocaleString("vi-VN")}đ
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Đủ để thuê nhiều số điện thoại</p>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                <Button asChild size="lg" className="min-h-[48px] sm:min-h-[52px] font-semibold">
                  <Link href="/dashboard/deposit" className="flex items-center justify-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Nạp tiền</span>
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="min-h-[48px] sm:min-h-[52px] bg-transparent">
                  <Link href="/dashboard/transactions" className="flex items-center justify-center gap-2">
                    <History className="h-4 w-4" />
                    <span>Lịch sử</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 gradient-accent text-white shadow-lg">
          <CardHeader className="pb-3 px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-white">Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-5 sm:px-6 sm:pb-6">
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start h-auto py-3.5 min-h-[48px] text-white hover:bg-white/20 font-medium"
            >
              <Link href="/dashboard/history" className="flex items-center gap-3">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Lịch sử thuê số</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start h-auto py-3.5 min-h-[48px] text-white hover:bg-white/20 font-medium"
            >
              <Link href="/dashboard/transactions" className="flex items-center gap-3">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Giao dịch</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-5 sm:px-6">
            <CardTitle className="text-sm font-medium">Đang thuê</CardTitle>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6">
            <div className="text-3xl sm:text-4xl font-bold mb-1">{activeRentals || 0}</div>
            <p className="text-xs text-muted-foreground">{activeRentals ? "Chưa có số nào" : "Số đang hoạt động"}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-5 sm:px-6">
            <CardTitle className="text-sm font-medium">Tổng lượt</CardTitle>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6">
            <div className="text-3xl sm:text-4xl font-bold mb-1">{totalRentals || 0}</div>
            <p className="text-xs text-muted-foreground">{totalRentals ? "Tất cả thời gian" : "Bắt đầu thuê ngay"}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-5 sm:px-6">
            <CardTitle className="text-sm font-medium">Thành công</CardTitle>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6">
            <div className="text-3xl sm:text-4xl font-bold mb-1">{completedRentals || 0}</div>
            <p className="text-xs text-muted-foreground">{completedRentals ? "OTP đầu tiên" : "Nhận được OTP"}</p>
          </CardContent>
        </Card>
      </div>

      {popularServices && popularServices.length > 0 && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-4 px-4 pt-5 sm:px-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 fill-yellow-500" />
                  Dịch vụ phổ biến nhất
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1.5">
                  Các dịch vụ được người Việt sử dụng nhiều nhất
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs px-3 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Giá tốt nhất
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6">
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
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {service.icon_url ? (
                            <img
                              src={service.icon_url || "/placeholder.svg"}
                              alt={service.name}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{service.name}</h3>
                            {pricing.popular && (
                              <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                                Phổ biến
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl sm:text-3xl font-bold text-blue-600 tabular-nums">
                              {pricing.price.toLocaleString("vi-VN")}đ
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">/số</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Nhận OTP nhanh chóng, độ thành công cao
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Button variant="outline" asChild className="w-full mt-4 min-h-[52px] text-sm font-semibold bg-transparent">
              <Link href="/dashboard/rent" className="flex items-center justify-center gap-2">
                <span>Xem tất cả 500+ dịch vụ</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Rentals */}
      {recentRentals && recentRentals.length > 0 ? (
        <Card className="border-2">
          <CardHeader className="px-4 pt-5 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Lịch sử gần đây</CardTitle>
            <CardDescription className="text-xs sm:text-sm">5 lượt thuê số gần nhất của bạn</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-6">
            <div className="space-y-3">
              {recentRentals.map((rental: PhoneRental) => (
                <div
                  key={rental.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 last:border-0 gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base leading-tight">
                      {rental.service?.name} - {rental.country?.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono break-all">{rental.phone_number}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(rental.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 flex-shrink-0">
                    <StatusBadge status={rental.status} />
                    <p className="text-sm font-medium whitespace-nowrap tabular-nums">
                      {rental.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" asChild className="w-full mt-4 min-h-[52px] text-sm font-semibold bg-transparent">
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
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
              Bạn chưa thuê số điện thoại nào. Hãy bắt đầu bằng cách chọn dịch vụ phù hợp!
            </p>
            <Button asChild size="lg" className="min-h-[52px] font-semibold">
              <Link href="/dashboard/rent" className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>Thuê số ngay</span>
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
    waiting: { label: "Chờ SMS", variant: "secondary" as const },
    active: { label: "Đang chờ", variant: "default" as const },
    completed: { label: "Hoàn thành", variant: "default" as const },
    cancelled: { label: "Đã hủy", variant: "destructive" as const },
    expired: { label: "Hết hạn", variant: "secondary" as const },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting

  return (
    <Badge variant={config.variant} className="text-[10px] sm:text-xs">
      {config.label}
    </Badge>
  )
}
