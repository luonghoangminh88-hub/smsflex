/**
 * Currency utility functions for converting and formatting prices
 */

// Tỷ giá: 1 credit = 1000 VNĐ (có thể điều chỉnh)
export const CREDIT_TO_VND_RATE = 1000

/**
 * Chuyển đổi credits sang VNĐ
 */
export function creditsToVND(credits: number): number {
  return credits * CREDIT_TO_VND_RATE
}

/**
 * Chuyển đổi VNĐ sang credits
 */
export function vndToCredits(vnd: number): number {
  return vnd / CREDIT_TO_VND_RATE
}

/**
 * Format giá tiền sang VNĐ (₫)
 */
export function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}₫`
}

/**
 * Format giá tiền với đơn vị credits (nếu cần hiển thị)
 */
export function formatCredits(credits: number): string {
  return `${credits.toLocaleString("vi-VN")} credits`
}

/**
 * Lấy giá tiền đã format với đơn vị mặc định (VNĐ)
 */
export function getFormattedPrice(price: number): string {
  return formatVND(price)
}
