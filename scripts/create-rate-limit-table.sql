-- Create rate_limit_logs table for tracking API rate limits
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT rate_limit_logs_identifier_action_idx UNIQUE (identifier, action, created_at)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier ON rate_limit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_action ON rate_limit_logs(action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_lookup ON rate_limit_logs(identifier, action, created_at);

-- Enable RLS
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for rate limiting from server)
CREATE POLICY "Service role can manage rate limits"
  ON rate_limit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users cannot access rate limit logs directly
CREATE POLICY "Users cannot access rate limits"
  ON rate_limit_logs
  FOR ALL
  TO authenticated
  USING (false);

-- Auto-cleanup old rate limit logs (older than 24 hours) using a function
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run cleanup (if pg_cron is enabled)
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_old_rate_limits();');

COMMENT ON TABLE rate_limit_logs IS 'Tracks API rate limit requests for preventing abuse';
COMMENT ON COLUMN rate_limit_logs.identifier IS 'Unique identifier (user_id, IP, etc.)';
COMMENT ON COLUMN rate_limit_logs.action IS 'Type of action being rate limited (deposit, rental, login, api)';
COMMENT ON COLUMN rate_limit_logs.ip_address IS 'IP address of the request';
