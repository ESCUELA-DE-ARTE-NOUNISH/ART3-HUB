import { NextRequest, NextResponse } from 'next/server'
import { AITranslationService } from '@/lib/services/ai-translation-service'
import { FirebaseTranslationCacheService } from '@/lib/services/firebase-translation-cache-service'
import { FirebaseOpportunitiesService } from '@/lib/services/firebase-opportunities-service'
import { FirebaseCommunitiesService } from '@/lib/services/firebase-communities-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, locales, contentTypes } = body
    
    console.log('🔄 POST /api/admin/translations', { action, locales, contentTypes })

    switch (action) {
      case 'translate': {
        // Direct translation test
        const { contentId, content, targetLocale, contentType } = body
        
        if (!contentId || !content || !targetLocale || !contentType) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for translation' },
            { status: 400 }
          )
        }
        
        console.log('🔄 Direct translation test:', { contentId, targetLocale, contentType })
        
        const translation = await AITranslationService.getOrCreateTranslation(
          contentId,
          content,
          targetLocale,
          contentType
        )
        
        return NextResponse.json({
          success: true,
          data: translation,
          original: content
        })
      }
      
      case 'batch-translate': {
        const targetLocales = locales || ['es', 'pt', 'fr']
        const types = contentTypes || ['opportunities', 'communities']
        
        let totalTranslated = 0
        
        // Translate opportunities
        if (types.includes('opportunities')) {
          const opportunities = await FirebaseOpportunitiesService.getPublishedOpportunities()
          console.log(`📊 Found ${opportunities.length} opportunities to translate`)
          
          const opportunityItems = opportunities.map(opp => ({
            id: opp.id,
            content: {
              title: opp.title,
              description: opp.description,
              organization: opp.organization
            },
            type: 'opportunity' as const
          }))
          
          await AITranslationService.batchTranslate(opportunityItems, targetLocales)
          totalTranslated += opportunities.length * targetLocales.length
        }
        
        // Translate communities
        if (types.includes('communities')) {
          const communities = await FirebaseCommunitiesService.getPublishedCommunities()
          console.log(`📊 Found ${communities.length} communities to translate`)
          
          const communityItems = communities.map(comm => ({
            id: comm.id,
            content: {
              title: comm.title,
              description: comm.description
            },
            type: 'community' as const
          }))
          
          await AITranslationService.batchTranslate(communityItems, targetLocales)
          totalTranslated += communities.length * targetLocales.length
        }
        
        return NextResponse.json({
          success: true,
          message: 'Batch translation completed',
          totalTranslated,
          locales: targetLocales,
          contentTypes: types
        })
      }
      
      case 'clear-cache': {
        const clearedCount = await FirebaseTranslationCacheService.clearExpiredCache()
        
        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
          clearedCount
        })
      }
      
      case 'clear-specific-cache': {
        const { contentId, contentType } = body
        
        if (!contentId || !contentType) {
          return NextResponse.json(
            { success: false, error: 'Missing contentId or contentType' },
            { status: 400 }
          )
        }
        
        const clearedCount = await FirebaseTranslationCacheService.clearContentCache(contentId, contentType)
        
        return NextResponse.json({
          success: true,
          message: 'Specific cache cleared',
          clearedCount,
          contentId,
          contentType
        })
      }
      
      case 'cache-stats': {
        const stats = await FirebaseTranslationCacheService.getCacheStatistics()
        
        return NextResponse.json({
          success: true,
          data: stats
        })
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in POST /api/admin/translations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Translation operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'
    
    console.log('🔍 GET /api/admin/translations', { action })

    switch (action) {
      case 'stats': {
        const stats = await FirebaseTranslationCacheService.getCacheStatistics()
        
        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            supportedLocales: AITranslationService.getSupportedLocales(),
            cacheInfo: {
              defaultTTL: '30 days',
              autoCleanup: 'Available via API'
            }
          }
        })
      }
      
      case 'health': {
        // Check if translation services are working
        try {
          // Test translation with a simple phrase
          const testTranslation = await AITranslationService.translateContent(
            {
              title: 'Test',
              description: 'This is a test description.'
            },
            'es',
            'opportunity'
          )
          
          return NextResponse.json({
            success: true,
            data: {
              translationService: 'healthy',
              cacheService: 'healthy',
              testTranslation: testTranslation.title !== 'Test' ? 'working' : 'fallback',
              timestamp: new Date().toISOString()
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: true,
            data: {
              translationService: 'error',
              cacheService: 'healthy',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
          })
        }
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in GET /api/admin/translations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get translation info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}