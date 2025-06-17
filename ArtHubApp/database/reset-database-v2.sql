-- Art3Hub V2 Database Reset Script
-- This script drops all existing tables and recreates them for the V2 subscription-based model

-- Drop existing tables (in order to avoid foreign key constraints)
DROP TABLE IF EXISTS nfts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_profiles table with V2 subscription fields
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
    
    -- V2 Subscription fields
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'master')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    nfts_minted_this_period INTEGER DEFAULT 0,
    nft_quota INTEGER DEFAULT 1, -- Free plan gets 1 NFT
    usdc_payment_hash TEXT,
    last_quota_reset TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create nfts table with V2 collection-based fields
CREATE TABLE nfts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_ipfs_hash TEXT NOT NULL,
    metadata_ipfs_hash TEXT,
    
    -- V2 transaction fields
    transaction_hash TEXT,
    gasless_signature TEXT, -- For gasless mints
    relayer_address TEXT,   -- Address of relayer used
    
    -- Collection information
    collection_address TEXT, -- V2 collection contract address
    token_id BIGINT,
    
    -- Network and metadata
    network TEXT DEFAULT 'base-sepolia',
    chain_id INTEGER DEFAULT 84532,
    royalty_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- V2 specific fields
    mint_type TEXT DEFAULT 'gasless' CHECK (mint_type IN ('gasless', 'traditional')),
    subscription_plan_used TEXT DEFAULT 'free',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subscriptions table for tracking subscription history
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'master')),
    
    -- Payment information
    payment_amount DECIMAL(10,6), -- USDC amount
    payment_token_address TEXT,
    payment_transaction_hash TEXT,
    
    -- Subscription period
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collections table for tracking V2 collections
CREATE TABLE collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL, -- Creator's wallet
    contract_address TEXT UNIQUE NOT NULL,
    
    -- Collection metadata
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    description TEXT,
    image_uri TEXT,
    
    -- Blockchain information
    transaction_hash TEXT NOT NULL,
    network TEXT DEFAULT 'base-sepolia',
    chain_id INTEGER DEFAULT 84532,
    
    -- V2 specific fields
    created_via_subscription BOOLEAN DEFAULT TRUE,
    subscription_plan_used TEXT DEFAULT 'free',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires_at ON user_profiles(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- NFTs indexes
CREATE INDEX IF NOT EXISTS idx_nfts_wallet_address ON nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nfts_collection_address ON nfts(collection_address);
CREATE INDEX IF NOT EXISTS idx_nfts_chain_id ON nfts(chain_id);
CREATE INDEX IF NOT EXISTS idx_nfts_mint_type ON nfts(mint_type);
CREATE INDEX IF NOT EXISTS idx_nfts_created_at ON nfts(created_at);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_wallet_address ON subscriptions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_wallet_address ON collections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_collections_contract_address ON collections(contract_address);
CREATE INDEX IF NOT EXISTS idx_collections_chain_id ON collections(chain_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

-- Create triggers to automatically update updated_at timestamps

-- User profiles trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- NFTs trigger
DROP TRIGGER IF EXISTS update_nfts_updated_at ON nfts;
CREATE TRIGGER update_nfts_updated_at
    BEFORE UPDATE ON nfts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions trigger
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Collections trigger
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on nfts" ON nfts FOR ALL USING (true);
CREATE POLICY "Allow all operations on subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all operations on collections" ON collections FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO user_profiles (
    wallet_address, 
    profile_complete, 
    name, 
    subscription_plan, 
    nft_quota,
    subscription_started_at,
    last_quota_reset
) VALUES 
    ('0x1234567890123456789012345678901234567890', true, 'Test User 1', 'free', 1, NOW(), NOW()),
    ('0x0987654321098765432109876543210987654321', true, 'Test User 2', 'master', 10, NOW(), NOW());

-- Success message
SELECT 'Art3Hub V2 database has been reset successfully!' as status;
SELECT 'Default testing mode: Base Sepolia (Chain ID: 84532)' as network_info;
SELECT 'Free plan users get 1 NFT, Master plan users get 10 NFTs per month' as subscription_info;