"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleLoginButton } from "@/components/google-login-button"
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!acceptedTerms) {
      setError("Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      setIsLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ hoa")
      setIsLoading(false)
      return
    }

    if (!/[a-z]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ thường")
      setIsLoading(false)
      return
    }

    if (!/\d/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất 1 số")
      setIsLoading(false)
      return
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt")
      setIsLoading(false)
      return
    }

    console.log("[v0] Starting signup process for:", email)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/api/auth/callback`,
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            role: "user",
          },
        },
      })

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.")
        } else {
          console.error("[v0] Signup error:", error)
          throw error
        }
        setIsLoading(false)
        return
      }

      console.log("[v0] Signup successful:", data.user?.email)

      if (data.user && !data.session) {
        console.log("[v0] Email confirmation required")
        router.push("/auth/signup-success")
      } else if (data.session) {
        console.log("[v0] Auto-confirmed, redirecting to dashboard")
        await new Promise((resolve) => setTimeout(resolve, 1500))
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: unknown) {
      console.error("[v0] Signup exception:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi đăng ký")
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
          <p className="mt-2 text-muted-foreground">Tạo tài khoản mới</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Đăng ký</CardTitle>
            <CardDescription>Điền thông tin để tạo tài khoản mới</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup}>
              <div className="flex flex-col gap-4">
                <GoogleLoginButton />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Hoặc đăng ký bằng email</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
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
                  <Label htmlFor="phoneNumber">Số điện thoại (tùy chọn)</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm leading-none cursor-pointer">
                    Tôi đồng ý với{" "}
                    <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                      Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                      Chính sách bảo mật
                    </Link>
                  </Label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Đã có tài khoản?{" "}
                <Link href="/auth/login" className="font-medium text-primary hover:underline underline-offset-4">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
