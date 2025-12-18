import { createClient } from "@/lib/supabase/server"

interface LoginAttempt {
  email: string
  attempts: number
  lastAttempt: Date
  lockedUntil?: Date
}

// In-memory store for login attempts (trong production nên dùng Redis)
const loginAttempts = new Map<string, LoginAttempt>()

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const ATTEMPT_WINDOW_MINUTES = 15

export async function checkLoginAttempts(
  email: string,
): Promise<{ allowed: boolean; remainingAttempts?: number; lockedUntil?: Date }> {
  const attempt = loginAttempts.get(email)

  if (!attempt) {
    return { allowed: true }
  }

  // Check if account is locked
  if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    return {
      allowed: false,
      lockedUntil: attempt.lockedUntil,
    }
  }

  // Reset if attempt window has passed
  const windowExpired = new Date().getTime() - attempt.lastAttempt.getTime() > ATTEMPT_WINDOW_MINUTES * 60 * 1000
  if (windowExpired) {
    loginAttempts.delete(email)
    return { allowed: true }
  }

  // Check if max attempts reached
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
    attempt.lockedUntil = lockoutUntil
    loginAttempts.set(email, attempt)

    return {
      allowed: false,
      lockedUntil: lockoutUntil,
    }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.attempts,
  }
}

export function recordLoginAttempt(email: string, success: boolean) {
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(email)
    return
  }

  const attempt = loginAttempts.get(email)

  if (attempt) {
    attempt.attempts++
    attempt.lastAttempt = new Date()
  } else {
    loginAttempts.set(email, {
      email,
      attempts: 1,
      lastAttempt: new Date(),
    })
  }
}

export interface PasswordValidation {
  valid: boolean
  errors: string[]
  strength: "weak" | "medium" | "strong"
  score: number
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  // Minimum length
  if (password.length < 8) {
    errors.push("Mật khẩu phải có ít nhất 8 ký tự")
  } else {
    score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
  }

  // Contains uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất 1 chữ hoa")
  } else {
    score += 1
  }

  // Contains lowercase
  if (!/[a-z]/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất 1 chữ thường")
  } else {
    score += 1
  }

  // Contains number
  if (!/\d/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất 1 số")
  } else {
    score += 1
  }

  // Contains special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)")
  } else {
    score += 2
  }

  // Common password check
  const commonPasswords = ["password", "12345678", "qwerty", "abc123", "password123", "123456789"]
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push("Mật khẩu quá phổ biến, vui lòng chọn mật khẩu khác")
    score = 0
  }

  let strength: "weak" | "medium" | "strong" = "weak"
  if (score >= 7) strength = "strong"
  else if (score >= 4) strength = "medium"

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  }
}

export async function logSecurityEvent(
  userId: string | null,
  eventType: "login" | "login_failed" | "signup" | "password_change" | "suspicious_activity",
  details: Record<string, any>,
) {
  const supabase = await createClient()

  await supabase.from("security_logs").insert({
    user_id: userId,
    event_type: eventType,
    ip_address: details.ip_address,
    user_agent: details.user_agent,
    details: details,
    created_at: new Date().toISOString(),
  })
}
