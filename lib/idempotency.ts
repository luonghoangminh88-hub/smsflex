/**
 * Idempotency Layer
 * Prevents duplicate orders and ensures exactly-once semantics
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

export interface IdempotencyResult<T = any> {
  isNew: boolean
  data?: T
  status?: number
}

/**
 * Generate idempotency key from request data
 */
export function generateIdempotencyKey(userId: string, requestData: any): string {
  const content = `${userId}:${JSON.stringify(requestData)}`
  return crypto.createHash("sha256").update(content).digest("hex")
}

/**
 * Check if request has been processed before
 * Returns cached response if exists, otherwise marks as processing
 */
export async function checkIdempotency<T = any>(
  idempotencyKey: string,
  userId: string,
  requestBody: any,
): Promise<IdempotencyResult<T>> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  // Check if key exists and is not expired
  const { data: existing } = await supabase
    .from("idempotency_keys")
    .select("*")
    .eq("key", idempotencyKey)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (existing) {
    if (existing.status === "completed") {
      // Request already processed successfully
      console.log(`[Idempotency] Request ${idempotencyKey} already processed`)
      return {
        isNew: false,
        data: existing.response_body,
        status: existing.response_status,
      }
    }

    if (existing.status === "processing") {
      // Request is currently being processed (within timeout window)
      const createdAt = new Date(existing.created_at).getTime()
      const now = Date.now()
      const processingTime = now - createdAt

      // If processing for more than 30 seconds, consider it stale and allow retry
      if (processingTime > 30000) {
        console.log(`[Idempotency] Stale processing request ${idempotencyKey}, allowing retry`)
        await supabase.from("idempotency_keys").update({ status: "failed" }).eq("key", idempotencyKey)
        return { isNew: true }
      }

      // Request is still being processed, return conflict
      console.log(`[Idempotency] Request ${idempotencyKey} is being processed`)
      return {
        isNew: false,
        status: 409, // Conflict
      }
    }

    // Status is 'failed', allow retry
    console.log(`[Idempotency] Previous request ${idempotencyKey} failed, allowing retry`)
    await supabase.from("idempotency_keys").delete().eq("key", idempotencyKey)
  }

  // New request, create processing record
  const { error } = await supabase.from("idempotency_keys").insert({
    key: idempotencyKey,
    user_id: userId,
    request_body: requestBody,
    status: "processing",
  })

  if (error) {
    // Race condition: another request created the key
    if (error.code === "23505") {
      // Unique constraint violation
      console.log(`[Idempotency] Race condition detected for ${idempotencyKey}`)
      return {
        isNew: false,
        status: 409,
      }
    }
    throw error
  }

  return { isNew: true }
}

/**
 * Mark idempotent request as completed with response
 */
export async function completeIdempotency(
  idempotencyKey: string,
  responseBody: any,
  responseStatus: number,
  rentalId?: string,
): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  await supabase
    .from("idempotency_keys")
    .update({
      response_body: responseBody,
      response_status: responseStatus,
      rental_id: rentalId,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("key", idempotencyKey)
}

/**
 * Mark idempotent request as failed
 */
export async function failIdempotency(idempotencyKey: string, error: any): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  await supabase
    .from("idempotency_keys")
    .update({
      status: "failed",
      response_body: { error: error.message || "Unknown error" },
      response_status: error.status || 500,
      completed_at: new Date().toISOString(),
    })
    .eq("key", idempotencyKey)
}
