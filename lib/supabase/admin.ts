import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

/**
 * Create Supabase admin client with service role key
 * This bypasses RLS and should ONLY be used in server-side code
 * for admin operations after verifying user permissions
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[v0] Missing Supabase environment variables:")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing")
    console.error("[v0] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓ Set" : "✗ Missing")
    throw new Error("Missing Supabase environment variables for admin client")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        apikey: supabaseServiceKey,
      },
    },
  })
}
