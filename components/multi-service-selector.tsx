"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Package, TrendingDown } from "lucide-react"
import { formatVND } from "@/lib/currency"
import type { Service, Country } from "@/lib/types"

interface MultiServiceSelectorProps {
  services: Service[]
  country: Country
  onRent: (serviceIds: string[]) => Promise<void>
}

export function MultiServiceSelector({ services, country, onRent }: MultiServiceSelectorProps) {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [isRenting, setIsRenting] = useState(false)

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const calculateTotalPrice = () => {
    return services.filter((s) => selectedServices.has(s.id)).reduce((sum, service) => sum + (service.price || 0), 0)
  }

  const calculateDiscount = () => {
    const count = selectedServices.size
    if (count >= 5) return 0.47 // 47% discount
    if (count >= 3) return 0.3 // 30% discount
    if (count >= 2) return 0.15 // 15% discount
    return 0
  }

  const totalPrice = calculateTotalPrice()
  const discount = calculateDiscount()
  const finalPrice = totalPrice * (1 - discount)
  const savings = totalPrice - finalPrice

  const handleRent = async () => {
    if (selectedServices.size === 0) return

    setIsRenting(true)
    try {
      await onRent(Array.from(selectedServices))
    } finally {
      setIsRenting(false)
    }
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Multi-Service Number</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chọn nhiều dịch vụ cùng lúc để sử dụng 1 số điện thoại cho tất cả. Tiết kiệm lên đến 47% chi phí!
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Chọn dịch vụ (tối thiểu 2):</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedServices.has(service.id)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:bg-accent"
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <Checkbox
                    checked={selectedServices.has(service.id)}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{service.name}</div>
                  </div>
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatVND(service.price || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedServices.size > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng giá gốc:</span>
                  <span className="font-medium">{formatVND(totalPrice)}</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        Giảm giá ({(discount * 100).toFixed(0)}%):
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">-{formatVND(savings)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span>Thành tiền:</span>
                      <span className="text-primary">{formatVND(finalPrice)}</span>
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRent}
                disabled={isRenting || selectedServices.size < 2}
              >
                {isRenting ? "Đang thuê..." : `Thuê ${selectedServices.size} dịch vụ ngay`}
              </Button>

              {selectedServices.size < 2 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Vui lòng chọn ít nhất 2 dịch vụ</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
