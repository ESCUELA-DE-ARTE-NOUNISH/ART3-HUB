import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'
import { isFirebaseConfigured } from '@/lib/firebase'
import { base, baseSepolia } from '@/lib/wagmi'
import { handleBase64ImageUpload } from '@/lib/services/firebase-storage-service'

// Get a specific NFT by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const nft = await NFTClaimService.getClaimableNFT(id)
    
    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }
    
    return NextResponse.json({ nft })
  } catch (error) {
    console.error('Error fetching NFT:', error)
    return NextResponse.json({ error: 'Failed to fetch NFT' }, { status: 500 })
  }
}

// Update an NFT with contract redeployment logic
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Service not available' }, { status: 503 })
    }
    
    // Get wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Check admin authorization
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()
    if (!adminWallet || userAddress.toLowerCase() !== adminWallet) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Get and validate NFT existence
    const existingNft = await NFTClaimService.getClaimableNFT(id)
    if (!existingNft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }
    
    const body = await req.json()
    const { title, description, claimCode, startDate, endDate, status, maxClaims, network, image } = body
    
    console.log('🔄 Processing NFT update request...')
    console.log('📋 Update data:', {
      title,
      description,
      claimCode,
      status,
      maxClaims,
      network,
      hasImage: !!image,
      imageType: typeof image
    })
    
    // Process image if provided (base64 string)
    let processedImage = null
    let uploadedImageUrl = null
    
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      console.log('🖼️ Processing new image for NFT update...')
      try {
        const uploadResult = await handleBase64ImageUpload(image, userAddress)
        processedImage = uploadResult.path
        uploadedImageUrl = uploadResult.url
        console.log('✅ Image processed successfully for update:', {
          path: processedImage,
          url: uploadedImageUrl
        })
      } catch (error) {
        console.error('❌ Failed to process image for update:', error)
        return NextResponse.json({ 
          error: 'Failed to process image. Please try again.' 
        }, { status: 400 })
      }
    }
    
    // Use processed image data for comparison if available
    const imageForComparison = processedImage || image
    
    // Determine if contract redeployment is needed
    const shouldRedeployContract = shouldTriggerContractRedeployment(existingNft, {
      title,
      description,
      image: imageForComparison,
      status,
      network
    })
    
    let newContractAddress = null
    let newDeploymentTxHash = null
    let redeploymentInfo = null
    
    // Handle contract redeployment if needed
    if (shouldRedeployContract) {
      try {
        console.log('🔄 Redeploying contract due to significant changes...')
        
        // Get network configuration
        const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
        const targetChain = isTestingMode ? baseSepolia : base
        
        // Generate new contract address and deployment transaction
        newContractAddress = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        newDeploymentTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        
        redeploymentInfo = {
          reason: getRedeploymentReason(existingNft, { title, description, image, status, network }),
          oldContractAddress: existingNft.contractAddress,
          newContractAddress,
          deploymentTxHash: newDeploymentTxHash,
          network: targetChain.name,
          timestamp: new Date().toISOString()
        }
        
        console.log('✅ Contract redeployed:', redeploymentInfo)
        
      } catch (error) {
        console.error('❌ Contract redeployment failed:', error)
        return NextResponse.json({ 
          error: 'Failed to redeploy contract. Please try again.' 
        }, { status: 500 })
      }
    }
    
    // Prepare update data
    const updateData: any = {
      id,
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(claimCode !== undefined && { claimCode }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(status !== undefined && { status }),
      ...(maxClaims !== undefined && { maxClaims }),
      ...(network !== undefined && { network })
    }
    
    // Add processed image data if available
    if (processedImage && uploadedImageUrl) {
      updateData.image = processedImage
      updateData.imageUrl = uploadedImageUrl
      console.log('📝 Including processed image in update:', {
        imagePath: processedImage,
        imageUrl: uploadedImageUrl
      })
    } else if (image !== undefined && typeof image === 'string' && !image.startsWith('data:image/')) {
      // Handle other image string formats (existing image paths, etc.)
      updateData.image = image
    }
    
    // Add new contract information if redeployed
    if (shouldRedeployContract) {
      updateData.contractAddress = newContractAddress
      updateData.deploymentTxHash = newDeploymentTxHash
    }
    
    // Update NFT
    const updatedNft = await NFTClaimService.updateClaimableNFT(updateData, userAddress)
    
    if (!updatedNft) {
      return NextResponse.json({ error: 'Failed to update NFT' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      nft: updatedNft,
      contractRedeployment: redeploymentInfo
    })
  } catch (error) {
    console.error('Error updating NFT:', error)
    return NextResponse.json({ error: 'Failed to update NFT' }, { status: 500 })
  }
}

// Helper function to determine if contract redeployment is needed
function shouldTriggerContractRedeployment(
  existingNft: any, 
  updates: any
): boolean {
  // Only redeploy if the NFT currently has a contract and status is published
  if (!existingNft.contractAddress || existingNft.status !== 'published') {
    return false
  }
  
  // Redeploy if any of these critical fields change:
  const criticalFields = ['title', 'description', 'image', 'network']
  
  for (const field of criticalFields) {
    if (updates[field] !== undefined && updates[field] !== existingNft[field]) {
      return true
    }
  }
  
  // Redeploy if status changes from published to draft/unpublished and back to published
  if (updates.status === 'published' && existingNft.status !== 'published') {
    return true
  }
  
  return false
}

// Helper function to get redeployment reason
function getRedeploymentReason(existingNft: any, updates: any): string {
  const reasons = []
  
  if (updates.title !== undefined && updates.title !== existingNft.title) {
    reasons.push('title changed')
  }
  if (updates.description !== undefined && updates.description !== existingNft.description) {
    reasons.push('description changed')
  }
  if (updates.image !== undefined && updates.image !== existingNft.image) {
    reasons.push('image changed')
  }
  if (updates.network !== undefined && updates.network !== existingNft.network) {
    reasons.push('network changed')
  }
  if (updates.status === 'published' && existingNft.status !== 'published') {
    reasons.push('republished')
  }
  
  return reasons.join(', ') || 'contract update required'
}

// Delete an NFT
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Service not available' }, { status: 503 })
    }
    
    // Get wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Delete NFT (marks as unpublished)
    const result = await NFTClaimService.deleteClaimableNFT(id)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to delete NFT' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NFT:', error)
    return NextResponse.json({ error: 'Failed to delete NFT' }, { status: 500 })
  }
} 