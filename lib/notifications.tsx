import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type NotificationType =
  | "deposit_approved"
  | "deposit_rejected"
  | "rental_created"
  | "rental_expired"
  | "refund_processed"
  | "otp_received"
  | "balance_low"
  | "system"

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
      is_read: false,
    })

    if (error) {
      console.error("[v0] Notification creation error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Notification error:", error)
    return false
  }
}

export async function sendEmailNotification(email: string, subject: string, html: string): Promise<boolean> {
  // In production, integrate with email service (SendGrid, Resend, etc.)
  // For now, we'll just log it
  console.log("[v0] Email notification:", { email, subject, html })

  // TODO: Implement actual email sending
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ from: 'noreply@yourdomain.com', to: email, subject, html })

  return true
}

export function getEmailTemplate(type: NotificationType, data: Record<string, any>): { subject: string; html: string } {
  switch (type) {
    case "deposit_approved":
      return {
        subject: "Xác nhận nạp tiền thành công",
        html: `
          <h2>Nạp tiền thành công</h2>
          <p>Số tiền: <strong>${data.amount?.toLocaleString("vi-VN")}đ</strong></p>
          <p>Số dư hiện tại: <strong>${data.balance?.toLocaleString("vi-VN")}đ</strong></p>
          <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
        `,
      }
    case "deposit_rejected":
      return {
        subject: "Yêu cầu nạp tiền bị từ chối",
        html: `
          <h2>Nạp tiền không thành công</h2>
          <p>Số tiền: <strong>${data.amount?.toLocaleString("vi-VN")}đ</strong></p>
          <p>Lý do: ${data.reason || "Không xác định"}</p>
          <p>Vui lòng kiểm tra lại thông tin và thử lại.</p>
        `,
      }
    case "rental_created":
      return {
        subject: "Thuê số thành công",
        html: `
          <h2>Bạn đã thuê số điện thoại thành công</h2>
          <p>Số điện thoại: <strong>${data.phoneNumber}</strong></p>
          <p>Dịch vụ: ${data.serviceName}</p>
          <p>Giá: <strong>${data.price?.toLocaleString("vi-VN")}đ</strong></p>
          <p>Hệ thống sẽ tự động nhận OTP khi có tin nhắn đến.</p>
        `,
      }
    case "otp_received":
      return {
        subject: "Đã nhận OTP",
        html: `
          <h2>Mã OTP của bạn</h2>
          <p>Số điện thoại: ${data.phoneNumber}</p>
          <p>Mã OTP: <strong style="font-size: 24px; color: #2563eb;">${data.otp}</strong></p>
          <p>Dịch vụ: ${data.serviceName}</p>
        `,
      }
    case "refund_processed":
      return {
        subject: "Hoàn tiền thành công",
        html: `
          <h2>Đã hoàn tiền</h2>
          <p>Số tiền hoàn: <strong>${data.amount?.toLocaleString("vi-VN")}đ</strong></p>
          <p>Lý do: ${data.reason}</p>
          <p>Số dư hiện tại: <strong>${data.balance?.toLocaleString("vi-VN")}đ</strong></p>
        `,
      }
    default:
      return {
        subject: "Thông báo từ hệ thống",
        html: `<p>${data.message || "Bạn có thông báo mới"}</p>`,
      }
  }
}

export async function notifyDepositApproved(userId: string, email: string, amount: number, balance: number) {
  await createNotification({
    userId,
    type: "deposit_approved",
    title: "Nạp tiền thành công",
    message: `Tài khoản của bạn đã được nạp ${amount.toLocaleString("vi-VN")}đ`,
    metadata: { amount, balance },
  })

  const emailTemplate = getEmailTemplate("deposit_approved", { amount, balance })
  await sendEmailNotification(email, emailTemplate.subject, emailTemplate.html)
}

export async function notifyDepositRejected(userId: string, email: string, amount: number, reason: string) {
  await createNotification({
    userId,
    type: "deposit_rejected",
    title: "Nạp tiền không thành công",
    message: `Yêu cầu nạp ${amount.toLocaleString("vi-VN")}đ bị từ chối. Lý do: ${reason}`,
    metadata: { amount, reason },
  })

  const emailTemplate = getEmailTemplate("deposit_rejected", { amount, reason })
  await sendEmailNotification(email, emailTemplate.subject, emailTemplate.html)
}

export async function notifyRentalCreated(
  userId: string,
  email: string,
  phoneNumber: string,
  serviceName: string,
  price: number,
) {
  await createNotification({
    userId,
    type: "rental_created",
    title: "Thuê số thành công",
    message: `Bạn đã thuê số ${phoneNumber} cho dịch vụ ${serviceName}`,
    metadata: { phoneNumber, serviceName, price },
  })

  const emailTemplate = getEmailTemplate("rental_created", { phoneNumber, serviceName, price })
  await sendEmailNotification(email, emailTemplate.subject, emailTemplate.html)
}

export async function notifyOTPReceived(
  userId: string,
  email: string,
  phoneNumber: string,
  otp: string,
  serviceName: string,
) {
  await createNotification({
    userId,
    type: "otp_received",
    title: "Đã nhận OTP",
    message: `Mã OTP cho số ${phoneNumber}: ${otp}`,
    metadata: { phoneNumber, otp, serviceName },
  })

  const emailTemplate = getEmailTemplate("otp_received", { phoneNumber, otp, serviceName })
  await sendEmailNotification(email, emailTemplate.subject, emailTemplate.html)
}

export async function notifyRefundProcessed(
  userId: string,
  email: string,
  amount: number,
  reason: string,
  balance: number,
) {
  await createNotification({
    userId,
    type: "refund_processed",
    title: "Hoàn tiền thành công",
    message: `Đã hoàn ${amount.toLocaleString("vi-VN")}đ vào tài khoản. ${reason}`,
    metadata: { amount, reason, balance },
  })

  const emailTemplate = getEmailTemplate("refund_processed", { amount, reason, balance })
  await sendEmailNotification(email, emailTemplate.subject, emailTemplate.html)
}
