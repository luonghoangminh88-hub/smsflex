import { cookies } from "next/headers"
import { createHash, randomBytes } from "crypto"

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"

// Generate CSRF token
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex")
}

// Hash token for storage
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

// Set CSRF token in cookie
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })

  return token
}

// Get CSRF token from cookie
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

// Validate CSRF token
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Skip CSRF check for GET, HEAD, OPTIONS
  const method = request.method
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  const cookieToken = await getCsrfToken()

  if (!headerToken || !cookieToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return headerToken === cookieToken
}

// Middleware wrapper for CSRF protection
export async function withCsrfProtection(
  handler: (request: Request) => Promise<Response>,
  request: Request,
): Promise<Response> {
  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  return handler(request)
}
