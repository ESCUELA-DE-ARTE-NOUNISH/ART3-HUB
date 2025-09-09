#!/usr/bin/env node

/**
 * Debug translation to see actual translated content
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function debugTranslation() {
  console.log('🔍 Debug Translation Test')
  console.log('=' .repeat(40))

  try {
    // Test English vs Spanish side by side
    console.log('\n📝 Fetching English content...')
    const enResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=en`)
    const enData = await enResponse.json()
    
    console.log('\n🌐 Fetching Spanish content...')
    const esResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=es`)
    const esData = await esResponse.json()

    if (enData.success && esData.success && enData.data.length > 0 && esData.data.length > 0) {
      const enOpp = enData.data[0]
      const esOpp = esData.data[0]

      console.log('\n📊 COMPARISON:')
      console.log('=' .repeat(60))
      
      console.log('\n🇺🇸 ENGLISH:')
      console.log('Title:', enOpp.title)
      console.log('Description:', enOpp.description.substring(0, 100) + '...')
      console.log('Organization:', enOpp.organization)
      
      console.log('\n🇪🇸 SPANISH:')
      console.log('Title:', esOpp.title)
      console.log('Description:', esOpp.description.substring(0, 100) + '...')
      console.log('Organization:', esOpp.organization)
      
      console.log('\n🔍 ANALYSIS:')
      const titleChanged = enOpp.title !== esOpp.title
      const descChanged = enOpp.description !== esOpp.description
      const orgChanged = enOpp.organization !== esOpp.organization
      
      console.log('Title translated:', titleChanged ? '✅ YES' : '❌ NO')
      console.log('Description translated:', descChanged ? '✅ YES' : '❌ NO')
      console.log('Organization translated:', orgChanged ? '✅ YES' : '❌ NO')
      
      if (!titleChanged && !descChanged && !orgChanged) {
        console.log('\n⚠️ NO TRANSLATION DETECTED')
        console.log('Possible causes:')
        console.log('1. Translation service failing silently')
        console.log('2. Content is already in target language')
        console.log('3. AI returning identical content')
        console.log('4. Cache serving original content')
      } else {
        console.log('\n✅ TRANSLATION WORKING')
      }
    } else {
      console.log('❌ Failed to fetch opportunities')
      console.log('EN Response:', enData)
      console.log('ES Response:', esData)
    }

    // Test the translation service directly
    console.log('\n🧪 Direct Translation Service Test...')
    const testResponse = await fetch(`${SITE_URL}/api/admin/translations?action=health`)
    const testData = await testResponse.json()
    
    if (testData.success) {
      console.log('Translation Service:', testData.data.translationService)
      console.log('Test Result:', testData.data.testTranslation)
      
      if (testData.data.testTranslation === 'fallback') {
        console.log('⚠️ Translation service is falling back to original content')
      } else {
        console.log('✅ Translation service appears to be working')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

if (require.main === module) {
  debugTranslation()
}

module.exports = { debugTranslation }