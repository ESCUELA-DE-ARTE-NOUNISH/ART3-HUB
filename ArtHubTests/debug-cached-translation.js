#!/usr/bin/env node

/**
 * Debug cached translations to see if the issue is with caching
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function debugCachedTranslation() {
  console.log('🔍 Debug Cached Translation Issue')
  console.log('=' .repeat(45))

  try {
    // First, clear any existing cache
    console.log('\n1️⃣ Clearing translation cache...')
    const clearResponse = await fetch(`${SITE_URL}/api/admin/translations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-cache' })
    })
    const clearData = await clearResponse.json()
    console.log('Cache clear result:', clearData)

    // Get the actual opportunity that's being tested
    console.log('\n2️⃣ Getting opportunity data...')
    const enResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=en`)
    const enData = await enResponse.json()
    
    if (enData.success && enData.data.length > 0) {
      const opportunity = enData.data[0]
      console.log('Opportunity ID:', opportunity.id)
      console.log('Title:', opportunity.title.substring(0, 50) + '...')
      
      // Now request Spanish translation - this should create a fresh translation
      console.log('\n3️⃣ Requesting fresh Spanish translation...')
      const esResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=es`)
      const esData = await esResponse.json()
      
      if (esData.success && esData.data.length > 0) {
        const spanishOpportunity = esData.data[0]
        
        console.log('\n📊 COMPARISON AFTER CACHE CLEAR:')
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
          console.log('\n❌ STILL NO TRANSLATION - The issue is not with caching!')
          console.log('Let\'s check what happened in the API call...')
          
          // Let's try a direct translation of this specific opportunity
          console.log('\n4️⃣ Testing direct translation of this opportunity...')
          const directResponse = await fetch(`${SITE_URL}/api/admin/translations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'translate',
              contentId: opportunity.id,
              content: {
                title: opportunity.title,
                description: opportunity.description,
                organization: opportunity.organization
              },
              targetLocale: 'es',
              contentType: 'opportunity'
            })
          })
          
          const directData = await directResponse.json()
          console.log('Direct translation result:', JSON.stringify(directData, null, 2))
          
          if (directData.success) {
            const translated = directData.data
            console.log('\n🔍 Direct translation comparison:')
            console.log('Direct title changed:', opportunity.title !== translated.title ? '✅' : '❌')
            console.log('Direct desc changed:', opportunity.description !== translated.description ? '✅' : '❌')
          }
          
        } else {
          console.log('\n✅ TRANSLATION IS WORKING!')
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  debugCachedTranslation()
}

module.exports = { debugCachedTranslation }