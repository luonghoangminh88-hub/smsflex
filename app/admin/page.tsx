import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Activity, Info } from "lucide-react"
import { AdminProfitChart } from "@/components/admin-profit-chart"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabaseAdmin = await createAdminClient()

  // Fetch analytics data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Today's completed rentals
  const { data: todayRentals } = await supabaseAdmin
    .from("phone_rentals")
    .select("price, cost_price, status, rental_type")
    .gte("created_at", today.toISOString())
    .eq("status", "completed")

  const todayRevenue = todayRentals?.reduce((sum, r) => sum + Number.parseFloat(r.price), 0) || 0
  const todayProfit =
    todayRentals?.reduce(
      (sum, r) => sum + (Number.parseFloat(r.price) - (r.cost_price || Number.parseFloat(r.price) * 0.7)),
      0,
    ) || 0
  const todayProfitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0

  // Yesterday's stats for comparison
  const { data: yesterdayRentals } = await supabaseAdmin
    .from("phone_rentals")
    .select("price, cost_price")
    .gte("created_at", yesterday.toISOString())
    .lt("created_at", today.toISOString())
    .eq("status", "completed")

  const yesterdayRevenue = yesterdayRentals?.reduce((sum, r) => sum + Number.parseFloat(r.price), 0) || 0
  const yesterdayProfit =
    yesterdayRentals?.reduce(
      (sum, r) => sum + (Number.parseFloat(r.price) - (r.cost_price || Number.parseFloat(r.price) * 0.7)),
      0,
    ) || 0

  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
  const profitChange = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100 : 0

  // Loss warnings - rentals with negative profit
  const lossRentals = todayRentals?.filter((r) => {
    const price = Number.parseFloat(r.price)
    const cost = r.cost_price || price * 0.7
    return price < cost
  })
  const lossCount = lossRentals?.length || 0

  // Total orders today
  const { count: todayOrders } = await supabaseAdmin
    .from("phone_rentals")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())

  // 7-day chart data
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const { data: dayRentals } = await supabaseAdmin
      .from("phone_rentals")
      .select("price, cost_price")
      .gte("created_at", date.toISOString())
      .lt("created_at", nextDate.toISOString())
      .eq("status", "completed")

    const dayRevenue = dayRentals?.reduce((sum, r) => sum + Number.parseFloat(r.price), 0) || 0
    const dayProfit =
      dayRentals?.reduce(
        (sum, r) => sum + (Number.parseFloat(r.price) - (r.cost_price || Number.parseFloat(r.price) * 0.7)),
        0,
      ) || 0

    chartData.push({
      date: `Thứ ${i === 0 ? "CN" : 8 - i}`,
      revenue: Math.round(dayRevenue),
      profit: Math.round(dayProfit),
    })
  }

  // Get global profit margin setting
  const { data: marginSetting } = await supabaseAdmin
    .from("system_settings")
    .select("value")
    .eq("key", "profit_margin_percentage")
    .single()

  const globalProfitMargin = marginSetting ? Number.parseInt(marginSetting.value) : 25

  // Recent loss transactions
  const recentLosses = lossRentals?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Profit Dashboard</h1>
        <p className="text-muted-foreground mt-1">Theo dõi dòng tiền và tối ưu hóa chiết khấu hệ thống</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu hôm nay</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRevenue.toLocaleString("vi-VN")}đ</div>
            <div className="flex items-center gap-1 text-xs">
              {revenueChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{revenueChange.toFixed(1)}%</span>
                </>
              ) : revenueChange < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
                </>
              ) : (
                <span className="text-muted-foreground">Không đổi</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lợi nhuận thực</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {todayProfit.toLocaleString("vi-VN")}đ
            </div>
            <div className="flex items-center gap-2 text-xs">
              {profitChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{profitChange.toFixed(1)}%</span>
                </>
              ) : profitChange < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{profitChange.toFixed(1)}%</span>
                </>
              ) : (
                <span className="text-muted-foreground">Không đổi</span>
              )}
              <span className="text-muted-foreground ml-auto">Margin TB: {todayProfitMargin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className={lossCount > 0 ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cảnh báo LỖ</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lossCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lossCount > 0 ? "text-red-700 dark:text-red-400" : ""}`}>
              {lossCount}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {lossCount > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  Cần kiểm tra
                </Badge>
              ) : (
                <span className="text-green-600">Tất cả có lãi</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số đơn</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Ổn định</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Biểu đồ Lợi nhuận & Doanh thu (7 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminProfitChart data={chartData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
                </div>
                <CardTitle className="text-base">Tối ưu hóa Giá (Smart Pricing)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Global Profit Margin</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">{globalProfitMargin}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${globalProfitMargin}%` }}
                  />
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Khuyến nghị:</strong> Để duy trì Discount 25% cho Multi-service mà không lỗ, Global Margin của
                  bạn nên đạt ít nhất 35%.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">TRẠNG THÁI DISCOUNT HIỆN TẠI</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span>Multi-service (25%)</span>
                    <Badge variant="destructive" className="h-5 text-[10px]">
                      Rủi ro cao
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Long-term 1D (20%)</span>
                    <Badge className="h-5 text-[10px] bg-green-600">An toàn</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Long-term 1W (30%)</span>
                    <Badge variant="outline" className="h-5 text-[10px] border-orange-500 text-orange-600">
                      Hòa vốn
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {lossCount > 0 && (
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-base">Giao dịch LỖ gần đây</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentLosses.map((rental, idx) => {
                    const price = Number.parseFloat(rental.price)
                    const cost = rental.cost_price || price * 0.7
                    const loss = price - cost

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white dark:bg-gray-950 border border-red-100 dark:border-red-900/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Rental #{rental.id.slice(0, 6)}</p>
                            <p className="text-xs text-muted-foreground">
                              {rental.rental_type === "long-term" && "1 tuần - 50% discount"}
                              {rental.rental_type === "multi-service" && "Đa dịch vụ"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-600">{loss.toLocaleString("vi-VN")}đ</p>
                            <p className="text-[10px] text-muted-foreground">{cost.toLocaleString("vi-VN")}đ cost</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
