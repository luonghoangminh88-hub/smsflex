import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: settings } = await supabase.from("system_settings").select("*").eq("category", "email")

    const config: any = {}
    settings?.forEach((setting) => {
      config[setting.key] = setting.value
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const config = await request.json()

    const settingsToUpdate = [
      { key: "smtp_host", value: config.smtp_host, description: "SMTP server host" },
      { key: "smtp_port", value: config.smtp_port, description: "SMTP server port" },
      { key: "smtp_user", value: config.smtp_user, description: "SMTP username" },
      { key: "smtp_password", value: config.smtp_password, description: "SMTP password" },
      { key: "smtp_from_email", value: config.smtp_from_email, description: "From email address" },
      { key: "smtp_from_name", value: config.smtp_from_name, description: "From name" },
      { key: "smtp_secure", value: config.smtp_secure, description: "Use SSL/TLS" },
      { key: "smtp_enabled", value: config.smtp_enabled, description: "Enable email sending" },
    ]

    for (const setting of settingsToUpdate) {
      await supabase.from("system_settings").upsert(
        {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: "email",
        },
        {
          onConflict: "key",
        },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving email config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
