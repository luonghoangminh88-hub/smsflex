import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface NotificationPayload {
  user_id: string
  title: string
  message: string
  type:
    | "deposit_approved"
    | "deposit_rejected"
    | "rental_created"
    | "rental_expired"
    | "refund_processed"
    | "otp_received"
    | "balance_low"
    | "system"
  metadata?: Record<string, any>
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase.from("notifications").insert({
      user_id: payload.user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      metadata: payload.metadata || {},
      is_read: false,
    })

    console.log("[v0] Notification created:", payload.type, "for user:", payload.user_id)
  } catch (error) {
    console.error("[v0] Failed to create notification:", error)
  }
}

export async function notifyDepositApproved(userId: string, amount: number, paymentMethod: string): Promise<void> {
  await createNotification({
    user_id: userId,
    title: "Nạp tiền thành công",
    message: `Yêu cầu nạp ${amount.toLocaleString("vi-VN")}đ qua ${paymentMethod} đã được xác nhận. Số dư đã được cập nhật.`,
    type: "deposit_approved",
    metadata: { amount, paymentMethod },
  })
}

export async function notifyDepositRejected(userId: string, amount: number, reason?: string): Promise<void> {
  await createNotification({
    user_id: userId,
    title: "Nạp tiền bị từ chối",
    message: `Yêu cầu nạp ${amount.toLocaleString("vi-VN")}đ đã bị từ chối. ${reason ? `Lý do: ${reason}` : ""}`,
    type: "deposit_rejected",
    metadata: { amount, reason },
  })
}

export async function notifyRentalCreated(
  userId: string,
  phoneNumber: string,
  service: string,
  country: string,
): Promise<void> {
  await createNotification({
    user_id: userId,
    title: "Thuê số thành công",
    message: `Bạn đã thuê số ${phoneNumber} cho dịch vụ ${service} (${country}). Vui lòng chờ OTP.`,
    type: "rental_created",
    metadata: { phoneNumber, service, country },
  })
}

export async function notifyOtpReceived(userId: string, phoneNumber: string, otpCode: string): Promise<void> {
  await createNotification({
    user_id: userId,
    title: "Đã nhận OTP",
    message: `OTP cho số ${phoneNumber} là: ${otpCode}`,
    type: "otp_received",
    metadata: { phoneNumber, otpCode },
  })
}

export async function notifyRentalExpired(userId: string, phoneNumber: string, refundAmount?: number): Promise<void> {
  const refundMessage = refundAmount ? ` Đã hoàn ${refundAmount.toLocaleString("vi-VN")}đ.` : ""
  await createNotification({
    user_id: userId,
    title: "Số điện thoại đã hết hạn",
    message: `Số ${phoneNumber} đã hết hạn mà không nhận được OTP.${refundMessage}`,
    type: "rental_expired",
    metadata: { phoneNumber, refundAmount },
  })
}

export async function notifyRefundProcessed(
  userId: string,
  amount: number,
  reason: string,
  percentage: number,
): Promise<void> {
  await createNotification({
    user_id: userId,
    title: "Hoàn tiền thành công",
    message: `Đã hoàn ${amount.toLocaleString("vi-VN")}đ (${percentage}%) vào tài khoản của bạn. Lý do: ${reason}`,
    type: "refund_processed",
    metadata: { amount, reason, percentage },
  })
}

export async function notifyBalanceLow(userId: string, currentBalance: number): Promise<void> {
  await createNotification({
    user_id: userId,
    title: "Số dư tài khoản thấp",
    message: `Số dư hiện tại của bạn là ${currentBalance.toLocaleString("vi-VN")}đ. Vui lòng nạp thêm để tiếp tục sử dụng dịch vụ.`,
    type: "balance_low",
    metadata: { currentBalance },
  })
}

export async function notifySystem(userId: string, title: string, message: string, metadata?: any): Promise<void> {
  await createNotification({
    user_id: userId,
    title,
    message,
    type: "system",
    metadata,
  })
}
