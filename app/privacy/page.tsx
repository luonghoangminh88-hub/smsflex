import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Globe } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-otpviet.jpg" alt="OTPVIET" className="h-8 w-8 rounded" />
            <span className="font-bold text-xl">OTPVIET</span>
          </Link>
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-4">
            <Shield className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-balance">Chính sách bảo mật</h1>
          <p className="text-lg text-muted-foreground">Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
        </div>

        {/* Trust Banner */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-green-900 dark:text-green-100">Cam kết bảo mật tuyệt đối</p>
                <p className="text-green-800 dark:text-green-200">
                  OTPVIET cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn. Chúng tôi sử dụng công nghệ mã hóa
                  tiên tiến và tuân thủ các tiêu chuẩn bảo mật quốc tế.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              1. Giới thiệu
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Chính sách bảo mật này giải thích cách OTPVIET ("chúng tôi", "của chúng tôi") thu thập, sử dụng, lưu trữ
              và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng dịch vụ thuê SIM ảo của chúng tôi.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Bằng việc sử dụng OTPVIET, bạn đồng ý với các điều khoản trong Chính sách bảo mật này. Nếu bạn không đồng
              ý, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              2. Thông tin chúng tôi thu thập
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Chúng tôi thu thập các loại thông tin sau để cung cấp và cải thiện dịch vụ:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1. Thông tin bạn cung cấp trực tiếp</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Thông tin tài khoản:</strong> Email, mật khẩu (được mã hóa), họ tên (tùy chọn)
              </li>
              <li>
                <strong>Thông tin thanh toán:</strong> Số tài khoản ngân hàng (chỉ khi bạn nạp tiền), lịch sử giao dịch
              </li>
              <li>
                <strong>Thông tin liên hệ:</strong> Email hỗ trợ, nội dung liên hệ với đội ngũ hỗ trợ
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2. Thông tin được thu thập tự động</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Dữ liệu sử dụng dịch vụ:</strong> Các dịch vụ bạn thuê, quốc gia bạn chọn, số điện thoại được
                cấp, mã OTP (chỉ lưu trong 20 phút)
              </li>
              <li>
                <strong>Thông tin kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, ngôn ngữ, múi giờ
              </li>
              <li>
                <strong>Cookies và công nghệ tương tự:</strong> Để duy trì phiên đăng nhập và cải thiện trải nghiệm
                người dùng
              </li>
              <li>
                <strong>Dữ liệu phân tích:</strong> Thống kê sử dụng ẩn danh (Vercel Analytics) để tối ưu hiệu suất
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3. Thông tin từ bên thứ ba</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Đăng nhập qua Google OAuth:</strong> Nếu bạn chọn đăng nhập qua Google, chúng tôi nhận email và
                tên của bạn
              </li>
              <li>
                <strong>Nhà cung cấp SIM:</strong> Số điện thoại và trạng thái OTP từ đối tác (SMS-Activate, 5sim)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Cách chúng tôi sử dụng thông tin</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Chúng tôi sử dụng thông tin của bạn để:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Cung cấp dịch vụ:</strong> Cấp số điện thoại ảo, hiển thị OTP, xử lý thanh toán, quản lý tài
                khoản
              </li>
              <li>
                <strong>Xử lý giao dịch:</strong> Nạp tiền, trừ tiền khi thuê số, hoàn tiền tự động
              </li>
              <li>
                <strong>Hỗ trợ khách hàng:</strong> Giải quyết vấn đề, trả lời câu hỏi, xử lý khiếu nại
              </li>
              <li>
                <strong>Cải thiện dịch vụ:</strong> Phân tích hành vi sử dụng, tối ưu hiệu suất, phát triển tính năng
                mới
              </li>
              <li>
                <strong>Bảo mật và phòng chống gian lận:</strong> Phát hiện hoạt động đáng ngờ, ngăn chặn lạm dụng dịch
                vụ
              </li>
              <li>
                <strong>Tuân thủ pháp luật:</strong> Đáp ứng yêu cầu của cơ quan chức năng, thực thi điều khoản sử dụng
              </li>
              <li>
                <strong>Thông báo:</strong> Gửi thông báo về giao dịch, cập nhật dịch vụ (không gửi email quảng cáo
                spam)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Chia sẻ thông tin với bên thứ ba</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Chúng tôi KHÔNG bán hoặc cho thuê thông tin cá nhân của bạn. Tuy nhiên, chúng tôi có thể chia sẻ thông tin
              trong các trường hợp sau:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Nhà cung cấp dịch vụ:</strong> SMS-Activate, 5sim (để cấp số điện thoại và nhận OTP)
              </li>
              <li>
                <strong>Nhà cung cấp hạ tầng:</strong> Vercel (hosting), Supabase (cơ sở dữ liệu), các dịch vụ đám mây
              </li>
              <li>
                <strong>Đối tác thanh toán:</strong> Ngân hàng xử lý giao dịch (chỉ thông tin cần thiết để xác minh
                thanh toán)
              </li>
              <li>
                <strong>Theo yêu cầu pháp luật:</strong> Khi được cơ quan có thẩm quyền yêu cầu hoặc để bảo vệ quyền lợi
                hợp pháp của chúng tôi
              </li>
              <li>
                <strong>Chuyển giao kinh doanh:</strong> Trong trường hợp sáp nhập, mua bán hoặc tái cấu trúc doanh
                nghiệp
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Tất cả các bên thứ ba được yêu cầu bảo mật thông tin của bạn và chỉ sử dụng cho mục đích cụ thể đã thỏa
              thuận.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              5. Bảo mật thông tin
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin của bạn:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Mã hóa:</strong> Tất cả dữ liệu truyền tải được mã hóa bằng SSL/TLS (HTTPS)
              </li>
              <li>
                <strong>Mật khẩu:</strong> Được hash bằng bcrypt, không lưu dạng plain text
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> Chỉ người dùng mới truy cập được dữ liệu của chính họ
              </li>
              <li>
                <strong>Phân quyền:</strong> Hệ thống phân quyền chặt chẽ giữa user và admin
              </li>
              <li>
                <strong>Giám sát:</strong> Hệ thống audit log ghi lại các hoạt động quan trọng
              </li>
              <li>
                <strong>Tự động xóa:</strong> Mã OTP và số điện thoại tạm thời bị xóa sau 20 phút
              </li>
              <li>
                <strong>Sao lưu định kỳ:</strong> Dữ liệu được sao lưu hàng ngày để đề phòng mất mát
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Tuy nhiên, không có hệ thống nào an toàn 100%. Chúng tôi khuyến nghị bạn sử dụng mật khẩu mạnh và không
              chia sẻ thông tin đăng nhập với người khác.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Lưu trữ và xóa dữ liệu</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>6.1. Thời gian lưu trữ:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Thông tin tài khoản:</strong> Lưu trữ cho đến khi bạn yêu cầu xóa tài khoản
              </li>
              <li>
                <strong>Lịch sử giao dịch:</strong> Lưu trữ ít nhất 5 năm theo quy định pháp luật về kế toán
              </li>
              <li>
                <strong>Số điện thoại và OTP:</strong> Tự động xóa sau 20 phút kể từ khi thuê
              </li>
              <li>
                <strong>Nhật ký hệ thống:</strong> Lưu trữ tối đa 90 ngày
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>6.2. Quyền xóa dữ liệu:</strong> Bạn có thể yêu cầu xóa tài khoản và dữ liệu cá nhân bằng cách
              liên hệ với chúng tôi. Tuy nhiên, chúng tôi có thể giữ lại một số thông tin cần thiết để tuân thủ pháp
              luật hoặc giải quyết tranh chấp.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              7. Quyền của bạn
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bạn có các quyền sau đối với dữ liệu cá nhân của mình:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Quyền truy cập:</strong> Yêu cầu xem thông tin cá nhân mà chúng tôi đang lưu trữ
              </li>
              <li>
                <strong>Quyền chỉnh sửa:</strong> Cập nhật hoặc sửa đổi thông tin không chính xác trong tài khoản
              </li>
              <li>
                <strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu cá nhân (trừ dữ liệu bắt buộc lưu theo pháp
                luật)
              </li>
              <li>
                <strong>Quyền hạn chế xử lý:</strong> Yêu cầu tạm dừng xử lý dữ liệu trong một số trường hợp
              </li>
              <li>
                <strong>Quyền phản đối:</strong> Phản đối việc xử lý dữ liệu cho mục đích marketing (chúng tôi hiện
                không làm điều này)
              </li>
              <li>
                <strong>Quyền rút lại đồng ý:</strong> Rút lại sự đồng ý đã cấp trước đó (điều này có thể ảnh hưởng đến
                việc sử dụng dịch vụ)
              </li>
              <li>
                <strong>Quyền khiếu nại:</strong> Gửi khiếu nại đến cơ quan bảo vệ dữ liệu có thẩm quyền
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua email{" "}
              <a href="mailto:privacy@otpviet.com" className="text-primary hover:underline">
                privacy@otpviet.com
              </a>
              . Chúng tôi sẽ phản hồi trong vòng 30 ngày.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Cookies và công nghệ theo dõi</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Chúng tôi sử dụng cookies và công nghệ tương tự để:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Cookies cần thiết:</strong> Duy trì phiên đăng nhập, xác thực người dùng
              </li>
              <li>
                <strong>Cookies chức năng:</strong> Ghi nhớ tùy chọn ngôn ngữ, giao diện
              </li>
              <li>
                <strong>Cookies phân tích:</strong> Vercel Analytics (ẩn danh, không theo dõi cá nhân)
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bạn có thể tắt cookies trong cài đặt trình duyệt, nhưng điều này có thể ảnh hưởng đến chức năng của dịch
              vụ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              9. Chuyển dữ liệu quốc tế
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Dữ liệu của bạn có thể được lưu trữ và xử lý trên các máy chủ đặt tại:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Vercel (Hoa Kỳ):</strong> Hosting và edge network toàn cầu
              </li>
              <li>
                <strong>Supabase (Hoa Kỳ/Singapore):</strong> Cơ sở dữ liệu và xác thực
              </li>
              <li>
                <strong>SMS-Activate (Nga) và 5sim (Estonia):</strong> Nhà cung cấp số điện thoại ảo
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi đảm bảo rằng tất cả các bên xử lý dữ liệu tuân thủ các tiêu chuẩn bảo mật quốc tế (GDPR, ISO
              27001) và có biện pháp bảo vệ dữ liệu phù hợp.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Dịch vụ dành cho trẻ em</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dịch vụ của chúng tôi không dành cho người dưới 18 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ
              em. Nếu bạn phát hiện một trẻ em đã cung cấp thông tin cá nhân cho chúng tôi, vui lòng liên hệ ngay để
              chúng tôi có thể xóa dữ liệu đó.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Thay đổi chính sách bảo mật</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian để phản ánh:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Thay đổi trong hoạt động kinh doanh hoặc dịch vụ</li>
              <li>Yêu cầu mới của pháp luật hoặc cơ quan quản lý</li>
              <li>Cải tiến về bảo mật hoặc công nghệ</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi sẽ thông báo về các thay đổi quan trọng qua email hoặc thông báo trên website. Ngày "Cập nhật
              lần cuối" ở đầu trang sẽ cho biết khi nào chính sách được sửa đổi gần nhất.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Tuân thủ pháp luật</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              OTPVIET cam kết tuân thủ các quy định về bảo vệ dữ liệu cá nhân, bao gồm:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Nghị định 13/2023/NĐ-CP:</strong> Về bảo vệ dữ liệu cá nhân tại Việt Nam
              </li>
              <li>
                <strong>GDPR:</strong> Quy định bảo vệ dữ liệu chung của Liên minh Châu Âu (nếu áp dụng)
              </li>
              <li>
                <strong>ISO 27001:</strong> Tiêu chuẩn quốc tế về quản lý an ninh thông tin
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">13. Liên hệ về bảo mật</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc yêu cầu nào liên quan đến quyền riêng tư và bảo mật dữ liệu, vui
              lòng liên hệ:
            </p>
            <Card className="border-2">
              <CardContent className="pt-6 space-y-3">
                <p className="text-muted-foreground">
                  <strong>Email bảo mật:</strong>{" "}
                  <a href="mailto:privacy@otpviet.com" className="text-primary hover:underline">
                    privacy@otpviet.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Email hỗ trợ:</strong>{" "}
                  <a href="mailto:support@otpviet.com" className="text-primary hover:underline">
                    support@otpviet.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Website:</strong>{" "}
                  <Link href="/" className="text-primary hover:underline">
                    https://otpviet.com
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  <strong>Thời gian phản hồi:</strong> Trong vòng 30 ngày làm việc
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer CTA */}
        <Card className="mt-12 border-2 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Lock className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold">Dữ liệu của bạn được bảo vệ</h3>
              <p className="text-muted-foreground">
                Chúng tôi sử dụng công nghệ mã hóa tiên tiến và tuân thủ các tiêu chuẩn bảo mật quốc tế
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild size="lg">
                  <Link href="/auth/signup">Bắt đầu sử dụng</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/terms">Xem Điều khoản sử dụng</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 OTPVIET. Tất cả quyền được bảo lưu.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Điều khoản sử dụng
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Chính sách bảo mật
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
