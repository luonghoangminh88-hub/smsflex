-- Seed popular services for OTP rental
INSERT INTO services (name, code, icon_url, is_active, is_experimental) VALUES
-- Popular messaging apps
('Telegram', 'telegram', '/images/telegram.png', true, false),
('WhatsApp', 'whatsapp', '/images/whatsapp.png', true, false),
('Facebook', 'facebook', '/images/icons8-facebook-50.png', true, false),
('Instagram', 'instagram', '/images/icons8-instagram-50.png', true, false),

-- Vietnamese services (experimental - use 'other' code)
('Zalo', 'zalo', '/images/zalo.png', true, true),
('Grab', 'grab', '/images/grab-logo.png', true, true),
('Xanh SM', 'xanhsm', '/images/xanhsm.png', true, true),
('Shopee', 'shopee', '/images/icons8-shopee-48.png', true, true),
('Lazada', 'lazada', '/images/icons8-lazada-100.png', true, true),

-- AI services
('ChatGPT', 'chatgpt', '/images/icons8-chatgpt-50.png', true, false),
('Claude AI', 'claude', '/images/icons8-claude-ai-48.png', true, false),
('Gemini', 'gemini', '/images/gemini-ai-48.png', true, false),

-- Other services
('Gmail', 'gmail', '/images/icons8-gmail-50.png', true, false),
('Other', 'other', '/images/other.png', true, true)

ON CONFLICT (code) DO NOTHING;
