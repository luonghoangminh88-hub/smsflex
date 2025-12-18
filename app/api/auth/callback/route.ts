import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  console.log("[v0] OAuth callback: processing code")

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] OAuth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    // Get user data after successful authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      console.log("[v0] OAuth callback: user authenticated:", user.email)

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", user.email)
        .single()

      if (existingProfile) {
        console.log("[v0] OAuth callback: updating existing profile")
        // Update existing profile with Google ID and avatar
        await supabase
          .from("profiles")
          .update({
            google_id: user.user_metadata?.sub || user.id,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.full_name,
            updated_at: new Date().toISOString(),
          })
          .eq("email", user.email)
      } else {
        console.log("[v0] OAuth callback: creating new profile")
        // Create new profile for new Google user
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          google_id: user.user_metadata?.sub || user.id,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          role: "user",
          balance: 0,
        })

        if (insertError) {
          console.error("[v0] OAuth callback: failed to create profile", insertError)
        }
      }
    }

    console.log("[v0] OAuth callback: redirecting to dashboard")
    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  console.log("[v0] OAuth callback: no code, redirecting to login")
  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
