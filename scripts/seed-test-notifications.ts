import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function seedNotifications() {
  console.log("[v0] Starting notification seeding...")

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get first user
  const { data: users, error: userError } = await supabase.from("profiles").select("id").limit(1)

  if (userError) {
    console.error("[v0] Error fetching users:", userError)
    return
  }

  if (!users || users.length === 0) {
    console.log("[v0] No users found to create notifications for")
    return
  }

  const userId = users[0].id
  console.log("[v0] Creating notifications for user:", userId)

  const testNotifications = [
    {
      user_id: userId,
      type: "system",
      title: "Chào mừng đến với hệ thống",
      message: "Cảm ơn bạn đã sử dụng dịch vụ thuê số điện thoại của chúng tôi!",
      is_read: false,
      metadata: {},
    },
    {
      user_id: userId,
      type: "balance_low",
      title: "Số dư tài khoản thấp",
      message: "Số dư tài khoản của bạn đang thấp. Vui lòng nạp thêm tiền để tiếp tục sử dụng dịch vụ.",
      is_read: false,
      metadata: { balance: 50000 },
    },
    {
      user_id: userId,
      type: "deposit_approved",
      title: "Nạp tiền thành công",
      message: "Tài khoản của bạn đã được nạp 100,000đ",
      is_read: false,
      metadata: { amount: 100000 },
    },
    {
      user_id: userId,
      type: "rental_created",
      title: "Thuê số thành công",
      message: "Bạn đã thuê số +84 123 456 789 cho dịch vụ Facebook",
      is_read: true,
      metadata: { phoneNumber: "+84 123 456 789", serviceName: "Facebook" },
    },
    {
      user_id: userId,
      type: "otp_received",
      title: "Đã nhận OTP",
      message: "Mã OTP cho số +84 123 456 789: 123456",
      is_read: true,
      metadata: { phoneNumber: "+84 123 456 789", otp: "123456" },
    },
  ]

  const { data, error } = await supabase.from("notifications").insert(testNotifications).select()

  if (error) {
    console.error("[v0] Error seeding notifications:", error)
    return
  }

  console.log(`[v0] Successfully created ${data.length} test notifications for user ${userId}`)
  console.log("[v0] Notifications:", data)
}

seedNotifications()
