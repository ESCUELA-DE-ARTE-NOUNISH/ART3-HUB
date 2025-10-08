import { NextRequest, NextResponse } from 'next/server'
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'
import { adminService } from '@/lib/services/admin-service'

/**
 * POST /api/admin/gallery/bulk
 * Bulk toggle gallery status for multiple NFTs
 * Body: { nftIds: string[], inGallery: boolean, adminWallet: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nftIds, inGallery, adminWallet } = body

    // Validate required fields
    if (!Array.isArray(nftIds) || nftIds.length === 0 || typeof inGallery !== 'boolean' || !adminWallet) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: nftIds (array), inGallery (boolean), adminWallet (string)' },
        { status: 400 }
      )
    }

    // Limit bulk operations to prevent abuse
    if (nftIds.length > 50) {
      return NextResponse.json(
        { error: 'Bulk operation limited to 50 NFTs at a time' },
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

    // Perform bulk toggle
    const successCount = await FirebaseNFTService.bulkToggleGalleryStatus(
      nftIds,
      inGallery,
      adminWallet
    )

    return NextResponse.json({
      success: true,
      updatedCount: successCount,
      totalRequested: nftIds.length,
      failedCount: nftIds.length - successCount
    })
  } catch (error) {
    console.error('Error in POST /api/admin/gallery/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
