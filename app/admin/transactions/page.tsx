import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export const dynamic = "force-dynamic"

export default async function AdminTransactionsPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      *,
      profile:profiles(email, full_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quản lý giao dịch</h1>
        <p className="text-muted-foreground mt-2">Theo dõi tất cả giao dịch trong hệ thống</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <CardDescription>50 giao dịch gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Tìm kiếm theo email hoặc mô tả..." />
          </div>
          <div className="space-y-3">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <TransactionTypeBadge type={transaction.type} />
                      <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {transaction.status === "completed" ? "Hoàn thành" : transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.profile?.full_name || transaction.profile?.email}
                    </p>
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
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có giao dịch nào</p>
            )}
          </div>
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
