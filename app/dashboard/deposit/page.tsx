"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wallet, Copy, Check, Loader2, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatVND } from "@/lib/currency"
import { useToast } from "@/hooks/use-toast"

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
  status: string
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
  const [isPolling, setIsPolling] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  useEffect(() => {
    if (!depositInfo || !isPolling) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/deposits/status?id=${depositInfo.id}`)
        const data = await response.json()

        console.log("[v0] Polling deposit status:", {
          depositId: depositInfo.id,
          status: data.deposit?.status,
          pollCount: pollCount + 1,
        })

        if (data.deposit?.status === "completed") {
          setIsPolling(false)
          setDepositInfo({ ...depositInfo, status: "completed" })
          setShowSuccessAnimation(true)

          router.refresh()

          // Play success sound
          try {
            const audio = new Audio("/sounds/success.mp3")
            audio.volume = 0.3
            audio.play().catch(() => {
              // Silently fail if audio can't play
            })
          } catch (e) {
            // Ignore audio errors
          }

          toast({
            title: "Thanh toán thành công!",
            description: `+${formatVND(depositInfo.amount)} đã được cộng vào tài khoản`,
          })

          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push("/dashboard")
          }, 3000)

          return
        }

        setPollCount((prev) => {
          const newCount = prev + 1
          if (newCount >= 100) {
            setIsPolling(false)
            toast({
              title: "Vẫn chưa nhận được xác nhận",
              description: "Vui lòng kiểm tra lại giao dịch hoặc liên hệ hỗ trợ",
              variant: "destructive",
            })
          }
          return newCount
        })
      } catch (err) {
        console.error("[v0] Error polling deposit status:", err)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [depositInfo, isPolling, pollCount, router, toast])

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
      setIsPolling(true)
      setPollCount(0)
      setShowSuccessAnimation(false)
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo yêu cầu nạp tiền")
      toast({
        title: "Không thể tạo yêu cầu nạp tiền",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod)

  if (depositInfo) {
    const isCompleted = depositInfo.status === "completed"

    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6 min-h-[44px]">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>{isCompleted ? "Thanh toán thành công" : "Thông tin chuyển khoản"}</CardTitle>
            <CardDescription>
              {isCompleted ? "Số dư của bạn đã được cập nhật" : "Vui lòng chuyển khoản theo thông tin bên dưới"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6">
            {isCompleted ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className={`${showSuccessAnimation ? "animate-scale-in" : ""}`}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <CheckCircle2 className="relative h-24 w-24 text-green-500 animate-bounce-once" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-green-600">Thanh toán thành công!</p>
                  <p className="text-lg text-muted-foreground">
                    Bạn đã nạp <span className="font-semibold text-foreground">{formatVND(depositInfo.amount)}</span>{" "}
                    vào tài khoản
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang chuyển về trang chủ...</span>
                </div>
              </div>
            ) : (
              <>
                {isPolling && (
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-900 dark:text-blue-100">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-semibold">Đang chờ xác nhận thanh toán...</span>
                      </div>
                      <p className="text-xs mt-2">
                        Hệ thống đang tự động kiểm tra giao dịch của bạn ({Math.floor((pollCount * 3000) / 1000)}
                        s)
                      </p>
                      <p className="text-xs mt-1 opacity-75">
                        Trang sẽ tự động cập nhật khi nhận được xác nhận từ ngân hàng
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {depositInfo.payment_data?.qr_url && (
                  <div className="flex justify-center p-4 bg-white dark:bg-slate-900 rounded-lg">
                    <img
                      src={depositInfo.payment_data.qr_url || "/placeholder.svg"}
                      alt="QR Code thanh toán"
                      className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {depositInfo.payment_data?.bank_code && (
                    <div className="space-y-2">
                      <Label>Ngân hàng</Label>
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg min-h-[52px]">
                        <span className="font-semibold">{depositInfo.payment_data.bank_code}</span>
                      </div>
                    </div>
                  )}

                  {depositInfo.payment_data?.account_number && (
                    <div className="space-y-2">
                      <Label>Số tài khoản</Label>
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg min-h-[52px]">
                        <span className="font-mono text-base sm:text-lg break-all">
                          {depositInfo.payment_data.account_number}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(depositInfo.payment_data.account_number, "account")}
                          className="ml-2 min-h-[44px] min-w-[44px]"
                        >
                          {copied === "account" ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {depositInfo.payment_data?.account_name && (
                    <div className="space-y-2">
                      <Label>Chủ tài khoản</Label>
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg min-h-[52px]">
                        <span className="break-words">{depositInfo.payment_data.account_name}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Số tiền</Label>
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg min-h-[52px]">
                      <span className="font-semibold text-lg sm:text-xl">{formatVND(depositInfo.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(depositInfo.amount.toString(), "amount")}
                        className="ml-2 min-h-[44px] min-w-[44px]"
                      >
                        {copied === "amount" ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nội dung chuyển khoản</Label>
                    <div className="flex items-center justify-between p-4 bg-primary/10 border-2 border-primary rounded-lg min-h-[56px]">
                      <span className="font-mono font-bold text-lg sm:text-xl break-all">
                        {depositInfo.payment_code}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(depositInfo.payment_code, "content")}
                        className="ml-2 min-h-[48px] min-w-[48px]"
                      >
                        {copied === "content" ? (
                          <Check className="h-6 w-6 text-primary" />
                        ) : (
                          <Copy className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm leading-relaxed">
                    <strong>Lưu ý quan trọng:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động cộng tiền</li>
                      <li>
                        <strong>Số dư sẽ được cập nhật TỰ ĐỘNG</strong> trong vòng 1-5 phút, không cần tải lại trang
                      </li>
                      <li>Nếu sau 30 phút chưa nhận được tiền, vui lòng liên hệ hỗ trợ</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push("/dashboard/transactions")}
                    variant="outline"
                    className="flex-1 min-h-[48px]"
                  >
                    Xem lịch sử giao dịch
                  </Button>
                  <Button onClick={() => setDepositInfo(null)} className="flex-1 min-h-[48px]">
                    Tạo yêu cầu mới
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6 min-h-[44px]">
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
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="space-y-3">
            <Label>Phương thức thanh toán</Label>
            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all min-h-[64px] ${
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

          <div className="space-y-3">
            <Label>Chọn nhanh</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[50000, 100000, 200000, 500000, 1000000].map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preset.toString())}
                  className="h-auto py-4 min-h-[52px] text-sm sm:text-base"
                >
                  {formatVND(preset)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Hoặc nhập số tiền khác</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              placeholder="Ví dụ: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              className="text-lg h-12"
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
            className="w-full min-h-[52px] text-base"
            size="lg"
          >
            {isLoading ? "Đang xử lý..." : "Tiếp tục"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
