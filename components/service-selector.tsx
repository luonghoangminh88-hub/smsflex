"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Service, Country, ServicePrice } from "@/lib/types"

interface ServiceSelectorProps {
  services: Service[]
  countries: Country[]
  servicePrices: ServicePrice[]
}

export function ServiceSelector({ services, countries, servicePrices }: ServiceSelectorProps) {
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

  const handleRent = async () => {
    if (!selectedService || !selectedCountry || !selectedPrice) {
      setError("Vui lòng chọn dịch vụ và quốc gia")
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

      // Check balance
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
    <div className="space-y-6">
      {/* Service Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">1. Chọn dịch vụ</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm dịch vụ..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedService?.id === service.id ? "border-primary border-2 bg-primary/5" : "border"
              }`}
              onClick={() => setSelectedService(service)}
            >
              <CardContent className="p-4 text-center">
                <p className="font-medium text-sm">{service.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Country Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">2. Chọn quốc gia</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm quốc gia..."
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
          {filteredCountries.map((country) => (
            <Card
              key={country.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCountry?.id === country.id ? "border-primary border-2 bg-primary/5" : "border"
              }`}
              onClick={() => setSelectedCountry(country)}
            >
              <CardContent className="p-4 text-center">
                <p className="font-medium text-sm">{country.name}</p>
                <p className="text-xs text-muted-foreground uppercase">{country.code}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      {selectedService && selectedCountry && (
        <div className="p-4 bg-secondary rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dịch vụ đã chọn</span>
            <Badge variant="secondary">{selectedService.name}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quốc gia</span>
            <Badge variant="secondary">{selectedCountry.name}</Badge>
          </div>
          {selectedPrice && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Giá thuê</span>
                <span className="font-bold text-lg">{selectedPrice.price.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Số lượng có sẵn</span>
                <span>{selectedPrice.stock_count} số</span>
              </div>
            </>
          )}
          {!selectedPrice && (
            <Alert>
              <AlertDescription>Không có giá cho tổ hợp dịch vụ và quốc gia này</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Button */}
      <Button
        onClick={handleRent}
        disabled={!selectedService || !selectedCountry || !selectedPrice || isRenting}
        className="w-full"
        size="lg"
      >
        {isRenting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Xác nhận thuê số"
        )}
      </Button>
    </div>
  )
}
