-- Initialize system settings with default profit margin
INSERT INTO system_settings (key, category, value, description) VALUES
('profit_margin', 'pricing', '{"percentage": 20}'::jsonb, 'Tỷ lệ lợi nhuận áp dụng cho giá dịch vụ (%)')
ON CONFLICT (key) DO NOTHING;
