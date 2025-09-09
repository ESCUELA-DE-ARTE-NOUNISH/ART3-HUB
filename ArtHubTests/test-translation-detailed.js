#!/usr/bin/env node

/**
 * Detailed translation testing to identify the exact issue
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function detailedTranslationTest() {
  console.log('🔍 Detailed Translation Investigation')
  console.log('=' .repeat(50))

  try {
    // First, let's test the translation service directly
    console.log('\n1️⃣ Testing Translation Service Health...')
    const healthResponse = await fetch(`${SITE_URL}/api/admin/translations?action=health`)
    const healthData = await healthResponse.json()
    
    console.log('Health Response:', JSON.stringify(healthData, null, 2))

    // Test direct translation of sample content
    console.log('\n2️⃣ Testing Direct Translation...')
    const testTranslationResponse = await fetch(`${SITE_URL}/api/admin/translations?action=test&locale=es`)
    const testTranslationData = await testTranslationResponse.json()
    
    console.log('Test Translation Response:', JSON.stringify(testTranslationData, null, 2))

    // Get actual opportunity data
    console.log('\n3️⃣ Getting Raw Opportunity Data...')
    const rawOpportunityResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=en`)
    const rawOpportunityData = await rawOpportunityResponse.json()
    
    if (rawOpportunityData.success && rawOpportunityData.data.length > 0) {
      const opportunity = rawOpportunityData.data[0]
      
      console.log('\n📋 Raw English Opportunity:')
      console.log('ID:', opportunity.id)
      console.log('Title:', opportunity.title)
      console.log('Description:', opportunity.description.substring(0, 150) + '...')
      console.log('Organization:', opportunity.organization)

      // Now test translating this specific opportunity
      console.log('\n4️⃣ Testing Translation of This Specific Opportunity...')
      const spanishOpportunityResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=1&locale=es`)
      const spanishOpportunityData = await spanishOpportunityResponse.json()
      
      if (spanishOpportunityData.success && spanishOpportunityData.data.length > 0) {
        const spanishOpportunity = spanishOpportunityData.data[0]
        
        console.log('\n📋 Processed Spanish Opportunity:')
        console.log('ID:', spanishOpportunity.id)
        console.log('Title:', spanishOpportunity.title)
        console.log('Description:', spanishOpportunity.description.substring(0, 150) + '...')
        console.log('Organization:', spanishOpportunity.organization)
        
        // Check if the content actually changed
        const titleChanged = opportunity.title !== spanishOpportunity.title
        const descChanged = opportunity.description !== spanishOpportunity.description
        const orgChanged = opportunity.organization !== spanishOpportunity.organization
        
        console.log('\n🔍 Change Detection:')
        console.log('Title changed:', titleChanged ? '✅' : '❌')
        console.log('Description changed:', descChanged ? '✅' : '❌')
        console.log('Organization changed:', orgChanged ? '✅' : '❌')
        
        if (!titleChanged && !descChanged && !orgChanged) {
          console.log('\n❌ PROBLEM: No changes detected in the content!')
          console.log('This suggests the translation process is not working as expected.')
          
          // Let's check if there's a cache entry for this
          console.log('\n5️⃣ Checking Translation Cache...')
          
          // The cache would be stored in Firebase, let's try to clear it and test again
          console.log('Recommendation: Clear translation cache and test again')
        } else {
          console.log('\n✅ Translation appears to be working!')
        }
      } else {
        console.log('❌ Failed to get Spanish opportunity data')
      }
    } else {
      console.log('❌ Failed to get raw opportunity data')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  detailedTranslationTest()
}

module.exports = { detailedTranslationTest }