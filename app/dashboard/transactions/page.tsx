import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import type { Transaction } from "@/lib/types"

export default async function TransactionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Calculate statistics
  const totalDeposits = transactions?.filter((t) => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0) || 0
  const totalSpent =
    transactions?.filter((t) => t.type === "rental_purchase").reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
  const totalRefunds = transactions?.filter((t) => t.type === "refund").reduce((sum, t) => sum + t.amount, 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nạp</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalDeposits.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalSpent.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn tiền</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalRefunds.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
          <CardDescription>Tất cả các giao dịch của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <TransactionTypeBadge type={transaction.type} />
                      <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {getStatusText(transaction.status)}
                      </Badge>
                    </div>
                    <p className="text-sm">{transaction.description || "Không có mô tả"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold text-lg ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Số dư: {transaction.balance_after.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Bạn chưa có giao dịch nào</p>
              <Button asChild>
                <Link href="/dashboard/deposit">Nạp tiền ngay</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { label: string; className: string }> = {
    deposit: { label: "Nạp tiền", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    withdrawal: {
      label: "Rút tiền",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
    rental_purchase: {
      label: "Thuê số",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    refund: {
      label: "Hoàn tiền",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
  }

  const config = typeConfig[type] || { label: type, className: "bg-gray-100 text-gray-800" }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Đang xử lý",
    completed: "Hoàn thành",
    failed: "Thất bại",
  }
  return statusMap[status] || status
}
