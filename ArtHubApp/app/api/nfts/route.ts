import { NextRequest, NextResponse } from 'next/server'
import { FirebaseNFTService, getCurrentNetworkInfo } from '@/lib/services/firebase-nft-service'
import { isFirebaseConfigured } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not properly configured')
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
      royalty_percentage,
      contract_address,
      token_id
    } = await request.json()

    if (!wallet_address || !name || !image_ipfs_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create NFT record using Firebase service
    const nftData = {
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
      source: 'user_created' as const
    }

    const nft = await FirebaseNFTService.createNFT(nftData)

    if (!nft) {
      console.error('Failed to create NFT')
      return NextResponse.json({ error: 'Failed to store NFT data' }, { status: 500 })
    }

    console.log('✅ NFT stored successfully:', nft)
    return NextResponse.json({ success: true, nft })

  } catch (error) {
    console.error('Error storing NFT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const wallet_address = searchParams.get('wallet_address')
    const search = searchParams.get('search')
    const network = searchParams.get('network')

    let nfts = []

    if (wallet_address) {
      // Get NFTs for specific wallet with current network filtering
      const networkInfo = getCurrentNetworkInfo()
      console.log(`🔍 Fetching NFTs for wallet ${wallet_address} on network:`, networkInfo.network)
      nfts = await FirebaseNFTService.getNFTsByWalletAndNetwork(wallet_address, networkInfo.network)
    } else if (search) {
      // Search NFTs by name
      nfts = await FirebaseNFTService.searchNFTsByName(search)
    } else if (network) {
      // Get NFTs by network
      nfts = await FirebaseNFTService.getNFTsByNetwork(network)
    } else {
      // Get all NFTs for current network (prevent cross-network display)
      const networkInfo = getCurrentNetworkInfo()
      console.log('🌐 Getting all NFTs for current network:', networkInfo.network)
      nfts = await FirebaseNFTService.getNFTsByNetwork(networkInfo.network)
    }

    return NextResponse.json({ 
      nfts: nfts || [], 
      totalCount: nfts?.length || 0,
      hasMore: false
    })

  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    
    const { searchParams } = new URL(request.url)
    const nftId = searchParams.get('id')
    
    if (!nftId) {
      return NextResponse.json({ error: 'NFT ID is required' }, { status: 400 })
    }
    
    const updateData = await request.json()
    
    // Update NFT record using Firebase service
    const updatedNFT = await FirebaseNFTService.updateNFT(nftId, updateData)
    
    if (!updatedNFT) {
      return NextResponse.json({ error: 'Failed to update NFT' }, { status: 500 })
    }
    
    console.log('✅ NFT updated successfully:', nftId)
    return NextResponse.json({ success: true, nft: updatedNFT })
    
  } catch (error) {
    console.error('Error updating NFT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}