import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RentalStatus } from "@/components/rental-status"
import type { PhoneRental } from "@/lib/types"

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: rentals } = await supabase
    .from("phone_rentals")
    .select(
      `
      *,
      service:services(*),
      country:countries(*)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Button variant="ghost" asChild className="mb-6 min-h-[44px]">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Lịch sử thuê số</CardTitle>
          <CardDescription>Tất cả các lượt thuê số của bạn</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {rentals && rentals.length > 0 ? (
            <div className="space-y-4">
              {rentals.map((rental: PhoneRental) => (
                <Link key={rental.id} href={`/dashboard/rental/${rental.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base">
                              {rental.service?.name} - {rental.country?.name}
                            </h3>
                            <RentalStatus status={rental.status} />
                          </div>
                          <p className="text-sm font-mono text-muted-foreground break-all">{rental.phone_number}</p>
                          {rental.otp_code && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">OTP: </span>
                              <span className="font-mono font-semibold text-green-600 text-base sm:text-lg tracking-wider">
                                {rental.otp_code}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(rental.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                          <p className="font-semibold text-base sm:text-lg">{rental.price.toLocaleString("vi-VN")}đ</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Bạn chưa có lịch sử thuê số nào</p>
              <Button asChild className="min-h-[48px]">
                <Link href="/dashboard/rent">Thuê số ngay</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
