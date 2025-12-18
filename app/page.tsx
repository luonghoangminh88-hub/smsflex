import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Smartphone,
  Shield,
  Zap,
  Globe,
  Clock,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Star,
} from "lucide-react"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Ưu đãi đặc biệt: Nạp lần đầu tặng thêm 10% - Chỉ trong tháng này!
        </span>
      </div>

      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">OTP Rental</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm hover:text-primary transition-colors">
              Tính năng
            </Link>
            <Link href="#pricing" className="text-sm hover:text-primary transition-colors">
              Bảng giá
            </Link>
            <Link href="#faq" className="text-sm hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="/auth/login" className="text-sm hover:text-primary transition-colors">
              Đăng nhập
            </Link>
          </div>
          <Button asChild>
            <Link href="/auth/signup">Bắt đầu ngay</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Đã có 10,000+ người dùng tin tưởng
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance leading-tight">
              Thuê SIM ảo nhận OTP <span className="text-primary">nhanh trong 30 giây</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
              Giải pháp số 1 tại Việt Nam cho xác minh tài khoản. Hỗ trợ 200+ dịch vụ phổ biến, 50+ quốc gia, giá từ
              2,000đ. Không cần đăng ký SIM thật, không rủi ro bị khóa tài khoản chính.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg h-12 px-8">
                <Link href="/auth/signup">
                  Dùng thử miễn phí
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg h-12 px-8 bg-transparent">
                <Link href="#pricing">Xem bảng giá</Link>
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-background"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">2,500+ giao dịch/ngày</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">4.9/5 (320+ đánh giá)</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] rounded-2xl" />
              <div className="relative space-y-4">
                <div className="bg-card border rounded-xl p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-1000">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Telegram</div>
                      <div className="text-sm text-muted-foreground">+84 99 123 4567</div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-1000 delay-200">
                  <div className="flex items-center gap-3">
                    <Image src="/images/icons8-facebook-50.png" alt="Facebook" width={48} height={48} />
                    <div className="flex-1">
                      <div className="font-semibold">Facebook</div>
                      <div className="text-sm text-muted-foreground">+1 650 555 0123</div>
                    </div>
                    <div className="text-2xl font-bold text-primary">123456</div>
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                  <div className="flex items-center gap-3">
                    <Image src="/images/icons8-instagram-50.png" alt="Instagram" width={48} height={48} />
                    <div className="flex-1">
                      <div className="font-semibold">Instagram</div>
                      <div className="text-sm text-muted-foreground">+44 20 7946 0958</div>
                    </div>
                    <span className="text-xs text-muted-foreground">Đang chờ OTP...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Người dùng hoạt động</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">200+</div>
              <div className="text-sm text-muted-foreground">Dịch vụ hỗ trợ</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Quốc gia</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.8%</div>
              <div className="text-sm text-muted-foreground">Tỷ lệ thành công</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Tại sao chọn OTP Rental?</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Chúng tôi cung cấp dịch vụ thuê SIM ảo nhanh nhất, ổn định nhất và giá tốt nhất trên thị trường
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-xl">Siêu nhanh - 30 giây</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nhận số điện thoại ảo ngay lập tức, OTP về trong vòng 30 giây. Không phải chờ đợi lâu như các nền tảng
                khác.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Trung bình 24 giây nhận OTP
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-500">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-xl">Giá rẻ nhất thị trường</h3>
              <p className="text-muted-foreground leading-relaxed">
                Chỉ từ 2,000đ/số. Miễn phí hoàn tiền 100% nếu không nhận được OTP. Không phí ẩn, không tính thêm phụ
                phí.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Tiết kiệm tới 40% so với đối thủ
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-xl">200+ dịch vụ phổ biến</h3>
              <p className="text-muted-foreground leading-relaxed">
                Telegram, WhatsApp, Facebook, Instagram, TikTok, Google, Microsoft, Binance, Grab, Shopee, Lazada và
                hàng trăm dịch vụ khác.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Cập nhật dịch vụ mới hàng tuần
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-xl">50+ quốc gia</h3>
              <p className="text-muted-foreground leading-relaxed">
                Số điện thoại từ Việt Nam, Mỹ, UK, Indonesia, Thái Lan, Philippines, Singapore, Malaysia và 40+ quốc gia
                khác.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                SIM thật, chất lượng cao
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-xl">Bảo mật tuyệt đối</h3>
              <p className="text-muted-foreground leading-relaxed">
                Số điện thoại ảo riêng tư, không lưu log, không chia sẻ với người khác. Dữ liệu được mã hóa end-to-end.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Tuân thủ GDPR & ISO 27001
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="pt-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-xl">Tự động hoàn tiền</h3>
              <p className="text-muted-foreground leading-relaxed">
                Không nhận được OTP? Tiền tự động hoàn về tài khoản sau 20 phút. Không cần liên hệ support, không phải
                chờ đợi.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                99.8% tỷ lệ nhận OTP thành công
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Chỉ 3 bước đơn giản</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Quy trình thuê SIM ảo siêu đơn giản, ai cũng làm được ngay lần đầu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="bg-card border-2 rounded-2xl p-8 space-y-4 h-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="font-bold text-2xl">Chọn dịch vụ & quốc gia</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Chọn dịch vụ bạn muốn (vd: Telegram), chọn quốc gia (vd: Việt Nam) và xem giá cả
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>

            <div className="relative">
              <div className="bg-card border-2 rounded-2xl p-8 space-y-4 h-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-2xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="font-bold text-2xl">Nhận số ngay lập tức</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nhấn "Thuê ngay", hệ thống tự động cấp số điện thoại ảo cho bạn trong 5 giây
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>

            <div className="bg-card border-2 rounded-2xl p-8 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="font-bold text-2xl">Nhận OTP tự động</h3>
              <p className="text-muted-foreground leading-relaxed">
                Copy số, dán vào app, chờ OTP tự động hiển thị trong vòng 30 giây
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Bảng giá minh họa</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Giá thực tế thay đổi theo thời gian thực dựa trên cung cầu. Đăng nhập để xem giá chính xác.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/images/icons8-facebook-50.png" alt="Facebook" width={40} height={40} />
                <div>
                  <h3 className="font-bold">Facebook</h3>
                  <p className="text-sm text-muted-foreground">Việt Nam</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">3,500đ</div>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Thuê ngay</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-10 w-10 text-blue-500" />
                <div>
                  <h3 className="font-bold">Telegram</h3>
                  <p className="text-sm text-muted-foreground">Indonesia</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">2,000đ</div>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Thuê ngay</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/images/icons8-instagram-50.png" alt="Instagram" width={40} height={40} />
                <div>
                  <h3 className="font-bold">Instagram</h3>
                  <p className="text-sm text-muted-foreground">Mỹ</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">8,500đ</div>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Thuê ngay</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/images/icons8-gmail-50.png" alt="Google" width={40} height={40} />
                <div>
                  <h3 className="font-bold">Google</h3>
                  <p className="text-sm text-muted-foreground">Thái Lan</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">4,200đ</div>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Thuê ngay</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">Xem thêm 200+ dịch vụ khác với giá cạnh tranh nhất thị trường</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Khách hàng nói gì về chúng tôi?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "Mình làm marketing cần tạo nhiều tài khoản Telegram. Dùng OTP Rental nhanh lắm, giá rẻ hơn các trang
                  khác, tiền auto hoàn nếu không nhận được OTP. Rất ưng!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
                  <div>
                    <div className="font-semibold">Nguyễn Văn A</div>
                    <div className="text-sm text-muted-foreground">Digital Marketer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "Giá rẻ nhất thị trường mà chất lượng tốt. Mình test qua 5-6 nền tảng, OTP Rental nhanh nhất và ít lỗi
                  nhất. Support cũng nhiệt tình. 10/10!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400" />
                  <div>
                    <div className="font-semibold">Trần Thị B</div>
                    <div className="text-sm text-muted-foreground">Freelancer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "Giao diện đơn giản, dễ sử dụng. Mình không rành công nghệ mà vẫn dùng được ngay. OTP về trong vòng 20
                  giây là ra. Giá cả hợp lý, sẽ dùng lâu dài."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400" />
                  <div>
                    <div className="font-semibold">Lê Văn C</div>
                    <div className="text-sm text-muted-foreground">Chủ shop online</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Câu hỏi thường gặp</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Giải đáp mọi thắc mắc về dịch vụ thuê SIM ảo của chúng tôi
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                OTP Rental là gì? Có hợp pháp không?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                OTP Rental là dịch vụ cho thuê số điện thoại ảo tạm thời để nhận mã xác minh OTP. Dịch vụ hoàn toàn hợp
                pháp tại Việt Nam và được sử dụng phổ biến bởi các freelancer, marketer, developer để test ứng dụng hoặc
                tạo tài khoản phụ. Chúng tôi chỉ cung cấp số điện thoại, không lưu trữ nội dung tin nhắn sau khi giao
                dịch hoàn tất.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Tôi có thể thanh toán bằng cách nào?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Chúng tôi hỗ trợ thanh toán qua VietQR (quét mã QR từ các app ngân hàng), chuyển khoản ngân hàng, và ví
                điện tử (Momo, ZaloPay). Số dư được nạp vào tài khoản ngay sau khi thanh toán thành công. Hệ thống tự
                động xác nhận thanh toán trong vòng 1-5 phút.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Nếu không nhận được OTP thì sao?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Nếu không nhận được OTP trong vòng 20 phút, hệ thống tự động hoàn tiền 100% về tài khoản của bạn. Bạn
                không cần liên hệ support hay làm bất kỳ thao tác nào. Tỷ lệ thành công của chúng tôi là 99.8%, rất hiếm
                khi xảy ra trường hợp không nhận được OTP.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Số điện thoại có bị người khác dùng chung không?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Không. Mỗi số điện thoại được cấp độc quyền cho 1 người dùng trong thời gian thuê (20 phút). Sau khi kết
                thúc giao dịch, số điện thoại sẽ được "nghỉ ngơi" tối thiểu 24 giờ trước khi được cấp lại cho người
                khác. Điều này đảm bảo bảo mật và tránh xung đột tài khoản.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Có giới hạn số lần thuê không?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Không có giới hạn. Bạn có thể thuê bao nhiêu số tùy thích, miễn là tài khoản có đủ số dư. Đối với người
                dùng mới, chúng tôi khuyến nghị bắt đầu với 2-3 số để làm quen với hệ thống trước khi thuê số lượng lớn.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Tôi có thể nhận bao nhiêu tin nhắn OTP?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Mỗi số điện thoại có thể nhận tối đa 3 tin nhắn OTP trong thời gian thuê 20 phút. Phù hợp cho hầu hết
                các trường hợp xác minh tài khoản. Nếu bạn cần nhận nhiều OTP hơn (ví dụ: xác minh cả email và số điện
                thoại), vui lòng thuê thêm số mới.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Dữ liệu của tôi có được bảo mật không?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Tất cả dữ liệu được mã hóa end-to-end với SSL/TLS. Chúng tôi KHÔNG lưu trữ nội dung tin nhắn OTP sau khi
                giao dịch hoàn tất. Chúng tôi tuân thủ GDPR và các quy định về bảo vệ dữ liệu cá nhân tại Việt Nam. Bạn
                có thể xóa tài khoản và toàn bộ dữ liệu bất kỳ lúc nào.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Tôi cần hỗ trợ thì liên hệ ai?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Bạn có thể liên hệ support qua email support@otprental.com hoặc live chat trên website (góc dưới bên
                phải). Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày. Chúng tôi cam kết phản hồi trong vòng 2 giờ làm việc.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary via-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-balance">Sẵn sàng nhận OTP trong 30 giây?</h2>
          <p className="text-xl text-white/90 text-pretty max-w-2xl mx-auto">
            Tham gia cùng 10,000+ người dùng đang tin tưởng OTP Rental mỗi ngày. Nạp lần đầu tặng thêm 10%!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg h-12 px-8">
              <Link href="/auth/signup">
                Đăng ký miễn phí ngay
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg h-12 px-8 bg-transparent text-white border-white hover:bg-white/10"
            >
              <Link href="/auth/login">Đã có tài khoản? Đăng nhập</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">OTP Rental</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Giải pháp thuê SIM ảo nhận OTP số 1 tại Việt Nam. Nhanh chóng, an toàn, giá rẻ.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Sản phẩm</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-primary transition-colors">
                    Tính năng
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-primary transition-colors">
                    Bảng giá
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#faq" className="hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@otprental.com" className="hover:text-primary transition-colors">
                    Email: support@otprental.com
                  </a>
                </li>
                <li>
                  <span>Hotline: 1900-xxxx</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Pháp lý</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-primary transition-colors">
                    Chính sách hoàn tiền
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 OTP Rental. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Chấp nhận thanh toán:</span>
              <div className="flex items-center gap-2">
                <div className="h-8 w-12 bg-muted rounded border flex items-center justify-center text-xs font-bold">
                  VISA
                </div>
                <div className="h-8 w-12 bg-muted rounded border flex items-center justify-center text-xs font-bold">
                  QR
                </div>
                <div className="h-8 w-12 bg-muted rounded border flex items-center justify-center text-xs font-bold">
                  MOMO
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
