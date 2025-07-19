import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'

// ABI for ClaimableNFT contract
const CLAIMABLE_NFT_ABI = [
  {
    inputs: [{ name: "claimCode", type: "string" }],
    name: "claimNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "claimCode", type: "string" },
      { name: "user", type: "address" }
    ],
    name: "validateClaimCode",
    outputs: [
      { name: "valid", type: "bool" },
      { name: "message", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const

export async function POST(req: NextRequest) {
  try {
    // Extract claim code from request body
    const body = await req.json()
    const { claimCode, txHash, tokenId } = body
    
    // Get user wallet address from session
    const walletAddress = await getSessionUserAddress(req)
    if (!walletAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Validate inputs
    if (!claimCode) {
      return NextResponse.json({ error: 'Claim code is required' }, { status: 400 })
    }

    console.log("Processing claim for code:", claimCode)
    console.log("User wallet:", walletAddress)
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
    
    // Get the contract address from the NFT record
    const contractAddress = dbValidation.nft!.contractAddress
    if (!contractAddress) {
      return NextResponse.json({ 
        success: false, 
        message: 'NFT contract not deployed yet. Please contact admin.'
      })
    }
    
    console.log("Using contract address:", contractAddress)
    
    // Call the smart contract's claimNFT function via gasless relayer
    let blockchainResult;
    try {
      console.log("🚀 Calling claimNFT on smart contract via gasless relayer...")
      
      // Call gasless relayer to execute claimNFT on the contract
      const gaslessResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gasless-relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'claimNFT',
          contractAddress,
          claimCode,
          userAddress: walletAddress,
          chainId: 84532 // Base Sepolia for now
        })
      });
      
      if (!gaslessResponse.ok) {
        const errorData = await gaslessResponse.json();
        throw new Error(`Gasless relay failed: ${errorData.error || errorData.message}`);
      }
      
      blockchainResult = await gaslessResponse.json();
      console.log("✅ Blockchain claim successful:", blockchainResult);
      
    } catch (blockchainError) {
      console.error("❌ Blockchain claim failed:", blockchainError);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to claim NFT on blockchain: ${blockchainError instanceof Error ? blockchainError.message : 'Unknown error'}`
      });
    }
    
    // Process the claim in our database with transaction details
    const claimResult = await NFTClaimService.processClaim(
      dbValidation.nft!.id, 
      walletAddress,
      blockchainResult.transactionHash || blockchainResult.txHash,
      blockchainResult.tokenId,
      contractAddress // Use the contract address from the NFT record
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