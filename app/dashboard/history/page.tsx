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
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Lịch sử thuê số</CardTitle>
          <CardDescription>Tất cả các lượt thuê số của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {rentals && rentals.length > 0 ? (
            <div className="space-y-4">
              {rentals.map((rental: PhoneRental) => (
                <Link key={rental.id} href={`/dashboard/rental/${rental.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {rental.service?.name} - {rental.country?.name}
                            </h3>
                            <RentalStatus status={rental.status} />
                          </div>
                          <p className="text-sm font-mono text-muted-foreground">{rental.phone_number}</p>
                          {rental.otp_code && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">OTP: </span>
                              <span className="font-mono font-semibold text-green-600">{rental.otp_code}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(rental.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{rental.price.toLocaleString("vi-VN")}đ</p>
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
              <Button asChild>
                <Link href="/dashboard/rent">Thuê số ngay</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
