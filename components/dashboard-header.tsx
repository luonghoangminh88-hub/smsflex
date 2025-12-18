"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, Wallet, History, Receipt, Shield } from "lucide-react"
import type { Profile } from "@/lib/types"
import { LanguageSwitcher } from "./language-switcher"
import { NotificationBell } from "./notification-bell"
import { useState, useEffect } from "react"
import { useTranslation, type Locale } from "@/lib/i18n"
import { formatVND } from "@/lib/currency"

interface DashboardHeaderProps {
  profile: Profile
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>("vi")
  const { t } = useTranslation(locale)

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale
    if (saved) setLocale(saved)

    const handleLocaleChange = (e: CustomEvent) => {
      setLocale(e.detail)
    }
    window.addEventListener("localeChange", handleLocaleChange as EventListener)
    return () => window.removeEventListener("localeChange", handleLocaleChange as EventListener)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || profile.email[0].toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#4a6fa5] text-white shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <div className="bg-white/10 rounded-lg px-3 py-1">
              <span className="text-white">OTP</span>
            </div>
            <span className="hidden sm:inline">{t("dashboard.subtitle")}</span>
          </h1>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="/dashboard" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors font-medium">
              {t("nav.home")}
            </a>
            <a href="/dashboard/history" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">
              {t("nav.history")}
            </a>
            <a href="/dashboard/transactions" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">
              {t("nav.transactions")}
            </a>
            {profile.role === "admin" && (
              <a
                href="/admin"
                className="px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-medium flex items-center gap-1.5"
              >
                <Shield className="h-4 w-4" />
                <span>Quản trị</span>
              </a>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
            <Wallet className="h-4 w-4" />
            <span className="font-semibold">{formatVND(profile.balance)}</span>
          </div>

          <NotificationBell />

          <LanguageSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-white/20 text-white">{initials}</AvatarFallback>
                </Avatar>
                {profile.role === "admin" && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-yellow-400 border-2 border-[#4a6fa5]" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile.full_name || "Người dùng"}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                  {profile.role === "admin" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                      <Shield className="h-3 w-3" />
                      Quản trị viên
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profile.role === "admin" && (
                <>
                  <DropdownMenuItem asChild>
                    <a href="/admin" className="font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Trang quản trị</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="sm:hidden">
                <Wallet className="mr-2 h-4 w-4" />
                <span>
                  {t("dashboard.balance")}: {formatVND(profile.balance)}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("nav.profile")}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/dashboard/transactions">
                  <Receipt className="mr-2 h-4 w-4" />
                  <span>{t("nav.transactions")}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/dashboard/history">
                  <History className="mr-2 h-4 w-4" />
                  <span>{t("nav.history")}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("nav.settings")}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("nav.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
