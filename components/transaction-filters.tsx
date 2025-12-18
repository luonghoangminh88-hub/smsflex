"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export interface TransactionFilters {
  type?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  search?: string
}

interface TransactionFiltersProps {
  onFilterChange: (filters: TransactionFilters) => void
  onReset: () => void
}

export function TransactionFiltersComponent({ onFilterChange, onReset }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters({})
    setDateFrom(undefined)
    setDateTo(undefined)
    onReset()
  }

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date)
    handleFilterChange("dateFrom", date)
  }

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date)
    handleFilterChange("dateTo", date)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bộ lọc nâng cao</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-1" />
          Xóa bộ lọc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type">Loại giao dịch</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(v) => handleFilterChange("type", v === "all" ? undefined : v)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="deposit">Nạp tiền</SelectItem>
              <SelectItem value="withdrawal">Rút tiền</SelectItem>
              <SelectItem value="rental_purchase">Thuê số</SelectItem>
              <SelectItem value="refund">Hoàn tiền</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => handleFilterChange("status", v === "all" ? undefined : v)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Đang xử lý</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="failed">Thất bại</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Tìm kiếm</Label>
          <Input
            id="search"
            placeholder="Tìm trong mô tả..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <Label>Từ ngày</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateFrom} onSelect={handleDateFromChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>Đến ngày</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateTo} onSelect={handleDateToChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <Label htmlFor="minAmount">Số tiền (từ - đến)</Label>
          <div className="flex gap-2">
            <Input
              id="minAmount"
              type="number"
              placeholder="Min"
              value={filters.minAmount || ""}
              onChange={(e) =>
                handleFilterChange("minAmount", e.target.value ? Number.parseFloat(e.target.value) : undefined)
              }
            />
            <Input
              id="maxAmount"
              type="number"
              placeholder="Max"
              value={filters.maxAmount || ""}
              onChange={(e) =>
                handleFilterChange("maxAmount", e.target.value ? Number.parseFloat(e.target.value) : undefined)
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
