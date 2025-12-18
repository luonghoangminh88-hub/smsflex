import type { Transaction } from "./types"

export function exportToCSV(transactions: Transaction[], filename = "transactions.csv"): void {
  const headers = ["Ngày giờ", "Loại", "Số tiền", "Trạng thái", "Số dư trước", "Số dư sau", "Mô tả"]

  const csvContent = [
    headers.join(","),
    ...transactions.map((t) => {
      const date = new Date(t.created_at).toLocaleString("vi-VN")
      const type = getTypeText(t.type)
      const amount = t.amount.toString()
      const status = getStatusText(t.status)
      const balanceBefore = t.balance_before.toString()
      const balanceAfter = t.balance_after.toString()
      const description = `"${t.description?.replace(/"/g, '""') || ""}"`

      return [date, type, amount, status, balanceBefore, balanceAfter, description].join(",")
    }),
  ].join("\n")

  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel(transactions: Transaction[], filename = "transactions.xlsx"): void {
  const headers = ["Ngày giờ", "Loại", "Số tiền", "Trạng thái", "Số dư trước", "Số dư sau", "Mô tả"]

  const data = transactions.map((t) => [
    new Date(t.created_at).toLocaleString("vi-VN"),
    getTypeText(t.type),
    t.amount,
    getStatusText(t.status),
    t.balance_before,
    t.balance_after,
    t.description || "",
  ])

  const worksheet = [headers, ...data]

  const csvContent = worksheet.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(transactions: Transaction[], filename = "transactions.json"): void {
  const jsonContent = JSON.stringify(transactions, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function getTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    deposit: "Nạp tiền",
    withdrawal: "Rút tiền",
    rental_purchase: "Thuê số",
    refund: "Hoàn tiền",
  }
  return typeMap[type] || type
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Đang xử lý",
    completed: "Hoàn thành",
    failed: "Thất bại",
  }
  return statusMap[status] || status
}
