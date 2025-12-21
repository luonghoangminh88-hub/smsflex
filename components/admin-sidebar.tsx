"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  Phone,
  Globe,
  Settings,
  LogOut,
  Wallet,
  CreditCard,
  Shield,
  Bell,
  User,
  Mail,
  Landmark,
  Menu,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useAdminCounts } from "@/hooks/use-admin-counts"
import { useEffect, useState } from "react"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { counts, loading } = useAdminCounts()
  const [dismissedBadges, setDismissedBadges] = useState<Set<string>>(new Set())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Load dismissed badges from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("admin-dismissed-badges")
    if (stored) {
      try {
        setDismissedBadges(new Set(JSON.parse(stored)))
      } catch (e) {
        // Silent fail for localStorage issues
      }
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen])

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Tổng quan", count: null, key: "dashboard" },
    { href: "/admin/users", icon: Users, label: "Người dùng", count: counts.users, key: "users" },
    { href: "/admin/rentals", icon: Phone, label: "Lượt thuê", count: counts.rentals, key: "rentals" },
    { href: "/admin/services", icon: Globe, label: "Dịch vụ & Quốc gia", count: null, key: "services" },
    { href: "/admin/transactions", icon: Wallet, label: "Giao dịch", count: counts.transactions, key: "transactions" },
    { href: "/admin/deposits", icon: CreditCard, label: "Nạp tiền", count: counts.deposits, key: "deposits" },
    {
      href: "/admin/payment-methods",
      icon: CreditCard,
      label: "Phương thức thanh toán",
      count: counts.paymentMethods,
      key: "payment-methods",
    },
    {
      href: "/admin/bank-transactions",
      icon: Landmark,
      label: "Giao dịch ngân hàng",
      count: counts.bankTransactions,
      key: "bank-transactions",
    },
    { href: "/admin/notifications", icon: Bell, label: "Thông báo", count: counts.notifications, key: "notifications" },
    { href: "/admin/security-monitor", icon: Shield, label: "Bảo mật", count: counts.security, key: "security" },
    { href: "/admin/profile", icon: User, label: "Hồ sơ", count: null, key: "profile" },
    { href: "/admin/email-config", icon: Mail, label: "Cấu hình Email", count: null, key: "email-config" },
    { href: "/admin/settings", icon: Settings, label: "Cài đặt", count: null, key: "settings" },
  ]

  const handleMenuClick = (key: string) => {
    const newDismissed = new Set(dismissedBadges)
    newDismissed.add(key)
    setDismissedBadges(newDismissed)
    localStorage.setItem("admin-dismissed-badges", JSON.stringify(Array.from(newDismissed)))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed md:fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col transition-transform duration-300",
          // On mobile: slide in/out based on menu state
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // On desktop: always visible
          "md:translate-x-0",
        )}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img src="/logo-otpviet.jpg" alt="OTPVIET" className="h-10 w-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                OTPVIET
              </h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const showBadge = !loading && item.count !== null && item.count > 0 && !dismissedBadges.has(item.key)

            return (
              <Link key={item.href} href={item.href} onClick={() => handleMenuClick(item.key)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start relative", isActive && "bg-primary/10 text-primary")}
                >
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                    >
                      {item.count! > 9 ? "9+" : item.count}
                    </Badge>
                  )}
                  <Icon className={cn("h-4 w-4", showBadge ? "ml-6 mr-2" : "mr-2")} />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-[60] md:hidden min-h-[44px] min-w-[44px]"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Mở menu</span>
      </Button>
    </>
  )
}
