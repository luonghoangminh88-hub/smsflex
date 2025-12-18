"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Eye, Filter, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: any
  profiles?: {
    full_name: string
    email: string
  }
}

export function AdminNotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const router = useRouter()
  const supabase = createClient()

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "deposit_approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "deposit_rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "rental_created":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "otp_received":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "refund_processed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "rental_expired":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "balance_low":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "deposit_approved":
        return "Nạp tiền duyệt"
      case "deposit_rejected":
        return "Nạp tiền từ chối"
      case "rental_created":
        return "Thuê số mới"
      case "otp_received":
        return "Nhận OTP"
      case "refund_processed":
        return "Hoàn tiền"
      case "rental_expired":
        return "Hết hạn"
      case "balance_low":
        return "Số dư thấp"
      default:
        return type
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thông báo này?")) return

    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      router.refresh()
    }
  }

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      router.refresh()
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      searchTerm === "" ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || n.type === filterType
    const matchesStatus = filterStatus === "all" || (filterStatus === "read" ? n.is_read : !n.is_read)

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thông báo, người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Loại thông báo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="deposit_approved">Nạp tiền duyệt</SelectItem>
            <SelectItem value="deposit_rejected">Nạp tiền từ chối</SelectItem>
            <SelectItem value="rental_created">Thuê số mới</SelectItem>
            <SelectItem value="otp_received">Nhận OTP</SelectItem>
            <SelectItem value="refund_processed">Hoàn tiền</SelectItem>
            <SelectItem value="rental_expired">Hết hạn</SelectItem>
            <SelectItem value="balance_low">Số dư thấp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="unread">Chưa đọc</SelectItem>
            <SelectItem value="read">Đã đọc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications Table */}
      <div className="border rounded-lg">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Không có thông báo nào</div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-muted/50 transition-colors ${!notif.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getNotificationTypeColor(notif.type)}>
                        {getNotificationTypeLabel(notif.type)}
                      </Badge>
                      {!notif.is_read && (
                        <Badge
                          variant="outline"
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                        >
                          Mới
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {notif.profiles && (
                        <span className="font-medium">
                          {notif.profiles.full_name} ({notif.profiles.email})
                        </span>
                      )}
                      <span>{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notif.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(notif.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
