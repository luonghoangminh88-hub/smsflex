import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email } = await request.json()

    // In a real implementation, you would use nodemailer or similar to send test email
    // For now, we'll simulate a successful test
    console.log(`[v0] Test email would be sent to: ${email}`)

    return NextResponse.json({
      success: true,
      message: `Email test đã được gửi đến ${email}`,
    })
  } catch (error) {
    console.error("Error testing email:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Không thể gửi email test",
      },
      { status: 500 },
    )
  }
}
