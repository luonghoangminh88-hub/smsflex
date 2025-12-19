import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Auth error in notifications API:", authError)
      return NextResponse.json({ error: "Unauthorized", details: authError.message }, { status: 401 })
    }

    if (!user) {
      console.log("[v0] No user in notifications API")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching notifications for user:", user.id)

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Database error fetching notifications:", error)
      throw error
    }

    console.log("[v0] Found notifications:", notifications?.length || 0)
    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error in PATCH:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId, isRead } = await request.json()

    console.log("[v0] Updating notification:", notificationId, "isRead:", isRead)

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: isRead })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error updating notification:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
