-- Fix admin access to view all profiles
-- Solution: Create a safe admin policy that doesn't cause infinite recursion

-- First, ensure we have the base policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate user policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a security definer function to get user role
-- This function runs with the permissions of the owner, not the caller
-- This avoids the infinite recursion issue
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

-- Now create admin policy using the security definer function
-- This avoids recursion because the function doesn't trigger RLS
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Admin can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Admin can insert profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

COMMENT ON FUNCTION public.get_user_role(UUID) IS 
  'Returns the role of a user. Used by RLS policies to check admin status without causing infinite recursion.';
