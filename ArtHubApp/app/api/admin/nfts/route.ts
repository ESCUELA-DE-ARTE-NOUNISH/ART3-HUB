import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'
import { isFirebaseConfigured } from '@/lib/firebase'

// List all NFTs or create a new one
export async function GET(req: NextRequest) {
  try {
    const nfts = await NFTClaimService.getAllClaimableNFTs()
    return NextResponse.json({ nfts })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
  }
}

// Create a new NFT
export async function POST(req: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Service not available' }, { status: 503 })
    }
    
    const body = await req.json()
    const { title, description, claimCode, startDate, endDate, status, maxClaims, network, image } = body
    
    // Validate required fields
    if (!title || !description || !claimCode || !startDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, claimCode, startDate' 
      }, { status: 400 })
    }
    
    // Get wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Create NFT
    const nft = await NFTClaimService.createClaimableNFT({
      title,
      description,
      image,
      claimCode,
      startDate,
      endDate: endDate || null,
      status: status || 'draft',
      maxClaims,
      network
    }, userAddress)
    
    return NextResponse.json({ nft }, { status: 201 })
  } catch (error) {
    console.error('Error creating NFT:', error)
    return NextResponse.json({ error: 'Failed to create NFT' }, { status: 500 })
  }
} 