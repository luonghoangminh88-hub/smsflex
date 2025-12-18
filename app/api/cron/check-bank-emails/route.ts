import { type NextRequest, NextResponse } from "next/server"
import { AutoPaymentProcessor } from "@/lib/email/auto-payment-processor"

// This endpoint should be called by a cron job every 30-60 seconds
// You can use Vercel Cron or external services like cron-job.org
export async function GET(request: NextRequest) {
  // Verify the request is from authorized source
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET || "your-secret-key"

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const processor = new AutoPaymentProcessor()
    const result = await processor.processEmails()

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
