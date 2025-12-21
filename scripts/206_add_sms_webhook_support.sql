-- Add webhook configuration table for SMS providers
CREATE TABLE IF NOT EXISTS sms_webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend webhook_logs to support SMS provider webhooks
ALTER TABLE webhook_logs 
  DROP CONSTRAINT IF EXISTS webhook_logs_provider_check;

ALTER TABLE webhook_logs 
  ADD CONSTRAINT webhook_logs_provider_check 
  CHECK (provider IN ('vnpay', 'momo', 'sms-activate', '5sim', 'other'));

-- Add rental_id to webhook_logs for SMS webhooks
ALTER TABLE webhook_logs 
  ADD COLUMN IF NOT EXISTS rental_id UUID REFERENCES phone_rentals(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_rental ON webhook_logs(rental_id);

-- RLS Policies for webhook config (admin only)
ALTER TABLE sms_webhook_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook config"
  ON sms_webhook_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add webhook_enabled flag to phone_rentals for tracking
ALTER TABLE phone_rentals 
  ADD COLUMN IF NOT EXISTS webhook_delivered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ;

-- Create index for webhook tracking
CREATE INDEX IF NOT EXISTS idx_phone_rentals_activation ON phone_rentals(activation_id) 
  WHERE activation_id IS NOT NULL;

COMMENT ON TABLE sms_webhook_config IS 'Configuration for SMS provider webhook endpoints';
COMMENT ON COLUMN phone_rentals.webhook_delivered IS 'True if OTP was delivered via webhook';
COMMENT ON COLUMN phone_rentals.webhook_received_at IS 'Timestamp when webhook was received';
