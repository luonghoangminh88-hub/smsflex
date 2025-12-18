-- Add constraint to prevent negative balance
ALTER TABLE profiles 
ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- Add deposit idempotency support
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Add deposit verification tracking
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_balance ON profiles(balance) 
WHERE balance > 0;

CREATE INDEX IF NOT EXISTS idx_deposits_idempotency ON deposits(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON deposits(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON deposits(user_id, status);

-- Add comments
COMMENT ON CONSTRAINT balance_non_negative ON profiles IS 
'Ensures user balance cannot go negative at database level';

COMMENT ON COLUMN deposits.idempotency_key IS 
'Unique key to prevent duplicate deposit requests';

COMMENT ON COLUMN deposits.verified_by IS 
'Admin user ID who verified this deposit';

COMMENT ON COLUMN deposits.verified_at IS 
'Timestamp when deposit was verified';
