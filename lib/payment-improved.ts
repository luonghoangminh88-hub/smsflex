import crypto from "crypto"
import { formatVND } from "./currency"

export interface PaymentMethod {
  id: string
  name: string
  type: "bank_transfer" | "ewallet" | "card"
  provider: string
  account_number?: string
  account_name?: string
  bank_code?: string
  logo_url?: string
  instructions?: string
  min_amount: number
  max_amount?: number
  fee_percentage: number
  fee_fixed: number
  is_active: boolean
}

export interface Deposit {
  id: string
  user_id: string
  payment_method_id: string
  amount: number
  fee: number
  total_amount: number
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  payment_code: string
  transfer_content: string
  payment_data?: any
  idempotency_key?: string
  created_at: string
}

/**
 * Generate secure payment code for user
 * Format: NT[6-char UserID][Timestamp][Random]
 * Example: NT8A3F2Bk9x8zABC123
 */
export function generatePaymentCode(userId: string): string {
  // Use only 6 characters of user ID for brevity
  const shortUserId = userId.substring(0, 6).toUpperCase()

  // Convert timestamp to base36 for shorter representation
  const timestamp = Date.now().toString(36).toUpperCase()

  // Add 4 random bytes for uniqueness and security
  const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase()

  return `NT${shortUserId}${timestamp}${randomBytes}`
}

/**
 * Generate idempotency key for deposit request
 */
export function generateIdempotencyKey(userId: string, amount: number, timestamp: number): string {
  return crypto.createHash("sha256").update(`${userId}:${amount}:${timestamp}`).digest("hex")
}

/**
 * Generate bank transfer content
 */
export function generateTransferContent(paymentCode: string, amount: number): string {
  return `${paymentCode} ${formatVND(amount)}`
}

/**
 * Calculate fee for payment method
 */
export function calculateFee(amount: number, method: PaymentMethod): number {
  const percentageFee = (amount * method.fee_percentage) / 100
  return percentageFee + method.fee_fixed
}

/**
 * Calculate total amount with fee breakdown
 */
export function calculateTotalWithFee(
  amount: number,
  method: PaymentMethod,
): {
  amount: number
  fee: number
  total: number
  feeBreakdown: { percentage: number; fixed: number }
} {
  const percentageFee = (amount * method.fee_percentage) / 100
  const fixedFee = method.fee_fixed
  const totalFee = percentageFee + fixedFee

  return {
    amount,
    fee: totalFee,
    total: amount + totalFee,
    feeBreakdown: {
      percentage: percentageFee,
      fixed: fixedFee,
    },
  }
}

/**
 * Generate VietQR URL with improved error handling
 */
export function generateVietQRUrl(
  bankCode: string,
  accountNumber: string,
  accountName: string,
  amount: number,
  content: string,
): string {
  if (!bankCode || !accountNumber) {
    throw new Error("Bank code and account number are required")
  }

  const baseUrl = "https://img.vietqr.io/image"
  const template = "compact2"

  // Sanitize content for URL
  const sanitizedContent = encodeURIComponent(content.replace(/[^\w\s]/gi, ""))
  const sanitizedName = encodeURIComponent(accountName)

  return `${baseUrl}/${bankCode}-${accountNumber}-${template}.jpg?amount=${amount}&addInfo=${sanitizedContent}&accountName=${sanitizedName}`
}

/**
 * Check if deposit is expired (pending for more than 30 minutes)
 */
export function isDepositExpired(createdAt: string, expiryMinutes = 30): boolean {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const expiryMs = expiryMinutes * 60 * 1000
  return now - created > expiryMs
}

/**
 * Calculate refund amount based on rental duration and policy
 */
export function calculateRefundAmount(
  rentalPrice: number,
  createdAt: string,
  hasOtp: boolean,
  cancelledAt: Date = new Date(),
): {
  refundAmount: number
  refundPercentage: number
  reason: string
} {
  // No refund if OTP was received
  if (hasOtp) {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      reason: "OTP đã được nhận",
    }
  }

  const createdTime = new Date(createdAt)
  const minutesElapsed = (cancelledAt.getTime() - createdTime.getTime()) / 60000

  let percentage = 0
  let reason = ""

  if (minutesElapsed < 1) {
    percentage = 100
    reason = "Hủy trong vòng 1 phút"
  } else if (minutesElapsed < 5) {
    percentage = 75
    reason = "Hủy trong vòng 5 phút"
  } else if (minutesElapsed < 10) {
    percentage = 50
    reason = "Hủy trong vòng 10 phút"
  } else {
    percentage = 25
    reason = "Hủy sau 10 phút"
  }

  return {
    refundAmount: (rentalPrice * percentage) / 100,
    refundPercentage: percentage,
    reason,
  }
}

/**
 * Validate payment amount against method limits
 */
export function validatePaymentAmount(amount: number, method: PaymentMethod): { valid: boolean; error?: string } {
  if (amount < method.min_amount) {
    return {
      valid: false,
      error: `Số tiền nạp tối thiểu là ${formatVND(method.min_amount)}`,
    }
  }

  if (method.max_amount && amount > method.max_amount) {
    return {
      valid: false,
      error: `Số tiền nạp tối đa là ${formatVND(method.max_amount)}`,
    }
  }

  return { valid: true }
}
