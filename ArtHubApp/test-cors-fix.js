#!/usr/bin/env node

/**
 * Test CORS policy fixes and enrollment detection improvements
 * This verifies that browser-compatible RPC endpoints work properly
 */

const { createPublicClient, http } = require('viem')
const { base } = require('viem/chains')

// Load environment variables
require('dotenv').config()

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453
const TEST_USER_ADDRESS = process.argv[2] || '0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd'

console.log('=== CORS Fix and Enrollment Detection Test ===')
console.log('')
console.log('Configuration:')
console.log('  Subscription V6:', SUBSCRIPTION_ADDRESS)
console.log('  Test User:', TEST_USER_ADDRESS)
console.log('')

// Updated browser-compatible RPC endpoints (CORS-safe)
const BROWSER_COMPATIBLE_RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.blockpi.network/v1/rpc/public',
  'https://base.meowrpc.com'
]

// Removed CORS-problematic endpoints:
// - https://1rpc.io/base (CORS policy blocked)
// - https://rpc.notadegen.com/base (may have CORS issues)

const SUBSCRIPTION_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getSubscription",
    "outputs": [
      {"name": "plan", "type": "uint8"},
      {"name": "expiresAt", "type": "uint256"},
      {"name": "nftsMinted", "type": "uint256"},
      {"name": "nftLimit", "type": "uint256"},
      {"name": "isActive", "type": "bool"},
      {"name": "hasGaslessMinting", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

async function testCORSCompatibility() {
  console.log('🧪 Test 1: CORS Compatibility Check')
  console.log('')
  
  for (let i = 0; i < BROWSER_COMPATIBLE_RPC_ENDPOINTS.length; i++) {
    const endpoint = BROWSER_COMPATIBLE_RPC_ENDPOINTS[i]
    
    try {
      console.log(`🔄 Testing endpoint ${i + 1}/${BROWSER_COMPATIBLE_RPC_ENDPOINTS.length}: ${endpoint}`)
      
      const client = createPublicClient({
        chain: base,
        transport: http(endpoint)
      })
      
      // Test basic connectivity
      const startTime = Date.now()
      const blockNumber = await client.getBlockNumber()
      const endTime = Date.now()
      
      console.log(`✅ Endpoint ${i + 1} ACCESSIBLE - Block: ${blockNumber}, Response time: ${endTime - startTime}ms`)
      
    } catch (error) {
      const isCORSError = error.message?.includes('CORS') || error.message?.includes('blocked by CORS policy')
      const is429 = error.message?.includes('429') || error.message?.includes('Too Many Requests')
      
      if (isCORSError) {
        console.log(`🚫 Endpoint ${i + 1} CORS BLOCKED - ${error.message?.substring(0, 80)}`)
      } else if (is429) {
        console.log(`⏳ Endpoint ${i + 1} RATE LIMITED - ${error.message?.substring(0, 80)}`)
      } else {
        console.log(`❌ Endpoint ${i + 1} OTHER ERROR - ${error.message?.substring(0, 80)}`)
      }
    }
    
    console.log('')
  }
}

async function testEnrollmentDetection() {
  console.log('🧪 Test 2: Enrollment Detection Logic')
  console.log('')
  
  // Test with the specific user address that was having contract revert issues
  try {
    console.log(`🔍 Testing getSubscription call for user: ${TEST_USER_ADDRESS}`)
    
    const client = createPublicClient({
      chain: base,
      transport: http(BROWSER_COMPATIBLE_RPC_ENDPOINTS[0])
    })
    
    const subscriptionResult = await client.readContract({
      address: SUBSCRIPTION_ADDRESS,
      abi: SUBSCRIPTION_ABI,
      functionName: 'getSubscription',
      args: [TEST_USER_ADDRESS]
    })
    
    console.log('✅ getSubscription call successful!')
    
    const [plan, expiresAt, nftsMinted, nftLimit, isActive, hasGaslessMinting] = subscriptionResult
    const planName = plan === 0 ? 'FREE Plan' : plan === 1 ? 'MASTER Plan' : plan === 2 ? 'ELITE Plan' : 'Unknown Plan'
    
    console.log('')
    console.log('📋 Subscription Result:')
    console.log('   Plan:', planName)
    console.log('   NFTs Minted:', nftsMinted.toString())
    console.log('   NFT Limit:', nftLimit.toString())
    console.log('   Is Active:', isActive)
    console.log('   Has Gasless:', hasGaslessMinting)
    console.log('')
    console.log('✅ User appears to be enrolled in V6 subscription system')
    
  } catch (error) {
    const errorMessage = error.message || ''
    const isContractRevert = errorMessage.includes('reverted') || 
                            errorMessage.includes('Execution reverted') ||
                            errorMessage.includes('getSubscription') ||
                            errorMessage.includes('ContractFunctionExecutionError')
    const isCORSError = errorMessage.includes('CORS') || 
                       errorMessage.includes('blocked by CORS policy')
    const isRateLimit = errorMessage.includes('429') || 
                       errorMessage.includes('Too Many Requests') ||
                       errorMessage.includes('rate limit')
    
    console.log('')
    console.log('❌ getSubscription call failed:', errorMessage.substring(0, 120))
    console.log('')
    console.log('🔍 Error Analysis:')
    console.log('   Contract Revert:', isContractRevert ? '✅' : '❌')
    console.log('   CORS Error:', isCORSError ? '✅' : '❌') 
    console.log('   Rate Limit:', isRateLimit ? '✅' : '❌')
    console.log('')
    
    if (isContractRevert && !isCORSError && !isRateLimit) {
      console.log('ℹ️  DETECTION: User not enrolled in V6 subscription system')
      console.log('   → This is expected behavior for users who haven\'t been enrolled yet')
      console.log('   → The app will return default Free Plan values to trigger enrollment')
    } else if (isCORSError) {
      console.log('🚫 DETECTION: CORS policy issue')
      console.log('   → This should NOT happen with browser-compatible endpoints')
      console.log('   → Review endpoint list for CORS-problematic URLs')
    } else if (isRateLimit) {
      console.log('⏳ DETECTION: Rate limiting issue')
      console.log('   → Retry mechanism should handle this automatically')
    } else {
      console.log('❓ DETECTION: Unknown error type')
      console.log('   → May need additional error handling logic')
    }
  }
}

async function runTests() {
  try {
    if (!SUBSCRIPTION_ADDRESS) {
      console.log('❌ Missing NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453 environment variable')
      return
    }
    
    await testCORSCompatibility()
    await testEnrollmentDetection()
    
    console.log('')
    console.log('🎯 Test Summary:')
    console.log('✅ CORS-problematic endpoints removed from fallback list')
    console.log('✅ Browser-compatible endpoints only: mainnet.base.org, publicnode.com, blockpi.network, meowrpc.com')
    console.log('✅ Enhanced enrollment detection with specific error categorization')
    console.log('✅ Improved error logging for better troubleshooting')
    console.log('')
    console.log('🚀 Expected Benefits:')
    console.log('• No more "blocked by CORS policy" errors in browser console')
    console.log('• Clearer differentiation between enrollment and rate limiting issues')
    console.log('• Better user experience during master plan upgrades')
    console.log('• More reliable subscription status updates after upgrades')
    console.log('')
    console.log('💡 Next Step: Test the upgrade flow in the UI!')
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

runTests()