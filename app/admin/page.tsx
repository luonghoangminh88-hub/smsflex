import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Phone, Wallet, DollarSign, Activity } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabaseAdmin = await createAdminClient()

  // Get statistics with admin client
  const { count: totalUsers } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "user")

  const { count: totalRentals } = await supabaseAdmin.from("phone_rentals").select("*", { count: "exact", head: true })

  const { count: activeRentals } = await supabaseAdmin
    .from("phone_rentals")
    .select("*", { count: "exact", head: true })
    .in("status", ["waiting", "active"])

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("amount")
    .eq("type", "rental_purchase")
    .eq("status", "completed")

  const totalRevenue = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

  const { data: completedRentals } = await supabaseAdmin
    .from("phone_rentals")
    .select(
      `
      price,
      service_id,
      country_id,
      service_prices!inner(cost_price)
    `,
    )
    .eq("status", "completed")

  let totalProfit = 0
  if (completedRentals) {
    totalProfit = completedRentals.reduce((sum, rental: any) => {
      const costPrice = rental.service_prices?.cost_price || 0
      const sellingPrice = rental.price
      return sum + (sellingPrice - costPrice)
    }, 0)
  }

  const { data: profitMarginSetting } = await supabaseAdmin
    .from("system_settings")
    .select("value")
    .eq("key", "profit_margin_percentage")
    .single()

  const currentProfitMargin = profitMarginSetting ? Number(profitMarginSetting.value) : 20

  // Recent rentals
  const { data: recentRentals } = await supabaseAdmin
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
    .limit(10)

  console.log("[v0] Admin dashboard stats:", {
    totalUsers,
    totalRentals,
    activeRentals,
    totalRevenue,
    totalProfit,
  })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tổng quan hệ thống</h1>
        <p className="text-muted-foreground mt-2">Thống kê và hoạt động gần đây</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt thuê</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentals || 0}</div>
            <p className="text-xs text-muted-foreground">Tất cả thời gian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRentals || 0}</div>
            <p className="text-xs text-muted-foreground">Số đang thuê</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">Từ thuê số</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalProfit.toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">Margin: {currentProfitMargin}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rentals */}
      <Card>
        <CardHeader>
          <CardTitle>Lượt thuê gần đây</CardTitle>
          <CardDescription>10 lượt thuê số mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRentals && recentRentals.length > 0 ? (
              recentRentals.map((rental: any) => (
                <div key={rental.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {rental.service?.name} - {rental.country?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{rental.phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.profile?.full_name || rental.profile?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={rental.status} />
                    <p className="text-sm font-medium mt-1">{rental.price.toLocaleString("vi-VN")}đ</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rental.created_at).toLocaleString("vi-VN")}
                    </p>
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
