-- Seed popular countries for OTP rental
INSERT INTO countries (code, name, flag_url, is_active) VALUES
-- Southeast Asia
('vn', 'Vietnam', 'https://flagcdn.com/w40/vn.png', true),
('th', 'Thailand', 'https://flagcdn.com/w40/th.png', true),
('id', 'Indonesia', 'https://flagcdn.com/w40/id.png', true),
('my', 'Malaysia', 'https://flagcdn.com/w40/my.png', true),
('sg', 'Singapore', 'https://flagcdn.com/w40/sg.png', true),
('ph', 'Philippines', 'https://flagcdn.com/w40/ph.png', true),

-- Major countries
('us', 'United States', 'https://flagcdn.com/w40/us.png', true),
('uk', 'United Kingdom', 'https://flagcdn.com/w40/gb.png', true),
('cn', 'China', 'https://flagcdn.com/w40/cn.png', true),
('in', 'India', 'https://flagcdn.com/w40/in.png', true),
('ru', 'Russia', 'https://flagcdn.com/w40/ru.png', true)

ON CONFLICT (code) DO NOTHING;
