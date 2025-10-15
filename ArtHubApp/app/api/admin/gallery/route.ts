import { NextRequest, NextResponse } from 'next/server'
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'
import { adminService } from '@/lib/services/admin-service'

/**
 * GET /api/admin/gallery
 * Get paginated NFTs for admin gallery management
 * Query params: page, limit, filter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'gallery' | 'not_gallery'

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Validate filter parameter
    if (!['all', 'gallery', 'not_gallery'].includes(filter)) {
      return NextResponse.json(
        { error: 'Invalid filter parameter' },
        { status: 400 }
      )
    }

    // Fetch paginated NFTs
    const result = await FirebaseNFTService.getAdminGalleryNFTs(page, limit, filter)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/gallery
 * Toggle NFT gallery status
 * Body: { nftId: string, inGallery: boolean, adminWallet: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nftId, inGallery, adminWallet } = body

    // Validate required fields
    if (!nftId || typeof inGallery !== 'boolean' || !adminWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, inGallery, adminWallet' },
        { status: 400 }
      )
    }

    // Verify admin permissions using Firebase admin service
    const isAdmin = await adminService.isAdmin(adminWallet)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      )
    }

    // Toggle gallery status
    const updatedNft = await FirebaseNFTService.toggleGalleryStatus(
      nftId,
      inGallery,
      adminWallet
    )

    if (!updatedNft) {
      return NextResponse.json(
        { error: 'NFT not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      nft: updatedNft
    })
  } catch (error) {
    console.error('Error in POST /api/admin/gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
