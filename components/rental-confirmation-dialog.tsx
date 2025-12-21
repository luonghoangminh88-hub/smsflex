"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

interface PricingBreakdown {
  originalPrice: number
  discount: number
  discountPercentage: number
  finalPrice: number
  adminProfit: number
  adminProfitPercentage: number
}

interface RentalConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: { name: string; icon?: string }
  country: { name: string; code: string }
  rentalType: "standard" | "multi-service" | "long-term"
  pricing: PricingBreakdown
  currentBalance: number
  onConfirm: () => Promise<void>
  additionalServices?: string[]
  rentDurationHours?: number
}

export function RentalConfirmationDialog({
  open,
  onOpenChange,
  service,
  country,
  rentalType,
  pricing,
  currentBalance,
  onConfirm,
  additionalServices,
  rentDurationHours,
}: RentalConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Rental failed:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  const newBalance = currentBalance - pricing.finalPrice
  const hasEnoughBalance = currentBalance >= pricing.finalPrice

  const getRentalTypeLabel = () => {
    if (rentalType === "multi-service") {
      return `Đa dịch vụ (${additionalServices?.length || 0} dịch vụ bổ sung)`
    }
    if (rentalType === "long-term") {
      const hours = rentDurationHours || 0
      if (hours >= 168) return "Thuê dài hạn (1 tuần)"
      if (hours >= 24) return "Thuê dài hạn (1 ngày)"
      return "Thuê dài hạn (4 giờ)"
    }
    return "Thuê thông thường"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Xác nhận thuê số</DialogTitle>
          <DialogDescription>Vui lòng kiểm tra thông tin trước khi xác nhận</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              {service.icon && <span className="text-2xl">{service.icon}</span>}
              <div className="flex-1">
                <h4 className="font-semibold">{service.name}</h4>
                <p className="text-sm text-muted-foreground">{country.name}</p>
              </div>
              <Badge variant="secondary">{getRentalTypeLabel()}</Badge>
            </div>
          </div>

          {/* Additional Services */}
          {rentalType === "multi-service" && additionalServices && additionalServices.length > 0 && (
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                Dịch vụ bổ sung
              </div>
              <div className="flex flex-wrap gap-2">
                {additionalServices.map((svc) => (
                  <Badge key={svc} variant="outline">
                    {svc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giá gốc</span>
              <span>{pricing.originalPrice.toLocaleString("vi-VN")}đ</span>
            </div>

            {pricing.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá ({pricing.discountPercentage.toFixed(0)}%)</span>
                <span>-{pricing.discount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Tổng thanh toán</span>
              <span className="text-lg text-primary">{pricing.finalPrice.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {/* Balance Info */}
          <div className="rounded-lg border p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số dư hiện tại</span>
                <span className="font-medium">{currentBalance.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số dư sau khi thuê</span>
                <span className={`font-medium ${newBalance < 0 ? "text-destructive" : ""}`}>
                  {newBalance.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {!hasEnoughBalance && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Số dư không đủ. Vui lòng nạp thêm tiền.</span>
              </div>
            )}
          </div>

          {/* Savings Info */}
          {pricing.discount > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Bạn tiết kiệm được {pricing.discount.toLocaleString("vi-VN")}đ với {getRentalTypeLabel().toLowerCase()}!
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!hasEnoughBalance || isConfirming}>
            {isConfirming ? "Đang xử lý..." : "Xác nhận thuê"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
