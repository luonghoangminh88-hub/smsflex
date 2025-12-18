"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface PaymentGateway {
  id: string
  name: string
  code: string
  logo: string
  description: string
}

const gateways: PaymentGateway[] = [
  {
    id: "vnpay",
    name: "VNPay",
    code: "vnpay",
    logo: "/vnpay-logo.jpg",
    description: "Thanh toán qua VNPay - Hỗ trợ tất cả ngân hàng",
  },
  {
    id: "momo",
    name: "MoMo",
    code: "momo",
    logo: "/momo-logo.jpg",
    description: "Thanh toán qua ví MoMo",
  },
]

export function PaymentGatewaySelector() {
  const [amount, setAmount] = useState("")
  const [selectedGateway, setSelectedGateway] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (!amount || !selectedGateway) {
      toast.error("Vui lòng nhập số tiền và chọn phương thức thanh toán")
      return
    }

    const amountNumber = Number.parseFloat(amount)
    if (amountNumber < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10,000đ")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/payment/${selectedGateway}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNumber, paymentMethodId: selectedGateway }),
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error("Không thể tạo thanh toán")
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nhập số tiền</CardTitle>
          <CardDescription>Số tiền nạp tối thiểu 10,000đ</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="amount">Số tiền (VND)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="100,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2"
            min="10000"
            step="1000"
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Chọn cổng thanh toán</h3>
        {gateways.map((gateway) => (
          <Card
            key={gateway.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedGateway === gateway.code ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => setSelectedGateway(gateway.code)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="relative h-12 w-24 flex-shrink-0">
                <Image src={gateway.logo || "/placeholder.svg"} alt={gateway.name} fill className="object-contain" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{gateway.name}</h4>
                <p className="text-sm text-muted-foreground">{gateway.description}</p>
              </div>
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  selectedGateway === gateway.code ? "border-primary bg-primary" : "border-muted"
                }`}
              >
                {selectedGateway === gateway.code && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={handlePayment} disabled={loading || !selectedGateway || !amount} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Tiếp tục thanh toán"
        )}
      </Button>
    </div>
  )
}
