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
  created_at: string
}

/**
 * Generate unique payment code for user
 * Format: NAPTEN_[UserID]_[Timestamp]
 */
export function generatePaymentCode(userId: string): string {
  const shortUserId = userId.substring(0, 8).toUpperCase()
  const timestamp = Date.now().toString().slice(-8)
  return `NAPTEN${shortUserId}${timestamp}`
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
 * Generate VietQR URL
 * Using VietQR API standard format
 */
export function generateVietQRUrl(
  bankCode: string,
  accountNumber: string,
  accountName: string,
  amount: number,
  content: string,
): string {
  const baseUrl = "https://img.vietqr.io/image"
  // Format: https://img.vietqr.io/image/[BANK_CODE]-[ACCOUNT_NUMBER]-[TEMPLATE].png?amount=[AMOUNT]&addInfo=[CONTENT]
  const qrUrl = `${baseUrl}/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(
    content,
  )}&accountName=${encodeURIComponent(accountName)}`
  return qrUrl
}

/**
 * Generate MoMo payment URL (for demo - actual implementation needs MoMo API)
 */
export function generateMoMoUrl(phoneNumber: string, amount: number, content: string): string {
  // In production, this would call MoMo API to generate payment URL
  // For demo, return a placeholder
  return `https://nhantien.momo.vn/${phoneNumber}?amount=${amount}&note=${encodeURIComponent(content)}`
}

/**
 * Check if deposit is expired (pending for more than 30 minutes)
 */
export function isDepositExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const thirtyMinutes = 30 * 60 * 1000
  return now - created > thirtyMinutes
}
