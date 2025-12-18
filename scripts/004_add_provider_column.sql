-- Add provider column to phone_rentals table
ALTER TABLE public.phone_rentals 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'sms-activate' 
CHECK (provider IN ('sms-activate', '5sim'));

-- Add index for provider column
CREATE INDEX IF NOT EXISTS idx_phone_rentals_provider ON public.phone_rentals(provider);

-- Add comment
COMMENT ON COLUMN public.phone_rentals.provider IS 'SMS provider used for this rental (sms-activate or 5sim)';
