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
    const days = Number.parseInt(searchParams.get("days") || "30")

    const analyticsService = getAnalyticsService()
    const report = await analyticsService.getCostSavingsReport(days)

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error("[Analytics] Error fetching cost savings:", error)
    return NextResponse.json({ error: "Failed to fetch cost savings" }, { status: 500 })
  }
}
