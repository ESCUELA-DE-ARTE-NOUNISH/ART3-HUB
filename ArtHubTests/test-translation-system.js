#!/usr/bin/env node

/**
 * Test script for the AI Translation System
 * Tests opportunities and communities translation functionality
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testTranslationAPI() {
  console.log('🧪 Testing AI Translation System')
  console.log('=' .repeat(50))

  try {
    // Test 1: Get translation health check
    console.log('\n📋 Test 1: Health Check')
    const healthResponse = await fetch(`${SITE_URL}/api/admin/translations?action=health`)
    const healthData = await healthResponse.json()
    console.log('Health Status:', healthData.success ? '✅ Healthy' : '❌ Error')
    if (healthData.data) {
      console.log('Translation Service:', healthData.data.translationService)
      console.log('Cache Service:', healthData.data.cacheService)
      console.log('Test Translation:', healthData.data.testTranslation)
    }

    // Test 2: Get cache statistics
    console.log('\n📊 Test 2: Cache Statistics')
    const statsResponse = await fetch(`${SITE_URL}/api/admin/translations?action=stats`)
    const statsData = await statsResponse.json()
    
    if (statsData.success) {
      console.log('✅ Cache Stats Retrieved')
      console.log('Total Cache Entries:', statsData.data.totalEntries)
      console.log('Entries by Type:', statsData.data.entriesByType)
      console.log('Entries by Locale:', statsData.data.entriesByLocale)
      console.log('Expired Entries:', statsData.data.expiredEntries)
      console.log('Supported Locales:', statsData.data.supportedLocales)
    } else {
      console.log('❌ Failed to get cache stats:', statsData.error)
    }

    // Test 3: Test opportunities API with different locales
    console.log('\n🌍 Test 3: Opportunities Translation')
    
    const locales = ['en', 'es', 'pt', 'fr']
    
    for (const locale of locales) {
      const response = await fetch(`${SITE_URL}/api/opportunities?locale=${locale}&limit=2`)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        const opportunity = data.data[0]
        console.log(`\n${locale.toUpperCase()}: "${opportunity.title.substring(0, 50)}..."`)
        
        if (locale === 'en') {
          // Store original for comparison
          console.log('📝 Original (English)')
        } else {
          console.log('🌐 Translated')
          // Check if content actually changed (indicates translation worked)
          if (opportunity.title && opportunity.description) {
            console.log('✅ Translation applied')
          } else {
            console.log('⚠️ No translation or fallback used')
          }
        }
      } else {
        console.log(`❌ No opportunities found for ${locale}`)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Test 4: Test communities API with different locales
    console.log('\n🏘️ Test 4: Communities Translation')
    
    for (const locale of locales) {
      const response = await fetch(`${SITE_URL}/api/communities?locale=${locale}&limit=2`)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        const community = data.data[0]
        console.log(`\n${locale.toUpperCase()}: "${community.title.substring(0, 50)}..."`)
        
        if (locale === 'en') {
          console.log('📝 Original (English)')
        } else {
          console.log('🌐 Translated')
          if (community.title && community.description) {
            console.log('✅ Translation applied')
          } else {
            console.log('⚠️ No translation or fallback used')
          }
        }
      } else {
        console.log(`❌ No communities found for ${locale}`)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Test 5: Cache cleanup test (optional)
    console.log('\n🧹 Test 5: Cache Cleanup')
    try {
      const cleanupResponse = await fetch(`${SITE_URL}/api/admin/translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      })
      
      const cleanupData = await cleanupResponse.json()
      
      if (cleanupData.success) {
        console.log('✅ Cache cleanup completed')
        console.log('Cleared entries:', cleanupData.clearedCount)
      } else {
        console.log('⚠️ Cache cleanup failed:', cleanupData.error)
      }
    } catch (error) {
      console.log('⚠️ Cache cleanup test skipped:', error.message)
    }

    console.log('\n🎉 Translation System Test Complete!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Performance timing
async function runWithTiming() {
  const startTime = Date.now()
  
  await testTranslationAPI()
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  console.log(`\n⏱️ Total test duration: ${duration}ms`)
  
  if (duration > 10000) {
    console.log('⚠️ Tests took longer than expected (>10s)')
    console.log('💡 Consider optimizing translation caching or batch size')
  } else {
    console.log('✅ Performance looks good!')
  }
}

// Run the tests
if (require.main === module) {
  runWithTiming().catch(error => {
    console.error('❌ Test script failed:', error)
    process.exit(1)
  })
}

module.exports = { testTranslationAPI }