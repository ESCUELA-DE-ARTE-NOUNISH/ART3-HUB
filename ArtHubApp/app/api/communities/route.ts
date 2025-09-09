import { NextRequest, NextResponse } from 'next/server'
import { FirebaseCommunitiesService } from '@/lib/services/firebase-communities-service'
import { AITranslationService } from '@/lib/services/ai-translation-service'
import { type Community } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const admin = searchParams.get('admin') === 'true'
    const locale = searchParams.get('locale') || 'en'

    console.log('🔍 GET /api/communities', {
      featured,
      limit,
      search,
      status,
      admin,
      locale
    })

    let communities: Community[] = []

    if (search) {
      // Search communities
      communities = await FirebaseCommunitiesService.searchCommunities(search)
    } else if (admin) {
      // Admin view - get all communities
      communities = await FirebaseCommunitiesService.getAllCommunities(status || undefined)
    } else if (featured) {
      // Get featured communities
      communities = await FirebaseCommunitiesService.getFeaturedCommunities(limit)
    } else {
      // Get published communities
      communities = await FirebaseCommunitiesService.getPublishedCommunities(limit)
    }

    // Apply translations if locale is not English
    if (locale !== 'en' && communities.length > 0) {
      console.log(`🌍 Applying translations for locale: ${locale}`)
      
      const translatedCommunities = await Promise.all(
        communities.map(async (community) => {
          try {
            const translatedContent = await AITranslationService.getOrCreateTranslation(
              community.id,
              {
                title: community.title,
                description: community.description
              },
              locale,
              'community'
            )

            return {
              ...community,
              title: translatedContent.title,
              description: translatedContent.description
            }
          } catch (error) {
            console.error(`❌ Translation failed for community ${community.id}:`, error)
            return community // Return original if translation fails
          }
        })
      )

      communities = translatedCommunities
    }

    console.log(`✅ Returning ${communities.length} communities (locale: ${locale})`)

    return NextResponse.json({
      success: true,
      data: communities,
      count: communities.length,
      locale
    })

  } catch (error) {
    console.error('❌ Error in GET /api/communities:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch communities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('➕ POST /api/communities', {
      title: body.title,
      status: body.status
    })

    // Validate required fields
    const requiredFields = ['title', 'description', 'created_by']
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

    // Create the community
    const newCommunity = await FirebaseCommunitiesService.createCommunity({
      title: body.title,
      description: body.description,
      links: body.links || [],
      status: body.status || 'draft',
      featured: body.featured || false,
      created_by: body.created_by
    })

    if (!newCommunity) {
      return NextResponse.json(
        { success: false, error: 'Failed to create community' },
        { status: 500 }
      )
    }

    console.log('✅ Created community:', newCommunity.id)

    return NextResponse.json({
      success: true,
      data: newCommunity
    })

  } catch (error) {
    console.error('❌ Error in POST /api/communities:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create community',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}