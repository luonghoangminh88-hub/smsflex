import { createClient } from "@/lib/supabase/server"

/**
 * Check if the current authenticated user is an admin
 * This should be called in server-side code (API routes, server components)
 */
export async function isAdmin(): Promise<boolean> {
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
 * Get the current user's profile including role
 * Returns null if user is not authenticated
 */
export async function getCurrentUserProfile() {
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
