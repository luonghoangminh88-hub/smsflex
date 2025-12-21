/**
 * Kiểm tra cấu hình API keys cho SMS-Activate và 5sim
 * Chạy script này để verify API keys đã được cài đặt đúng
 */

console.log("=== Kiểm tra cấu hình API ===\n")

// Kiểm tra SMS-Activate API Key
const smsActivateKey = process.env.SMS_ACTIVATE_API_KEY
console.log("📱 SMS-Activate API Key:")
if (smsActivateKey) {
  console.log(`   ✅ Đã cấu hình (${smsActivateKey.substring(0, 8)}...${smsActivateKey.slice(-4)})`)
  console.log(`   📏 Độ dài: ${smsActivateKey.length} ký tự`)
} else {
  console.log("   ❌ CHƯA cấu hình - Cần thêm SMS_ACTIVATE_API_KEY vào environment variables")
}

// Kiểm tra 5sim API Key
const fiveSimKey = process.env.FIVESIM_API_KEY
console.log("\n📱 5sim API Key:")
if (fiveSimKey) {
  console.log(`   ✅ Đã cấu hình (${fiveSimKey.substring(0, 8)}...${fiveSimKey.slice(-4)})`)
  console.log(`   📏 Độ dài: ${fiveSimKey.length} ký tự`)
} else {
  console.log("   ⚠️  Không cấu hình - Hệ thống sẽ chỉ sử dụng SMS-Activate")
}

console.log("\n=== Test kết nối API ===\n")

// Test SMS-Activate connection
if (smsActivateKey) {
  console.log("🔄 Đang test SMS-Activate API...")
  try {
    const { getSmsActivateClient } = await import("../lib/sms-activate")
    const client = getSmsActivateClient()
    const balance = await client.getBalance()
    console.log(`   ✅ Kết nối thành công!`)
    console.log(`   💰 Balance: ${balance.toLocaleString()} RUB`)
  } catch (error: any) {
    console.log(`   ❌ Lỗi kết nối: ${error.message}`)
    if (error.message.includes("BAD_KEY")) {
      console.log("   ⚠️  API key không hợp lệ - vui lòng kiểm tra lại")
    }
  }
} else {
  console.log("⏭️  Bỏ qua test SMS-Activate (không có API key)")
}

// Test 5sim connection
if (fiveSimKey) {
  console.log("\n🔄 Đang test 5sim API...")
  try {
    const { getFiveSimClient } = await import("../lib/5sim")
    const client = getFiveSimClient()
    const balance = await client.getBalance()
    console.log(`   ✅ Kết nối thành công!`)
    console.log(`   💰 Balance: ${balance.toLocaleString()} RUB`)
  } catch (error: any) {
    console.log(`   ❌ Lỗi kết nối: ${error.message}`)
    if (error.message.includes("not enough user balance")) {
      console.log("   ⚠️  Tài khoản 5sim không đủ balance")
    }
  }
} else {
  console.log("\n⏭️  Bỏ qua test 5sim (không có API key)")
}

console.log("\n=== Khuyến nghị ===\n")

if (!smsActivateKey && !fiveSimKey) {
  console.log("❌ Cần cấu hình ít nhất một API key để sử dụng hệ thống")
  console.log("\n📝 Cách thêm API key:")
  console.log("   1. Vào phần 'Vars' trong sidebar")
  console.log("   2. Thêm biến SMS_ACTIVATE_API_KEY với giá trị từ https://sms-activate.io")
} else if (smsActivateKey && !fiveSimKey) {
  console.log("✅ Hệ thống sẽ sử dụng SMS-Activate làm provider duy nhất")
  console.log("💡 Có thể thêm FIVESIM_API_KEY để có thêm backup provider")
} else if (!smsActivateKey && fiveSimKey) {
  console.log("✅ Hệ thống sẽ sử dụng 5sim làm provider duy nhất")
  console.log("💡 Nên thêm SMS_ACTIVATE_API_KEY để có thêm backup provider")
} else {
  console.log("✅ Cả hai provider đã được cấu hình")
  console.log("💡 Hệ thống sẽ tự động chọn provider tốt nhất dựa trên:")
  console.log("   - Stock availability")
  console.log("   - Price")
  console.log("   - Circuit breaker status")
}
