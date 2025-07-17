import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserAddress } from '@/lib/utils'
import { FirebaseStorageService } from '@/lib/services/firebase-storage-service'
import { NFTClaimService } from '@/lib/services/nft-claim-service'

export async function POST(req: NextRequest) {
  try {
    // Get user wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const nftId = formData.get('nftId') as string
    
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!nftId) {
      return NextResponse.json({ error: 'NFT ID is required' }, { status: 400 })
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }
    
    // Get NFT to verify ownership
    const nft = await NFTClaimService.getClaimableNFT(nftId)
    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }
    
    // Check if user is the creator
    if (nft.createdBy.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized to update this NFT' }, { status: 403 })
    }
    
    // Upload image to Firebase Storage
    const uploadResult = await FirebaseStorageService.uploadFile(
      file,
      `nft-images/${userAddress}/${nftId}`
    )
    
    // Update NFT with new image URL
    await NFTClaimService.updateClaimableNFT({
      id: nftId,
      image: uploadResult.path,
      imageUrl: uploadResult.url
    }, userAddress)
    
    // If NFT is published, update metadata on IPFS
    if (nft.status === 'published') {
      // Get updated NFT with new image URL
      const updatedNft = await NFTClaimService.getClaimableNFT(nftId)
      if (updatedNft) {
        await NFTClaimService.uploadMetadataToPinata(updatedNft)
      }
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.url,
      imagePath: uploadResult.path
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
} 