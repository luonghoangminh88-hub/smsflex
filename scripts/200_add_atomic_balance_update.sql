-- Create atomic balance update function to prevent race conditions
-- This function locks the user's row, updates balance, and creates transaction in one atomic operation

CREATE OR REPLACE FUNCTION update_balance_atomic(
  p_user_id UUID,
  p_amount NUMERIC,
  p_transaction_type TEXT,
  p_description TEXT,
  p_rental_id UUID DEFAULT NULL
) RETURNS TABLE(
  new_balance NUMERIC,
  transaction_id UUID
) AS $$
DECLARE
  v_old_balance NUMERIC;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Lock the user's profile row for update (prevents concurrent modifications)
  SELECT balance INTO v_old_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF v_old_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_old_balance + p_amount;
  
  -- Check sufficient balance for negative amounts (withdrawals/rentals)
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', v_old_balance, ABS(p_amount);
  END IF;
  
  -- Update balance atomically
  UPDATE profiles
  SET 
    balance = v_new_balance, 
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO transactions (
    user_id, 
    type, 
    amount, 
    balance_before, 
    balance_after, 
    status, 
    description,
    rental_id
  ) VALUES (
    p_user_id, 
    p_transaction_type, 
    p_amount, 
    v_old_balance, 
    v_new_balance, 
    'completed', 
    p_description,
    p_rental_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Return results
  RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION update_balance_atomic IS 
'Atomically updates user balance and creates transaction record. Prevents race conditions by using row-level locking.';

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION update_balance_atomic TO service_role;
