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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, Wallet, History, Receipt, Shield, Menu, X } from "lucide-react"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <span className="text-white">OTP</span>
            </div>
            <span className="hidden md:inline">{t("dashboard.subtitle")}</span>
          </h1>

          <nav className="hidden lg:flex items-center gap-1 text-sm ml-4">
            <a
              href="/dashboard"
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors font-medium min-h-[44px] flex items-center"
            >
              {t("nav.home")}
            </a>
            <a
              href="/dashboard/history"
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors min-h-[44px] flex items-center"
            >
              {t("nav.history")}
            </a>
            <a
              href="/dashboard/transactions"
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors min-h-[44px] flex items-center"
            >
              {t("nav.transactions")}
            </a>
            {profile.role === "admin" && (
              <a
                href="/admin"
                className="px-3 py-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-medium flex items-center gap-1.5 min-h-[44px]"
              >
                <Shield className="h-4 w-4" />
                <span>Quản trị</span>
              </a>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 min-h-[44px]">
            <Wallet className="h-4 w-4" />
            <span className="font-semibold text-sm sm:text-base">{formatVND(profile.balance)}</span>
          </div>

          <NotificationBell />

          <LanguageSwitcher />

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden hover:bg-white/10 min-h-[44px] min-w-[44px]">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-10 w-10">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex flex-col p-4 space-y-1">
                <a
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">{t("nav.home")}</span>
                </a>
                <a
                  href="/dashboard/history"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <History className="h-5 w-5" />
                  <span className="font-medium">{t("nav.history")}</span>
                </a>
                <a
                  href="/dashboard/transactions"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Receipt className="h-5 w-5" />
                  <span className="font-medium">{t("nav.transactions")}</span>
                </a>
                <a
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{t("nav.profile")}</span>
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors min-h-[48px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">{t("nav.settings")}</span>
                </a>

                {profile.role === "admin" && (
                  <>
                    <div className="border-t my-2" />
                    <a
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors min-h-[48px]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium text-yellow-900 dark:text-yellow-100">Quản trị</span>
                    </a>
                  </>
                )}

                <div className="border-t my-2" />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors min-h-[48px]"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">{t("nav.logout")}</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full hover:bg-white/10 hidden lg:flex min-h-[44px] min-w-[44px]"
              >
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
