export const dynamic = "force-dynamic"
export const revalidate = 0

import { requireAdminAuth } from "@/lib/auth/admin-check"
import { createClient } from "@/lib/supabase/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BankTransactionsClient } from "@/components/bank-transactions-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function BankTransactionsPage() {
  await requireAdminAuth()
  const supabase = await createClient()

  console.log("[v0] Fetching bank transactions...")

  let transactions = null
  let error = null
  let usedFallback = false

  try {
    // Try with JOIN using PostgREST foreign key syntax
    const result = await supabase
      .from("bank_transactions")
      .select(`
        *,
        profiles!user_id (
          id,
          full_name,
          email
        ),
        deposits!deposit_id (
          id,
          status
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (result.error) {
      console.warn("[v0] JOIN query failed:", result.error.message)
      throw result.error
    }

    transactions = result.data
    console.log("[v0] Successfully fetched transactions with JOIN:", transactions?.length)
  } catch (joinError: any) {
    console.warn("[v0] Falling back to simple query without JOIN")
    usedFallback = true

    // Fallback to simple query without JOIN
    const result = await supabase
      .from("bank_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    transactions = result.data
    error = result.error

    if (error) {
      console.error("[v0] Even simple query failed:", error)
    } else {
      console.log("[v0] Successfully fetched raw transactions:", transactions?.length)
    }
  }

  const finalTransactions = transactions || []

  console.log("[v0] Final transactions to display:", {
    count: finalTransactions.length,
    statuses: finalTransactions.map((t) => t.status),
  })

  // Get statistics
  const { data: stats } = await supabase.from("bank_transactions").select("status")

  const totalCount = stats?.length || 0
  const pendingCount = stats?.filter((s) => s.status === "pending").length || 0
  const successCount = stats?.filter((s) => s.status === "success").length || 0
  const errorCount = stats?.filter((s) => s.status === "error").length || 0
  const reviewCount = stats?.filter((s) => s.status === "manual_review").length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Giao dịch ngân hàng</h1>
        <p className="text-muted-foreground">Quản lý giao dịch tự động từ email ngân hàng</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lỗi khi tải giao dịch: {error.message}
            {error.hint && <div className="mt-1 text-xs">Gợi ý: {error.hint}</div>}
          </AlertDescription>
        </Alert>
      )}

      {usedFallback && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Đang hiển thị dữ liệu giao dịch cơ bản. Để xem thông tin người dùng, vui lòng chạy script{" "}
            <code>003_fix_foreign_key_constraints.sql</code> và khởi động lại ứng dụng.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng giao dịch</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang xử lý</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Thành công</CardDescription>
            <CardTitle className="text-3xl text-green-600">{successCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lỗi</CardDescription>
            <CardTitle className="text-3xl text-red-600">{errorCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cần duyệt</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{reviewCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <BankTransactionsClient transactions={finalTransactions} />
    </div>
  )
}
