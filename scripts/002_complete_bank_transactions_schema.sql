-- Complete schema migration for bank_transactions table
-- This adds all required columns that may be missing

-- Add bank_name column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add email_date column if not exists (stores the original email timestamp)
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS email_date TIMESTAMPTZ;

-- Add email_subject column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS email_subject TEXT;

-- Add email_from column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS email_from TEXT;

-- Add email_body column if not exists (stores full email content for debugging)
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS email_body TEXT;

-- Add error_message column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add sender_info column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS sender_info TEXT;

-- Add processed_at column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Add deposit_id column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS deposit_id UUID REFERENCES deposits(id);

-- Add user_id column if not exists
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_email_date 
ON bank_transactions(email_date);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_name 
ON bank_transactions(bank_name);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_status 
ON bank_transactions(status);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id 
ON bank_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_deposit_id 
ON bank_transactions(deposit_id);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_processed_at 
ON bank_transactions(processed_at);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added all missing columns to bank_transactions table';
  RAISE NOTICE 'Columns added: bank_name, email_date, email_subject, email_from, email_body, error_message, sender_info, processed_at, deposit_id, user_id';
  RAISE NOTICE 'Indexes created for better query performance';
  RAISE NOTICE 'Schema cache refreshed';
END $$;
