import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// This is a one-time setup endpoint to create first admin
// Should be disabled in production or protected with a secret key
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, secretKey } = body

    // Security check - set this in your environment variables
    const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || "change-this-secret-key-in-production"

    if (secretKey !== ADMIN_SETUP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Update user role to admin
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("email", email)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create admin", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      admin: {
        id: data.id,
        email: data.email,
        role: data.role,
      },
    })
  } catch (error) {
    console.error("[v0] Create admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
