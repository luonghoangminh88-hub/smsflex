-- Create bank_transactions table for storing email-based bank transaction data
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction identification
  transaction_id TEXT UNIQUE NOT NULL,
  bank_name TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  content TEXT,
  
  -- Email metadata
  email_date TIMESTAMPTZ,
  email_subject TEXT,
  email_from TEXT,
  email_body TEXT,
  
  -- User and deposit linking
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deposit_id UUID REFERENCES deposits(id) ON DELETE SET NULL,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'manual_review')),
  error_message TEXT,
  
  -- Additional metadata
  sender_info TEXT,
  raw_content TEXT,
  
  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_id ON bank_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_deposit_id ON bank_transactions(deposit_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_email_date ON bank_transactions(email_date DESC);

-- Enable Row Level Security
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin can see all transactions
CREATE POLICY "Admin can view all bank transactions" ON bank_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can only see their own transactions
CREATE POLICY "Users can view own bank transactions" ON bank_transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Only system/service role can insert/update bank transactions
CREATE POLICY "Service role can manage bank transactions" ON bank_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bank_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bank_transactions_updated_at
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_transactions_updated_at();

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
