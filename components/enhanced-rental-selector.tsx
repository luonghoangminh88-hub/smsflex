"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Star, Loader2, ShoppingCart, TrendingUp, BarChart3, Zap, Gift, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Service, Country, ServicePrice } from "@/lib/types"
import { getServiceLogo, getCountryFlag, getServiceIcon } from "@/lib/service-icons"
import Image from "next/image"
import { useTranslation, type Locale } from "@/lib/i18n"
import { formatVND } from "@/lib/currency"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RentalConfirmationDialog } from "./rental-confirmation-dialog"
import { calculateRentalPricing, type PricingResult } from "@/lib/pricing-calculator"
import { cn } from "@/lib/utils"

interface EnhancedRentalSelectorProps {
  services: Service[]
  countries: Country[]
  servicePrices: ServicePrice[]
  userBalance: number
}

type RentalType = "standard" | "multi-service" | "long-term"

export function EnhancedRentalSelector({
  services,
  countries,
  servicePrices,
  userBalance,
}: EnhancedRentalSelectorProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [serviceSearch, setServiceSearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isRenting, setIsRenting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const router = useRouter()

  const [rentalType, setRentalType] = useState<RentalType>("standard")
  const [additionalServices, setAdditionalServices] = useState<Set<string>>(new Set())
  const [rentDuration, setRentDuration] = useState<4 | 24 | 168>(4) // hours

  const [locale, setLocale] = useState<Locale>("vi")
  const { t } = useTranslation(locale)

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"success" | "price">("success")

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [calculatedPricing, setCalculatedPricing] = useState<PricingResult | null>(null)

  const handleImageError = (serviceId: string) => {
    setImageErrors((prev) => new Set(prev).add(serviceId))
  }

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale
    if (saved) setLocale(saved)

    const handleLocaleChange = (e: CustomEvent) => {
      setLocale(e.detail)
    }
    window.addEventListener("localeChange", handleLocaleChange as EventListener)
    return () => window.removeEventListener("localeChange", handleLocaleChange as EventListener)
  }, [])

  const filteredServices = useMemo(() => {
    return services
      .filter((service) => service.name.toLowerCase().includes(serviceSearch.toLowerCase()))
      .sort((a, b) => {
        const aFav = favorites.has(a.id)
        const bFav = favorites.has(b.id)
        if (aFav && !bFav) return -1
        if (!aFav && bFav) return 1
        return a.name.localeCompare(b.name)
      })
  }, [services, serviceSearch, favorites])

  const filteredCountries = useMemo(() => {
    if (!selectedService) return []

    const availableCountries = countries.filter((country) => {
      const hasPrice = servicePrices.some(
        (sp) => sp.service_id === selectedService.id && sp.country_id === country.id && sp.is_available,
      )
      return hasPrice && country.name.toLowerCase().includes(countrySearch.toLowerCase())
    })

    return availableCountries
  }, [countries, selectedService, servicePrices, countrySearch])

  const countryStats = useMemo(() => {
    if (!selectedService) return []

    return filteredCountries
      .map((country) => {
        const price = servicePrices.find((sp) => sp.service_id === selectedService.id && sp.country_id === country.id)
        const successRate = Math.floor(Math.random() * 20) + 75

        return {
          country,
          price: price?.price || 0,
          stock: price?.stock_count || 0,
          successRate,
          priceId: price?.id,
        }
      })
      .sort((a, b) => {
        if (viewMode === "success") {
          return b.successRate - a.successRate
        } else {
          return a.price - b.price
        }
      })
  }, [selectedService, filteredCountries, servicePrices, viewMode])

  const selectedPrice = servicePrices.find(
    (sp) => sp.service_id === selectedService?.id && sp.country_id === selectedCountry?.id,
  )

  const calculateFinalPrice = (): PricingResult | null => {
    if (!selectedPrice) return null

    try {
      const costPrice = selectedPrice.cost_price || selectedPrice.price * 0.7

      return calculateRentalPricing({
        basePrice: selectedPrice.price,
        costPrice,
        rentalType,
        additionalServicesCount: rentalType === "multi-service" ? additionalServices.size : 0,
        rentDurationHours: rentalType === "long-term" ? rentDuration : 0,
      })
    } catch (error) {
      console.error("Pricing calculation error:", error)
      return null
    }
  }

  useEffect(() => {
    const pricing = calculateFinalPrice()
    setCalculatedPricing(pricing)
  }, [selectedPrice, rentalType, additionalServices, rentDuration])

  const toggleFavorite = (serviceId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(serviceId)) {
        newFavorites.delete(serviceId)
      } else {
        newFavorites.add(serviceId)
      }
      return newFavorites
    })
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setSelectedCountry(null)
    setCurrentStep(2)
    setAdditionalServices(new Set())
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setCurrentStep(3)
  }

  const handleRentClick = async () => {
    if (!selectedService || !selectedCountry || !calculatedPricing) {
      alert("Vui lòng chọn dịch vụ và quốc gia")
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmRent = async () => {
    if (!selectedService || !selectedCountry || !calculatedPricing) return

    setIsRenting(true)
    try {
      const response = await fetch("/api/rentals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          countryId: selectedCountry.id,
          rentalType,
          additionalServices: rentalType === "multi-service" ? Array.from(additionalServices) : undefined,
          rentDurationHours: rentalType === "long-term" ? rentDuration : undefined,
          expectedPrice: calculatedPricing.finalPrice,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Thuê số thành công!\nSố điện thoại: ${data.rental.phone_number}`)
        window.location.href = "/dashboard/rent"
      } else {
        alert(`❌ Lỗi: ${data.error}${data.details ? `\n${data.details}` : ""}`)
      }
    } catch (error) {
      console.error("Rent error:", error)
      alert("Có lỗi xảy ra khi thuê số")
    } finally {
      setIsRenting(false)
    }
  }

  const maxPrice = Math.max(...countryStats.map((s) => s.price), 1)

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Service Selection Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="border-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">1. Chọn dịch vụ</span>
                <Badge variant="secondary" className="text-xs">
                  {services.length}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2">
                {filteredServices.map((service) => {
                  const availablePrices = servicePrices
                    .filter((sp) => sp.service_id === service.id && sp.is_available)
                    .map((sp) => sp.price)

                  const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null
                  const totalStock = servicePrices
                    .filter((sp) => sp.service_id === service.id && sp.is_available)
                    .reduce((sum, sp) => sum + sp.stock_count, 0)

                  const isSelected = selectedService?.id === service.id
                  const FallbackIcon = getServiceIcon(service.name)
                  const hasImageError = imageErrors.has(service.id)

                  if (minPrice === null) return null

                  return (
                    <div
                      key={service.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-accent group ${
                        isSelected ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800" : ""
                      }`}
                      onClick={() => handleServiceSelect(service)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(service.id)
                        }}
                        className="flex-shrink-0 p-1"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            favorites.has(service.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      </button>

                      <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 border">
                        {!hasImageError ? (
                          <Image
                            src={getServiceLogo(service.name) || service.icon_url || "/placeholder.svg"}
                            alt={service.name}
                            width={22}
                            height={22}
                            className="object-contain"
                            onError={() => handleImageError(service.id)}
                            unoptimized
                          />
                        ) : (
                          <FallbackIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{service.name}</div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                          Từ {formatVND(minPrice)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{totalStock.toLocaleString("vi-VN")} số</div>
                      </div>
                    </div>
                  )
                })}

                {filteredServices.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">Không tìm thấy dịch vụ</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <Card className="border-2">
            <CardContent className="p-6">
              {!selectedService ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Chọn dịch vụ để bắt đầu</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Chọn một dịch vụ từ danh sách bên trái để xem các quốc gia và giá cả khả dụng
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Service Display */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border">
                      <Image
                        src={getServiceLogo(selectedService.name) || selectedService.icon_url || "/placeholder.svg"}
                        alt={selectedService.name}
                        width={28}
                        height={28}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{selectedService.name}</div>
                      <div className="text-sm text-muted-foreground">Chọn quốc gia để xem giá và tình trạng kho</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-semibold text-sm">Loại hình thuê</div>
                    <div className="grid gap-4">
                      {/* Standard rental */}
                      <div
                        onClick={() => setRentalType("standard")}
                        className={cn(
                          "p-4 border-2 rounded-lg cursor-pointer transition-all",
                          rentalType === "standard"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "border-gray-200 hover:border-blue-300",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium">Thuê thông thường</div>
                              <div className="text-sm text-gray-600">1 số cho 1 dịch vụ, nhận OTP ngay</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                            Giá gốc
                          </Badge>
                        </div>
                      </div>

                      {/* Multi-service rental */}
                      <div
                        onClick={() => setRentalType("multi-service")}
                        className={cn(
                          "p-4 border-2 rounded-lg cursor-pointer transition-all",
                          rentalType === "multi-service"
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                            : "border-gray-200 hover:border-emerald-300",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Gift className="h-5 w-5 text-emerald-600" />
                            <div>
                              <div className="font-medium">Đa dịch vụ</div>
                              <div className="text-sm text-gray-600">1 số cho nhiều dịch vụ, giảm giá lớn</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                            Tiết kiệm 25%
                          </Badge>
                        </div>
                      </div>

                      {/* Long-term rental */}
                      <div
                        onClick={() => setRentalType("long-term")}
                        className={cn(
                          "p-4 border-2 rounded-lg cursor-pointer transition-all",
                          rentalType === "long-term"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                            : "border-gray-200 hover:border-purple-300",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="font-medium">Thuê dài hạn</div>
                              <div className="text-sm text-gray-600">Thuê số từ 4 giờ đến 1 tuần</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                            Giảm 25%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {rentalType === "multi-service" && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
                      <div className="font-medium text-xs flex items-center justify-between">
                        <span>Chọn thêm dịch vụ</span>
                        <span className="text-muted-foreground">{additionalServices.size}/5</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                        {services
                          .filter((s) => s.id !== selectedService.id)
                          .slice(0, 10)
                          .map((service) => (
                            <Label
                              key={service.id}
                              htmlFor={`service-${service.id}`}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground"
                            >
                              <Checkbox
                                id={`service-${service.id}`}
                                checked={additionalServices.has(service.id)}
                                disabled={additionalServices.size >= 5 && !additionalServices.has(service.id)}
                                onCheckedChange={(checked) => {
                                  const newSet = new Set(additionalServices)
                                  if (checked) {
                                    newSet.add(service.id)
                                  } else {
                                    newSet.delete(service.id)
                                  }
                                  setAdditionalServices(newSet)
                                }}
                              />
                              <span className="truncate">{service.name}</span>
                            </Label>
                          ))}
                      </div>
                    </div>
                  )}

                  {rentalType === "long-term" && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 space-y-2">
                      <div className="font-medium text-xs">Thời gian thuê</div>
                      <RadioGroup
                        value={rentDuration.toString()}
                        onValueChange={(v) => setRentDuration(Number(v) as 4 | 24 | 168)}
                        className="grid grid-cols-3 gap-2"
                      >
                        <Label
                          htmlFor="4h"
                          className={`flex flex-col items-center gap-1 p-2 border rounded-lg cursor-pointer text-center ${
                            rentDuration === 4 ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30" : ""
                          }`}
                        >
                          <RadioGroupItem value="4" id="4h" className="sr-only" />
                          <span className="text-xs font-medium">4 giờ</span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            Cơ bản
                          </Badge>
                        </Label>
                        <Label
                          htmlFor="24h"
                          className={`flex flex-col items-center gap-1 p-2 border rounded-lg cursor-pointer text-center ${
                            rentDuration === 24 ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30" : ""
                          }`}
                        >
                          <RadioGroupItem value="24" id="24h" className="sr-only" />
                          <span className="text-xs font-medium">1 ngày</span>
                          <Badge variant="outline" className="text-[10px] py-0 bg-purple-100">
                            -30%
                          </Badge>
                        </Label>
                        <Label
                          htmlFor="168h"
                          className={`flex flex-col items-center gap-1 p-2 border rounded-lg cursor-pointer text-center ${
                            rentDuration === 168 ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30" : ""
                          }`}
                        >
                          <RadioGroupItem value="168" id="168h" className="sr-only" />
                          <span className="text-xs font-medium">1 tuần</span>
                          <Badge variant="outline" className="text-[10px] py-0 bg-purple-100">
                            -50%
                          </Badge>
                        </Label>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Country Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">2. Chọn quốc gia</span>
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === "success" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("success")}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Tỷ lệ thành công
                        </Button>
                        <Button
                          variant={viewMode === "price" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("price")}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Giá rẻ nhất
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm quốc gia..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {countryStats.map(({ country, price, stock, successRate }) => {
                        const isSelected = selectedCountry?.id === country.id

                        return (
                          <div
                            key={country.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                              isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : ""
                            }`}
                            onClick={() => handleCountrySelect(country)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{getCountryFlag(country.code)}</div>
                                <div>
                                  <div className="font-semibold">{country.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{successRate}% thành công</span>
                                    <span>•</span>
                                    <span>{stock.toLocaleString("vi-VN")} số khả dụng</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-700">Còn hàng</Badge>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Tỷ lệ thành công</span>
                                <span>{successRate}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">Giá gốc</div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {formatVND(price)}
                                </div>
                              </div>
                              {isSelected && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRentClick()
                                  }}
                                  disabled={isRenting}
                                >
                                  {isRenting ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Đang xử lý...
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="h-4 w-4 mr-2" />
                                      Thuê ngay
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {countryStats.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          Không có quốc gia nào khả dụng cho dịch vụ này
                        </div>
                      )}
                    </div>
                  </div>

                  {calculatedPricing && (
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                      <div className="space-y-2">
                        {calculatedPricing.discount > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Giá gốc</span>
                              <span className="line-through">
                                {calculatedPricing.originalPrice.toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-green-600">
                              <span>Giảm giá ({calculatedPricing.discountPercentage.toFixed(0)}%)</span>
                              <span>-{calculatedPricing.discount.toLocaleString("vi-VN")}đ</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between border-t pt-2">
                          <span className="font-semibold">Tổng thanh toán</span>
                          <span className="text-2xl font-bold text-primary">
                            {calculatedPricing.finalPrice.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>

                      <Button className="mt-4 w-full" size="lg" onClick={handleRentClick} disabled={isRenting}>
                        {isRenting ? "Đang xử lý..." : "Thuê ngay"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedService && selectedCountry && calculatedPricing && (
        <RentalConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          service={selectedService}
          country={selectedCountry}
          rentalType={rentalType}
          pricing={calculatedPricing}
          currentBalance={userBalance}
          onConfirm={handleConfirmRent}
          additionalServices={rentalType === "multi-service" ? Array.from(additionalServices) : undefined}
          rentDurationHours={rentalType === "long-term" ? rentDuration : undefined}
        />
      )}
    </>
  )
}
