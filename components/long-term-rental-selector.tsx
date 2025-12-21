"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import { formatVND } from "@/lib/currency"
import type { Service, Country } from "@/lib/types"

interface LongTermRentalSelectorProps {
  service: Service
  country: Country
  basePrice: number
  onRent: (duration: number) => Promise<void>
}

const DURATION_OPTIONS = [
  { hours: 4, label: "4 giờ", discount: 0 },
  { hours: 24, label: "1 ngày", discount: 0.2 },
  { hours: 72, label: "3 ngày", discount: 0.35 },
  { hours: 168, label: "1 tuần", discount: 0.5 },
]

export function LongTermRentalSelector({ service, country, basePrice, onRent }: LongTermRentalSelectorProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [isRenting, setIsRenting] = useState(false)

  const calculatePrice = (hours: number, discount: number) => {
    const multiplier = hours / 4 // Base unit is 4 hours
    const rawPrice = basePrice * multiplier
    return rawPrice * (1 - discount)
  }

  const handleRent = async () => {
    if (!selectedDuration) return

    setIsRenting(true)
    try {
      await onRent(selectedDuration)
    } finally {
      setIsRenting(false)
    }
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Thuê dài hạn</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Thuê số điện thoại sử dụng liên tục trong nhiều giờ/ngày. Tiết kiệm lên đến 50% cho thuê 1 tuần!
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Chọn thời hạn thuê:</h4>
            <div className="grid grid-cols-2 gap-3">
              {DURATION_OPTIONS.map((option) => {
                const price = calculatePrice(option.hours, option.discount)
                const isSelected = selectedDuration === option.hours

                return (
                  <div
                    key={option.hours}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedDuration(option.hours)}
                  >
                    {option.discount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                        -{(option.discount * 100).toFixed(0)}%
                      </Badge>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-sm">{option.label}</span>
                      </div>
                      <div className="text-lg font-bold text-primary">{formatVND(price)}</div>
                      {option.discount > 0 && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatVND(calculatePrice(option.hours, 0))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleRent} disabled={!selectedDuration || isRenting}>
            {isRenting ? "Đang thuê..." : "Thuê số dài hạn ngay"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
