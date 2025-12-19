"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AdminCounts {
  users: number
  rentals: number
  transactions: number
  paymentMethods: number
  notifications: number
  security: number
  deposits: number
  bankTransactions: number
}

export function useAdminCounts() {
  const [counts, setCounts] = useState<AdminCounts>({
    users: 0,
    rentals: 0,
    transactions: 0,
    paymentMethods: 0,
    notifications: 0,
    security: 0,
    deposits: 0,
    bankTransactions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const supabase = createClient()

        // Fetch all counts in parallel
        const [
          usersResult,
          rentalsResult,
          transactionsResult,
          paymentMethodsResult,
          notificationsResult,
          securityResult,
          depositsResult,
          bankTransactionsResult,
        ] = await Promise.all([
          // Total active users
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          // Pending or active rentals
          supabase
            .from("phone_rentals")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "active"]),
          // Pending transactions
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          // Active payment methods
          supabase
            .from("payment_methods")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          // Unread notifications (all system notifications)
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false),
          // Recent security events (last 24h rate limit logs)
          supabase
            .from("rate_limit_logs")
            .select("id", { count: "exact", head: true })
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          // Pending deposits
          supabase
            .from("deposits")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          // Unprocessed bank transactions
          supabase
            .from("bank_transactions")
            .select("id", { count: "exact", head: true })
            .eq("processed", false),
        ])

        setCounts({
          users: usersResult.count || 0,
          rentals: rentalsResult.count || 0,
          transactions: transactionsResult.count || 0,
          paymentMethods: paymentMethodsResult.count || 0,
          notifications: notificationsResult.count || 0,
          security: securityResult.count || 0,
          deposits: depositsResult.count || 0,
          bankTransactions: bankTransactionsResult.count || 0,
        })
      } catch (error) {
        console.error("[v0] Error fetching admin counts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000)

    return () => clearInterval(interval)
  }, [])

  return { counts, loading }
}
