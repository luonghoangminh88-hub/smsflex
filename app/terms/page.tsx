import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileText, Shield, AlertCircle, Scale } from "lucide-react"

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-balance">Điều khoản sử dụng</h1>
          <p className="text-lg text-muted-foreground">Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
        </div>

        {/* Alert Box */}
        <Card className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Vui lòng đọc kỹ trước khi sử dụng dịch vụ
                </p>
                <p className="text-amber-800 dark:text-amber-200">
                  Bằng việc đăng ký và sử dụng OTPVIET, bạn đồng ý với tất cả các điều khoản và điều kiện được nêu dưới
                  đây.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              1. Chấp nhận điều khoản
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Khi truy cập và sử dụng dịch vụ OTPVIET (bao gồm website, ứng dụng và API), bạn xác nhận rằng bạn đã đọc,
              hiểu và đồng ý tuân thủ các Điều khoản sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều
              khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi có quyền thay đổi, sửa đổi hoặc cập nhật các điều khoản này bất kỳ lúc nào mà không cần thông
              báo trước. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các
              thay đổi đó.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Mô tả dịch vụ</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              OTPVIET cung cấp dịch vụ thuê số điện thoại ảo tạm thời để nhận mã OTP (One-Time Password) phục vụ mục
              đích xác minh tài khoản trên các nền tảng trực tuyến. Dịch vụ bao gồm:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Cung cấp số điện thoại ảo từ 50+ quốc gia</li>
              <li>Hỗ trợ 200+ dịch vụ và nền tảng phổ biến (Telegram, Facebook, Instagram, WhatsApp, v.v.)</li>
              <li>Nhận và hiển thị mã OTP trong thời gian thực</li>
              <li>Hệ thống nạp tiền và quản lý giao dịch</li>
              <li>Hoàn tiền tự động nếu không nhận được OTP trong thời gian quy định</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Dịch vụ của chúng tôi chỉ dành cho mục đích hợp pháp và tuân thủ quy định của từng quốc gia. Chúng tôi
              không chịu trách nhiệm về việc sử dụng dịch vụ cho các mục đích vi phạm pháp luật.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Đăng ký tài khoản</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Để sử dụng dịch vụ, bạn cần tạo tài khoản bằng cách cung cấp địa chỉ email hợp lệ và mật khẩu. Bạn cam kết
              rằng:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Thông tin bạn cung cấp là chính xác, đầy đủ và cập nhật</li>
              <li>Bạn có đủ tuổi theo quy định pháp luật để ký kết hợp đồng (ít nhất 18 tuổi tại Việt Nam)</li>
              <li>Bạn chịu trách nhiệm về việc bảo mật thông tin đăng nhập của mình</li>
              <li>Bạn sẽ thông báo ngay cho chúng tôi nếu phát hiện bất kỳ hành vi truy cập trái phép nào</li>
              <li>Mỗi người chỉ được tạo một tài khoản duy nhất</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi có quyền từ chối, đình chỉ hoặc chấm dứt tài khoản của bạn nếu phát hiện vi phạm điều khoản sử
              dụng hoặc hoạt động đáng ngờ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Sử dụng dịch vụ và hành vi cấm</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Khi sử dụng OTPVIET, bạn đồng ý KHÔNG:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Sử dụng dịch vụ cho mục đích gian lận, lừa đảo hoặc vi phạm pháp luật</li>
              <li>Tạo nhiều tài khoản giả mạo hoặc spam trên các nền tảng khác</li>
              <li>Vi phạm điều khoản sử dụng của các dịch vụ bên thứ ba (Facebook, Telegram, v.v.)</li>
              <li>Cố gắng tấn công, hack hoặc phá hoại hệ thống của chúng tôi</li>
              <li>Sử dụng bot, script hoặc công cụ tự động để lạm dụng dịch vụ</li>
              <li>Chia sẻ, bán lại hoặc cho thuê lại quyền truy cập vào dịch vụ</li>
              <li>Reverse engineer, decompile hoặc tìm cách truy cập mã nguồn của hệ thống</li>
              <li>Sử dụng dịch vụ để gửi spam, phishing hoặc nội dung độc hại</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Vi phạm bất kỳ quy định nào trên đây có thể dẫn đến việc tài khoản của bạn bị khóa vĩnh viễn mà không hoàn
              lại số dư.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Giá cả và thanh toán</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>5.1. Nạp tiền:</strong> Bạn cần nạp tiền vào tài khoản trước khi sử dụng dịch vụ. Số tiền nạp tối
              thiểu được quy định bởi phương thức thanh toán bạn chọn (thường là 10.000đ). Chúng tôi hỗ trợ thanh toán
              qua chuyển khoản ngân hàng với mã QR tự động.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>5.2. Giá dịch vụ:</strong> Giá thuê số điện thoại dao động từ 2.000đ đến 50.000đ tùy theo dịch vụ
              và quốc gia. Giá cả có thể thay đổi theo thời gian thực dựa trên cung cầu thị trường mà không cần thông
              báo trước.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>5.3. Trừ tiền:</strong> Khi bạn thuê một số điện thoại, số tiền tương ứng sẽ được trừ ngay lập tức
              từ số dư tài khoản của bạn.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>5.4. Hoàn tiền:</strong> Nếu bạn không nhận được OTP trong vòng 20 phút, số tiền sẽ được tự động
              hoàn lại vào tài khoản của bạn. Hoàn tiền không áp dụng nếu:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Bạn đã nhận được OTP thành công</li>
              <li>Số điện thoại bị dịch vụ bên thứ ba từ chối (không phải lỗi của chúng tôi)</li>
              <li>Bạn nhập sai số điện thoại hoặc thông tin không hợp lệ</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              <strong>5.5. Không hoàn tiền nạp:</strong> Các khoản tiền đã nạp vào hệ thống không thể rút lại hoặc hoàn
              trả bằng tiền mặt. Số dư chỉ có thể sử dụng để thuê dịch vụ trong hệ thống.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Quyền sở hữu trí tuệ</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Tất cả nội dung, thiết kế, logo, mã nguồn, database và các tài sản khác trên OTPVIET đều thuộc quyền sở
              hữu của chúng tôi hoặc các bên cấp phép. Bạn không được:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Sao chép, phân phối hoặc tái sử dụng bất kỳ phần nào của dịch vụ mà không có sự cho phép</li>
              <li>Sử dụng tên thương hiệu, logo hoặc nhãn hiệu của chúng tôi mà không có sự đồng ý bằng văn bản</li>
              <li>Tạo các dịch vụ cạnh tranh dựa trên dữ liệu hoặc thiết kế của chúng tôi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Giới hạn trách nhiệm</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>7.1. Dịch vụ "NGUYÊN TRẠNG":</strong> OTPVIET cung cấp dịch vụ theo nguyên trạng ("as-is") mà
              không có bất kỳ bảo đảm nào về tính khả dụng, độ chính xác hoặc phù hợp cho mục đích cụ thể nào.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>7.2. Không chịu trách nhiệm:</strong> Chúng tôi không chịu trách nhiệm về:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Các vấn đề kỹ thuật, gián đoạn dịch vụ hoặc mất dữ liệu</li>
              <li>
                Hành vi của bên thứ ba (nhà cung cấp SIM, dịch vụ mạng viễn thông, các nền tảng bạn xác minh tài khoản)
              </li>
              <li>Thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng dịch vụ</li>
              <li>Việc tài khoản của bạn bị khóa trên các nền tảng bên thứ ba do vi phạm điều khoản của họ</li>
              <li>Số điện thoại đã bị sử dụng trước đó hoặc không thể nhận OTP do lỗi của nhà mạng</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              <strong>7.3. Giới hạn bồi thường:</strong> Trách nhiệm tối đa của chúng tôi đối với bạn trong mọi trường
              hợp không vượt quá số tiền bạn đã thanh toán cho giao dịch cụ thể gây ra tranh chấp.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Quyền riêng tư và dữ liệu cá nhân</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Việc thu thập, lưu trữ và sử dụng dữ liệu cá nhân của bạn được quy định chi tiết trong{" "}
              <Link href="/privacy" className="text-primary underline hover:no-underline">
                Chính sách bảo mật
              </Link>{" "}
              của chúng tôi. Bằng việc sử dụng dịch vụ, bạn đồng ý với cách thức chúng tôi xử lý dữ liệu của bạn.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và tuân thủ các quy định về bảo vệ dữ liệu hiện hành.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Chấm dứt dịch vụ</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>9.1. Chấm dứt do người dùng:</strong> Bạn có thể ngừng sử dụng dịch vụ bất kỳ lúc nào bằng cách
              xóa tài khoản của mình. Số dư còn lại trong tài khoản sẽ không được hoàn trả.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>9.2. Chấm dứt do OTPVIET:</strong> Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn
              ngay lập tức mà không cần thông báo trước nếu:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Bạn vi phạm bất kỳ điều khoản nào trong thỏa thuận này</li>
              <li>Chúng tôi phát hiện hoạt động gian lận hoặc lạm dụng dịch vụ</li>
              <li>Theo yêu cầu của cơ quan chức năng hoặc quy định pháp luật</li>
              <li>Tài khoản của bạn không hoạt động trong thời gian dài (trên 12 tháng)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Sau khi chấm dứt, bạn sẽ mất quyền truy cập vào tài khoản và số dư còn lại sẽ không được hoàn trả.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Luật áp dụng và giải quyết tranh chấp</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>10.1. Luật điều chỉnh:</strong> Các điều khoản này được điều chỉnh và hiểu theo pháp luật Việt
              Nam.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>10.2. Giải quyết tranh chấp:</strong> Mọi tranh chấp phát sinh từ hoặc liên quan đến việc sử dụng
              dịch vụ sẽ được giải quyết thông qua thương lượng thiện chí. Nếu không đạt được thỏa thuận, tranh chấp sẽ
              được đưa ra Trọng tài Kinh tế Việt Nam (VIAC) hoặc Tòa án có thẩm quyền tại Việt Nam.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Điều khoản chung</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>11.1. Toàn bộ thỏa thuận:</strong> Các điều khoản này cùng với Chính sách bảo mật tạo thành toàn
              bộ thỏa thuận giữa bạn và OTPVIET.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>11.2. Tính độc lập:</strong> Nếu bất kỳ điều khoản nào được xác định là không hợp lệ hoặc không
              thể thực thi, các điều khoản còn lại vẫn có hiệu lực đầy đủ.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>11.3. Không chuyển nhượng:</strong> Bạn không được chuyển nhượng quyền hoặc nghĩa vụ của mình theo
              thỏa thuận này mà không có sự đồng ý bằng văn bản của chúng tôi.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>11.4. Miễn trừ:</strong> Việc chúng tôi không thực thi bất kỳ quyền hoặc điều khoản nào không cấu
              thành sự từ bỏ quyền hoặc điều khoản đó.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Liên hệ</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản sử dụng này, vui lòng liên hệ với chúng tôi qua:
            </p>
            <Card className="border-2">
              <CardContent className="pt-6 space-y-3">
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
                  <strong>Thời gian hỗ trợ:</strong> 24/7 qua hệ thống ticket
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer CTA */}
        <Card className="mt-12 border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-bold">Đã hiểu và đồng ý?</h3>
              <p className="text-muted-foreground">
                Bắt đầu sử dụng dịch vụ thuê SIM ảo an toàn và tiện lợi nhất hiện nay
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild size="lg">
                  <Link href="/auth/signup">Đăng ký ngay</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/privacy">Xem Chính sách bảo mật</Link>
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
