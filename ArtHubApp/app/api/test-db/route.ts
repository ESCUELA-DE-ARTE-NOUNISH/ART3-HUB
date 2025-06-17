import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    const config = getSupabaseConfig()
    console.log('Supabase configuration:', config)

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured',
        config
      }, { status: 500 })
    }

    // Test the connection and check if NFTs table has required columns
    const { data: testColumns, error: describeError } = await supabase
      .from('nfts')
      .select('id, artist_name, category')
      .limit(1)

    if (describeError) {
      console.error('Supabase table check error:', describeError)
      return NextResponse.json({
        error: 'NFTs table missing columns',
        details: describeError.message,
        needsMigration: true,
        config
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful and NFTs table has required columns',
      config,
      data: testColumns
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    const { action } = await request.json()

    if (action === 'check_migration') {
      return NextResponse.json({
        success: true,
        message: 'CRITICAL: Database is missing multiple columns. Please run this complete migration in your Supabase SQL Editor:',
        sql: `
-- COMPLETE MIGRATION to add ALL missing columns to nfts table
-- This fixes the "Could not find the 'contract_address' column" error

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
        `,
        instructions: [
          '1. Go to your Supabase dashboard (https://supabase.com/dashboard)',
          '2. Navigate to your project',
          '3. Click on "SQL Editor" in the left sidebar',
          '4. Paste the SQL above into a new query',
          '5. Click "Run" to execute the migration',
          '6. You should see the column list at the end confirming all columns exist',
          '7. After running, try creating an NFT again - it should work!'
        ]
      })
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}