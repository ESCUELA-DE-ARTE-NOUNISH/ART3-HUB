import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    // Get the claim code from the URL query parameters
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    
    // Validate the code
    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        message: 'No claim code provided' 
      })
    }
    
    // Get user wallet address from session
    const walletAddress = await getSessionUserAddress(req)
    
    // First check if the code is valid, even without a wallet
    const codeValidation = await NFTClaimService.validateCodeOnly(code)
    
    if (!codeValidation.valid) {
      return NextResponse.json({
        valid: false,
        message: codeValidation.message || 'Invalid claim code'
      })
    }
    
    // If code is valid but no wallet is connected
    if (!walletAddress) {
      return NextResponse.json({ 
        valid: true,
        needsWallet: true, 
        message: 'Code is valid. Please connect your wallet to continue.',
        nft: codeValidation.nft ? {
          id: codeValidation.nft.id,
          title: codeValidation.nft.title,
          description: codeValidation.nft.description,
          imageUrl: codeValidation.nft.imageUrl || codeValidation.nft.image,
          contractAddress: codeValidation.nft.contractAddress || '0x1234567890123456789012345678901234567890',
          network: codeValidation.nft.network || 'baseSepolia'
        } : null
      })
    }
    
    // If wallet is connected, perform full validation
    const validation = await NFTClaimService.verifyClaimCode(code, walletAddress)
    
    return NextResponse.json({
      valid: validation.valid,
      message: validation.message || (validation.valid ? 'Valid claim code' : 'Invalid claim code'),
      nft: validation.nft ? {
        id: validation.nft.id,
        title: validation.nft.title,
        description: validation.nft.description,
        imageUrl: validation.nft.imageUrl || validation.nft.image,
        contractAddress: validation.nft.contractAddress || '0x1234567890123456789012345678901234567890',
        network: validation.nft.network || 'baseSepolia'
      } : null
    })
  } catch (error) {
    console.error('Error verifying claim code:', error)
    return NextResponse.json(
      { valid: false, message: 'Failed to verify claim code' },
      { status: 500 }
    )
  }
} 