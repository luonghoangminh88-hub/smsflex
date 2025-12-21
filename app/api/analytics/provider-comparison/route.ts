import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { getAnalyticsService } from "@/lib/analytics-service"

export async function GET(request: Request) {
  const authCheck = await checkAdminAuth()
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    const analyticsService = getAnalyticsService()
    const comparison = await analyticsService.getProviderComparison(days)

    return NextResponse.json({ comparison })
  } catch (error: any) {
    console.error("[Analytics] Error fetching provider comparison:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
