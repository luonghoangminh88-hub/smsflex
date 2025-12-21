"use client"

import type React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleLoginButton } from "@/components/google-login-button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useState(() => {
    const errorParam = searchParams.get("error")
    const reason = searchParams.get("reason")

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    } else if (reason === "no_profile") {
      setError("Không tìm thấy thông tin tài khoản. Vui lòng liên hệ hỗ trợ.")
    } else if (reason === "session_error") {
      setError("Phiên đăng nhập không hợp lệ. Vui lòng thử lại.")
    }
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setRemainingAttempts(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.error)
        } else {
          setError(data.error || "Đăng nhập thất bại")
          if (data.remainingAttempts !== undefined) {
            setRemainingAttempts(data.remainingAttempts)
          }
        }
        return
      }

      // Success
      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.error("Login exception:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi đăng nhập")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo-otpviet.jpg" alt="OTPVIET" className="h-12 w-12 rounded-lg" />
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              OTPVIET
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">Hệ thống thuê SIM ảo chuyên nghiệp</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>Nhập email và mật khẩu để truy cập tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <GoogleLoginButton />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Hoặc đăng nhập bằng email</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <div className="mt-1 text-sm">Còn {remainingAttempts} lần thử</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Chưa có tài khoản?{" "}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline underline-offset-4">
                  Đăng ký ngay
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Bằng việc đăng nhập, bạn đồng ý với{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline">
                    Điều khoản
                  </Link>{" "}
                  và{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
