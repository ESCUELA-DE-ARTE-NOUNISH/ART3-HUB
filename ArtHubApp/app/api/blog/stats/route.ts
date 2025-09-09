import { NextRequest, NextResponse } from 'next/server'
import { FirebaseBlogService } from '@/lib/services/firebase-blog-service'

export async function GET(request: NextRequest) {
  try {
    const result = await FirebaseBlogService.getBlogStats()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch blog statistics'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error in blog stats route:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}