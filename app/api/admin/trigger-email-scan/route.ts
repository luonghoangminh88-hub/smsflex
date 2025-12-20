export const dynamic = "force-dynamic"
export const revalidate = 0

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Starting email scan trigger...")

    let supabase
    try {
      supabase = await createClient()
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize database connection",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // 1. Kiểm tra đăng nhập qua Cookie
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json(
        { success: false, error: "Authentication failed", details: authError.message },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("[v0] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized - Please login first" }, { status: 401 })
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
      return NextResponse.json(
        { success: false, error: "Failed to check permissions", details: profileError.message },
        { status: 500 },
      )
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
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: CRON_SECRET not set",
          hint: "Please add CRON_SECRET to environment variables",
        },
        { status: 500 },
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://otpviet.com"
    const cronUrl = `${baseUrl}/api/cron/check-bank-emails`

    console.log("[v0] Calling cron endpoint:", cronUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch(cronUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      console.log("[v0] Cron response:", { status: response.status, data })

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || "Email scan failed",
            details: data,
          },
          { status: response.status },
        )
      }

      return NextResponse.json({ success: true, result: data.result })
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("[v0] Email scan timeout")
        return NextResponse.json(
          {
            success: false,
            error: "Email scan timed out",
            hint: "The email scan is taking too long. Please check server logs.",
          },
          { status: 504 },
        )
      }

      console.error("[v0] Fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to email scan service",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
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
