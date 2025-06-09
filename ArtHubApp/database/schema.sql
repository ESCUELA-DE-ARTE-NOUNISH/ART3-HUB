-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    profile_complete BOOLEAN DEFAULT FALSE NOT NULL,
    name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    profile_picture TEXT,
    banner_image TEXT,
    instagram_url TEXT,
    farcaster_url TEXT,
    x_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);

-- Create index on username for faster lookups (since it's unique)
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Create index on email for faster lookups (since it's unique)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Create index on profile_complete for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_complete ON user_profiles(profile_complete);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can make this more restrictive)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles
    FOR ALL USING (true);

-- Optional: Create policy for more restrictive access (commented out)
-- CREATE POLICY "Users can view their own profile" ON user_profiles
--     FOR SELECT USING (auth.uid()::text = wallet_address);
-- 
-- CREATE POLICY "Users can update their own profile" ON user_profiles
--     FOR UPDATE USING (auth.uid()::text = wallet_address);
-- 
-- CREATE POLICY "Allow insert for authenticated users" ON user_profiles
--     FOR INSERT WITH CHECK (true);