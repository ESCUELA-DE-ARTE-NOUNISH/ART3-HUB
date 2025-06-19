import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📥 Creating collection with data:', body)
    
    // Validate required fields
    const requiredFields = ['wallet_address', 'contract_address', 'name', 'symbol', 'network', 'chain_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Insert collection into database
    const { data, error } = await supabase
      .from('collections')
      .insert({
        wallet_address: body.wallet_address,
        contract_address: body.contract_address,
        name: body.name,
        symbol: body.symbol,
        description: body.description || null,
        image: body.image || null,
        external_url: body.external_url || null,
        royalty_recipient: body.royalty_recipient || body.wallet_address,
        royalty_fee_numerator: body.royalty_fee_numerator || 250,
        network: body.network,
        chain_id: body.chain_id,
        factory_address: body.factory_address || null,
        transaction_hash: body.transaction_hash || null,
        gasless_transaction_hash: body.gasless_transaction_hash || body.transaction_hash,
        opensea_collection_url: body.opensea_collection_url || null,
        total_nfts: 0
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error creating collection:', error)
      return NextResponse.json(
        { error: 'Failed to create collection in database' },
        { status: 500 }
      )
    }

    console.log('✅ Collection created successfully:', data.id)
    
    return NextResponse.json({ 
      success: true, 
      collection: data,
      message: 'Collection created successfully' 
    })

  } catch (error) {
    console.error('❌ Error in collections API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')
    const contractAddress = searchParams.get('contract_address')
    
    let query = supabase.from('collections').select('*')
    
    // Filter by wallet address if provided
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress)
    }
    
    // Filter by contract address if provided
    if (contractAddress) {
      query = query.eq('contract_address', contractAddress)
    }
    
    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Database error fetching collections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      collections: data || [],
      count: data?.length || 0
    })
    
  } catch (error) {
    console.error('❌ Error in collections GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { contract_address, ...updateData } = body
    
    if (!contract_address) {
      return NextResponse.json(
        { error: 'contract_address is required for updates' },
        { status: 400 }
      )
    }
    
    console.log('📝 Updating collection:', contract_address, updateData)
    
    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('contract_address', contract_address)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Database error updating collection:', error)
      return NextResponse.json(
        { error: 'Failed to update collection' },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Collection updated successfully:', data.id)
    
    return NextResponse.json({ 
      success: true, 
      collection: data,
      message: 'Collection updated successfully' 
    })
    
  } catch (error) {
    console.error('❌ Error in collections PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}