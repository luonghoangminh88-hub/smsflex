-- Insert popular services
INSERT INTO public.services (name, code, is_active) VALUES
  ('Telegram', 'telegram', true),
  ('WhatsApp', 'whatsapp', true),
  ('Facebook', 'facebook', true),
  ('Instagram', 'instagram', true),
  ('Twitter/X', 'twitter', true),
  ('Google', 'google', true),
  ('TikTok', 'tiktok', true),
  ('Viber', 'viber', true),
  ('WeChat', 'wechat', true),
  ('Line', 'line', true)
ON CONFLICT (code) DO NOTHING;

-- Insert popular countries
INSERT INTO public.countries (name, code, is_active) VALUES
  ('Vietnam', 'vn', true),
  ('United States', 'us', true),
  ('United Kingdom', 'uk', true),
  ('Thailand', 'th', true),
  ('Indonesia', 'id', true),
  ('Philippines', 'ph', true),
  ('Malaysia', 'my', true),
  ('Singapore', 'sg', true),
  ('India', 'in', true),
  ('China', 'cn', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample pricing (will be updated from API later)
INSERT INTO public.service_prices (service_id, country_id, price, stock_count, is_available)
SELECT 
  s.id,
  c.id,
  CASE 
    WHEN c.code = 'vn' THEN 5000
    WHEN c.code = 'us' THEN 15000
    WHEN c.code = 'uk' THEN 18000
    ELSE 10000
  END,
  100,
  true
FROM public.services s
CROSS JOIN public.countries c
WHERE s.code IN ('telegram', 'whatsapp', 'facebook')
  AND c.code IN ('vn', 'us', 'th')
ON CONFLICT (service_id, country_id) DO NOTHING;
