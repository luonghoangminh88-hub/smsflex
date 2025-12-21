"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Filter } from "lucide-react"
import Link from "next/link"
import type { Transaction } from "@/lib/types"
import { TransactionFiltersComponent, type TransactionFilters } from "@/components/transaction-filters"
import { TransactionExport } from "@/components/transaction-export"
import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) // Added limit of 50 for pagination

    if (data) {
      setTransactions(data)
      setFilteredTransactions(data)
    }
    setLoading(false)
  }

  const handleFilterChange = (filters: TransactionFilters) => {
    let filtered = [...transactions]

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type)
    }

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((t) => new Date(t.created_at) >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo)
      endOfDay.setHours(23, 59, 59, 999)
      filtered = filtered.filter((t) => new Date(t.created_at) <= endOfDay)
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) >= filters.minAmount!)
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) <= filters.maxAmount!)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter((t) => t.description?.toLowerCase().includes(searchLower))
    }

    setFilteredTransactions(filtered)
  }

  const handleResetFilters = () => {
    setFilteredTransactions(transactions)
  }

  const totalDeposits =
    filteredTransactions?.filter((t) => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0) || 0
  const totalSpent =
    filteredTransactions?.filter((t) => t.type === "rental_purchase").reduce((sum, t) => sum + Math.abs(t.amount), 0) ||
    0
  const totalRefunds =
    filteredTransactions?.filter((t) => t.type === "refund").reduce((sum, t) => sum + t.amount, 0) || 0

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Button variant="ghost" asChild className="mb-6 min-h-[44px]">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nạp</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{totalDeposits.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{totalSpent.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn tiền</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalRefunds.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="min-h-[48px]">
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
        </Button>
        <TransactionExport transactions={filteredTransactions} />
      </div>

      {showFilters && (
        <div className="mb-6">
          <TransactionFiltersComponent onFilterChange={handleFilterChange} onReset={handleResetFilters} />
        </div>
      )}

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Lịch sử giao dịch</CardTitle>
          <CardDescription>
            Hiển thị {filteredTransactions.length} giao dịch
            {transactions.length >= 50 ? " (50 giao dịch gần nhất)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 last:border-0 gap-3"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TransactionTypeBadge type={transaction.type} />
                      <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {getStatusText(transaction.status)}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{transaction.description || "Không có mô tả"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                    <p
                      className={`font-semibold text-lg sm:text-xl ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
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
              <p className="text-muted-foreground mb-4">
                {transactions.length === 0 ? "Bạn chưa có giao dịch nào" : "Không tìm thấy giao dịch phù hợp"}
              </p>
              {transactions.length === 0 && (
                <Button asChild className="min-h-[48px]">
                  <Link href="/dashboard/deposit">Nạp tiền ngay</Link>
                </Button>
              )}
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
