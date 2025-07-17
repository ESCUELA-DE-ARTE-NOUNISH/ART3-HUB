import { NextRequest, NextResponse } from 'next/server'
import { isFirebaseConfigured } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    
    console.log('📥 Creating collection with data:', body)
    
    // Collections are now managed on-chain with V6 contracts
    // This endpoint is deprecated in favor of contract-based storage
    return NextResponse.json({ 
      message: 'Collections are now managed on-chain with Art3Hub V6 contracts',
      success: true,
      collection: {
        contract_address: body.contract_address,
        name: body.name,
        symbol: body.symbol,
        network: body.network
      }
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
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')
    const contractAddress = searchParams.get('contract_address')
    
    console.log('📖 Fetching collections - wallet:', walletAddress, 'contract:', contractAddress)
    
    // Collections are now managed on-chain with V6 contracts
    // Return empty array for now - implement contract reading later
    return NextResponse.json({ 
      message: 'Collections are now managed on-chain with Art3Hub V6 contracts',
      success: true, 
      collections: [],
      count: 0
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
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { contract_address, ...updateData } = body
    
    if (!contract_address) {
      return NextResponse.json(
        { error: 'contract_address is required for updates' },
        { status: 400 }
      )
    }
    
    console.log('📝 Updating collection:', contract_address, updateData)
    
    // Collections are now managed on-chain with V6 contracts
    // This endpoint is deprecated in favor of contract-based storage
    return NextResponse.json({ 
      message: 'Collection updates are now managed on-chain with Art3Hub V6 contracts',
      success: true,
      collection: {
        contract_address,
        ...updateData
      }
    })
    
  } catch (error) {
    console.error('❌ Error in collections PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}