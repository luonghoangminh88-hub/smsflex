-- Add new services to replace Line and Twitter/X with Vietnamese/Asian focused services
-- Updated to match actual services table schema (no description or updated_at columns)

-- Delete old services we're replacing
DELETE FROM services WHERE code IN ('line', 'twitter', 'twitterx');

-- Insert new services with correct schema
INSERT INTO services (code, name, icon_url, is_active)
VALUES
  -- Vietnamese Services
  ('zalo', 'Zalo', '/images/zalo.jpg', true),
  
  -- Ride Sharing (Vietnamese)
  ('grab', 'Grab', '/images/grab-logo.png', true),
  ('xanhsm', 'Xanh SM', '/images/xanh-sm.webp', true),
  
  -- Streaming
  ('fptplay', 'FPT Play', '/images/fpt-play.webp', true),
  ('netflix', 'Netflix', '/images/netflix-logo.jpg', true),
  
  -- AI Services
  ('chatgpt', 'ChatGPT', '/images/icons8-chatgpt-50.png', true),
  ('claude', 'Claude AI', '/images/icons8-claude-ai-48.png', true),
  ('gemini', 'Gemini AI', '/images/gemini-ai-48.png', true),
  
  -- E-commerce (Popular in Asia)
  ('shopee', 'Shopee', '/images/icons8-shopee-48.png', true),
  ('lazada', 'Lazada', '/images/icons8-lazada-100.png', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url,
  is_active = EXCLUDED.is_active;

-- Update icon URLs for existing services to use high-quality Icons8 images
UPDATE services SET icon_url = '/images/icons8-facebook-50.png' WHERE code = 'facebook';
UPDATE services SET icon_url = '/images/icons8-gmail-50.png' WHERE code = 'google';
UPDATE services SET icon_url = '/images/icons8-instagram-50.png' WHERE code = 'instagram';
UPDATE services SET icon_url = '/images/icons8-telegram-app-50.png' WHERE code = 'telegram';
UPDATE services SET icon_url = '/images/icons8-tiktok-50.png' WHERE code = 'tiktok';
UPDATE services SET icon_url = '/images/icons8-viber-50.png' WHERE code = 'viber';
UPDATE services SET icon_url = '/images/icons8-wechat-50.png' WHERE code = 'wechat';
UPDATE services SET icon_url = '/images/icons8-whatsapp-50.png' WHERE code = 'whatsapp';
