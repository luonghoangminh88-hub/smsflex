"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Zap } from "lucide-react"
import { CopyButton } from "@/components/copy-button"

interface RealtimeOTPDisplayProps {
  rentalId: string
  phoneNumber: string
  onOTPReceived?: (otp: string) => void
}

export function RealtimeOTPDisplay({ rentalId, phoneNumber, onOTPReceived }: RealtimeOTPDisplayProps) {
  const [otp, setOtp] = useState<string | null>(null)
  const [status, setStatus] = useState<"waiting" | "received" | "timeout">("waiting")
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    // Polling for OTP updates
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rentals/${rentalId}/status`)
        const data = await response.json()

        if (data.otp_code) {
          setOtp(data.otp_code)
          setStatus("received")
          onOTPReceived?.(data.otp_code)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("[v0] Error polling OTP:", error)
      }
    }, 2000) // Poll every 2 seconds

    // Timer for elapsed time
    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
      clearInterval(timerInterval)
    }
  }, [rentalId, onOTPReceived])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Trạng thái nhận OTP</h3>
            {status === "waiting" && (
              <Badge variant="outline" className="gap-2">
                <Clock className="h-4 w-4 animate-pulse" />
                Đang chờ: {formatTime(elapsedTime)}
              </Badge>
            )}
            {status === "received" && (
              <Badge variant="default" className="gap-2 bg-green-500">
                <CheckCircle2 className="h-4 w-4" />
                Đã nhận sau {formatTime(elapsedTime)}
              </Badge>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Số điện thoại:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{phoneNumber}</span>
                <CopyButton text={phoneNumber} />
              </div>
            </div>

            {otp ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-300 font-medium">Mã OTP:</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono">{otp}</div>
                  </div>
                </div>
                <CopyButton text={otp} />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Clock className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Vui lòng nhập số điện thoại vào dịch vụ để nhận OTP
                  <br />
                  OTP sẽ tự động hiển thị ở đây khi nhận được
                </p>
              </div>
            )}
          </div>

          {status === "waiting" && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Realtime webhook:</strong> Hệ thống sử dụng webhook để nhận OTP ngay lập tức. Bạn không cần
                refresh trang.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
