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
      artist_name,
      category,
      image_ipfs_hash, 
      metadata_ipfs_hash, 
      transaction_hash,
      network,
      royalty_percentage,
      contract_address,
      token_id
    } = await request.json()

    if (!wallet_address || !name || !image_ipfs_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert NFT record into database - handle missing columns gracefully
    const insertData: any = {
      wallet_address: wallet_address.toLowerCase(),
      name,
      description,
      image_ipfs_hash,
      metadata_ipfs_hash,
      transaction_hash,
      network,
      royalty_percentage: parseFloat(royalty_percentage) || 0,
      contract_address,
      token_id,
      created_at: new Date().toISOString()
    }

    // Try to add artist_name and category if they exist in the table
    try {
      // Test if the columns exist by attempting a select
      const { error: testError } = await supabase
        .from('nfts')
        .select('artist_name, category')
        .limit(1)

      if (!testError) {
        // Columns exist, add them to the insert data
        insertData.artist_name = artist_name
        insertData.category = category || 'Digital Art'
        console.log('✅ Adding artist_name and category to NFT data')
      } else {
        console.log('⚠️ artist_name and category columns do not exist, skipping')
      }
    } catch (e) {
      console.log('⚠️ Could not check for artist_name and category columns')
    }

    const { data, error } = await supabase
      .from('nfts')
      .insert(insertData)
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
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const artist = searchParams.get('artist')
    const sortBy = searchParams.get('sortBy') || 'created_at' // trending, latest, popular
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase.from('nfts').select('*')

    // Filter by wallet address if provided (for user's personal gallery)
    if (wallet_address) {
      query = query.eq('wallet_address', wallet_address.toLowerCase())
    }

    // Search functionality (search in name, description, artist_name)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,artist_name.ilike.%${search}%`)
    }

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Filter by artist
    if (artist) {
      query = query.eq('artist_name', artist)
    }

    // Sorting
    switch (sortBy) {
      case 'trending':
        query = query.order('view_count', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
    }

    // Get total count for pagination (only if not filtering by wallet_address)
    let totalCount = 0
    if (!wallet_address) {
      let countQuery = supabase.from('nfts').select('*', { count: 'exact', head: true })
      
      if (search) {
        countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,artist_name.ilike.%${search}%`)
      }
      if (category && category !== 'all') {
        countQuery = countQuery.eq('category', category)
      }
      if (artist) {
        countQuery = countQuery.eq('artist_name', artist)
      }

      const { count } = await countQuery
      totalCount = count || 0
    }

    return NextResponse.json({ 
      nfts: data || [], 
      totalCount,
      hasMore: data && data.length === limit
    })

  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}