import { NextRequest, NextResponse } from 'next/server'
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'
import { FirebaseUserService } from '@/lib/services/firebase-user-service'
import { isFirebaseConfigured } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not properly configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get request body
    const { wallet_address, admin_key } = await request.json()

    // Simple admin check - you should replace this with proper admin authentication
    if (admin_key !== process.env.MIGRATION_ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting NFT metadata migration...')
    
    // Get all NFTs that need updating
    let nftsToUpdate: any[] = []
    
    if (wallet_address) {
      // Update NFTs for specific wallet
      nftsToUpdate = await FirebaseNFTService.getNFTsByWallet(wallet_address)
    } else {
      // Update all NFTs (use carefully)
      nftsToUpdate = await FirebaseNFTService.getAllNFTs()
    }

    console.log(`📊 Found ${nftsToUpdate.length} NFTs to check`)

    let updatedCount = 0
    const results = []

    for (const nft of nftsToUpdate) {
      let needsUpdate = false
      const updates: any = {}

      // Check if artist_name is missing or generic
      if (!nft.artist_name || 
          nft.artist_name.startsWith('Artist 0x') || 
          nft.artist_name.toLowerCase() === 'artist') {
        
        // Try to get user profile for better artist name
        try {
          const userProfile = await FirebaseUserService.getUserProfile(nft.wallet_address)
          if (userProfile && userProfile.name) {
            updates.artist_name = userProfile.name
            needsUpdate = true
          } else {
            // Set to null so our display logic handles it gracefully
            updates.artist_name = null
            needsUpdate = true
          }
        } catch (error) {
          console.log(`Could not get profile for ${nft.wallet_address}:`, error)
          updates.artist_name = null
          needsUpdate = true
        }
      }

      // Check if category is missing
      if (!nft.category) {
        updates.category = 'Digital Art' // Default category
        needsUpdate = true
      }

      // Update if needed
      if (needsUpdate) {
        try {
          await FirebaseNFTService.updateNFT(nft.id, updates)
          updatedCount++
          results.push({
            nft_id: nft.id,
            nft_name: nft.name,
            updates: updates,
            status: 'updated'
          })
          console.log(`✅ Updated NFT ${nft.name} (${nft.id})`)
        } catch (error) {
          results.push({
            nft_id: nft.id,
            nft_name: nft.name,
            error: error.message,
            status: 'error'
          })
          console.error(`❌ Failed to update NFT ${nft.id}:`, error)
        }
      } else {
        results.push({
          nft_id: nft.id,
          nft_name: nft.name,
          status: 'skipped'
        })
      }
    }

    console.log(`✅ Migration complete. Updated ${updatedCount} out of ${nftsToUpdate.length} NFTs`)

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} out of ${nftsToUpdate.length} NFTs`,
      results: results
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'NFT Metadata Migration API',
    usage: 'POST with { wallet_address?: string, admin_key: string }'
  })
}