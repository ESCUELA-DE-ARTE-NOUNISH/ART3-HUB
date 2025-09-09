#!/usr/bin/env node

/**
 * Test translation with very simple, clearly English content
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testSimpleTranslation() {
  console.log('🧪 Simple Translation Test')
  console.log('=' .repeat(30))

  const testCases = [
    {
      name: "Very Simple English",
      content: {
        title: "Hello World",
        description: "This is a simple test in English language.",
        organization: "Test Organization"
      }
    },
    {
      name: "Art-Related English",
      content: {
        title: "Art Exhibition Opportunity",
        description: "Submit your artwork for our gallery exhibition. We welcome all artists.",
        organization: "Local Art Gallery"
      }
    },
    {
      name: "Complex Art/Web3 English",
      content: {
        title: "NFT Creation Workshop",
        description: "Learn how to create and mint your first NFT artwork on the blockchain.",
        organization: "Web3 Art Community"
      }
    }
  ]

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    
    console.log(`\n${i + 1}️⃣ Testing: ${testCase.name}`)
    console.log('Original:', JSON.stringify(testCase.content, null, 2))
    
    try {
      const response = await fetch(`${SITE_URL}/api/admin/translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          contentId: `test-${i}`,
          content: testCase.content,
          targetLocale: 'es',
          contentType: 'opportunity'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const translated = data.data
        console.log('Translated:', JSON.stringify(translated, null, 2))
        
        const titleChanged = testCase.content.title !== translated.title
        const descChanged = testCase.content.description !== translated.description
        const orgChanged = testCase.content.organization !== translated.organization
        
        console.log('Results:')
        console.log('  Title changed:', titleChanged ? '✅' : '❌')
        console.log('  Description changed:', descChanged ? '✅' : '❌')
        console.log('  Organization changed:', orgChanged ? '✅' : '❌')
        
        if (!titleChanged && !descChanged && !orgChanged) {
          console.log('  ❌ NO TRANSLATION OCCURRED')
        } else {
          console.log('  ✅ TRANSLATION SUCCESSFUL')
        }
      } else {
        console.log('❌ Translation failed:', data.error)
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
    }
  }
}

if (require.main === module) {
  testSimpleTranslation()
}

module.exports = { testSimpleTranslation }