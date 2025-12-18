-- Add pricing data for all services across all countries
-- This ensures every service has realistic stock and pricing

-- Get service and country IDs
WITH service_ids AS (
  SELECT id, code FROM services WHERE is_active = true
),
country_ids AS (
  SELECT id, code FROM countries WHERE is_active = true
)

-- Insert pricing data for each service-country combination
INSERT INTO service_prices (service_id, country_id, price, stock_count, is_available)
SELECT 
  s.id as service_id,
  c.id as country_id,
  -- Pricing varies by country (Vietnam cheaper, US/UK more expensive)
  CASE 
    WHEN c.code = 'vn' THEN FLOOR(RANDOM() * 3000 + 2000)::int  -- 2,000-5,000 VND
    WHEN c.code IN ('th', 'id', 'my', 'ph') THEN FLOOR(RANDOM() * 4000 + 3000)::int  -- 3,000-7,000 VND
    WHEN c.code IN ('sg', 'cn', 'in') THEN FLOOR(RANDOM() * 5000 + 4000)::int  -- 4,000-9,000 VND
    WHEN c.code IN ('us', 'uk') THEN FLOOR(RANDOM() * 8000 + 7000)::int  -- 7,000-15,000 VND
    ELSE FLOOR(RANDOM() * 5000 + 4000)::int  -- 4,000-9,000 VND for others
  END as price,
  -- Random stock (50-500 numbers per country)
  FLOOR(RANDOM() * 450 + 50)::int as stock_count,
  true as is_available
FROM service_ids s
CROSS JOIN country_ids c
ON CONFLICT (service_id, country_id) DO UPDATE SET
  price = EXCLUDED.price,
  stock_count = EXCLUDED.stock_count,
  is_available = EXCLUDED.is_available;
