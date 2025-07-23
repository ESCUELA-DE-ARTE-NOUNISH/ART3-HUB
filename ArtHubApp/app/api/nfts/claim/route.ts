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

    console.log('\\n🎫 PROCESSING NFT CLAIM')
    console.log('=======================')
    console.log('🔑 Claim Code:', claimCode)
    console.log('👤 User Wallet:', walletAddress)
    console.log('📊 Transaction Hash:', txHash || 'None')
    console.log('🎯 Token ID:', tokenId || 'None')
    console.log('🕐 Timestamp:', new Date().toISOString())

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
    
    console.log('\\n✅ CLAIM CODE VALIDATION SUCCESSFUL')
    console.log('===================================')
    console.log('🎨 NFT Title:', dbValidation.nft?.title)
    console.log('📅 Created:', dbValidation.nft?.createdAt)
    console.log('🔑 Claim Code:', dbValidation.nft?.claimCode)
    console.log('🖼️ Image URL:', dbValidation.nft?.imageUrl)
    console.log('📄 Metadata URL:', dbValidation.nft?.metadataUrl)
    console.log('📍 Database validation approach: ACTIVE')
    
    // Get the contract address from the NFT record
    const contractAddress = dbValidation.nft!.contractAddress
    if (!contractAddress) {
      console.log('❌ Contract not deployed yet')
      return NextResponse.json({ 
        success: false, 
        message: 'NFT contract not deployed yet. Please contact admin.'
      })
    }
    
    console.log('\\n📍 CONTRACT DETAILS')
    console.log('===================')
    console.log('📍 Contract Address:', contractAddress)
    console.log('🌐 Network: Base Sepolia')
    console.log('🎯 Expected Approach: ownerMint (with claimNFT fallback)')
    
    // Call the smart contract's ownerMint function via gasless relayer (no claim codes needed!)
    let blockchainResult;
    try {
      console.log("🚀 Calling ownerMint on smart contract via gasless relayer (database-only validation)...")
      
      // Use relative URL to avoid port issues between localhost:3000 and localhost:3001
      const protocol = req.headers.get('x-forwarded-proto') || 'http'
      const host = req.headers.get('host') || 'localhost:3000'
      const baseUrl = `${protocol}://${host}`
      
      // CRITICAL: Ensure metadata is uploaded BEFORE minting
      console.log('📄 Checking metadata URL before minting...')
      let metadataURI = dbValidation.nft!.metadataUrl
      
      // If no metadata URL exists, upload metadata BEFORE calling gasless relay
      if (!metadataURI) {
        console.log('⚠️ No metadata URL found, uploading metadata to IPFS before minting...')
        try {
          const metadataHash = await NFTClaimService.uploadMetadataToPinata(dbValidation.nft!)
          // Refresh NFT data to get the updated metadata URL
          const refreshedValidation = await NFTClaimService.verifyClaimCode(claimCode, walletAddress)
          if (refreshedValidation.valid && refreshedValidation.nft?.metadataUrl) {
            metadataURI = refreshedValidation.nft.metadataUrl
            console.log('✅ Metadata uploaded successfully before minting:', metadataURI)
          } else {
            console.log('⚠️ Metadata upload succeeded but URL not found, using IPFS hash fallback')
            metadataURI = `https://ipfs.io/ipfs/${metadataHash}`
          }
        } catch (error) {
          console.error('❌ Failed to upload metadata before minting:', error)
          // Use fallback metadata but log the issue
          metadataURI = 'https://ipfs.io/ipfs/QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L'
          console.warn('📄 Using fallback metadata URI due to upload failure')
        }
      } else {
        console.log('✅ Metadata URL already exists:', metadataURI)
      }
      
      console.log('📄 Final metadata URI confirmed for minting:', metadataURI)
      console.log('🎯 Using ownerMint - no claim codes needed on contract!')
      console.log(`🌐 Calling gasless relay at: ${baseUrl}/api/gasless-relay`)
      
      // 🔍 CRITICAL DEBUG: Log exactly what we're sending to gasless relay
      console.log('\\n🔍 CRITICAL DEBUG: Payload being sent to gasless relay:')
      console.log('======================================================')
      console.log('📄 metadataURI being sent:', JSON.stringify(metadataURI))
      console.log('📄 metadataURI type:', typeof metadataURI)
      console.log('📄 metadataURI length:', metadataURI?.length)
      console.log('======================================================')
      
      // 🔍 DEBUG: Test metadata URL accessibility
      if (metadataURI && metadataURI.startsWith('http')) {
        try {
          console.log('🧪 TESTING: Verifying metadata URL is accessible...')
          const testResponse = await fetch(metadataURI)
          if (testResponse.ok) {
            const testMetadata = await testResponse.json()
            console.log('✅ METADATA TEST SUCCESS:', {
              url: metadataURI,
              name: testMetadata.name,
              description: testMetadata.description,
              image: testMetadata.image?.substring(0, 50) + '...'
            })
          } else {
            console.error('❌ METADATA TEST FAILED:', testResponse.status, testResponse.statusText)
          }
        } catch (metaTestError) {
          console.error('❌ METADATA TEST ERROR:', metaTestError.message)
        }
      }
      
      const gaslessResponse = await fetch(`${baseUrl}/api/gasless-relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'claimNFT', // Will try ownerMint first, fallback to claimNFT
          contractAddress,
          userAddress: walletAddress,
          claimCode, // Include for legacy contract compatibility
          metadataURI: metadataURI,
          chainId: 84532 // Base Sepolia for now
        })
      });
      
      if (!gaslessResponse.ok) {
        console.error(`❌ Gasless relay failed with status: ${gaslessResponse.status} ${gaslessResponse.statusText}`)
        
        let errorMessage = `Gasless relay failed (${gaslessResponse.status})`
        try {
          const errorData = await gaslessResponse.json();
          errorMessage = `Gasless relay failed: ${errorData.error || errorData.message || errorData}`
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), get text
          try {
            const errorText = await gaslessResponse.text();
            console.error(`❌ Non-JSON error response:`, errorText.substring(0, 200))
            errorMessage = `Gasless relay failed: ${gaslessResponse.status} ${gaslessResponse.statusText}`
          } catch (textError) {
            console.error(`❌ Could not parse error response:`, textError)
          }
        }
        
        throw new Error(errorMessage);
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
    
    console.log('\\n🎉 CLAIM PROCESSING COMPLETE!')
    console.log('==============================')
    console.log('✅ Database Status:', claimResult.success ? 'Updated' : 'Failed')
    console.log('🔗 Transaction Hash:', blockchainResult.transactionHash || blockchainResult.txHash)
    console.log('🎯 Token ID:', blockchainResult.tokenId)
    console.log('📍 Contract:', contractAddress)
    console.log('🎨 NFT:', dbValidation.nft!.title)
    console.log('👤 Owner:', walletAddress)
    console.log('🕐 Completed:', new Date().toISOString())
    console.log('==============================\\n')
    
    return NextResponse.json({
      ...claimResult,
      // Add blockchain transaction details
      txHash: blockchainResult.transactionHash || blockchainResult.txHash,
      tokenId: blockchainResult.tokenId,
      contractAddress: contractAddress,
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