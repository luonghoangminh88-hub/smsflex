import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { checkAdminAuth } from "@/lib/auth/admin-check"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  const auth = await checkAdminAuth(supabase)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Today's revenue and profit
    const { data: todayRentals } = await supabase
      .from("phone_rentals")
      .select("price, cost_price, status, created_at")
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
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: yesterdayRentals } = await supabase
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
    const { data: lossRentals, count: lossCount } = await supabase
      .from("phone_rentals")
      .select("*", { count: "exact" })
      .gte("created_at", today.toISOString())
      .or("rental_type.eq.multi-service,rental_type.eq.long-term")

    const lossWarnings =
      lossRentals?.filter((r) => {
        const price = Number.parseFloat(r.price)
        const cost = r.cost_price || price * 0.7
        return price < cost
      }).length || 0

    // Total orders today
    const { count: todayOrders } = await supabase
      .from("phone_rentals")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())

    // 7-day chart data
    const chartData: Array<{
      date: string
      revenue: number
      profit: number
    }> = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { data: dayRentals } = await supabase
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
        date: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: Math.round(dayRevenue),
        profit: Math.round(dayProfit),
      })
    }

    // Get global profit margin setting
    const { data: marginSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "profit_margin_percentage")
      .single()

    const globalProfitMargin = marginSetting ? Number.parseInt(marginSetting.value) : 25

    // Recent loss transactions
    const { data: recentLosses } = await supabase
      .from("phone_rentals")
      .select(
        `
        id,
        price,
        cost_price,
        rental_type,
        created_at,
        service:services(name),
        country:countries(name)
      `,
      )
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(10)

    const lossTransactions = recentLosses
      ?.filter((r) => {
        const price = Number.parseFloat(r.price)
        const cost = r.cost_price || price * 0.7
        return price < cost
      })
      .map((r) => ({
        id: r.id,
        service: r.service?.name || "Unknown",
        country: r.country?.name || "Unknown",
        price: Number.parseFloat(r.price),
        cost: r.cost_price || Number.parseFloat(r.price) * 0.7,
        loss: Number.parseFloat(r.price) - (r.cost_price || Number.parseFloat(r.price) * 0.7),
        rentalType: r.rental_type,
        createdAt: r.created_at,
      }))

    return NextResponse.json({
      success: true,
      data: {
        todayRevenue,
        todayProfit,
        todayProfitMargin,
        revenueChange,
        profitChange,
        lossWarnings,
        todayOrders,
        chartData,
        globalProfitMargin,
        lossTransactions: lossTransactions?.slice(0, 5) || [],
      },
    })
  } catch (error) {
    console.error("[Admin Dashboard] Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
