// BẮT BUỘC: Dòng này giúp Vercel không báo lỗi Dynamic server usage
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Kiểm tra đăng nhập qua Cookie
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // 2. Kiểm tra quyền Admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // 3. Gọi lệnh quét Email
    const cronSecret = process.env.CRON_SECRET
    // Tự động dùng domain otpviet.com nếu env chưa cập nhật
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://otpviet.com"
    
    const response = await fetch(`${baseUrl}/api/cron/check-bank-emails`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
      cache: 'no-store'
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.error || "Quét thất bại" }, { status: response.status })
    }

    return NextResponse.json({ success: true, result: data.result })
  } catch (error) {
    console.error("Lỗi:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}