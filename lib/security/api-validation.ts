import { z } from "zod"

// Common validation schemas
export const emailSchema = z.string().email("Email không hợp lệ").toLowerCase().trim()

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
  .regex(/\d/, "Mật khẩu phải chứa ít nhất 1 số")
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt")

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\-() ]{8,20}$/, "Số điện thoại không hợp lệ")
  .optional()

export const nameSchema = z
  .string()
  .min(2, "Tên phải có ít nhất 2 ký tự")
  .max(100, "Tên không được vượt quá 100 ký tự")
  .regex(/^[a-zA-ZÀ-ỹ\s]+$/, "Tên chỉ được chứa chữ cái và khoảng trắng")
  .trim()

export const uuidSchema = z.string().uuid("ID không hợp lệ")

export const amountSchema = z
  .number()
  .positive("Số tiền phải lớn hơn 0")
  .max(1000000000, "Số tiền không được vượt quá 1 tỷ")

// API request schemas
export const depositSchema = z.object({
  payment_method_id: uuidSchema,
  amount: amountSchema.min(10000, "Số tiền tối thiểu là 10,000 VNĐ"),
})

export const rentalSchema = z.object({
  serviceId: uuidSchema,
  countryId: uuidSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mật khẩu không được để trống"),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  phoneNumber: phoneSchema,
})

// Validation helper
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: "Dữ liệu không hợp lệ" }
  }
}

// SQL Injection detection
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|\*\/|\/\*)/g,
    /(\bOR\b.*=.*)/gi,
    /('|"|;|\\)/g,
  ]

  return sqlPatterns.some((pattern) => pattern.test(input))
}

// XSS detection
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc
    /<img[^>]*\s+on\w+/gi,
    /<svg[^>]*\s+on\w+/gi,
  ]

  return xssPatterns.some((pattern) => pattern.test(input))
}

// Sanitize HTML (remove dangerous tags and attributes)
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "")

  return sanitized
}

// Sanitize for display (escape HTML entities)
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  }

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

// Validate and sanitize user input
export function sanitizeUserInput(input: string): string {
  if (detectSqlInjection(input) || detectXss(input)) {
    throw new Error("Phát hiện nội dung không an toàn")
  }

  return escapeHtml(input.trim())
}
