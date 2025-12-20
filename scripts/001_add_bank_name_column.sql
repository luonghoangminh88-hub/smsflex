-- Migration: Add bank_name column to bank_transactions table
-- Description: This adds the bank_name column that is required by the auto-payment processor
-- Date: 2025-12-20

-- Add bank_name column if it doesn't exist
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Create index on bank_name for faster queries
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_name 
ON bank_transactions(bank_name);

-- Add comment to the column
COMMENT ON COLUMN bank_transactions.bank_name IS 'Name of the bank that sent the transaction notification (e.g., Timo, MB Bank, VCB)';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
