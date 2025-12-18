"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react"
import { exportToCSV, exportToExcel, exportToJSON } from "@/lib/export-transactions"
import type { Transaction } from "@/lib/types"
import { toast } from "sonner"

interface TransactionExportProps {
  transactions: Transaction[]
}

export function TransactionExport({ transactions }: TransactionExportProps) {
  const handleExport = (format: "csv" | "excel" | "json") => {
    if (transactions.length === 0) {
      toast.error("Không có dữ liệu để xuất")
      return
    }

    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `transactions_${timestamp}`

    try {
      switch (format) {
        case "csv":
          exportToCSV(transactions, `${filename}.csv`)
          toast.success("Đã xuất file CSV")
          break
        case "excel":
          exportToExcel(transactions, `${filename}.xlsx`)
          toast.success("Đã xuất file Excel")
          break
        case "json":
          exportToJSON(transactions, `${filename}.json`)
          toast.success("Đã xuất file JSON")
          break
      }
    } catch (error) {
      toast.error("Không thể xuất file")
      console.error("[v0] Export error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Xuất dữ liệu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="h-4 w-4 mr-2" />
          Xuất CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Xuất Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Xuất JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
