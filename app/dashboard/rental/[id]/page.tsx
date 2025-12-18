import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, Clock, CheckCircle, Sparkles, RefreshCw } from "lucide-react"
import Link from "next/link"
import { RentalStatus } from "@/components/rental-status"
import { CopyButton } from "@/components/copy-button"
import { SimulateOTPButton } from "@/components/simulate-otp-button"
import { AutoRefreshClient } from "@/components/auto-refresh-client"
import type { PhoneRental } from "@/lib/types"

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: rental } = await supabase
    .from("phone_rentals")
    .select(
      `
      *,
      service:services(*),
      country:countries(*)
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!rental) {
    notFound()
  }

  const expiresAt = rental.expires_at ? new Date(rental.expires_at).getTime() : null
  const now = Date.now()
  const timeRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <AutoRefreshClient rentalId={id} hasOtp={!!rental.otp_code} />

      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại Dashboard
        </Link>
      </Button>

      <Card className="border-2 shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50/80 to-blue-50/80 dark:from-slate-950/20 dark:to-blue-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Chi tiết thuê số</CardTitle>
              <CardDescription className="text-base">
                {(rental as PhoneRental).service?.name} - {(rental as PhoneRental).country?.name}
              </CardDescription>
            </div>
            <RentalStatus status={(rental as PhoneRental).status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 rounded-xl border-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Số điện thoại của bạn
              </span>
              <CopyButton text={(rental as PhoneRental).phone_number} />
            </div>
            <div className="text-3xl md:text-4xl font-mono font-bold text-center py-4 tracking-wider">
              {(rental as PhoneRental).phone_number}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Sử dụng số này để đăng ký dịch vụ {(rental as PhoneRental).service?.name}
            </p>
            {timeRemaining > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>
                  Hết hạn sau: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          {(rental as PhoneRental).otp_code ? (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-800 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-green-800 dark:text-green-400 flex items-center gap-2 font-bold">
                  <CheckCircle className="h-6 w-6" />
                  Mã OTP đã nhận!
                </span>
                <CopyButton text={(rental as PhoneRental).otp_code!} />
              </div>
              <div className="text-4xl md:text-5xl font-mono font-bold text-center py-6 text-green-700 dark:text-green-400 tracking-widest">
                {(rental as PhoneRental).otp_code}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>Sử dụng mã này để xác thực tài khoản</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400 absolute -bottom-1 -right-1 animate-spin" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-1">Đang chờ nhận mã OTP...</p>
                <p className="text-sm text-amber-700 dark:text-amber-500">
                  Vui lòng sử dụng số điện thoại ở trên để đăng ký. Mã OTP sẽ tự động hiển thị khi nhận được tin nhắn.
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <SimulateOTPButton rentalId={(rental as PhoneRental).id} />
                <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center justify-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Tự động làm mới mỗi 5 giây
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dịch vụ</span>
              <span className="font-medium">{(rental as PhoneRental).service?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quốc gia</span>
              <span className="font-medium">{(rental as PhoneRental).country?.name}</span>
            </div>
            {(rental as PhoneRental).provider && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nhà cung cấp</span>
                <span className="font-medium">
                  {(rental as PhoneRental).provider === "sms-activate" ? "SMS-Activate" : "5sim.net"}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giá</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {(rental as PhoneRental).price.toLocaleString("vi-VN")}₵
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trạng thái</span>
              <span className="font-medium capitalize">{getStatusText((rental as PhoneRental).status)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Thời gian tạo</span>
              <span className="font-medium">
                {new Date((rental as PhoneRental).created_at).toLocaleString("vi-VN")}
              </span>
            </div>
            {(rental as PhoneRental).expires_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hết hạn lúc</span>
                <span className="font-medium">
                  {new Date((rental as PhoneRental).expires_at).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          {(rental as PhoneRental).status === "completed" && (
            <div className="pt-4 border-t">
              <Button asChild className="w-full" size="lg" variant="default">
                <Link href="/dashboard/rent">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Thuê số khác
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    waiting: "Đang chờ",
    active: "Đang hoạt động",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    expired: "Hết hạn",
  }
  return statusMap[status] || status
}
