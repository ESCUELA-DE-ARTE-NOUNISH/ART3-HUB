-- Migration to add contract_address and token_id fields to existing nfts table
-- Run this in your Supabase SQL Editor

-- Add new columns for NFT contract tracking
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS token_id BIGINT;

-- Update network default from 'zora' to 'base'
ALTER TABLE nfts 
ALTER COLUMN network SET DEFAULT 'base';

-- Create index on contract_address and token_id for faster OpenSea URL generation
CREATE INDEX IF NOT EXISTS idx_nfts_contract_token ON nfts(contract_address, token_id);

-- Update any existing records to have base network if they were zora
UPDATE nfts SET network = 'base testnet' WHERE network = 'zora' OR network = 'zora testnet';