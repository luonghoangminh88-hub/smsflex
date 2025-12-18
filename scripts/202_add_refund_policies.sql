-- Add refund policies table
CREATE TABLE IF NOT EXISTS refund_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  refund_percentage NUMERIC NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  condition_type TEXT NOT NULL CHECK (condition_type IN ('no_otp', 'partial_otp', 'expired', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add refund history tracking
CREATE TABLE IF NOT EXISTS refund_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES phone_rentals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  original_amount NUMERIC NOT NULL,
  refund_amount NUMERIC NOT NULL,
  refund_percentage NUMERIC NOT NULL,
  reason TEXT,
  policy_id UUID REFERENCES refund_policies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_history_user ON refund_history(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_history_rental ON refund_history(rental_id);
CREATE INDEX IF NOT EXISTS idx_refund_history_created ON refund_history(created_at DESC);

-- RLS Policies
ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_history ENABLE ROW LEVEL SECURITY;

-- Admins can manage refund policies
CREATE POLICY "Admins can manage refund policies"
  ON refund_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can view active refund policies
CREATE POLICY "Anyone can view active refund policies"
  ON refund_policies FOR SELECT
  USING (is_active = true);

-- Users can view own refund history
CREATE POLICY "Users can view own refund history"
  ON refund_history FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all refund history
CREATE POLICY "Admins can view all refund history"
  ON refund_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default refund policies
INSERT INTO refund_policies (name, description, refund_percentage, condition_type) VALUES
  ('Hủy trước khi nhận OTP', 'Hoàn 80% nếu hủy trước khi nhận OTP', 80, 'no_otp'),
  ('Hủy sau khi nhận OTP', 'Hoàn 30% nếu hủy sau khi nhận OTP', 30, 'partial_otp'),
  ('Hết hạn không nhận OTP', 'Hoàn 50% nếu hết hạn mà không nhận được OTP', 50, 'expired');
