// BẮT BUỘC: Ép API luôn chạy ở chế độ động để đọc được Session của Admin
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Kiểm tra xác thực người dùng
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Bạn chưa đăng nhập" }, { status: 401 })
    }

    // 2. Kiểm tra quyền Admin trong bảng profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Quyền truy cập bị từ chối: Yêu cầu quyền Admin" },
        { status: 403 }
      )
    }

    // 3. Lấy mã bảo mật CRON_SECRET từ biến môi trường
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: "Lỗi hệ thống: CRON_SECRET chưa được cấu hình trên Vercel" },
        { status: 500 }
      )
    }

    // 4. Xác định URL để gọi lệnh quét email
    // Ưu tiên lấy từ biến môi trường NEXT_PUBLIC_APP_URL, nếu không có sẽ tự lấy domain hiện tại
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://otpviet.com"
    const cronUrl = `${baseUrl}/api/cron/check-bank-emails`

    console.log(`[Admin Scan] Đang gọi API quét email tại: ${cronUrl}`)

    // 5. Gọi API thực hiện quét (Cron logic)
    const response = await fetch(cronUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
      cache: 'no-store' // Không lưu cache để luôn lấy kết quả mới nhất
    })

    // Kiểm tra định dạng phản hồi
    const contentType = response.headers.get("content-type")
    let data

    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      const errorText = await response.text()
      console.error("[Admin Scan] Lỗi phản hồi không phải JSON:", errorText)
      throw new Error("Máy chủ xử lý quét email trả về lỗi (không phải định dạng JSON)")
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Quá trình quét email thất bại",
        },
        { status: response.status }
      )
    }

    // 6. Trả về kết quả thành công cho giao diện Admin
    return NextResponse.json({
      success: true,
      message: "Kích hoạt quét email thành công",
      result: data.result,
      timestamp: data.timestamp,
    })

  } catch (error) {
    console.error("[Admin Scan] Lỗi hệ thống:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
      },
      { status: 500 }
    )
  }
}