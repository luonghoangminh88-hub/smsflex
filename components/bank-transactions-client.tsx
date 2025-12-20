"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface BankTransaction {
  id: string
  transaction_id: string
  amount: number
  content: string
  sender_info?: string
  bank_name: string
  status: string
  error_message?: string
  email_subject?: string
  email_from?: string
  created_at: string
  processed_at?: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  deposits?: {
    id: string
    status: string
  }
}

interface Props {
  transactions: BankTransaction[]
}

export function BankTransactionsClient({ transactions: initialTransactions }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.bank_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || tx.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleRunCron = async () => {
    setIsProcessing(true)
    try {
      console.log("[v0] Starting email scan request...")

      const response = await fetch("/api/admin/trigger-email-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers))

      if (!response.ok) {
        console.error("[v0] Response not OK:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("[v0] Error response body:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (data.success) {
        alert(
          `Đã xử lý ${data.result.totalProcessed} email\n- Thành công: ${data.result.successCount}\n- Lỗi: ${data.result.errorCount}\n- Cần duyệt: ${data.result.manualReviewCount}`,
        )
        window.location.reload()
      } else {
        alert("Lỗi: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Error running cron:", error)
      alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Thành công</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Đang xử lý</Badge>
      case "error":
        return <Badge className="bg-red-500">Lỗi</Badge>
      case "manual_review":
        return <Badge className="bg-orange-500">Cần duyệt</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Danh sách giao dịch</CardTitle>
          <Button onClick={handleRunCron} disabled={isProcessing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
            {isProcessing ? "Đang xử lý..." : "Chạy quét email"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm mã GD, nội dung, ngân hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Đang xử lý</SelectItem>
              <SelectItem value="success">Thành công</SelectItem>
              <SelectItem value="error">Lỗi</SelectItem>
              <SelectItem value="manual_review">Cần duyệt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã GD</TableHead>
                <TableHead>Ngân hàng</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Không có giao dịch nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{tx.transaction_id}</TableCell>
                    <TableCell>{tx.bank_name}</TableCell>
                    <TableCell className="font-semibold">{tx.amount.toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell className="max-w-xs truncate" title={tx.content}>
                      {tx.content}
                    </TableCell>
                    <TableCell>
                      {tx.profiles ? (
                        <div className="text-sm">
                          <div className="font-medium">{tx.profiles.full_name}</div>
                          <div className="text-muted-foreground">{tx.profiles.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Chưa xác định</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tx.status)}
                      {tx.error_message && <div className="text-xs text-red-500 mt-1">{tx.error_message}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.created_at), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
