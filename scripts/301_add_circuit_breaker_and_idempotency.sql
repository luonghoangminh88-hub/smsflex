-- Add circuit breaker and idempotency support
-- This ensures system reliability and prevents duplicate orders

-- Provider health monitoring table
CREATE TABLE IF NOT EXISTS provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'down')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  circuit_state TEXT NOT NULL DEFAULT 'closed' CHECK (circuit_state IN ('closed', 'open', 'half_open')),
  circuit_opened_at TIMESTAMPTZ,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  average_response_time INTEGER, -- in milliseconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider)
);

-- Provider performance metrics
CREATE TABLE IF NOT EXISTS provider_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  service_code TEXT NOT NULL,
  country_code TEXT NOT NULL,
  success_rate DECIMAL(5,2), -- percentage
  average_cost DECIMAL(10,2),
  average_delivery_time INTEGER, -- seconds until OTP received
  stock_availability INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_metrics_lookup ON provider_metrics(provider, service_code, country_code);
CREATE INDEX idx_provider_metrics_updated ON provider_metrics(updated_at DESC);

-- Idempotency keys table to prevent duplicate orders
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_body JSONB NOT NULL,
  response_body JSONB,
  response_status INTEGER,
  rental_id UUID REFERENCES phone_rentals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_user ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- Free price tracking for cost optimization
CREATE TABLE IF NOT EXISTS free_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  service_code TEXT NOT NULL,
  country_code TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_count INTEGER,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_free_price_history_lookup ON free_price_history(provider, service_code, country_code, captured_at DESC);

-- Initialize provider health records
INSERT INTO provider_health (provider, status, circuit_state) 
VALUES 
  ('sms-activate', 'healthy', 'closed'),
  ('5sim', 'healthy', 'closed')
ON CONFLICT (provider) DO NOTHING;

-- RLS Policies
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_price_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all health data
CREATE POLICY "Admins can view provider health"
  ON provider_health FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can view metrics
CREATE POLICY "Admins can view provider metrics"
  ON provider_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can only see their own idempotency keys
CREATE POLICY "Users can view own idempotency keys"
  ON idempotency_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage everything
CREATE POLICY "Service role full access to provider_health"
  ON provider_health FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to provider_metrics"
  ON provider_metrics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to idempotency_keys"
  ON idempotency_keys FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to free_price_history"
  ON free_price_history FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-cleanup expired idempotency keys (can be run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
