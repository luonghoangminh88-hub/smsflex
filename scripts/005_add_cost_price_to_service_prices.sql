-- Add cost_price column to track original cost from provider
ALTER TABLE public.service_prices
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);

-- Add comment to explain fields
COMMENT ON COLUMN public.service_prices.cost_price IS 'Giá gốc từ nhà cung cấp';
COMMENT ON COLUMN public.service_prices.price IS 'Giá bán cho khách hàng (đã cộng profit margin)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_prices_updated_at ON public.service_prices(updated_at DESC);
