import { NextRequest, NextResponse } from 'next/server'
import { FirebaseCommunitiesService } from '@/lib/services/firebase-communities-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id

    console.log('🔍 GET /api/communities/[id]', { communityId })

    const community = await FirebaseCommunitiesService.getCommunity(communityId)

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    console.log('✅ Returning community:', communityId)

    return NextResponse.json({
      success: true,
      data: community
    })

  } catch (error) {
    console.error('❌ Error in GET /api/communities/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch community',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id
    const body = await request.json()
    
    console.log('✏️ PUT /api/communities/[id]', { 
      communityId, 
      title: body.title,
      status: body.status 
    })

    // Update the community
    const updatedCommunity = await FirebaseCommunitiesService.updateCommunity(communityId, {
      title: body.title,
      description: body.description,
      links: body.links,
      status: body.status,
      featured: body.featured
    })

    if (!updatedCommunity) {
      return NextResponse.json(
        { success: false, error: 'Failed to update community' },
        { status: 500 }
      )
    }

    console.log('✅ Updated community:', communityId)

    return NextResponse.json({
      success: true,
      data: updatedCommunity
    })

  } catch (error) {
    console.error('❌ Error in PUT /api/communities/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update community',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id

    console.log('🗑️ DELETE /api/communities/[id]', { communityId })

    const success = await FirebaseCommunitiesService.deleteCommunity(communityId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete community' },
        { status: 500 }
      )
    }

    console.log('✅ Deleted community:', communityId)

    return NextResponse.json({
      success: true,
      message: 'Community deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error in DELETE /api/communities/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete community',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}