import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'

// ABI snippet for the NFT contract
const NFT_ABI = [
  "function mint(address to, string memory _tokenURI) external returns (uint256)"
]

export async function POST(req: NextRequest) {
  try {
    // Extract claim code from request body
    const body = await req.json()
    const { claimCode, contractAddress, txHash, tokenId } = body
    
    // Get user wallet address from session
    const walletAddress = await getSessionUserAddress(req)
    if (!walletAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Validate inputs
    if (!claimCode) {
      return NextResponse.json({ error: 'Claim code is required' }, { status: 400 })
    }
    
    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 })
    }

    console.log("Processing claim for code:", claimCode)
    console.log("User wallet:", walletAddress)
    console.log("Contract address:", contractAddress)
    console.log("Transaction hash:", txHash)
    console.log("Token ID:", tokenId)

    // Check claim code validity in our database
    // Note: verifyClaimCode now handles case-insensitivity internally
    const dbValidation = await NFTClaimService.verifyClaimCode(claimCode, walletAddress)
    
    if (!dbValidation.valid) {
      console.log("Claim code validation failed:", dbValidation.message)
      return NextResponse.json({ 
        success: false, 
        message: dbValidation.message || 'Invalid claim code'
      })
    }
    
    console.log("Claim code validated successfully for NFT:", dbValidation.nft?.title)
    
    // Process the claim in our database with transaction details
    const claimResult = await NFTClaimService.processClaim(
      dbValidation.nft!.id, 
      walletAddress,
      txHash,
      tokenId,
      contractAddress // Pass the actual contract address used for minting
    )
    
    console.log("Claim processed successfully:", claimResult)
    
    return NextResponse.json({
      ...claimResult,
      nft: {
        id: dbValidation.nft!.id,
        title: dbValidation.nft!.title,
        description: dbValidation.nft!.description,
        imageUrl: dbValidation.nft!.imageUrl || dbValidation.nft!.image,
        claimCode: dbValidation.nft!.claimCode // Include the claim code in the response
      }
    })
  } catch (error) {
    console.error('Error processing claim:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process claim' },
      { status: 500 }
    )
  }
}

// For pre-flight verification only (no blockchain transaction)
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url)
    const claimCode = searchParams.get('code')
    
    // Get user wallet address
    const walletAddress = await getSessionUserAddress(req)
    if (!walletAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    if (!claimCode) {
      return NextResponse.json({ error: 'Claim code is required' }, { status: 400 })
    }
    
    console.log("Verifying claim code:", claimCode)
    console.log("User wallet:", walletAddress)
    
    // Verify the claim code in our database
    // Note: verifyClaimCode now handles case-insensitivity internally
    const validation = await NFTClaimService.verifyClaimCode(claimCode, walletAddress)
    
    console.log("Verification result:", validation)
    
    return NextResponse.json({
      valid: validation.valid,
      message: validation.message,
      nft: validation.nft ? {
        id: validation.nft.id,
        title: validation.nft.title,
        description: validation.nft.description,
        imageUrl: validation.nft.imageUrl || validation.nft.image
      } : null
    })
  } catch (error) {
    console.error('Error verifying claim code:', error)
    return NextResponse.json(
      { error: 'Failed to verify claim code' },
      { status: 500 }
    )
  }
} 