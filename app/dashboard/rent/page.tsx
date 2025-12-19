import { AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Zap, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"
import { FivesimInspiredSelector } from "@/components/fivesim-inspired-selector"
import type { Service, Country, ServicePrice, Profile } from "@/lib/types"
import { formatVND } from "@/lib/currency"

export default async function RentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all active services
  const { data: services } = await supabase.from("services").select("*").eq("is_active", true).order("name")

  // Fetch all active countries
  const { data: countries } = await supabase.from("countries").select("*").eq("is_active", true).order("name")

  // Fetch all service prices with relations
  const { data: servicePrices } = await supabase
    .from("service_prices")
    .select(
      `
      *,
      service:services(*),
      country:countries(*)
    `,
    )
    .eq("is_available", true)

  const { count: successfulRentals } = await supabase
    .from("phone_rentals")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-[1400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" asChild size="sm" className="flex-shrink-0">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <h1 className="text-base sm:text-xl font-bold leading-tight break-words">Số điện thoại ảo nhận SMS</h1>
          </div>

          <Card className="border-2 shadow-sm flex-shrink-0">
            <CardContent className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Số dư</div>
              <div className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                {formatVND((profile as Profile)?.balance || 0)}
              </div>
              <Button asChild size="sm" className="h-7 sm:h-8 text-xs px-2 sm:px-3">
                <Link href="/dashboard/deposit">Nạp tiền</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4 sm:mb-6 border-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-cyan-900 dark:text-cyan-100 mb-1">
                  Giá tối ưu tự động cho mọi dịch vụ!
                </p>
                <p className="text-[11px] sm:text-xs text-cyan-700 dark:text-cyan-300 leading-relaxed">
                  Hệ thống tự động chọn nhà cung cấp có giá tốt nhất và tỷ lệ thành công cao nhất để mang đến trải
                  nghiệm tốt nhất cho bạn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <FivesimInspiredSelector
          services={(services as Service[]) || []}
          countries={(countries as Country[]) || []}
          servicePrices={(servicePrices as ServicePrice[]) || []}
          userBalance={(profile as Profile)?.balance || 0}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <Card className="border">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">Nhận số nhanh chóng</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Số điện thoại được cấp tự động, nhận SMS ngay lập tức trong vài giây
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">Tỷ lệ thành công cao</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hơn 98% đơn hàng nhận được OTP thành công, cam kết hoàn tiền nếu thất bại
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">An toàn & riêng tư</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Số điện thoại chỉ dùng 1 lần, không chia sẻ, bảo mật thông tin tuyệt đối
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 sm:mt-6 border-2">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Cách thức hoạt động</h3>
            <div className="space-y-3 sm:space-y-4 text-sm">
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 text-sm">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Chọn dịch vụ và quốc gia</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Bạn chọn dịch vụ cần nhận OTP (Facebook, Zalo, Grab, v.v.) và quốc gia bạn muốn số điện thoại đến từ
                    đó.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 text-sm">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Hệ thống cấp số điện thoại</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Hệ thống tự động thuê số từ các nhà cung cấp như SMS-Activate hoặc 5SIM. Bạn nhận được số điện thoại
                    thật để sử dụng.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 text-sm">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Nhập số vào dịch vụ</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Bạn copy số điện thoại và nhập vào dịch vụ cần xác thực (Zalo, Grab, Xanh SM, v.v.). Dịch vụ sẽ gửi
                    mã OTP đến số điện thoại này.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 text-sm">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Nhận mã OTP tự động</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Hệ thống tự động lắng nghe và nhận tin nhắn từ số điện thoại. Khi OTP đến, nó sẽ hiển thị ngay trên
                    màn hình để bạn sử dụng. Bạn copy mã OTP và hoàn tất xác thực.
                  </p>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline-block mr-2" />
                <AlertDescription className="text-[11px] sm:text-xs inline-block">
                  <strong>Lưu ý:</strong> Mỗi số điện thoại chỉ được sử dụng 1 lần cho 1 dịch vụ duy nhất. Sau khi nhận
                  OTP thành công, số điện thoại sẽ được giải phóng và không thể sử dụng lại.
                  <br />
                  <br />
                  <strong>Dịch vụ thử nghiệm:</strong> Các dịch vụ Việt Nam như Zalo, Grab, Xanh SM sử dụng service code
                  "other" (nhận tất cả SMS). Hệ thống vẫn hoàn tiền nếu không nhận được OTP trong thời gian quy định.
                </AlertDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
