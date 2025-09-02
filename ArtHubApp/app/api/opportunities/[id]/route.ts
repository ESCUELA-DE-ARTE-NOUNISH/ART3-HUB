import { NextRequest, NextResponse } from 'next/server'
import { FirebaseOpportunitiesService } from '@/lib/services/firebase-opportunities-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    console.log('🔍 GET /api/opportunities/[id]:', id)

    const opportunity = await FirebaseOpportunitiesService.getOpportunity(id)

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found opportunity:', opportunity.title)

    return NextResponse.json({
      success: true,
      data: opportunity
    })

  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch opportunity',
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
    const { id } = params
    const body = await request.json()
    
    console.log('✏️ PUT /api/opportunities/[id]:', id, {
      title: body.title,
      status: body.status
    })

    // Update the opportunity
    const updatedOpportunity = await FirebaseOpportunitiesService.updateOpportunity(id, body)

    if (!updatedOpportunity) {
      return NextResponse.json(
        { success: false, error: 'Failed to update opportunity or opportunity not found' },
        { status: 404 }
      )
    }

    console.log('✅ Updated opportunity:', updatedOpportunity.title)

    return NextResponse.json({
      success: true,
      data: updatedOpportunity
    })

  } catch (error) {
    console.error('❌ Error in PUT /api/opportunities/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update opportunity',
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
    const { id } = params
    
    console.log('🗑️ DELETE /api/opportunities/[id]:', id)

    const success = await FirebaseOpportunitiesService.deleteOpportunity(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete opportunity' },
        { status: 404 }
      )
    }

    console.log('✅ Deleted opportunity:', id)

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error in DELETE /api/opportunities/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete opportunity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}