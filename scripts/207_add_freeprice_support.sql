-- Add FreePrice columns to service_prices table
ALTER TABLE public.service_prices
ADD COLUMN IF NOT EXISTS freeprice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS freeprice_map JSONB,
ADD COLUMN IF NOT EXISTS min_freeprice DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS max_freeprice DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS recommended_freeprice DECIMAL(10, 2);

-- Add FreePrice configuration to system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('freeprice_enabled', 'true', 'Enable FreePrice dynamic pricing'),
  ('freeprice_max_discount', '15', 'Maximum discount percentage for FreePrice'),
  ('freeprice_auto_select', 'true', 'Automatically select best FreePrice')
ON CONFLICT (key) DO NOTHING;

-- Create index for FreePrice queries
CREATE INDEX IF NOT EXISTS idx_service_prices_freeprice ON public.service_prices(freeprice_enabled) 
  WHERE freeprice_enabled = true;

-- Add comments
COMMENT ON COLUMN public.service_prices.freeprice_enabled IS 'Whether FreePrice is available for this service/country';
COMMENT ON COLUMN public.service_prices.freeprice_map IS 'Map of available FreePrice options: { "15.00": 100, "18.00": 50 }';
COMMENT ON COLUMN public.service_prices.min_freeprice IS 'Minimum FreePrice available';
COMMENT ON COLUMN public.service_prices.max_freeprice IS 'Maximum FreePrice available';
COMMENT ON COLUMN public.service_prices.recommended_freeprice IS 'Recommended FreePrice for best value';
