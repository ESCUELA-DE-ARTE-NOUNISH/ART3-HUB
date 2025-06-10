-- Create NFTs table for storing user-created NFT metadata
CREATE TABLE IF NOT EXISTS nfts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_ipfs_hash TEXT NOT NULL,
    metadata_ipfs_hash TEXT,
    transaction_hash TEXT,
    network TEXT DEFAULT 'base',
    royalty_percentage DECIMAL(5,2) DEFAULT 0,
    contract_address TEXT,
    token_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_nfts_wallet_address ON nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nfts_created_at ON nfts(created_at);
CREATE INDEX IF NOT EXISTS idx_nfts_network ON nfts(network);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_nfts_updated_at ON nfts;
CREATE TRIGGER update_nfts_updated_at
    BEFORE UPDATE ON nfts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
CREATE POLICY "Allow all operations on nfts" ON nfts
    FOR ALL USING (true);