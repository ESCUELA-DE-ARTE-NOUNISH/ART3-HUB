-- Migration to add profile fields to existing user_profiles table
-- Run this in your Supabase SQL Editor

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS farcaster_url TEXT,
ADD COLUMN IF NOT EXISTS x_url TEXT;

-- Create index on username for faster lookups (since it's unique)
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Create index on email for faster lookups (since it's unique)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update any existing profiles to have profile_complete = false since they now have more fields to fill
UPDATE user_profiles SET profile_complete = false WHERE profile_complete = true;