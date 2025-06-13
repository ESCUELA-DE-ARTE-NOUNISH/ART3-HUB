-- Migration to add artist and category fields to NFTs table
-- This enables proper explore page functionality with filtering

-- Add new columns to the nfts table
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS artist_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Digital Art',
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags for additional categorization
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0, -- For trending calculation
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0; -- For popularity tracking

-- Create indexes for faster filtering and sorting
CREATE INDEX IF NOT EXISTS idx_nfts_artist_name ON nfts(artist_name);
CREATE INDEX IF NOT EXISTS idx_nfts_category ON nfts(category);
CREATE INDEX IF NOT EXISTS idx_nfts_view_count ON nfts(view_count);
CREATE INDEX IF NOT EXISTS idx_nfts_likes_count ON nfts(likes_count);
CREATE INDEX IF NOT EXISTS idx_nfts_tags ON nfts USING GIN(tags); -- GIN index for array searches

-- Add a composite index for trending calculations (view_count + created_at)
CREATE INDEX IF NOT EXISTS idx_nfts_trending ON nfts(view_count DESC, created_at DESC);

-- Add a composite index for popular items (likes_count + created_at)
CREATE INDEX IF NOT EXISTS idx_nfts_popular ON nfts(likes_count DESC, created_at DESC);

-- Create a function to update view count
CREATE OR REPLACE FUNCTION increment_nft_view_count(nft_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE nfts 
    SET view_count = view_count + 1
    WHERE id = nft_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment likes count
CREATE OR REPLACE FUNCTION increment_nft_likes(nft_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE nfts 
    SET likes_count = likes_count + 1
    WHERE id = nft_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_nft_likes(nft_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE nfts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = nft_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing records to have default values for artist_name
-- This will use the user profile name if available, otherwise use wallet address
UPDATE nfts 
SET artist_name = COALESCE(
    (SELECT name FROM user_profiles WHERE user_profiles.wallet_address = nfts.wallet_address),
    CONCAT('Artist ', SUBSTRING(nfts.wallet_address, 1, 6))
)
WHERE artist_name IS NULL;

-- Set default category for existing records
UPDATE nfts 
SET category = 'Digital Art'
WHERE category IS NULL;

-- Add some sample categories as comments for reference
-- Categories: 'Digital Art', 'Photography', 'Illustrations', '3D Art', 'Pixel Art', 'Animation', 'Music', 'Video', 'Gaming', 'Abstract', 'Portrait', 'Landscape', 'Street Art', 'Pop Art', 'Surreal'