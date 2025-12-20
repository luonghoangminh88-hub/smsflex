export const dynamic = "force-dynamic"
export const revalidate = 0

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { AutoPaymentProcessor } from "@/lib/email/auto-payment-processor"

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

    try {
      const processor = new AutoPaymentProcessor()
      const result = await processor.processEmails()

      console.log("[v0] Email scan completed:", result)

      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      })
    } catch (processorError) {
      console.error("[v0] Email processor error:", processorError)
      return NextResponse.json(
        {
          success: false,
          error: "Email scan failed",
          details: processorError instanceof Error ? processorError.message : "Unknown error",
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
