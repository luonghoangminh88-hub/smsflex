import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RentalStatus } from "@/components/rental-status"

export const dynamic = "force-dynamic"

export default async function AdminRentalsPage() {
  const supabase = await createClient()

  const { data: rentals } = await supabase
    .from("phone_rentals")
    .select(
      `
      *,
      service:services(name),
      country:countries(name),
      profile:profiles(email, full_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quản lý lượt thuê</h1>
        <p className="text-muted-foreground mt-2">Theo dõi tất cả các lượt thuê số trong hệ thống</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lượt thuê</CardTitle>
          <CardDescription>50 lượt thuê gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Tìm kiếm theo số điện thoại hoặc email..." />
          </div>
          <div className="space-y-4">
            {rentals && rentals.length > 0 ? (
              rentals.map((rental: any) => (
                <div key={rental.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {rental.service?.name} - {rental.country?.name}
                        </p>
                        <RentalStatus status={rental.status} />
                      </div>
                      <p className="text-sm font-mono">{rental.phone_number}</p>
                      {rental.otp_code && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">OTP: </span>
                          <span className="font-mono font-semibold text-green-600">{rental.otp_code}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{rental.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>User: {rental.profile?.full_name || rental.profile?.email}</span>
                    <span>{new Date(rental.created_at).toLocaleString("vi-VN")}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có lượt thuê nào</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
