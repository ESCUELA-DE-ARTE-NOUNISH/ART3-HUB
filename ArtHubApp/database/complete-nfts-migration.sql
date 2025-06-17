-- Complete migration to add all missing columns to nfts table
-- This should be run in Supabase SQL Editor

-- Add all missing columns
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS token_id BIGINT,
ADD COLUMN IF NOT EXISTS artist_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Digital Art',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nfts_contract_address ON nfts(contract_address);
CREATE INDEX IF NOT EXISTS idx_nfts_token_id ON nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_nfts_contract_token ON nfts(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_nfts_artist_name ON nfts(artist_name);
CREATE INDEX IF NOT EXISTS idx_nfts_category ON nfts(category);
CREATE INDEX IF NOT EXISTS idx_nfts_view_count ON nfts(view_count);
CREATE INDEX IF NOT EXISTS idx_nfts_likes_count ON nfts(likes_count);
CREATE INDEX IF NOT EXISTS idx_nfts_tags ON nfts USING GIN(tags);

-- Add composite indexes for trending and popular sorting
CREATE INDEX IF NOT EXISTS idx_nfts_trending ON nfts(view_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfts_popular ON nfts(likes_count DESC, created_at DESC);

-- Update existing records to have default values
UPDATE nfts 
SET category = 'Digital Art'
WHERE category IS NULL;

UPDATE nfts 
SET artist_name = COALESCE(
    (SELECT name FROM user_profiles WHERE user_profiles.wallet_address = nfts.wallet_address),
    CONCAT('Artist ', SUBSTRING(nfts.wallet_address, 1, 6))
)
WHERE artist_name IS NULL;

-- Set default values for counters
UPDATE nfts 
SET view_count = 0
WHERE view_count IS NULL;

UPDATE nfts 
SET likes_count = 0
WHERE likes_count IS NULL;

-- Verify the migration worked
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'nfts' 
ORDER BY ordinal_position;