"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, AlertCircle, Sparkles, ArrowRight, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ServiceCardEnhanced } from "@/components/service-card-enhanced"
import { CountryCardEnhanced } from "@/components/country-card-enhanced"
import type { Service, Country, ServicePrice } from "@/lib/types"
import { getCountryFlag } from "@/lib/service-icons"
import { formatVND } from "@/lib/currency"

interface EnhancedServiceSelectorProps {
  services: Service[]
  countries: Country[]
  servicePrices: ServicePrice[]
  userBalance: number
}

const serviceStats: Record<string, { successRate: number; activeUsers: number }> = {
  telegram: { successRate: 99, activeUsers: 2345 },
  whatsapp: { successRate: 98, activeUsers: 1890 },
  facebook: { successRate: 97, activeUsers: 1567 },
  instagram: { successRate: 98, activeUsers: 1234 },
  default: { successRate: 95, activeUsers: 500 },
}

export function EnhancedServiceSelector({
  services,
  countries,
  servicePrices,
  userBalance,
}: EnhancedServiceSelectorProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [serviceSearch, setServiceSearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [isRenting, setIsRenting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  )

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()),
  )

  const selectedPrice = servicePrices.find(
    (sp) => sp.service_id === selectedService?.id && sp.country_id === selectedCountry?.id,
  )

  const canAfford = selectedPrice ? userBalance >= selectedPrice.price : false

  const handleRent = async () => {
    if (!selectedService || !selectedCountry || !selectedPrice) {
      setError("Vui lòng chọn đầy đủ dịch vụ và quốc gia")
      return
    }

    if (!canAfford) {
      setError("Số dư không đủ. Vui lòng nạp thêm tiền để tiếp tục")
      return
    }

    setIsRenting(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Vui lòng đăng nhập")

      // Check balance again
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()

      if (!profile) throw new Error("Không tìm thấy thông tin tài khoản")

      if (profile.balance < selectedPrice.price) {
        throw new Error("Số dư không đủ. Vui lòng nạp thêm tiền")
      }

      // Generate mock phone number (in production, this would come from API provider)
      const mockPhoneNumber = `+${selectedCountry.code === "vn" ? "84" : "1"}${Math.floor(Math.random() * 900000000 + 100000000)}`

      // Create rental
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 20) // 20 minutes expiry

      const { data: rental, error: rentalError } = await supabase
        .from("phone_rentals")
        .insert({
          user_id: user.id,
          service_id: selectedService.id,
          country_id: selectedCountry.id,
          phone_number: mockPhoneNumber,
          price: selectedPrice.price,
          status: "waiting",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (rentalError) throw rentalError

      // Update balance
      const newBalance = profile.balance - selectedPrice.price
      await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      // Create transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "rental_purchase",
        amount: -selectedPrice.price,
        balance_before: profile.balance,
        balance_after: newBalance,
        description: `Thuê số ${selectedService.name} - ${selectedCountry.name}`,
        rental_id: rental.id,
        status: "completed",
      })

      // Redirect to rental detail page
      router.push(`/dashboard/rental/${rental.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi thuê số")
    } finally {
      setIsRenting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
            1
          </div>
          <Label className="text-xl font-semibold">Chọn dịch vụ</Label>
          {selectedService && (
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              {selectedService.name} đã chọn
            </Badge>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            placeholder="Tìm kiếm dịch vụ (VD: Telegram, WhatsApp, Facebook...)"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="pl-9 h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1 rounded-lg border bg-secondary/20">
          {filteredServices.map((service) => {
            const stats = serviceStats[service.code.toLowerCase()] || serviceStats.default
            return (
              <ServiceCardEnhanced
                key={service.id}
                name={service.name}
                code={service.code}
                iconUrl={service.icon_url}
                isSelected={selectedService?.id === service.id}
                successRate={stats.successRate}
                activeUsers={stats.activeUsers}
                isExperimental={service.is_experimental || false}
                onClick={() => setSelectedService(service)}
              />
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Không tìm thấy dịch vụ phù hợp</p>
          </div>
        )}
      </div>

      {selectedService?.is_experimental && (
        <Alert className="animate-in fade-in slide-in-from-top-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Dịch vụ thử nghiệm:</strong> {selectedService.name} sử dụng service code "other" (nhận tất cả SMS).
            Tỷ lệ thành công không được đảm bảo 100% bởi nhà cung cấp, nhưng thường hoạt động tốt. Chúng tôi vẫn hoàn
            tiền nếu không nhận được OTP.
          </AlertDescription>
        </Alert>
      )}

      {selectedService && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
              2
            </div>
            <Label className="text-xl font-semibold">Chọn quốc gia</Label>
            {selectedCountry && (
              <Badge variant="secondary" className="ml-auto">
                <Sparkles className="h-3 w-3 mr-1" />
                {selectedCountry.name} đã chọn
              </Badge>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Tìm kiếm quốc gia (VD: Vietnam, USA, Thailand...)"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="pl-9 h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1 rounded-lg border bg-secondary/20">
            {filteredCountries.map((country) => {
              const priceInfo = servicePrices.find(
                (sp) => sp.service_id === selectedService.id && sp.country_id === country.id,
              )
              return (
                <CountryCardEnhanced
                  key={country.id}
                  name={country.name}
                  code={country.code}
                  flagEmoji={getCountryFlag(country.code)}
                  isSelected={selectedCountry?.id === country.id}
                  averageTime={30}
                  stockCount={priceInfo?.stock_count || 0}
                  onClick={() => setSelectedCountry(country)}
                />
              )
            })}
          </div>

          {filteredCountries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy quốc gia phù hợp</p>
            </div>
          )}
        </div>
      )}

      {selectedService && selectedCountry && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            <Label className="text-xl font-semibold">Xác nhận & thanh toán</Label>
          </div>

          {selectedPrice ? (
            <div className="border-2 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 space-y-4">
              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Dịch vụ đã chọn</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-white dark:bg-background flex items-center justify-center text-lg">
                      {selectedService.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedService.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{selectedService.code}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Quốc gia</div>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">{getCountryFlag(selectedCountry.code)}</div>
                    <div>
                      <div className="font-semibold">{selectedCountry.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{selectedCountry.code}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Giá thuê số</span>
                  <span className="font-medium">{formatVND(selectedPrice.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Thời gian sử dụng</span>
                  <Badge variant="secondary">20 phút</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Số lượng còn lại</span>
                  <Badge variant={selectedPrice.stock_count > 10 ? "secondary" : "destructive"}>
                    {selectedPrice.stock_count} số
                  </Badge>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Tổng thanh toán</div>
                    <div className="text-3xl font-bold text-primary">{formatVND(selectedPrice.price)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Số dư của bạn</div>
                    <div
                      className={`text-xl font-semibold ${canAfford ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {formatVND(userBalance)}
                    </div>
                  </div>
                </div>

                {/* Balance warning */}
                {!canAfford && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Số dư không đủ. Cần thêm {formatVND(selectedPrice.price - userBalance)}</span>
                      <Button asChild size="sm" variant="outline" className="bg-white dark:bg-background">
                        <a href="/dashboard/deposit">Nạp tiền</a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info notice */}
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Sau khi thanh toán, bạn sẽ nhận được số điện thoại ngay lập tức. Mã OTP sẽ được hiển thị tự động khi
                    có tin nhắn đến.
                  </AlertDescription>
                </Alert>

                {/* Action button */}
                <Button
                  onClick={handleRent}
                  disabled={!canAfford || isRenting || selectedPrice.stock_count === 0}
                  className="w-full h-14 text-lg font-semibold"
                  size="lg"
                >
                  {isRenting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang xử lý thanh toán...
                    </>
                  ) : (
                    <>
                      Xác nhận thuê số ngay
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tổ hợp dịch vụ <strong>{selectedService.name}</strong> và quốc gia{" "}
                <strong>{selectedCountry.name}</strong> hiện không khả dụng. Vui lòng chọn quốc gia khác.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
