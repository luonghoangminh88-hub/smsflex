"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  type: string
  user_id: string
}

export function AdminNotificationBell() {
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadNotifications()

    // Subscribe to new notifications for all users (admin sees all)
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("[v0] Admin notification change:", payload)
          loadNotifications()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Admin notification subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      console.log("[v0] Loading admin notifications...")
      // Admin sees all notifications from all users
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(15)

      if (error) {
        console.error("[v0] Error loading admin notifications:", error)
        setIsLoading(false)
        return
      }

      console.log("[v0] Loaded admin notifications:", data?.length || 0)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    } catch (error) {
      console.error("[v0] Exception loading admin notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-3 font-semibold border-b flex items-center justify-between">
          <span>Thông báo hệ thống</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} chưa đọc
            </Badge>
          )}
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Không có thông báo mới</div>
        ) : (
          <>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((notif: any) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-accent"
                  asChild
                >
                  <Link href="/admin/notifications">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">{notif.title}</span>
                      {!notif.is_read && <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-1">
                      <span>{notif.profiles?.full_name || notif.profiles?.email || "Unknown user"}</span>
                      <span>{new Date(notif.created_at).toLocaleString("vi-VN")}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuItem asChild className="border-t">
              <Link href="/admin/notifications" className="text-center w-full text-sm text-primary font-medium p-3">
                Xem tất cả thông báo
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
