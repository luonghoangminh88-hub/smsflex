"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wallet, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatVND } from "@/lib/currency"

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000]

interface PaymentMethod {
  id: string
  name: string
  type: string
  provider: string
  logo_url?: string
  instructions?: string
  min_amount: number
}

interface DepositInfo {
  id: string
  payment_code: string
  transfer_content: string
  amount: number
  payment_data?: any
}

export default function DepositPage() {
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      setPaymentMethods(data || [])
      if (data && data.length > 0) {
        setSelectedMethod(data[0].id)
      }
    } catch (err) {
      console.error("Error loading payment methods:", err)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCreateDeposit = async () => {
    const depositAmount = Number.parseInt(amount)
    if (isNaN(depositAmount) || depositAmount < 10000) {
      setError("Số tiền nạp tối thiểu là 10.000₫")
      return
    }

    if (!selectedMethod) {
      setError("Vui lòng chọn phương thức thanh toán")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/deposits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: selectedMethod,
          amount: depositAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create deposit")
      }

      setDepositInfo(data.deposit)
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo yêu cầu nạp tiền")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod)

  if (depositInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Thông tin chuyển khoản</CardTitle>
            <CardDescription>Vui lòng chuyển khoản theo thông tin bên dưới</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code if available */}
            {depositInfo.payment_data?.qr_url && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={depositInfo.payment_data.qr_url || "/placeholder.svg"}
                  alt="QR Code thanh toán"
                  className="w-64 h-64 object-contain"
                />
              </div>
            )}

            {/* Payment details */}
            <div className="space-y-4">
              {depositInfo.payment_data?.bank_code && (
                <div className="space-y-2">
                  <Label>Ngân hàng</Label>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="font-semibold">{depositInfo.payment_data.bank_code}</span>
                  </div>
                </div>
              )}

              {depositInfo.payment_data?.account_number && (
                <div className="space-y-2">
                  <Label>Số tài khoản</Label>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="font-mono">{depositInfo.payment_data.account_number}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(depositInfo.payment_data.account_number, "account")}
                    >
                      {copied === "account" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {depositInfo.payment_data?.account_name && (
                <div className="space-y-2">
                  <Label>Chủ tài khoản</Label>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span>{depositInfo.payment_data.account_name}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Số tiền</Label>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="font-semibold text-lg">{formatVND(depositInfo.amount)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(depositInfo.amount.toString(), "amount")}
                  >
                    {copied === "amount" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nội dung chuyển khoản</Label>
                <div className="flex items-center justify-between p-3 bg-primary/10 border-2 border-primary rounded-lg">
                  <span className="font-mono font-semibold">{depositInfo.payment_code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(depositInfo.payment_code, "content")}
                  >
                    {copied === "content" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Lưu ý quan trọng:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động cộng tiền</li>
                  <li>Số dư sẽ được cập nhật trong vòng 1-5 phút sau khi chuyển khoản thành công</li>
                  <li>Nếu sau 30 phút chưa nhận được tiền, vui lòng liên hệ hỗ trợ</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={() => router.push("/dashboard/transactions")} variant="outline" className="flex-1">
                Xem lịch sử giao dịch
              </Button>
              <Button onClick={() => setDepositInfo(null)} className="flex-1">
                Tạo yêu cầu mới
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Nạp tiền vào tài khoản
          </CardTitle>
          <CardDescription>Chọn phương thức thanh toán và số tiền muốn nạp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment method selection */}
          <div className="space-y-3">
            <Label>Phương thức thanh toán</Label>
            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {method.logo_url && (
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-white p-2">
                      <img
                        src={method.logo_url || "/placeholder.svg"}
                        alt={method.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{method.name}</div>
                    {method.instructions && (
                      <div className="text-xs text-muted-foreground mt-1">{method.instructions}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset amounts */}
          <div className="space-y-3">
            <Label>Chọn nhanh</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preset.toString())}
                  className="h-auto py-3"
                >
                  {formatVND(preset)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Hoặc nhập số tiền khác</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ví dụ: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Số tiền nạp tối thiểu: {formatVND(selectedMethodData?.min_amount || 10000)}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          {amount && Number.parseInt(amount) >= 10000 && (
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số tiền nạp</span>
                <span className="font-semibold">{formatVND(Number.parseInt(amount))}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleCreateDeposit}
            disabled={isLoading || !amount || !selectedMethod}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Đang xử lý..." : "Tiếp tục"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
