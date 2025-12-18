import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkLoginAttempts, recordLoginAttempt, logSecurityEvent } from "@/lib/security/auth-security"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Get IP and User-Agent for logging
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Check if account is locked
    const loginCheck = await checkLoginAttempts(email)

    if (!loginCheck.allowed) {
      const minutesLeft = loginCheck.lockedUntil
        ? Math.ceil((loginCheck.lockedUntil.getTime() - Date.now()) / 60000)
        : 0

      return NextResponse.json(
        {
          error: `Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`,
          lockedUntil: loginCheck.lockedUntil,
        },
        { status: 429 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Record failed attempt
      recordLoginAttempt(email, false)

      // Log failed login
      await logSecurityEvent(null, "login_failed", {
        email,
        ip_address: ip,
        user_agent: userAgent,
        error: error.message,
      })

      const remainingAttempts = loginCheck.remainingAttempts ? loginCheck.remainingAttempts - 1 : MAX_LOGIN_ATTEMPTS - 1

      return NextResponse.json(
        {
          error: error.message,
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
        },
        { status: 401 },
      )
    }

    // Clear failed attempts on success
    recordLoginAttempt(email, true)

    // Log successful login
    await logSecurityEvent(data.user?.id || null, "login", {
      email,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi đăng nhập" }, { status: 500 })
  }
}

const MAX_LOGIN_ATTEMPTS = 5
