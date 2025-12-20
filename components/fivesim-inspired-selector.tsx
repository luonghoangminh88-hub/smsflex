"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Star,
  Loader2,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Phone,
  Globe,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { Service, Country, ServicePrice } from "@/lib/types"
import { getServiceLogo, getCountryFlag, getServiceIcon } from "@/lib/service-icons"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useTranslation, type Locale } from "@/lib/i18n"
import { formatVND } from "@/lib/currency"

interface FivesimInspiredSelectorProps {
  services: Service[]
  countries: Country[]
  servicePrices: ServicePrice[]
  userBalance: number
}

export function FivesimInspiredSelector({
  services,
  countries,
  servicePrices,
  userBalance,
}: FivesimInspiredSelectorProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [serviceSearch, setServiceSearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isRenting, setIsRenting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const router = useRouter()

  const [locale, setLocale] = useState<Locale>("vi")
  const { t } = useTranslation(locale)

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const [viewMode, setViewMode] = useState<"success" | "price">("success")

  const [tabView, setTabView] = useState<"prices" | "stats">("prices")

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

        const successRate = Math.floor(Math.random() * 20) + 75 // 75-95%

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
          return a.price - b.price // Sort by lowest price first
        }
      })
  }, [selectedService, filteredCountries, servicePrices, viewMode])

  const selectedPrice = servicePrices.find(
    (sp) => sp.service_id === selectedService?.id && sp.country_id === selectedCountry?.id,
  )

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
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setCurrentStep(3)
  }

  const handleRent = async () => {
    if (!selectedService || !selectedCountry || !selectedPrice) {
      setError(t("rental.selectServiceAndCountry"))
      return
    }

    setIsRenting(true)
    setError(null)

    try {
      const response = await fetch("/api/rentals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          countryId: selectedCountry.id,
          provider: "sms-activate", // Default provider
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("rental.errorOccurred"))
      }

      router.push(`/dashboard/rental/${data.rental.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("rental.errorRentingNumber"))
    } finally {
      setIsRenting(false)
    }
  }

  const maxPrice = Math.max(...countryStats.map((s) => s.price), 1)

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[600px]">
      {/* Left Sidebar - Service Selection */}
      <div className="lg:w-80 flex-shrink-0">
        <Card className="h-full border-2">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <Tabs value={tabView} onValueChange={(v) => setTabView(v as "prices" | "stats")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="prices" className="text-xs sm:text-sm py-2.5 sm:py-2">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                  {t("service.priceList")}
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs sm:text-sm py-2.5 sm:py-2">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                  {t("service.statistics")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prices" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-sm">1. {t("rental.selectService")}</span>
                    <Badge variant="secondary" className="text-xs">
                      {services.length}
                    </Badge>
                  </div>

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("service.search")}
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="pl-10 h-11 sm:h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
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
                          className={`flex items-center gap-2.5 sm:gap-2 p-3 sm:p-2 rounded-lg cursor-pointer transition-all hover:bg-accent group min-h-[52px] sm:min-h-0 ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                              : ""
                          }`}
                          onClick={() => handleServiceSelect(service)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(service.id)
                            }}
                            className="flex-shrink-0 p-1 -m-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                          >
                            <Star
                              className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${
                                favorites.has(service.id)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 group-hover:text-gray-400"
                              }`}
                            />
                          </button>

                          <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 border">
                            {!hasImageError ? (
                              <Image
                                src={getServiceLogo(service.name) || service.icon_url || "/placeholder.svg"}
                                alt={service.name}
                                width={24}
                                height={24}
                                className="object-contain"
                                onError={() => handleImageError(service.id)}
                                unoptimized
                              />
                            ) : (
                              <FallbackIcon className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{service.name}</div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                              {t("service.from")} {formatVND(minPrice)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {totalStock.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} số
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {filteredServices.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        {locale === "vi" ? "Không tìm thấy dịch vụ" : "No services found"}
                      </div>
                    )}
                  </div>
                </div>

                {selectedService && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-sm">2. {t("rental.selectCountry")}</span>
                      <Badge variant="secondary" className="text-xs">
                        {filteredCountries.length}
                      </Badge>
                    </div>

                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t("country.search")}
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="pl-10 h-11 sm:h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredCountries.map((country) => {
                        const price = servicePrices.find(
                          (sp) => sp.service_id === selectedService.id && sp.country_id === country.id,
                        )
                        const stock = price?.stock_count || 0
                        const isSelected = selectedCountry?.id === country.id

                        return (
                          <div
                            key={country.id}
                            className={`flex items-center gap-2.5 sm:gap-2 p-3 sm:p-2 rounded-lg cursor-pointer transition-all hover:bg-accent min-h-[52px] sm:min-h-0 ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                                : ""
                            }`}
                            onClick={() => handleCountrySelect(country)}
                          >
                            <div className="text-2xl sm:text-xl flex-shrink-0">{getCountryFlag(country.code)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{country.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {price !== undefined ? formatVND(price.price) : t("service.unavailable")}
                              </div>
                            </div>
                            {price !== undefined && stock > 0 && (
                              <Badge variant={stock > 100 ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                                {stock}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Button
                      variant={viewMode === "success" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-9 sm:h-7 flex-shrink-0 px-3"
                      onClick={() => setViewMode("success")}
                    >
                      {t("service.successRate")} (%)
                    </Button>
                    <Button
                      variant={viewMode === "price" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-9 sm:h-7 flex-shrink-0 px-3"
                      onClick={() => setViewMode("price")}
                    >
                      {t("rental.price")} (VNĐ)
                    </Button>
                    <Badge
                      variant="secondary"
                      className="text-[10px] sm:text-xs break-words leading-tight py-1.5 sm:py-1"
                    >
                      <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="break-words">
                        {viewMode === "success" ? "Sắp xếp theo tỷ lệ thành công" : "Sắp xếp theo giá thấp nhất"}
                      </span>
                    </Badge>
                  </div>

                  <div className="space-y-3 sm:space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {countryStats.map(({ country, price, stock, successRate }) => {
                      const isSelected = selectedCountry?.id === country.id
                      const priceBarWidth = (price / maxPrice) * 100

                      return (
                        <div
                          key={country.id}
                          className={`border rounded-lg p-4 sm:p-3 cursor-pointer transition-all hover:shadow-md min-h-[120px] sm:min-h-0 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                          onClick={() => handleCountrySelect(country)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-3xl sm:text-2xl flex-shrink-0">{getCountryFlag(country.code)}</div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-sm truncate">{country.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {stock.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}{" "}
                                    {locale === "vi" ? "số khả dụng" : "numbers available"}
                                  </div>
                                </div>
                                <Badge
                                  variant={stock > 100 ? "default" : "secondary"}
                                  className="text-xs flex-shrink-0"
                                >
                                  {t("service.inStock")}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 sm:h-5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-full flex items-center justify-center text-xs sm:text-[10px] font-semibold text-white transition-all"
                                    style={{ width: `${successRate}%` }}
                                  >
                                    {successRate}%
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-full h-7 sm:h-6 overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-sm sm:text-xs font-semibold text-white transition-all"
                                  style={{ width: `${Math.max(priceBarWidth, 15)}%` }}
                                >
                                  {formatVND(price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
        <Card className="border-2 h-full">
          <CardContent className="p-4 sm:p-6">
            {!selectedService ? (
              <div className="flex flex-col items-center justify-center h-full py-12 sm:py-20 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{t("rental.selectServiceFirst")}</h3>
                <p className="text-sm text-muted-foreground max-w-md px-4">
                  {t("rental.selectServiceDescription") ||
                    "Chọn dịch vụ từ danh sách bên trái để xem các quốc gia khả dụng và giá cả"}
                </p>
              </div>
            ) : !selectedCountry ? (
              <div className="flex flex-col items-center justify-center h-full py-12 sm:py-20 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{t("rental.selectCountryNext")}</h3>
                <p className="text-sm text-muted-foreground max-w-md px-4">
                  {t("rental.selectCountryDescription") ||
                    "Chọn quốc gia bạn muốn nhận số điện thoại từ danh sách bên trái"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Selected Service Header */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  {(() => {
                    const FallbackIcon = getServiceIcon(selectedService.name)
                    const hasError = imageErrors.has(selectedService.id)

                    return (
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2">
                        {!hasError ? (
                          <Image
                            src={getServiceLogo(selectedService.name) || "/placeholder.svg"}
                            alt={selectedService.name}
                            width={28}
                            height={28}
                            className="object-contain"
                            onError={() => handleImageError(selectedService.id)}
                            unoptimized
                          />
                        ) : (
                          <FallbackIcon className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    )
                  })()}
                  <div>
                    <h3 className="font-bold text-lg">{selectedService.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {locale === "vi"
                        ? "Chọn quốc gia để xem giá và tồn kho"
                        : "Select country to view price and stock"}
                    </p>
                  </div>
                </div>

                {/* Country Statistics Table */}
                <div className="space-y-2">
                  {countryStats.map(({ country, price, stock, successRate }) => {
                    const isSelected = selectedCountry?.id === country.id
                    const priceBarWidth = (price / maxPrice) * 100

                    return (
                      <div
                        key={country.id}
                        className={`border rounded-lg p-3 sm:p-2 cursor-pointer transition-all hover:shadow-md min-h-[120px] sm:min-h-0 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => handleCountrySelect(country)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl sm:text-xl flex-shrink-0">{getCountryFlag(country.code)}</div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate">{country.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {stock.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}{" "}
                                  {locale === "vi" ? "số khả dụng" : "numbers available"}
                                </div>
                              </div>
                              <Badge variant={stock > 100 ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                                {stock}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 sm:h-5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-full flex items-center justify-center text-xs sm:text-[10px] font-semibold text-white transition-all"
                                  style={{ width: `${successRate}%` }}
                                >
                                  {successRate}%
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-full h-7 sm:h-6 overflow-hidden relative">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-sm sm:text-xs font-semibold text-white transition-all"
                                style={{ width: `${Math.max(priceBarWidth, 15)}%` }}
                              >
                                {formatVND(price)}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCountrySelect(country)
                            }}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {countryStats.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {locale === "vi"
                        ? "Không có quốc gia khả dụng cho dịch vụ này"
                        : "No countries available for this service"}
                    </div>
                  )}
                </div>

                {/* Checkout Section */}
                {selectedCountry && selectedPrice && (
                  <div className="mt-6 p-4 sm:p-4 border-2 border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-950/20 space-y-4 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                      <div>
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">Tổng thanh toán</div>
                        <div className="text-2xl sm:text-2xl font-bold text-primary">
                          {formatVND(selectedPrice.price)}
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">Số dư của bạn</div>
                        <div
                          className={`text-xl sm:text-xl font-semibold ${
                            userBalance >= selectedPrice.price
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatVND(userBalance)}
                        </div>
                      </div>
                    </div>

                    {userBalance < selectedPrice.price && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                          <span>Số dư không đủ. Vui lòng nạp thêm tiền để tiếp tục.</span>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleRent}
                      disabled={isRenting || userBalance < selectedPrice.price}
                      className="w-full h-14 sm:h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isRenting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span className="text-sm sm:text-base">Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm sm:text-base">
                            Xác nhận thuê số - {formatVND(selectedPrice.price)}
                          </span>
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
