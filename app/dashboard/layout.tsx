import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import type { Profile } from "@/lib/types"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  console.log("[v0] Dashboard layout: verifying authentication")

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error("[v0] Dashboard layout: authentication failed", error?.message)
    redirect("/auth/login?reason=session_error")
  }

  console.log("[v0] Dashboard layout: user authenticated:", user.email)

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError || !profile) {
    console.error("[v0] Dashboard layout: profile not found for user:", user.email, profileError?.message)

    const errorMsg = encodeURIComponent(`Profile không tồn tại. Lỗi: ${profileError?.message || "Unknown"}`)
    redirect(`/auth/login?error=${errorMsg}`)
  }

  console.log("[v0] Dashboard layout: profile loaded successfully")

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader profile={profile as Profile} />
      <main>{children}</main>
    </div>
  )
}
