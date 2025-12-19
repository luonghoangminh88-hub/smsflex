import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log("[v0] Creating rate_limit_logs table...")

  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      -- Create rate_limit_logs table
      CREATE TABLE IF NOT EXISTS rate_limit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Add indexes for performance
      CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
        ON rate_limit_logs(identifier, action);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at 
        ON rate_limit_logs(created_at);

      -- Enable RLS
      ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

      -- Policy to allow service role full access
      DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limit_logs;
      CREATE POLICY "Service role can manage rate limits" 
        ON rate_limit_logs FOR ALL 
        USING (true);

      -- Auto cleanup function (optional, for housekeeping)
      CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
      RETURNS void AS $$
      BEGIN
        DELETE FROM rate_limit_logs 
        WHERE created_at < NOW() - INTERVAL '24 hours';
      END;
      $$ LANGUAGE plpgsql;
    `,
  })

  if (error) {
    console.error("[v0] Migration failed:", error)
    process.exit(1)
  }

  console.log("[v0] Migration completed successfully!")
  console.log("[v0] Rate limit logs table is ready.")
}

runMigration()
