import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo-otpviet.jpg" alt="OTPVIET" className="h-6 w-6 rounded" />
            <span>&copy; 2025 OTPVIET. Tất cả quyền được bảo lưu.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </Link>
            <a href="mailto:support@otpviet.com" className="hover:text-primary transition-colors">
              Hỗ trợ
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
