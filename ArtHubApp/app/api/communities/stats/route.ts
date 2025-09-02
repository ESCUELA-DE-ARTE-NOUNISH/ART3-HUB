import { NextRequest, NextResponse } from 'next/server'
import { FirebaseCommunitiesService } from '@/lib/services/firebase-communities-service'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/communities/stats')

    const stats = await FirebaseCommunitiesService.getCommunitiesStatistics()

    console.log('✅ Returning communities statistics')

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('❌ Error in GET /api/communities/stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch communities statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}