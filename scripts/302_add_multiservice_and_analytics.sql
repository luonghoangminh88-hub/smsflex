-- Multi-service numbers support
CREATE TABLE IF NOT EXISTS public.multi_service_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES public.countries(id),
  phone_number TEXT NOT NULL,
  activation_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  services JSONB NOT NULL DEFAULT '[]', -- Array of service codes
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  messages JSONB DEFAULT '[]', -- Store all received messages
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Long-term rentals (rent API)
CREATE TABLE IF NOT EXISTS public.long_term_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  country_id UUID NOT NULL REFERENCES public.countries(id),
  phone_number TEXT NOT NULL,
  rent_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  rent_time_hours INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  messages JSONB DEFAULT '[]',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider performance analytics
CREATE TABLE IF NOT EXISTS public.provider_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('sms-activate', '5sim')),
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  failed_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  availability_score DECIMAL(5, 2) DEFAULT 100.00, -- 0-100
  error_rate DECIMAL(5, 2) DEFAULT 0.00, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, date)
);

-- Service performance analytics
CREATE TABLE IF NOT EXISTS public.service_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id),
  country_id UUID NOT NULL REFERENCES public.countries(id),
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  failed_orders INTEGER DEFAULT 0,
  avg_price DECIMAL(10, 2) DEFAULT 0,
  avg_delivery_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, country_id, date)
);

-- Cost optimization tracking
CREATE TABLE IF NOT EXISTS public.cost_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('rental', 'multi_service', 'long_term')),
  provider_selected TEXT NOT NULL,
  provider_cost DECIMAL(10, 2) NOT NULL,
  alternative_providers JSONB, -- Other providers and their costs
  savings_amount DECIMAL(10, 2) DEFAULT 0,
  savings_percentage DECIMAL(5, 2) DEFAULT 0,
  selection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.multi_service_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.long_term_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_optimization_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi_service_rentals
CREATE POLICY "Users can view own multi-service rentals"
  ON public.multi_service_rentals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own multi-service rentals"
  ON public.multi_service_rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all multi-service rentals"
  ON public.multi_service_rentals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for long_term_rentals
CREATE POLICY "Users can view own long-term rentals"
  ON public.long_term_rentals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own long-term rentals"
  ON public.long_term_rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all long-term rentals"
  ON public.long_term_rentals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for analytics (admin only)
CREATE POLICY "Admins can view provider analytics"
  ON public.provider_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert provider analytics"
  ON public.provider_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update provider analytics"
  ON public.provider_analytics FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view service analytics"
  ON public.service_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert service analytics"
  ON public.service_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update service analytics"
  ON public.service_analytics FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view cost optimization logs"
  ON public.cost_optimization_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert cost logs"
  ON public.cost_optimization_logs FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_multi_service_rentals_user_id ON public.multi_service_rentals(user_id);
CREATE INDEX idx_multi_service_rentals_status ON public.multi_service_rentals(status);
CREATE INDEX idx_multi_service_rentals_expires_at ON public.multi_service_rentals(expires_at);

CREATE INDEX idx_long_term_rentals_user_id ON public.long_term_rentals(user_id);
CREATE INDEX idx_long_term_rentals_status ON public.long_term_rentals(status);
CREATE INDEX idx_long_term_rentals_end_time ON public.long_term_rentals(end_time);
CREATE INDEX idx_long_term_rentals_rent_id ON public.long_term_rentals(rent_id);

CREATE INDEX idx_provider_analytics_date ON public.provider_analytics(date DESC);
CREATE INDEX idx_provider_analytics_provider ON public.provider_analytics(provider);

CREATE INDEX idx_service_analytics_date ON public.service_analytics(date DESC);
CREATE INDEX idx_service_analytics_service_country ON public.service_analytics(service_id, country_id);

CREATE INDEX idx_cost_optimization_created ON public.cost_optimization_logs(created_at DESC);

-- Triggers
CREATE TRIGGER update_multi_service_rentals_updated_at
  BEFORE UPDATE ON public.multi_service_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_long_term_rentals_updated_at
  BEFORE UPDATE ON public.long_term_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Aggregate provider analytics
  INSERT INTO public.provider_analytics (provider, date, total_orders, successful_orders, failed_orders, total_revenue)
  SELECT 
    'sms-activate' as provider,
    CURRENT_DATE - 1 as date,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_orders,
    COUNT(*) FILTER (WHERE status IN ('cancelled', 'expired')) as failed_orders,
    COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) as total_revenue
  FROM public.phone_rentals
  WHERE DATE(created_at) = CURRENT_DATE - 1
  ON CONFLICT (provider, date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    successful_orders = EXCLUDED.successful_orders,
    failed_orders = EXCLUDED.failed_orders,
    total_revenue = EXCLUDED.total_revenue,
    updated_at = NOW();
END;
$$;
