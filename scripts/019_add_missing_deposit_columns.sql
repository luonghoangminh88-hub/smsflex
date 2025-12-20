-- Add missing columns to deposits table for compatibility with auto-payment processor
-- This migration ensures the deposits table has all required columns

-- Add payment_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deposits' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE deposits ADD COLUMN payment_method TEXT DEFAULT 'bank_transfer';
        COMMENT ON COLUMN deposits.payment_method IS 'Payment method type: bank_transfer, momo, vnpay, etc';
    END IF;
END $$;

-- Add fee_amount column if it doesn't exist (rename from fee if needed)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deposits' AND column_name = 'fee_amount'
    ) THEN
        -- Check if 'fee' column exists, if so rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'deposits' AND column_name = 'fee'
        ) THEN
            ALTER TABLE deposits RENAME COLUMN fee TO fee_amount;
        ELSE
            ALTER TABLE deposits ADD COLUMN fee_amount NUMERIC DEFAULT 0;
        END IF;
        COMMENT ON COLUMN deposits.fee_amount IS 'Transaction fee amount';
    END IF;
END $$;

-- Add transfer_content column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deposits' AND column_name = 'transfer_content'
    ) THEN
        ALTER TABLE deposits ADD COLUMN transfer_content TEXT;
        COMMENT ON COLUMN deposits.transfer_content IS 'Bank transfer content/note';
    END IF;
END $$;

-- Ensure payment_code has unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'deposits_payment_code_key'
    ) THEN
        ALTER TABLE deposits ADD CONSTRAINT deposits_payment_code_key UNIQUE (payment_code);
    END IF;
END $$;

-- Add index on payment_method for faster lookups
CREATE INDEX IF NOT EXISTS idx_deposits_payment_method ON deposits(payment_method);

-- Update existing NULL values
UPDATE deposits SET fee_amount = 0 WHERE fee_amount IS NULL;
UPDATE deposits SET payment_method = 'bank_transfer' WHERE payment_method IS NULL;

COMMENT ON TABLE deposits IS 'Tracks all deposit transactions from various payment methods';
