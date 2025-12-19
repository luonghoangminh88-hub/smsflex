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
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("[v0] Notification change detected:", payload)
          loadNotifications()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Notification subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      console.log("[v0] Loading notifications...")
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("[v0] Auth error:", authError)
        setIsLoading(false)
        return
      }

      if (!user) {
        console.log("[v0] No user found")
        setIsLoading(false)
        return
      }

      console.log("[v0] User ID:", user.id)

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10) // Limit to 10 most recent notifications

      if (error) {
        console.error("[v0] Error loading notifications:", error)
        setIsLoading(false)
        return
      }

      console.log("[v0] Loaded notifications:", data?.length || 0)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    } catch (error) {
      console.error("[v0] Exception loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) {
        console.error("[v0] Error marking as read:", error)
        return
      }

      loadNotifications()
    } catch (error) {
      console.error("[v0] Exception marking as read:", error)
    }
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
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-semibold border-b">Thông báo</div>
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Không có thông báo mới</div>
        ) : (
          <>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">{notif.title}</span>
                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notif.created_at).toLocaleString("vi-VN")}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications" className="text-center w-full text-sm text-primary">
                Xem tất cả
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
