import { updateSession } from "./lib/supabase/proxy"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { applyRateLimit } from "./lib/rate-limiter"
import { securityHeaders } from "./lib/security/content-security"

export async function proxy(request: NextRequest) {
  const rateLimitResult = await applyRateLimit(request)
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60),
        },
      },
    )
  }

  const response = await updateSession(request)

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit))
  response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining))
  response.headers.set("X-RateLimit-Reset", String(rateLimitResult.reset))

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
