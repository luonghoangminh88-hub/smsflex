-- System settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access settings
CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default profit margin setting
INSERT INTO public.system_settings (key, value, description, category)
VALUES 
  ('profit_margin_percentage', '20'::jsonb, 'Tỷ lệ lợi nhuận tính trên giá gốc từ nhà cung cấp (đơn vị: %)', 'pricing'),
  ('min_profit_margin', '10'::jsonb, 'Tỷ lệ lợi nhuận tối thiểu cho phép', 'pricing'),
  ('max_profit_margin', '50'::jsonb, 'Tỷ lệ lợi nhuận tối đa cho phép', 'pricing')
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
