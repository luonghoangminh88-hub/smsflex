import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const depositId = searchParams.get("id")

    if (!depositId) {
      return NextResponse.json({ error: "Deposit ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get deposit status
    const { data: deposit, error } = await supabase
      .from("deposits")
      .select("id, status, amount, created_at")
      .eq("id", depositId)
      .eq("user_id", user.id)
      .single()

    if (error || !deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 })
    }

    return NextResponse.json({ deposit })
  } catch (error) {
    console.error("[v0] Error checking deposit status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
