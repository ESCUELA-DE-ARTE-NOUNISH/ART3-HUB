import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'
import { isFirebaseConfigured } from '@/lib/firebase'

// Get a specific NFT by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nft = await NFTClaimService.getClaimableNFT(params.id)
    
    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }
    
    return NextResponse.json({ nft })
  } catch (error) {
    console.error('Error fetching NFT:', error)
    return NextResponse.json({ error: 'Failed to fetch NFT' }, { status: 500 })
  }
}

// Update an NFT
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Service not available' }, { status: 503 })
    }
    
    // Get wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Get and validate NFT existence
    const existingNft = await NFTClaimService.getClaimableNFT(params.id)
    if (!existingNft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }
    
    const body = await req.json()
    const { title, description, claimCode, startDate, endDate, status, maxClaims, network, image } = body
    
    // Update NFT
    const updatedNft = await NFTClaimService.updateClaimableNFT({
      id: params.id,
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(claimCode !== undefined && { claimCode }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(status !== undefined && { status }),
      ...(maxClaims !== undefined && { maxClaims }),
      ...(network !== undefined && { network })
    }, userAddress)
    
    if (!updatedNft) {
      return NextResponse.json({ error: 'Failed to update NFT' }, { status: 500 })
    }
    
    return NextResponse.json({ nft: updatedNft })
  } catch (error) {
    console.error('Error updating NFT:', error)
    return NextResponse.json({ error: 'Failed to update NFT' }, { status: 500 })
  }
}

// Delete an NFT
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Service not available' }, { status: 503 })
    }
    
    // Get wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Delete NFT (marks as unpublished)
    const result = await NFTClaimService.deleteClaimableNFT(params.id)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to delete NFT' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NFT:', error)
    return NextResponse.json({ error: 'Failed to delete NFT' }, { status: 500 })
  }
} 