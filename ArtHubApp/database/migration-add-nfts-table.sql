-- Add NFTs table to store user-created NFTs
CREATE TABLE IF NOT EXISTS nfts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_ipfs_hash TEXT NOT NULL,
  metadata_ipfs_hash TEXT,
  transaction_hash TEXT,
  network TEXT,
  royalty_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by wallet address
CREATE INDEX IF NOT EXISTS idx_nfts_wallet_address ON nfts(wallet_address);

-- Create index for faster queries by creation date
CREATE INDEX IF NOT EXISTS idx_nfts_created_at ON nfts(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own NFTs
CREATE POLICY "Users can view their own NFTs" ON nfts
  FOR SELECT USING (true); -- Allow all users to view all NFTs for now

-- Create policy to allow users to insert their own NFTs
CREATE POLICY "Users can insert their own NFTs" ON nfts
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now