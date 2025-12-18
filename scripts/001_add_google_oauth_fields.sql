-- Add Google OAuth fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for faster google_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.google_id IS 'Google OAuth unique identifier';
COMMENT ON COLUMN profiles.avatar_url IS 'User profile picture URL from Google or other sources';
