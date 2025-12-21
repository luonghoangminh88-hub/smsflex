-- Add webhook support to phone_rentals table
ALTER TABLE public.phone_rentals ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'sms-activate';
ALTER TABLE public.phone_rentals ADD COLUMN IF NOT EXISTS provider_activation_id TEXT;
ALTER TABLE public.phone_rentals ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.phone_rentals ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_phone_rentals_provider_activation ON public.phone_rentals(provider, activation_id);

-- Enhance webhook_logs table
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON public.webhook_logs(processed, created_at);
