import { NextRequest, NextResponse } from 'next/server'
import { FirebaseOpportunitiesService } from '@/lib/services/firebase-opportunities-service'
import { AITranslationService } from '@/lib/services/ai-translation-service'
import { type Opportunity } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const admin = searchParams.get('admin') === 'true'
    const locale = searchParams.get('locale') || 'en'

    console.log('🔍 GET /api/opportunities', {
      category,
      featured,
      limit,
      search,
      status,
      admin,
      locale
    })

    let opportunities: Opportunity[] = []

    if (search) {
      // Search opportunities
      opportunities = await FirebaseOpportunitiesService.searchOpportunities(search)
    } else if (admin) {
      // Admin view - get all opportunities
      opportunities = await FirebaseOpportunitiesService.getAllOpportunities(status || undefined)
    } else if (featured) {
      // Get featured opportunities
      opportunities = await FirebaseOpportunitiesService.getFeaturedOpportunities(limit)
    } else if (category) {
      // Get opportunities by category
      opportunities = await FirebaseOpportunitiesService.getOpportunitiesByCategory(category, limit)
    } else {
      // Get published opportunities
      opportunities = await FirebaseOpportunitiesService.getPublishedOpportunities(undefined, limit)
    }

    // Apply translations if locale is not English
    if (locale !== 'en' && opportunities.length > 0) {
      console.log(`🌍 Applying translations for locale: ${locale}`)
      
      const translatedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          try {
            const translatedContent = await AITranslationService.getOrCreateTranslation(
              opportunity.id,
              {
                title: opportunity.title,
                description: opportunity.description,
                organization: opportunity.organization
              },
              locale,
              'opportunity'
            )

            return {
              ...opportunity,
              title: translatedContent.title,
              description: translatedContent.description,
              organization: translatedContent.organization || opportunity.organization
            }
          } catch (error) {
            console.error(`❌ Translation failed for opportunity ${opportunity.id}:`, error)
            return opportunity // Return original if translation fails
          }
        })
      )

      opportunities = translatedOpportunities
    }

    console.log(`✅ Returning ${opportunities.length} opportunities (locale: ${locale})`)

    return NextResponse.json({
      success: true,
      data: opportunities,
      count: opportunities.length,
      locale
    })

  } catch (error) {
    console.error('❌ Error in GET /api/opportunities:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('➕ POST /api/opportunities', {
      title: body.title,
      category: body.category,
      deadline: body.deadline
    })

    // Validate required fields
    const requiredFields = ['title', 'organization', 'description', 'url', 'deadline', 'category', 'created_by']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      )
    }

    // Create the opportunity
    const newOpportunity = await FirebaseOpportunitiesService.createOpportunity({
      title: body.title,
      organization: body.organization,
      description: body.description,
      url: body.url,
      amount: body.amount || undefined,
      amount_min: body.amount_min || undefined,
      amount_max: body.amount_max || undefined,
      currency: body.currency || 'USD',
      deadline: body.deadline,
      deadline_date: new Date(body.deadline).toISOString(),
      category: body.category,
      location: body.location || undefined,
      eligibility: body.eligibility || [],
      tags: body.tags || [],
      status: body.status || 'draft',
      featured: body.featured || false,
      difficulty_level: body.difficulty_level || 'any',
      application_requirements: body.application_requirements || [],
      contact_email: body.contact_email || undefined,
      notes: body.notes || undefined,
      created_by: body.created_by
    })

    if (!newOpportunity) {
      return NextResponse.json(
        { success: false, error: 'Failed to create opportunity' },
        { status: 500 }
      )
    }

    console.log('✅ Created opportunity:', newOpportunity.id)

    return NextResponse.json({
      success: true,
      data: newOpportunity
    })

  } catch (error) {
    console.error('❌ Error in POST /api/opportunities:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create opportunity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}