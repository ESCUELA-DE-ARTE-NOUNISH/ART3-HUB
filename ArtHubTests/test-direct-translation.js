#!/usr/bin/env node

/**
 * Direct test of the AI translation service with detailed logging
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testDirectTranslation() {
  console.log('🧪 Direct Translation Service Test')
  console.log('=' .repeat(40))

  try {
    // Test with a simple piece of content
    const testContent = {
      title: "Orange County Public Art Commission",
      description: "You've envisioned your art reaching massive audiences. This commission brings your vision into public space.",
      organization: "Orange County Arts & Cultural Affairs"
    }

    console.log('\n📝 Original English Content:')
    console.log(JSON.stringify(testContent, null, 2))

    // Create a manual translation request
    console.log('\n🔄 Requesting Spanish translation...')
    
    const response = await fetch(`${SITE_URL}/api/admin/translations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'translate',
        contentId: 'test-content-123',
        content: testContent,
        targetLocale: 'es',
        contentType: 'opportunity'
      })
    })

    const data = await response.json()
    
    console.log('\n📤 Translation Response:')
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (data.success && data.data) {
      const translated = data.data
      
      console.log('\n📋 Translated Spanish Content:')
      console.log(JSON.stringify(translated, null, 2))
      
      // Compare content
      console.log('\n🔍 Content Comparison:')
      console.log('Title changed:', testContent.title !== translated.title ? '✅' : '❌')
      console.log('Description changed:', testContent.description !== translated.description ? '✅' : '❌')
      console.log('Organization changed:', testContent.organization !== translated.organization ? '✅' : '❌')
      
      if (testContent.title === translated.title && 
          testContent.description === translated.description &&
          testContent.organization === translated.organization) {
        console.log('\n❌ TRANSLATION FAILED: Content is identical')
        console.log('This indicates the AI service is not translating or is returning fallback content')
      } else {
        console.log('\n✅ TRANSLATION SUCCESSFUL: Content was modified')
      }
    } else {
      console.log('\n❌ Translation request failed')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

if (require.main === module) {
  testDirectTranslation()
}

module.exports = { testDirectTranslation }