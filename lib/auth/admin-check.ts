import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"

/**
 * Check if the current authenticated user is an admin
 * This should be called in server-side code (API routes, server components)
 */
export async function isAdmin(): Promise<boolean> {
  noStore()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // Get user's profile to check role
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (error || !profile) {
      console.error("[Admin Check] Error fetching profile:", error)
      return false
    }

    return profile.role === "admin"
  } catch (error) {
    console.error("[Admin Check] Unexpected error:", error)
    return false
  }
}

/**
 * Require admin authentication for a page
 * Redirects to login if not authenticated, or to dashboard if not an admin
 * This should be called at the top of admin server components/pages
 */
export async function requireAdminAuth(): Promise<void> {
  noStore()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth/login")
    }

    // Get user's profile to check role
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (error || !profile) {
      console.error("[Admin Check] Error fetching profile:", error)
      redirect("/dashboard")
    }

    if (profile.role !== "admin") {
      redirect("/dashboard")
    }
  } catch (error) {
    console.error("[Admin Check] Unexpected error:", error)
    redirect("/dashboard")
  }
}

/**
 * Get the current user's profile including role
 * Returns null if user is not authenticated
 */
export async function getCurrentUserProfile() {
  noStore()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error || !profile) {
      return null
    }

    return profile
  } catch (error) {
    return null
  }
}
