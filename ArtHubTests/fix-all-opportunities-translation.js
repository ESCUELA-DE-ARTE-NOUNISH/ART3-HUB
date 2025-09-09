#!/usr/bin/env node

/**
 * Fix translation issues for all opportunities by clearing their stale cache
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function fixAllOpportunitiesTranslation() {
  console.log('🛠️ Fixing All Opportunities Translation')
  console.log('=' .repeat(45))

  try {
    // First, get all opportunities that need fixing
    console.log('📊 Getting all opportunities...')
    
    const allResponse = await fetch(`${SITE_URL}/api/opportunities?locale=en`)
    const allData = await allResponse.json()
    
    if (!allData.success || allData.data.length === 0) {
      console.error('❌ Failed to get opportunities data')
      return
    }
    
    const opportunities = allData.data
    console.log(`Found ${opportunities.length} opportunities to check`)
    
    // Clear cache for each opportunity
    console.log('\n🗑️ Clearing cache for all opportunities...')
    
    let clearedCount = 0
    for (const opp of opportunities) {
      try {
        const clearResponse = await fetch(`${SITE_URL}/api/admin/translations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clear-specific-cache',
            contentId: opp.id,
            contentType: 'opportunity'
          })
        })
        
        const clearData = await clearResponse.json()
        if (clearData.success) {
          console.log(`✅ Cleared cache for opportunity ${opp.id}`)
          clearedCount++
        } else {
          console.log(`⚠️ Failed to clear cache for opportunity ${opp.id}`)
        }
      } catch (error) {
        console.error(`❌ Error clearing cache for ${opp.id}:`, error.message)
      }
    }
    
    console.log(`\n📋 Cache clearing summary: ${clearedCount}/${opportunities.length} opportunities processed`)
    
    // Now test the Spanish translation again
    console.log('\n🧪 Testing fresh Spanish translations...')
    
    const esResponse = await fetch(`${SITE_URL}/api/opportunities?locale=es`)
    const esData = await esResponse.json()
    
    if (esData.success && esData.data.length > 0) {
      const testOpportunities = esData.data.slice(0, 5)
      
      // Get corresponding English versions for comparison
      const enResponse = await fetch(`${SITE_URL}/api/opportunities?locale=en`)
      const enData = await enResponse.json()
      
      if (enData.success) {
        console.log('\n📊 Translation Results:')
        console.log('=' .repeat(50))
        
        let translatedCount = 0
        
        testOpportunities.forEach((esOpp, index) => {
          const enOpp = enData.data.find(en => en.id === esOpp.id)
          if (enOpp) {
            const titleTranslated = esOpp.title !== enOpp.title
            const descTranslated = esOpp.description !== enOpp.description
            const orgTranslated = esOpp.organization !== enOpp.organization
            
            const isTranslated = titleTranslated || descTranslated || orgTranslated
            if (isTranslated) translatedCount++
            
            console.log(`\n${index + 1}. ${esOpp.id}:`)
            console.log(`   Title: ${titleTranslated ? '✅' : '❌'}`)
            console.log(`   Description: ${descTranslated ? '✅' : '❌'}`)
            console.log(`   Organization: ${orgTranslated ? '✅' : '❌'}`)
            console.log(`   Overall: ${isTranslated ? '✅ TRANSLATED' : '❌ NOT TRANSLATED'}`)
            
            if (titleTranslated) {
              console.log(`   EN Title: "${enOpp.title.substring(0, 50)}..."`)
              console.log(`   ES Title: "${esOpp.title.substring(0, 50)}..."`)
            }
          }
        })
        
        console.log(`\n🎯 FINAL RESULT: ${translatedCount}/${testOpportunities.length} opportunities successfully translated`)
        
        if (translatedCount === testOpportunities.length) {
          console.log('🎉 SUCCESS! All opportunities are now translating correctly!')
        } else if (translatedCount > 0) {
          console.log('⚠️ PARTIAL SUCCESS: Some opportunities still need attention')
        } else {
          console.log('❌ ISSUE PERSISTS: Translation system may need deeper investigation')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  fixAllOpportunitiesTranslation()
}

module.exports = { fixAllOpportunitiesTranslation }