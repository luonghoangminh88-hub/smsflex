-- Rate limiting logs
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON rate_limit_logs(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_logs(created_at DESC);

-- Auto cleanup old logs (keep only 7 days)
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON rate_limit_logs(created_at) WHERE created_at < NOW() - INTERVAL '7 days';

-- Fraud detection logs
CREATE TABLE IF NOT EXISTS fraud_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  is_suspicious BOOLEAN NOT NULL,
  flags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_user ON fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_suspicious ON fraud_logs(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_fraud_logs_created ON fraud_logs(created_at DESC);

-- RLS Policies
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view rate limit logs"
  ON rate_limit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view fraud logs"
  ON fraud_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE rate_limit_logs IS 'Tracks API rate limiting for abuse prevention';
COMMENT ON TABLE fraud_logs IS 'Logs suspicious activities for fraud detection';
