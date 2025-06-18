-- Art3Hub V3 Database Reset SQL
-- WARNING: This will delete ALL data from the database. Use with caution!
-- Run these queries in your Supabase SQL editor to reset the database for V3 integration

-- =============================================================================
-- STEP 1: DROP ALL EXISTING TABLES (Clean Slate)
-- =============================================================================

-- Drop NFTs table and related objects
DROP TABLE IF EXISTS nfts CASCADE;

-- Drop user profiles table and related objects  
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop any additional tables that might exist
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Drop any triggers and functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- STEP 2: RECREATE CORE TABLES FOR V3
-- =============================================================================

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_profiles table (V3 compatible)
CREATE TABLE user_profiles (
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
    -- V3 specific fields
    subscription_plan TEXT DEFAULT 'FREE' CHECK (subscription_plan IN ('FREE', 'MASTER')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    nfts_minted_this_period INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create NFTs table (V3 compatible with collection support)
CREATE TABLE nfts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_ipfs_hash TEXT NOT NULL,
    metadata_ipfs_hash TEXT,
    -- V3 specific fields
    collection_address TEXT,
    collection_name TEXT,
    collection_symbol TEXT,
    token_id BIGINT,
    transaction_hash TEXT,
    gasless_transaction_hash TEXT, -- For V3 gasless transactions
    network TEXT DEFAULT 'base' CHECK (network IN ('base', 'zora', 'celo', 'base-sepolia', 'zora-sepolia', 'celo-alfajores')),
    chain_id INTEGER,
    royalty_percentage DECIMAL(5,2) DEFAULT 0,
    -- Contract version tracking
    contract_version TEXT DEFAULT 'V3',
    factory_address TEXT, -- V3 factory used to create collection
    subscription_address TEXT, -- V3 subscription contract used
    -- Status tracking
    mint_status TEXT DEFAULT 'pending' CHECK (mint_status IN ('pending', 'processing', 'completed', 'failed')),
    opensea_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collections table (V3 new feature)
CREATE TABLE collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    contract_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    description TEXT,
    image TEXT,
    external_url TEXT,
    royalty_recipient TEXT,
    royalty_fee_numerator INTEGER DEFAULT 250, -- 2.5% default
    network TEXT NOT NULL CHECK (network IN ('base', 'zora', 'celo', 'base-sepolia', 'zora-sepolia', 'celo-alfajores')),
    chain_id INTEGER,
    factory_address TEXT NOT NULL, -- V3 factory that created this collection
    transaction_hash TEXT,
    gasless_transaction_hash TEXT,
    opensea_collection_url TEXT,
    total_nfts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_profile_complete ON user_profiles(profile_complete);
CREATE INDEX idx_user_profiles_subscription_plan ON user_profiles(subscription_plan);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- NFTs indexes
CREATE INDEX idx_nfts_wallet_address ON nfts(wallet_address);
CREATE INDEX idx_nfts_collection_address ON nfts(collection_address);
CREATE INDEX idx_nfts_network ON nfts(network);
CREATE INDEX idx_nfts_chain_id ON nfts(chain_id);
CREATE INDEX idx_nfts_mint_status ON nfts(mint_status);
CREATE INDEX idx_nfts_contract_version ON nfts(contract_version);
CREATE INDEX idx_nfts_created_at ON nfts(created_at);

-- Collections indexes
CREATE INDEX idx_collections_wallet_address ON collections(wallet_address);
CREATE INDEX idx_collections_contract_address ON collections(contract_address);
CREATE INDEX idx_collections_network ON collections(network);
CREATE INDEX idx_collections_chain_id ON collections(chain_id);
CREATE INDEX idx_collections_factory_address ON collections(factory_address);
CREATE INDEX idx_collections_created_at ON collections(created_at);

-- =============================================================================
-- STEP 4: CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================================================

-- User profiles trigger
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- NFTs trigger
CREATE TRIGGER update_nfts_updated_at
    BEFORE UPDATE ON nfts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Collections trigger
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development (restrict in production)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on nfts" ON nfts FOR ALL USING (true);
CREATE POLICY "Allow all operations on collections" ON collections FOR ALL USING (true);

-- =============================================================================
-- STEP 6: INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =============================================================================

-- Uncomment the following lines if you want to insert sample data for testing

-- Sample user profile
-- INSERT INTO user_profiles (wallet_address, profile_complete, name, username, subscription_plan)
-- VALUES ('0x1234567890123456789012345678901234567890', true, 'Test User', 'testuser', 'FREE');

-- Sample collection
-- INSERT INTO collections (
--     wallet_address, contract_address, name, symbol, description, 
--     network, chain_id, factory_address, transaction_hash
-- ) VALUES (
--     '0x1234567890123456789012345678901234567890',
--     '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
--     'Test Collection',
--     'TEST',
--     'A test collection for V3',
--     'base-sepolia',
--     84532,
--     '0x2634b3389c0CBc733bE05ba459A0C2e844594161',
--     '0x0000000000000000000000000000000000000000000000000000000000000000'
-- );

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify the reset worked)
-- =============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check if indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('user_profiles', 'nfts', 'collections') ORDER BY indexname;

-- Check if triggers were created
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Verify table structures
-- \d user_profiles
-- \d nfts  
-- \d collections

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- If you see this comment, the database reset for Art3Hub V3 was successful!
-- You can now start testing the V3 integration with a clean database.