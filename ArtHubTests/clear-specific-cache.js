#!/usr/bin/env node

/**
 * Clear cache for specific opportunity and test fresh translation
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function clearSpecificCache() {
  console.log('🧹 Clear Specific Cache Test')
  console.log('=' .repeat(35))

  try {
    // Get the problematic opportunity
    console.log('📊 Getting opportunity data...')
    const enResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=en`)
    const enData = await enResponse.json()
    
    if (!enData.success || enData.data.length === 0) {
      console.error('❌ Failed to get opportunity data')
      return
    }
    
    const opportunity = enData.data[0]
    console.log('Opportunity ID:', opportunity.id)
    console.log('Title:', opportunity.title)
    
    // First, let's clear the cache for this specific opportunity
    console.log('\n🗑️ Clearing cache for this specific opportunity...')
    
    // We need to manually clear the cache using the cache ID format
    const locales = ['es', 'pt', 'fr']
    const clearPromises = locales.map(async (locale) => {
      const cacheId = `opportunity_${opportunity.id}_${locale}`
      console.log(`Clearing cache for: ${cacheId}`)
      
      try {
        // We'll use the Firebase Admin API to delete this specific cache entry
        // Since we don't have direct access, let's create an admin endpoint
        const response = await fetch(`${SITE_URL}/api/admin/translations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clear-specific-cache',
            contentId: opportunity.id,
            contentType: 'opportunity'
          })
        })
        
        const data = await response.json()
        console.log(`Cache clear for ${locale}:`, data.success ? 'SUCCESS' : 'FAILED')
      } catch (error) {
        console.error(`Failed to clear cache for ${locale}:`, error.message)
      }
    })
    
    await Promise.all(clearPromises)
    
    // Now test fresh translation
    console.log('\n🔄 Testing fresh Spanish translation...')
    const esResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=es`)
    const esData = await esResponse.json()
    
    if (esData.success && esData.data.length > 0) {
      const spanishOpportunity = esData.data[0]
      
      console.log('\n📊 FRESH TRANSLATION TEST:')
      console.log('EN Title:', opportunity.title)
      console.log('ES Title:', spanishOpportunity.title)
      console.log('EN Desc:', opportunity.description.substring(0, 100) + '...')
      console.log('ES Desc:', spanishOpportunity.description.substring(0, 100) + '...')
      
      const titleChanged = opportunity.title !== spanishOpportunity.title
      const descChanged = opportunity.description !== spanishOpportunity.description
      
      console.log('\n🔍 Results:')
      console.log('Title translated:', titleChanged ? '✅ YES' : '❌ NO')
      console.log('Description translated:', descChanged ? '✅ YES' : '❌ NO')
      
      if (!titleChanged && !descChanged) {
        console.log('\n❌ STILL NO TRANSLATION')
        console.log('The issue is not with caching - there\'s a deeper problem.')
        
        // Let's check what the AI service is actually doing by looking at content hash
        console.log('\n🔍 Investigating content hash...')
        
        // Create a hash manually to see what it looks like
        const contentForHash = {
          title: opportunity.title,
          description: opportunity.description,
          organization: opportunity.organization
        }
        
        console.log('Content being hashed:', JSON.stringify(contentForHash, null, 2))
        
        // Let's also test if there might be hidden characters or encoding issues
        console.log('Title bytes:', Buffer.from(opportunity.title, 'utf8'))
        console.log('Description first 100 chars bytes:', Buffer.from(opportunity.description.substring(0, 100), 'utf8'))
        
      } else {
        console.log('\n✅ FRESH TRANSLATION WORKS!')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  clearSpecificCache()
}

module.exports = { clearSpecificCache }