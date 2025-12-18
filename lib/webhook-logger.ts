import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface WebhookLog {
  provider: "vnpay" | "momo" | "other"
  event_type: string
  payload: Record<string, any>
  signature_valid: boolean
  processing_status: "pending" | "success" | "failed"
  error_message?: string
  deposit_id?: string
}

export async function logWebhook(log: WebhookLog): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase.from("webhook_logs").insert({
      provider: log.provider,
      event_type: log.event_type,
      payload: log.payload,
      signature_valid: log.signature_valid,
      processing_status: log.processing_status,
      error_message: log.error_message,
      deposit_id: log.deposit_id,
      processed_at: log.processing_status !== "pending" ? new Date().toISOString() : null,
    })

    console.log("[v0] Webhook logged:", log.provider, log.event_type, log.processing_status)
  } catch (error) {
    console.error("[v0] Failed to log webhook:", error)
  }
}

export async function updateWebhookLog(
  logId: string,
  status: "success" | "failed",
  errorMessage?: string,
): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    await supabase
      .from("webhook_logs")
      .update({
        processing_status: status,
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq("id", logId)
  } catch (error) {
    console.error("[v0] Failed to update webhook log:", error)
  }
}
