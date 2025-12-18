"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  type: string
  metadata: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    loadNotifications()
  }

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)

    toast.success("Đã đánh dấu tất cả là đã đọc")
    loadNotifications()
  }

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id)
    toast.success("Đã xóa thông báo")
    loadNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Thông báo</CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả thông báo đã đọc"}
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Đánh dấu tất cả
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                    !notif.is_read ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{notif.title}</h3>
                      {!notif.is_read && (
                        <Badge variant="default" className="text-xs">
                          Mới
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getTypeText(notif.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notif.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notif.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    deposit_approved: "Nạp tiền",
    deposit_rejected: "Nạp tiền",
    rental_created: "Thuê số",
    rental_expired: "Hết hạn",
    refund_processed: "Hoàn tiền",
    otp_received: "OTP",
    balance_low: "Số dư thấp",
    system: "Hệ thống",
  }
  return typeMap[type] || "Khác"
}
