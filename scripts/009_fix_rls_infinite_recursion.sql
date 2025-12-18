-- Fix infinite recursion in RLS policies
-- The "Admins can view all profiles" policy causes infinite recursion
-- because it queries the profiles table within its own policy check

-- Drop problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Drop duplicate policies (có vẻ như có nhiều policies trùng)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Recreate clean policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (needed for trigger)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin access: Use a function that bypasses RLS
-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Admin policy using the helper function (still might recurse, so we'll use a different approach)
-- Instead, create a view for admins or use service role key for admin operations

-- For server-side admin operations, use service role key
-- For client-side, admins can only see their own profile plus we'll create
-- a separate admin API route that uses service role

COMMENT ON FUNCTION public.is_admin() IS 'Helper function to check if current user is admin. Use with service role for admin operations.';
