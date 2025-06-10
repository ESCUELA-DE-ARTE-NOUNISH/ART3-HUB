import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { 
      wallet_address, 
      name, 
      description, 
      image_ipfs_hash, 
      metadata_ipfs_hash, 
      transaction_hash,
      network,
      royalty_percentage 
    } = await request.json()

    if (!wallet_address || !name || !image_ipfs_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert NFT record into database
    const { data, error } = await supabase
      .from('nfts')
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        name,
        description,
        image_ipfs_hash,
        metadata_ipfs_hash,
        transaction_hash,
        network,
        royalty_percentage: parseFloat(royalty_percentage) || 0,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to store NFT data' }, { status: 500 })
    }

    console.log('✅ NFT stored successfully:', data)
    return NextResponse.json({ success: true, nft: data[0] })

  } catch (error) {
    console.error('Error storing NFT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get('wallet_address')

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Fetch NFTs for the wallet
    const { data, error } = await supabase
      .from('nfts')
      .select('*')
      .eq('wallet_address', wallet_address.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
    }

    return NextResponse.json({ nfts: data || [] })

  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}