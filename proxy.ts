import { updateSession } from "./lib/supabase/proxy"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { applyRateLimit } from "./lib/rate-limiter"
import { securityHeaders } from "./lib/security/content-security"

export async function proxy(request: NextRequest) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const identifier = `proxy:${ip}`

  try {
    await applyRateLimit(identifier, "api")
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Too many requests. Please try again later."
    return new NextResponse(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      },
    )
  }

  const response = await updateSession(request)

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
