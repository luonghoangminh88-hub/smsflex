export const dynamic = "force-dynamic"
export const revalidate = 0

import { requireAdminAuth } from "@/lib/auth/admin-check"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

export default async function AutoPaymentSetupPage() {
  await requireAdminAuth()

  const setupSteps = [
    {
      title: "Cấu hình Email IMAP",
      description: "Thiết lập kết nối Gmail với App Password",
      status: "required",
      envVars: ["BANK_EMAIL_USER", "BANK_EMAIL_PASSWORD", "BANK_EMAIL_HOST", "BANK_EMAIL_PORT"],
    },
    {
      title: "Cài đặt Database",
      description: "Chạy migration script 206_create_bank_transactions.sql",
      status: "required",
    },
    {
      title: "Cấu hình Cron Job",
      description: "Thiết lập Vercel Cron hoặc external cron service",
      status: "required",
      envVars: ["CRON_SECRET", "NEXT_PUBLIC_CRON_SECRET"],
    },
    {
      title: "Cấu hình Ngân hàng",
      description: "Thêm parser cho các ngân hàng cần hỗ trợ",
      status: "optional",
    },
    {
      title: "Test hệ thống",
      description: "Gửi email test và kiểm tra kết quả",
      status: "optional",
    },
  ]

  const bankFormats = [
    { bank: "Vietcombank", format: "NAP [USER_ID]", example: "NAP 12345" },
    { bank: "TPBank", format: "NAP [USER_ID]", example: "NAP 67890" },
    { bank: "Các ngân hàng khác", format: "NAP [USER_ID]", example: "NAP 11111" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hướng dẫn Auto-Payment</h1>
        <p className="text-muted-foreground">Cấu hình hệ thống tự động nạp tiền qua email ngân hàng</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Hệ thống sẽ tự động quét email từ ngân hàng mỗi 30-60 giây và tự động nạp tiền cho người dùng dựa trên nội
          dung chuyển khoản.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Các bước cài đặt</CardTitle>
          <CardDescription>Hoàn thành các bước sau để kích hoạt auto-payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSteps.map((step, index) => (
            <div key={index} className="flex gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  {step.status === "required" ? (
                    <Badge variant="destructive">Bắt buộc</Badge>
                  ) : (
                    <Badge variant="secondary">Tùy chọn</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                {step.envVars && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Environment Variables:</p>
                    {step.envVars.map((envVar) => (
                      <code key={envVar} className="block px-2 py-1 bg-muted rounded">
                        {envVar}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quy tắc nội dung chuyển khoản</CardTitle>
          <CardDescription>Format nội dung chuyển khoản để hệ thống tự động nhận diện</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bankFormats.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{item.bank}</p>
                  <p className="text-sm text-muted-foreground">Format: {item.format}</p>
                  <code className="text-xs bg-background px-2 py-1 rounded mt-1 inline-block">{item.example}</code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ngân hàng được hỗ trợ</CardTitle>
          <CardDescription>Các ngân hàng hiện đang được hỗ trợ bởi hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Vietcombank</p>
                <p className="text-xs text-muted-foreground">no-reply@vietcombank.com.vn</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">TPBank</p>
                <p className="text-xs text-muted-foreground">ebanking@tpb.com.vn</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">VCB</p>
                <p className="text-xs text-muted-foreground">vcb@vcb.com.vn</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg opacity-50">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Ngân hàng khác</p>
                <p className="text-xs text-muted-foreground">Cần cấu hình parser</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Quan trọng:</strong> Chỉ sử dụng App Password cho Gmail, không dùng mật khẩu chính. Luôn bảo vệ
          CRON_SECRET để tránh truy cập trái phép vào endpoint.
        </AlertDescription>
      </Alert>
    </div>
  )
}
