"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Mail, Server, Lock, TestTube, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

interface EmailConfig {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_password: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
  smtp_enabled: boolean
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    smtp_from_email: "",
    smtp_from_name: "OTP Rental System",
    smtp_secure: true,
    smtp_enabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchEmailConfig()
  }, [])

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch("/api/admin/email-config")
      if (!res.ok) throw new Error("Failed to fetch email config")
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error("Error fetching email config:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!res.ok) throw new Error("Failed to save email config")

      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình email",
      })
    } catch (error) {
      console.error("Error saving email config:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu cấu hình email",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: config.smtp_user }),
      })

      const data = await res.json()

      setTestResult({
        success: res.ok,
        message: data.message || (res.ok ? "Email test thành công!" : "Email test thất bại"),
      })

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Email test đã được gửi thành công",
        })
      } else {
        toast({
          title: "Lỗi",
          description: data.message || "Không thể gửi email test",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing email:", error)
      setTestResult({
        success: false,
        message: "Lỗi kết nối SMTP server",
      })
      toast({
        title: "Lỗi",
        description: "Không thể test email",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Email</h1>
        <p className="text-muted-foreground mt-2">Thiết lập SMTP để gửi email thông báo</p>
      </div>

      <div className="grid gap-6">
        {/* SMTP Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Cấu hình SMTP Server
            </CardTitle>
            <CardDescription>Thông tin kết nối đến SMTP server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Kích hoạt gửi email</Label>
                <p className="text-sm text-muted-foreground">Bật/tắt chức năng gửi email</p>
              </div>
              <Switch
                checked={config.smtp_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, smtp_enabled: checked })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={config.smtp_host}
                  onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={config.smtp_port}
                  onChange={(e) => setConfig({ ...config, smtp_port: e.target.value })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input
                id="smtp-user"
                value={config.smtp_user}
                onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input
                id="smtp-password"
                type="password"
                value={config.smtp_password}
                onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Với Gmail, hãy sử dụng App Password thay vì mật khẩu thường
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>SSL/TLS</Label>
                  <p className="text-xs text-muted-foreground">Kết nối bảo mật</p>
                </div>
              </div>
              <Switch
                checked={config.smtp_secure}
                onCheckedChange={(checked) => setConfig({ ...config, smtp_secure: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sender Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Thông tin người gửi
            </CardTitle>
            <CardDescription>Email và tên hiển thị khi gửi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from-email">Email gửi</Label>
              <Input
                id="from-email"
                type="email"
                value={config.smtp_from_email}
                onChange={(e) => setConfig({ ...config, smtp_from_email: e.target.value })}
                placeholder="noreply@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-name">Tên hiển thị</Label>
              <Input
                id="from-name"
                value={config.smtp_from_name}
                onChange={(e) => setConfig({ ...config, smtp_from_name: e.target.value })}
                placeholder="OTP Rental System"
              />
            </div>
          </CardContent>
        </Card>

        {/* Test & Save */}
        <Card>
          <CardHeader>
            <CardTitle>Kiểm tra và lưu</CardTitle>
            <CardDescription>Test kết nối SMTP trước khi lưu cấu hình</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleTestEmail}
                disabled={testing || !config.smtp_enabled}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang test...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Email
                  </>
                )}
              </Button>

              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu cấu hình
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Lưu ý:</strong> Sau khi lưu, hệ thống sẽ sử dụng cấu hình này để gửi email thông báo cho người
                dùng khi có giao dịch, đặt thuê thành công, v.v.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
