"use client"

import { AdminNotificationBell } from "./admin-notification-bell"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        <div className="flex items-center gap-4">
          <AdminNotificationBell />
        </div>
      </div>
    </header>
  )
}
