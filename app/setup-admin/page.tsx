"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function SetupAdminPage() {
  const [email, setEmail] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, secretKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to create admin" })
      } else {
        setMessage({
          type: "success",
          text: `Admin account created successfully for ${data.admin.email}`,
        })
        setEmail("")
        setSecretKey("")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="size-6 text-primary" />
          </div>
          <CardTitle>Thiết Lập Tài Khoản Admin</CardTitle>
          <CardDescription>Tạo tài khoản quản trị viên đầu tiên cho hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>Lưu ý:</strong> Trang này chỉ dùng cho lần cài đặt đầu tiên. Hãy tắt hoặc bảo mật trang này sau
              khi tạo admin.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSetupAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email tài khoản cần nâng quyền</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Tài khoản này phải đã đăng ký trước đó qua trang /auth/signup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Nhập secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mặc định: "change-this-secret-key-in-production" (xem trong .env)
              </p>
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                {message.type === "success" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang xử lý..." : "Tạo Admin"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
            <h4 className="mb-2 font-semibold">Hướng dẫn:</h4>
            <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
              <li>Đăng ký tài khoản thông thường tại /auth/signup</li>
              <li>Nhập email đó vào form này</li>
              <li>Nhập secret key (được set trong biến môi trường ADMIN_SETUP_SECRET)</li>
              <li>Click "Tạo Admin" để nâng quyền</li>
              <li>Sau khi tạo xong, nên xóa hoặc bảo vệ trang này</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
