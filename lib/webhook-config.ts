/**
 * Webhook Configuration Management
 * Handles setup and management of SMS provider webhook endpoints
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface WebhookConfig {
  id: string
  provider: "sms-activate" | "5sim"
  webhook_url: string
  webhook_secret?: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Get the public webhook URL for a provider
 */
export function getWebhookUrl(provider: "sms-activate" | "5sim"): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.vercel.app"

  if (provider === "sms-activate") {
    return `${baseUrl}/api/webhooks/sms-activate`
  }

  if (provider === "5sim") {
    return `${baseUrl}/api/webhooks/5sim`
  }

  throw new Error(`Unknown provider: ${provider}`)
}

/**
 * Save webhook configuration to database
 */
export async function saveWebhookConfig(
  provider: "sms-activate" | "5sim",
  options?: {
    webhookSecret?: string
    isEnabled?: boolean
  },
): Promise<WebhookConfig> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  const webhookUrl = getWebhookUrl(provider)

  const { data, error } = await supabase
    .from("sms_webhook_config")
    .upsert(
      {
        provider,
        webhook_url: webhookUrl,
        webhook_secret: options?.webhookSecret,
        is_enabled: options?.isEnabled ?? true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "provider",
      },
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save webhook config: ${error.message}`)
  }

  return data
}

/**
 * Get webhook configuration for a provider
 */
export async function getWebhookConfig(provider: "sms-activate" | "5sim"): Promise<WebhookConfig | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  const { data, error } = await supabase.from("sms_webhook_config").select("*").eq("provider", provider).single()

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null
    }
    throw new Error(`Failed to get webhook config: ${error.message}`)
  }

  return data
}

/**
 * Test webhook endpoint connectivity
 */
export async function testWebhookEndpoint(provider: "sms-activate" | "5sim"): Promise<{
  success: boolean
  url: string
  statusCode?: number
  error?: string
}> {
  const webhookUrl = getWebhookUrl(provider)

  try {
    const response = await fetch(webhookUrl, {
      method: "GET", // Should return 405 Method Not Allowed
    })

    return {
      success: response.status === 405, // Expected for POST-only endpoint
      url: webhookUrl,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      success: false,
      url: webhookUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(
  provider: "sms-activate" | "5sim",
  hours = 24,
): Promise<{
  total: number
  successful: number
  failed: number
  avgProcessingTime?: number
}> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("webhook_logs")
    .select("processing_status")
    .eq("provider", provider)
    .gte("created_at", sinceTime)

  if (error) {
    throw new Error(`Failed to get webhook stats: ${error.message}`)
  }

  const total = data.length
  const successful = data.filter((log) => log.processing_status === "success").length
  const failed = data.filter((log) => log.processing_status === "failed").length

  return {
    total,
    successful,
    failed,
  }
}
