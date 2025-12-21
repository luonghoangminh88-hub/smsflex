/**
 * Webhook Security Layer
 * Validates and secures incoming webhooks from SMS-Activate
 */

import crypto from "crypto"

export interface WebhookValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate webhook signature from SMS-Activate
 * SMS-Activate uses HMAC-SHA256 for webhook signing
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): WebhookValidationResult {
  try {
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))

    if (!isValid) {
      return { isValid: false, error: "Invalid webhook signature" }
    }

    return { isValid: true }
  } catch (error) {
    console.error("[v0] Webhook signature validation error:", error)
    return { isValid: false, error: "Signature validation failed" }
  }
}

/**
 * Validate webhook IP address
 * SMS-Activate webhooks come from specific IP ranges
 */
export function validateWebhookIP(requestIP: string): WebhookValidationResult {
  // SMS-Activate webhook IPs (update based on official documentation)
  const allowedIPs = ["185.158.113.0/24", "185.158.114.0/24", "185.158.115.0/24", "185.158.116.0/24"]

  // Allow localhost for development
  if (process.env.NODE_ENV === "development") {
    if (requestIP === "::1" || requestIP === "127.0.0.1" || requestIP === "localhost") {
      return { isValid: true }
    }
  }

  // Check if IP is in allowed ranges
  const isAllowed = allowedIPs.some((range) => {
    if (range.includes("/")) {
      return isIPInRange(requestIP, range)
    }
    return requestIP === range
  })

  if (!isAllowed) {
    return { isValid: false, error: `IP ${requestIP} not in whitelist` }
  }

  return { isValid: true }
}

/**
 * Check if IP is in CIDR range
 */
function isIPInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/")
  const mask = ~(2 ** (32 - Number.parseInt(bits)) - 1)

  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(range)

  return (ipNum & mask) === (rangeNum & mask)
}

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number.parseInt(octet), 0)
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: any): WebhookValidationResult {
  if (!payload) {
    return { isValid: false, error: "Empty payload" }
  }

  // Required fields for SMS-Activate webhook
  const requiredFields = ["activationId", "status"]

  for (const field of requiredFields) {
    if (!(field in payload)) {
      return { isValid: false, error: `Missing required field: ${field}` }
    }
  }

  // Validate activationId format
  if (typeof payload.activationId !== "string" || payload.activationId.length === 0) {
    return { isValid: false, error: "Invalid activationId" }
  }

  // Validate status
  const validStatuses = ["STATUS_OK", "STATUS_CANCEL", "STATUS_WAIT_CODE", "STATUS_WAIT_RETRY"]
  if (!validStatuses.includes(payload.status)) {
    return { isValid: false, error: `Invalid status: ${payload.status}` }
  }

  return { isValid: true }
}

/**
 * Rate limiting for webhook endpoints
 */
const webhookCallCache = new Map<string, number[]>()

export function checkWebhookRateLimit(
  activationId: string,
  maxRequests = 10,
  windowMs = 60000,
): WebhookValidationResult {
  const now = Date.now()
  const timestamps = webhookCallCache.get(activationId) || []

  // Remove old timestamps outside the window
  const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs)

  if (recentTimestamps.length >= maxRequests) {
    return {
      isValid: false,
      error: `Rate limit exceeded: ${maxRequests} requests per ${windowMs}ms`,
    }
  }

  // Add current timestamp
  recentTimestamps.push(now)
  webhookCallCache.set(activationId, recentTimestamps)

  // Cleanup old entries (every 100 requests)
  if (webhookCallCache.size > 1000) {
    for (const [key, times] of webhookCallCache.entries()) {
      if (times.every((t) => now - t > windowMs)) {
        webhookCallCache.delete(key)
      }
    }
  }

  return { isValid: true }
}

/**
 * Generate webhook secret for configuration
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Sanitize webhook payload for logging (remove sensitive data)
 */
export function sanitizeWebhookPayload(payload: any): any {
  const sanitized = { ...payload }

  // Remove or mask sensitive fields
  const sensitiveFields = ["phoneNumber", "phone"]
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      const value = sanitized[field].toString()
      sanitized[field] = value.substring(0, 3) + "****" + value.substring(value.length - 2)
    }
  }

  return sanitized
}
