import { NextRequest, NextResponse } from 'next/server'
import { FirebaseOpportunitiesService } from '@/lib/services/firebase-opportunities-service'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/opportunities/stats')

    const stats = await FirebaseOpportunitiesService.getOpportunityStatistics()

    console.log('✅ Opportunity statistics:', {
      totalActive: stats.totalActive,
      totalExpired: stats.totalExpired,
      categoriesCount: Object.keys(stats.totalByCategory).length
    })

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch opportunity statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/opportunities/stats - Mark expired opportunities')

    const expiredCount = await FirebaseOpportunitiesService.markExpiredOpportunities()

    console.log(`✅ Marked ${expiredCount} opportunities as expired`)

    return NextResponse.json({
      success: true,
      message: `Marked ${expiredCount} opportunities as expired`,
      expiredCount
    })

  } catch (error) {
    console.error('❌ Error in POST /api/opportunities/stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark expired opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}