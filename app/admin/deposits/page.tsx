import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DepositVerificationActions } from "@/components/admin/deposit-verification-actions"
import { formatVND } from "@/lib/currency"
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDepositsPage() {
  const supabase = await createAdminClient()

  // Get all deposits with user and payment method info
  const { data: deposits } = await supabase
    .from("deposits")
    .select(
      `
      *,
      user:profiles!deposits_user_id_fkey(id, email, full_name),
      payment_method:payment_methods(name, type, bank_code),
      verified_by_user:profiles!deposits_verified_by_fkey(email, full_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100)

  // Separate pending and processed deposits
  const pendingDeposits = deposits?.filter((d) => d.status === "pending") || []
  const processedDeposits = deposits?.filter((d) => d.status !== "pending") || []

  // Calculate stats
  const stats = {
    pending: pendingDeposits.length,
    completed: deposits?.filter((d) => d.status === "completed").length || 0,
    failed: deposits?.filter((d) => d.status === "failed").length || 0,
    totalAmount: deposits?.reduce((sum, d) => sum + (d.status === "completed" ? Number(d.amount) : 0), 0) || 0,
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quản lý nạp tiền</h1>
        <p className="text-muted-foreground mt-2">Xác thực và theo dõi các yêu cầu nạp tiền</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đã nạp</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Deposits */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Yêu cầu chờ xử lý ({pendingDeposits.length})
          </CardTitle>
          <CardDescription>Các yêu cầu nạp tiền cần được xác thực</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDeposits.length > 0 ? (
            <div className="space-y-4">
              {pendingDeposits.map((deposit: any) => (
                <DepositItem key={deposit.id} deposit={deposit} isPending={true} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Không có yêu cầu nào đang chờ xử lý</p>
          )}
        </CardContent>
      </Card>

      {/* Processed Deposits */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử xử lý</CardTitle>
          <CardDescription>100 giao dịch gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {processedDeposits.length > 0 ? (
              processedDeposits.map((deposit: any) => (
                <DepositItem key={deposit.id} deposit={deposit} isPending={false} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có giao dịch nào được xử lý</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DepositItem({ deposit, isPending }: { deposit: any; isPending: boolean }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> =
    {
      pending: { label: "Chờ xử lý", variant: "secondary" },
      completed: { label: "Đã duyệt", variant: "default" },
      failed: { label: "Đã từ chối", variant: "destructive" },
      cancelled: { label: "Đã hủy", variant: "outline" },
    }

  const status = statusConfig[deposit.status] || { label: deposit.status, variant: "outline" }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-sm font-mono text-muted-foreground">{deposit.payment_code}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{deposit.user?.full_name || deposit.user?.email}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{deposit.payment_method?.name}</span>
          </div>

          <p className="text-xs text-muted-foreground">{new Date(deposit.created_at).toLocaleString("vi-VN")}</p>

          {deposit.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Ghi chú:</strong> {deposit.notes}
            </p>
          )}

          {deposit.verified_by_user && (
            <p className="text-xs text-muted-foreground">
              Xử lý bởi: {deposit.verified_by_user.full_name || deposit.verified_by_user.email} -{" "}
              {deposit.verified_at ? new Date(deposit.verified_at).toLocaleString("vi-VN") : ""}
            </p>
          )}
        </div>

        <div className="text-right space-y-2">
          <div>
            <p className="text-2xl font-bold text-green-600">{formatVND(deposit.amount)}</p>
            {deposit.fee > 0 && <p className="text-xs text-muted-foreground">Phí: {formatVND(deposit.fee)}</p>}
          </div>

          {isPending && <DepositVerificationActions depositId={deposit.id} />}
        </div>
      </div>

      {/* Payment details for pending */}
      {isPending && deposit.payment_data && (
        <div className="pt-3 border-t space-y-2">
          {deposit.payment_data.qr_url && (
            <div className="flex items-center gap-3">
              <img
                src={deposit.payment_data.qr_url || "/placeholder.svg"}
                alt="QR Code"
                className="w-20 h-20 object-contain border rounded"
              />
              <div className="text-sm space-y-1">
                <p>
                  <strong>Ngân hàng:</strong> {deposit.payment_data.bank_code}
                </p>
                <p>
                  <strong>STK:</strong> {deposit.payment_data.account_number}
                </p>
                <p>
                  <strong>Chủ TK:</strong> {deposit.payment_data.account_name}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
