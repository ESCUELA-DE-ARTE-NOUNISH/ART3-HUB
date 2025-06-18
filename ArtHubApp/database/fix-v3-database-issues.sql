-- Complete fix for V3 database issues
-- Run this in Supabase SQL Editor

-- 1. Add all missing columns to nfts table
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS token_id BIGINT,
ADD COLUMN IF NOT EXISTS artist_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Digital Art',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nfts_contract_address ON nfts(contract_address);
CREATE INDEX IF NOT EXISTS idx_nfts_token_id ON nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_nfts_contract_token ON nfts(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_nfts_artist_name ON nfts(artist_name);
CREATE INDEX IF NOT EXISTS idx_nfts_category ON nfts(category);
CREATE INDEX IF NOT EXISTS idx_nfts_view_count ON nfts(view_count);
CREATE INDEX IF NOT EXISTS idx_nfts_likes_count ON nfts(likes_count);
CREATE INDEX IF NOT EXISTS idx_nfts_tags ON nfts USING GIN(tags);

-- 3. Add composite indexes for trending and popular sorting
CREATE INDEX IF NOT EXISTS idx_nfts_trending ON nfts(view_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfts_popular ON nfts(likes_count DESC, created_at DESC);

-- 4. Drop existing network constraint if it exists
ALTER TABLE nfts DROP CONSTRAINT IF EXISTS nfts_network_check;

-- 5. Add updated network constraint with correct V3 network names
ALTER TABLE nfts ADD CONSTRAINT nfts_network_check 
CHECK (network IN (
    'base', 'zora', 'celo',                           -- Mainnet values
    'base-sepolia', 'zora-sepolia', 'celo-alfajores', -- Testnet values
    'base testnet', 'zora testnet', 'celo testnet'    -- Legacy format (for backwards compatibility)
));

-- 6. Update existing records to use correct network format
UPDATE nfts SET network = 'base-sepolia' WHERE network = 'base testnet';
UPDATE nfts SET network = 'zora-sepolia' WHERE network = 'zora testnet';  
UPDATE nfts SET network = 'celo-alfajores' WHERE network = 'celo testnet';

-- 7. Update default values for existing records
UPDATE nfts 
SET category = 'Digital Art'
WHERE category IS NULL;

UPDATE nfts 
SET artist_name = COALESCE(
    (SELECT name FROM user_profiles WHERE user_profiles.wallet_address = nfts.wallet_address),
    CONCAT('Artist ', SUBSTRING(nfts.wallet_address, 1, 6))
)
WHERE artist_name IS NULL;

UPDATE nfts 
SET view_count = 0
WHERE view_count IS NULL;

UPDATE nfts 
SET likes_count = 0
WHERE likes_count IS NULL;

-- 8. Create utility functions if they don't exist
CREATE OR REPLACE FUNCTION increment_nft_view_count(nft_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE nfts 
    SET view_count = view_count + 1
    WHERE id = nft_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_nft_likes(nft_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE nfts 
    SET likes_count = likes_count + 1
    WHERE id = nft_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_nft_likes(nft_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE nfts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = nft_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Verify the migration worked
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'nfts' 
ORDER BY ordinal_position;