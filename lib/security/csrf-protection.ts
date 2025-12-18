import { cookies } from "next/headers"
import { randomBytes } from "crypto"

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"

export async function generateCSRFToken(): Promise<string> {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex")
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
    path: "/",
  })

  return token
}

export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

export async function verifyCSRFToken(token: string | null): Promise<boolean> {
  if (!token) {
    return false
  }

  const storedToken = await getCSRFToken()

  if (!storedToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(token, storedToken)
}

export async function validateCSRFFromRequest(request: Request): Promise<boolean> {
  const token = request.headers.get(CSRF_HEADER_NAME)
  return verifyCSRFToken(token)
}

// Constant-time string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

export function csrfProtectionMiddleware() {
  return async (request: Request) => {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      return null
    }

    // Verify CSRF token
    const isValid = await validateCSRFFromRequest(request)

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    return null
  }
}
