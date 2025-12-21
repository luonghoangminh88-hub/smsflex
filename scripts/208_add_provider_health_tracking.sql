-- Track provider health and performance metrics
CREATE TABLE IF NOT EXISTS provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unavailable')),
  success_rate DECIMAL(5, 2) DEFAULT 100.00,
  avg_response_time_ms INTEGER,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health(provider);

-- Track individual provider requests for detailed analytics
CREATE TABLE IF NOT EXISTS provider_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  request_type TEXT NOT NULL CHECK (request_type IN ('purchase', 'check_status', 'cancel', 'finish')),
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  country_code TEXT,
  service_code TEXT,
  rental_id UUID REFERENCES phone_rentals(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_requests_provider ON provider_requests(provider);
CREATE INDEX IF NOT EXISTS idx_provider_requests_created ON provider_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_requests_success ON provider_requests(success);
CREATE INDEX IF NOT EXISTS idx_provider_requests_rental ON provider_requests(rental_id);

-- Provider preference settings
CREATE TABLE IF NOT EXISTS provider_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preferred_provider TEXT CHECK (preferred_provider IN ('sms-activate', '5sim', 'auto')),
  fallback_enabled BOOLEAN DEFAULT true,
  min_success_rate DECIMAL(5, 2) DEFAULT 90.00,
  max_response_time_ms INTEGER DEFAULT 5000,
  retry_attempts INTEGER DEFAULT 2,
  retry_delay_ms INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default preferences
INSERT INTO provider_preferences (preferred_provider, fallback_enabled)
VALUES ('auto', true)
ON CONFLICT DO NOTHING;

-- RLS Policies (admin only)
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view provider health"
  ON provider_health FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage provider health"
  ON provider_health FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view provider requests"
  ON provider_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage preferences"
  ON provider_preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE provider_health IS 'Real-time health metrics for SMS providers';
COMMENT ON TABLE provider_requests IS 'Detailed log of all provider API requests';
COMMENT ON TABLE provider_preferences IS 'Configuration for provider selection and fallback behavior';
