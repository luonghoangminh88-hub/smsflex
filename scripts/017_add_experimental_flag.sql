-- Add is_experimental flag to services table
-- This marks services that use generic "other" service code

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS is_experimental BOOLEAN DEFAULT false;

-- Mark experimental services (those using "other" service code)
UPDATE services 
SET is_experimental = true 
WHERE code IN (
  'zalo',
  'grab',
  'xanhsm', 
  'fptplay',
  'shopee',
  'lazada',
  'chatgpt',
  'claude',
  'gemini',
  'netflix'
);

-- Add comment explaining the flag
COMMENT ON COLUMN services.is_experimental IS 
'Services marked as experimental use generic "other" service code. They will receive all SMS but OTP delivery is not guaranteed by providers.';
