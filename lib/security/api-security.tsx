import type { NextRequest } from "next/server"
import crypto from "crypto"

// CSRF Token Management
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 3600000 // 1 hour

interface CSRFToken {
  token: string
  createdAt: number
}

const csrfTokens = new Map<string, CSRFToken>()

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex")

  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
  })

  // Cleanup expired tokens
  cleanupExpiredTokens()

  return token
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const storedToken = csrfTokens.get(sessionId)

  if (!storedToken) {
    return false
  }

  // Check if token is expired
  if (Date.now() - storedToken.createdAt > CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(sessionId)
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(storedToken.token), Buffer.from(token))
}

function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [sessionId, token] of csrfTokens.entries()) {
    if (now - token.createdAt > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(sessionId)
    }
  }
}

// API Request Validation
export interface ValidationRule {
  field: string
  required?: boolean
  type?: "string" | "number" | "email" | "url" | "uuid"
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateRequest(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {}

  for (const rule of rules) {
    const value = data[rule.field]

    // Required check
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors[rule.field] = `${rule.field} là bắt buộc`
      continue
    }

    if (value === undefined || value === null || value === "") {
      continue
    }

    // Type check
    if (rule.type) {
      switch (rule.type) {
        case "string":
          if (typeof value !== "string") {
            errors[rule.field] = `${rule.field} phải là chuỗi`
          }
          break
        case "number":
          if (typeof value !== "number" && isNaN(Number(value))) {
            errors[rule.field] = `${rule.field} phải là số`
          }
          break
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[rule.field] = `${rule.field} phải là email hợp lệ`
          }
          break
        case "url":
          try {
            new URL(value)
          } catch {
            errors[rule.field] = `${rule.field} phải là URL hợp lệ`
          }
          break
        case "uuid":
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            errors[rule.field] = `${rule.field} phải là UUID hợp lệ`
          }
          break
      }
    }

    // String length checks
    if (typeof value === "string") {
      if (rule.minLength && value.length < rule.minLength) {
        errors[rule.field] = `${rule.field} phải có ít nhất ${rule.minLength} ký tự`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[rule.field] = `${rule.field} không được vượt quá ${rule.maxLength} ký tự`
      }
    }

    // Number range checks
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        errors[rule.field] = `${rule.field} phải lớn hơn hoặc bằng ${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        errors[rule.field] = `${rule.field} phải nhỏ hơn hoặc bằng ${rule.max}`
      }
    }

    // Pattern check
    if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      errors[rule.field] = `${rule.field} không đúng định dạng`
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors[rule.field] = `${rule.field} không hợp lệ`
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Input Sanitization
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "")

  // Trim whitespace
  sanitized = sanitized.trim()

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")

  return sanitized
}

// SQL Injection Prevention (for raw queries)
export function sanitizeSQLInput(input: string): string {
  // Remove SQL injection characters
  return input
    .replace(/['";]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .replace(/xp_/g, "")
    .replace(/sp_/g, "")
}

// Request Origin Validation
export function validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  if (!origin && !referer) {
    // Allow requests without origin (e.g., same-origin requests)
    return true
  }

  const requestOrigin = origin || new URL(referer!).origin

  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true
    if (allowed.includes("*")) {
      const regex = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$")
      return regex.test(requestOrigin)
    }
    return allowed === requestOrigin
  })
}

// API Key Validation (for external API integrations)
export function validateAPIKey(request: NextRequest, validKeys: string[]): boolean {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")

  if (!apiKey) {
    return false
  }

  return validKeys.includes(apiKey)
}
