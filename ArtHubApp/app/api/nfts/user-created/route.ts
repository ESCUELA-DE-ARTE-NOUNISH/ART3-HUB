import { NextRequest, NextResponse } from 'next/server'
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Get only user-created NFTs (excluding claimable NFTs)
    const userCreatedNfts = await FirebaseNFTService.getUserCreatedNFTsByWallet(walletAddress)

    return NextResponse.json({
      count: userCreatedNfts.length,
      nfts: userCreatedNfts
    })
  } catch (error) {
    console.error('Error fetching user-created NFTs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user-created NFTs' },
      { status: 500 }
    )
  }
}