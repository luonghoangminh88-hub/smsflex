-- Ensure rate_limit_logs table has correct schema
-- Drop and recreate if it exists with wrong schema
DROP TABLE IF EXISTS rate_limit_logs CASCADE;

CREATE TABLE rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_rate_limit_identifier_action ON rate_limit_logs(identifier, action);
CREATE INDEX idx_rate_limit_created ON rate_limit_logs(created_at DESC);
CREATE INDEX idx_rate_limit_lookup ON rate_limit_logs(identifier, action, created_at);

-- Enable RLS
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for rate limiting from server)
CREATE POLICY "Service role can manage rate limits"
  ON rate_limit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Only admins can view rate limit logs
CREATE POLICY "Admins can view rate limit logs"
  ON rate_limit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Auto-cleanup function for old rate limit logs
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE rate_limit_logs IS 'Tracks API rate limiting for abuse prevention';
COMMENT ON COLUMN rate_limit_logs.identifier IS 'Unique identifier (user_id, IP, etc.)';
COMMENT ON COLUMN rate_limit_logs.action IS 'Type of action being rate limited (deposit, rental, login, api)';
COMMENT ON COLUMN rate_limit_logs.ip_address IS 'IP address of the request';
