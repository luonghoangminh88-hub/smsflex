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

  console.log("[v0] Checking bank_transactions table...")

  const { data: rawTransactions, error: rawError } = await supabase
    .from("bank_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  console.log("[v0] Raw transactions query result:", {
    count: rawTransactions?.length,
    error: rawError,
    sample: rawTransactions?.[0],
  })

  const { data: transactions, error } = await supabase
    .from("bank_transactions")
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email
      ),
      deposits:deposit_id (
        id,
        status
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[v0] Error fetching bank transactions:", error)
    console.error("[v0] Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    // Check if it's a "table not found" error
    if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Giao dịch ngân hàng</h1>
            <p className="text-muted-foreground">Quản lý giao dịch tự động từ email ngân hàng</p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bảng <code>bank_transactions</code> chưa được tạo. Vui lòng chạy migration script{" "}
              <code>206-create-bank-transactions.sql</code> từ thư mục scripts.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    if (error.message?.includes("column") || error.message?.includes("foreign key")) {
      console.warn("[v0] JOIN failed, falling back to raw transactions")
      console.log("[v0] Using raw transactions:", rawTransactions?.length)
    }
  }

  const finalTransactions = transactions || rawTransactions || []

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
