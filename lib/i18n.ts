export type Locale = "vi" | "en"

const translations = {
  vi: {
    // Navigation
    nav: {
      home: "Trang chủ",
      history: "Lịch sử",
      transactions: "Giao dịch",
      profile: "Hồ sơ",
      settings: "Cài đặt",
      logout: "Đăng xuất",
    },
    // Dashboard
    dashboard: {
      subtitle: "Số Điện Thoại Ảo - OTPVIET",
      balance: "Số dư tài khoản",
      welcome: "Chào mừng",
      quickActions: "Thao tác nhanh",
      recentActivity: "Hoạt động gần đây",
    },
    // Rental
    rental: {
      selectService: "Chọn dịch vụ và quốc gia để bắt đầu thuê số điện thoại ảo",
      selectServiceFirst: "Chọn dịch vụ để bắt đầu",
      selectServiceDescription:
        "Vui lòng chọn dịch vụ và quốc gia từ bảng bên trái để xem giá và thuê số điện thoại ảo",
      selectCountryNext: "Chọn quốc gia tiếp theo",
      selectCountryDescription: "Chọn quốc gia từ danh sách bên dưới để xem giá và thuê số điện thoại ảo",
      selectCountry: "Chọn quốc gia",
      selectServiceAndCountry: "Vui lòng chọn cả dịch vụ và quốc gia",
      errorRentingNumber: "Có lỗi xảy ra khi thuê số",
      errorOccurred: "Đã xảy ra lỗi",
      price: "Giá",
      rentNumber: "Thuê số",
      renting: "Đang thuê...",
      phoneNumber: "Số điện thoại",
      status: "Trạng thái",
      waiting: "Đang chờ OTP",
      received: "Đã nhận OTP",
      cancelled: "Đã hủy",
      expired: "Hết hạn",
      cancel: "Hủy",
      checkOTP: "Kiểm tra OTP",
    },
    // Service
    service: {
      search: "Tìm kiếm dịch vụ...",
      searchCountry: "Tìm kiếm quốc gia...",
      priceList: "Bảng giá",
      statistics: "Thống kê",
      from: "Từ",
      successRate: "Tỷ lệ thành công",
      inStock: "Còn hàng",
      availability: "Tình trạng",
      experimental: "Thử nghiệm",
      experimentalWarning: "Dịch vụ này đang trong giai đoạn thử nghiệm",
      experimentalNote:
        'Dịch vụ này sử dụng service code "other" - số điện thoại sẽ nhận được tất cả SMS từ các dịch vụ tương tự.',
    },
    // Common
    common: {
      loading: "Đang tải...",
      error: "Lỗi",
      success: "Thành công",
      cancel: "Hủy",
      confirm: "Xác nhận",
      save: "Lưu",
      delete: "Xóa",
      edit: "Sửa",
      add: "Thêm",
      search: "Tìm kiếm",
      filter: "Lọc",
      sort: "Sắp xếp",
      close: "Đóng",
      back: "Quay lại",
      next: "Tiếp",
      submit: "Gửi",
    },
    // Errors
    error: {
      generic: "Đã xảy ra lỗi. Vui lòng thử lại.",
      network: "Lỗi kết nối mạng",
      unauthorized: "Bạn không có quyền truy cập",
      notFound: "Không tìm thấy",
      insufficientBalance: "Số dư không đủ",
    },
    // Auth
    auth: {
      login: "Đăng nhập",
      signup: "Đăng ký",
      logout: "Đăng xuất",
      email: "Email",
      password: "Mật khẩu",
      confirmPassword: "Xác nhận mật khẩu",
      forgotPassword: "Quên mật khẩu?",
      rememberMe: "Ghi nhớ đăng nhập",
    },
    // Transaction
    transaction: {
      type: "Loại giao dịch",
      amount: "Số tiền",
      date: "Ngày",
      status: "Trạng thái",
      deposit: "Nạp tiền",
      withdrawal: "Rút tiền",
      rental: "Thuê số",
      refund: "Hoàn tiền",
      pending: "Đang xử lý",
      completed: "Hoàn thành",
      failed: "Thất bại",
    },
  },
  en: {
    // Navigation
    nav: {
      home: "Home",
      history: "History",
      transactions: "Transactions",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
    },
    // Dashboard
    dashboard: {
      subtitle: "Virtual Phone Number - OTPVIET",
      balance: "Account Balance",
      welcome: "Welcome",
      quickActions: "Quick Actions",
      recentActivity: "Recent Activity",
    },
    // Rental
    rental: {
      selectService: "Select a service and country to start renting a virtual phone number",
      selectServiceFirst: "Select a service to get started",
      selectServiceDescription:
        "Please select a service and country from the left panel to view pricing and rent a virtual phone number",
      selectCountryNext: "Select a country next",
      selectCountryDescription: "Select a country from the list below to view pricing and rent a virtual phone number",
      selectCountry: "Select Country",
      selectServiceAndCountry: "Please select both service and country",
      errorRentingNumber: "An error occurred while renting number",
      errorOccurred: "An error occurred",
      price: "Price",
      rentNumber: "Rent Number",
      renting: "Renting...",
      phoneNumber: "Phone Number",
      status: "Status",
      waiting: "Waiting for OTP",
      received: "OTP Received",
      cancelled: "Cancelled",
      expired: "Expired",
      cancel: "Cancel",
      checkOTP: "Check OTP",
    },
    // Service
    service: {
      search: "Search services...",
      searchCountry: "Search country...",
      priceList: "Price List",
      statistics: "Statistics",
      from: "From",
      successRate: "Success Rate",
      inStock: "In Stock",
      availability: "Availability",
      experimental: "Experimental",
      experimentalWarning: "This service is in experimental stage",
      experimentalNote:
        'This service uses "other" service code - the phone number will receive all SMS from similar services.',
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      close: "Close",
      back: "Back",
      next: "Next",
      submit: "Submit",
    },
    // Errors
    error: {
      generic: "An error occurred. Please try again.",
      network: "Network connection error",
      unauthorized: "You are not authorized",
      notFound: "Not found",
      insufficientBalance: "Insufficient balance",
    },
    // Auth
    auth: {
      login: "Login",
      signup: "Sign Up",
      logout: "Logout",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      rememberMe: "Remember Me",
    },
    // Transaction
    transaction: {
      type: "Transaction Type",
      amount: "Amount",
      date: "Date",
      status: "Status",
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      rental: "Rental",
      refund: "Refund",
      pending: "Pending",
      completed: "Completed",
      failed: "Failed",
    },
  },
}

export function useTranslation(locale: Locale = "vi") {
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[locale]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        // Fallback to Vietnamese if key not found
        value = translations.vi
        for (const fallbackKey of keys) {
          if (value && typeof value === "object" && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }

    return typeof value === "string" ? value : key
  }

  return { t, locale }
}

export function getTranslation(locale: Locale, key: string): string {
  const { t } = useTranslation(locale)
  return t(key)
}
