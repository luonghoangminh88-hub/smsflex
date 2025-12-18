-- Phone rentals table
CREATE TABLE IF NOT EXISTS public.phone_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  country_id UUID NOT NULL REFERENCES public.countries(id),
  phone_number TEXT NOT NULL,
  activation_id TEXT,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled', 'expired')),
  otp_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.phone_rentals ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rentals
CREATE POLICY "Users can view own rentals"
  ON public.phone_rentals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rentals"
  ON public.phone_rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rentals"
  ON public.phone_rentals FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all rentals
CREATE POLICY "Admins can view all rentals"
  ON public.phone_rentals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all rentals"
  ON public.phone_rentals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_phone_rentals_updated_at
  BEFORE UPDATE ON public.phone_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for better performance
CREATE INDEX idx_phone_rentals_user_id ON public.phone_rentals(user_id);
CREATE INDEX idx_phone_rentals_status ON public.phone_rentals(status);
CREATE INDEX idx_phone_rentals_created_at ON public.phone_rentals(created_at DESC);
