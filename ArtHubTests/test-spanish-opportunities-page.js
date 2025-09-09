#!/usr/bin/env node

/**
 * Test the /es/opportunities page specifically to see if all opportunities translate
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testSpanishOpportunitiesPage() {
  console.log('🧪 Testing Spanish Opportunities Page')
  console.log('=' .repeat(40))

  try {
    console.log('🔍 Testing all opportunities endpoint with Spanish locale...')
    
    // Test the main opportunities API (not featured, not limited)
    const allOpportunitiesResponse = await fetch(`${SITE_URL}/api/opportunities?locale=es`)
    const allOpportunitiesData = await allOpportunitiesResponse.json()
    
    console.log('\n📊 All Opportunities API Response:')
    console.log('Status:', allOpportunitiesResponse.status)
    console.log('Success:', allOpportunitiesData.success)
    console.log('Count:', allOpportunitiesData.data?.length || 0)
    console.log('Locale in response:', allOpportunitiesData.locale)
    
    if (allOpportunitiesData.success && allOpportunitiesData.data.length > 0) {
      console.log('\n🔍 Checking first 3 opportunities for translation:')
      
      const opportunities = allOpportunitiesData.data.slice(0, 3)
      
      for (let i = 0; i < opportunities.length; i++) {
        const opp = opportunities[i]
        console.log(`\n${i + 1}. Opportunity ID: ${opp.id}`)
        console.log(`   Title: "${opp.title}"`)
        console.log(`   Description (first 100 chars): "${opp.description?.substring(0, 100)}..."`)
        console.log(`   Organization: "${opp.organization}"`)
        
        // Check if this looks like it's been translated
        const hasSpanishIndicators = (
          opp.title?.includes('ó') || opp.title?.includes('á') || opp.title?.includes('é') ||
          opp.description?.includes('ó') || opp.description?.includes('á') || opp.description?.includes('é') ||
          opp.organization?.includes('ó') || opp.organization?.includes('á') || opp.organization?.includes('é')
        )
        
        console.log(`   🌐 Appears translated: ${hasSpanishIndicators ? '✅ YES' : '❌ NO'}`)
      }
      
      // Now let's compare with English to see if there are differences
      console.log('\n🔄 Comparing with English versions...')
      
      const enResponse = await fetch(`${SITE_URL}/api/opportunities?locale=en`)
      const enData = await enResponse.json()
      
      if (enData.success && enData.data.length > 0) {
        const matchedOpportunities = opportunities.map(esOpp => {
          const enOpp = enData.data.find(en => en.id === esOpp.id)
          return { es: esOpp, en: enOpp }
        }).filter(pair => pair.en)
        
        console.log(`\nFound ${matchedOpportunities.length} matching opportunities for comparison:`)
        
        matchedOpportunities.forEach(({ es, en }, index) => {
          const titleDifferent = es.title !== en.title
          const descDifferent = es.description !== en.description
          const orgDifferent = es.organization !== en.organization
          
          console.log(`\n${index + 1}. ${es.id}:`)
          console.log(`   Title translated: ${titleDifferent ? '✅' : '❌'}`)
          console.log(`   Description translated: ${descDifferent ? '✅' : '❌'}`)
          console.log(`   Organization translated: ${orgDifferent ? '✅' : '❌'}`)
          
          if (!titleDifferent && !descDifferent && !orgDifferent) {
            console.log(`   ⚠️ NO TRANSLATION detected for ${es.id}`)
          }
        })
      }
    } else {
      console.log('❌ No opportunities data returned')
    }
    
    // Also test featured opportunities to make sure they still work
    console.log('\n🌟 Double-checking featured opportunities...')
    
    const featuredResponse = await fetch(`${SITE_URL}/api/opportunities?featured=true&limit=3&locale=es`)
    const featuredData = await featuredResponse.json()
    
    if (featuredData.success && featuredData.data.length > 0) {
      console.log('Featured opportunities count:', featuredData.data.length)
      console.log('Featured opportunities translated:', featuredData.data.map(opp => ({
        id: opp.id,
        titleSpanish: opp.title.includes('ó') || opp.title.includes('á') || opp.title.includes('é')
      })))
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  testSpanishOpportunitiesPage()
}

module.exports = { testSpanishOpportunitiesPage }