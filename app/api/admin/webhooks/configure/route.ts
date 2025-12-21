import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { saveWebhookConfig, getWebhookUrl } from "@/lib/webhook-config"

/**
 * Admin endpoint to configure webhooks for SMS providers
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { provider, isEnabled } = body

    if (!provider || !["sms-activate", "5sim"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider. Must be 'sms-activate' or '5sim'" }, { status: 400 })
    }

    const config = await saveWebhookConfig(provider, {
      isEnabled: isEnabled ?? true,
    })

    const webhookUrl = getWebhookUrl(provider)

    return NextResponse.json({
      success: true,
      config,
      instructions: {
        provider,
        webhookUrl,
        steps: getSetupInstructions(provider, webhookUrl),
      },
    })
  } catch (error) {
    console.error("[Webhook Config] Error:", error)
    return NextResponse.json({ error: "Failed to configure webhook" }, { status: 500 })
  }
}

/**
 * Get webhook configuration
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: configs } = await supabase.from("sms_webhook_config").select("*").order("provider")

    return NextResponse.json({
      configs: configs || [],
      webhookUrls: {
        "sms-activate": getWebhookUrl("sms-activate"),
        "5sim": getWebhookUrl("5sim"),
      },
    })
  } catch (error) {
    console.error("[Webhook Config] Error:", error)
    return NextResponse.json({ error: "Failed to get webhook configuration" }, { status: 500 })
  }
}

function getSetupInstructions(provider: string, webhookUrl: string): string[] {
  if (provider === "sms-activate") {
    return [
      "1. Login to your SMS-Activate account at https://sms-activate.io",
      "2. Go to Profile Settings",
      "3. Find the 'Webhooks' section",
      `4. Add webhook URL: ${webhookUrl}`,
      "5. Enable the webhook checkbox",
      "6. Save settings",
      "7. Test the webhook by purchasing a test number",
      "",
      "Note: Webhooks will come from IPs: 188.42.218.183, 142.91.156.119",
    ]
  }

  return [
    "1. Login to your 5sim account",
    "2. Navigate to API settings",
    `3. Configure webhook URL: ${webhookUrl}`,
    "4. Enable webhook notifications",
    "5. Save and test",
  ]
}
