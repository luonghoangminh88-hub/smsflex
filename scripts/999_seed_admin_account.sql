-- Seed admin account
-- Run this script after creating your first user account

-- Instructions:
-- 1. Sign up a normal account at /auth/signup with email: admin@otprentalsystem.com
-- 2. Run this script to upgrade that account to admin role
-- 3. Change the email below if you want a different admin email

-- Update existing user to admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@otprentalsystem.com';

-- If you want to create multiple admins, add more UPDATE statements:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'another-admin@example.com';

-- Verify admin accounts
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
