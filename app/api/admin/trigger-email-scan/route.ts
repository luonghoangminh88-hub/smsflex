export const dynamic = "force-dynamic"
export const revalidate = 0

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Starting email scan trigger...")

    const supabase = await createClient()

    // 1. Kiểm tra đăng nhập qua Cookie
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.log("[v0] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    // 2. Kiểm tra quyền Admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      return NextResponse.json({ success: false, error: "Failed to check permissions" }, { status: 500 })
    }

    if (!profile || profile.role !== "admin") {
      console.log("[v0] User is not admin:", profile?.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("[v0] Admin check passed")

    // 3. Gọi lệnh quét Email
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error("[v0] CRON_SECRET not configured")
      return NextResponse.json({ success: false, error: "CRON_SECRET not configured" }, { status: 500 })
    }

    // Tự động dùng domain otpviet.com nếu env chưa cập nhật
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://otpviet.com"
    const cronUrl = `${baseUrl}/api/cron/check-bank-emails`

    console.log("[v0] Calling cron endpoint:", cronUrl)

    const response = await fetch(cronUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
      cache: "no-store",
    })

    const data = await response.json()
    console.log("[v0] Cron response:", { status: response.status, data })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Quét thất bại",
          details: data,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, result: data.result })
  } catch (error) {
    console.error("[v0] Trigger email scan error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
