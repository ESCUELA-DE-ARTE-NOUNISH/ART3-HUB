#!/usr/bin/env node

/**
 * Test script to debug master plan upgrade issues
 * This script tests the upgrade process step by step to identify issues
 */

const { createPublicClient, http, formatUnits, parseUnits } = require('viem')
const { baseSepolia } = require('viem/chains')

// Load environment variables
require('dotenv').config()

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_84532
const TEST_USER_ADDRESS = '0x...' // Replace with actual test address

console.log('=== Master Plan Upgrade Debug Test ===')
console.log('')
console.log('Environment Configuration:')
console.log('  Subscription V6:', SUBSCRIPTION_ADDRESS)
console.log('  USDC:', USDC_ADDRESS)
console.log('  Test User:', TEST_USER_ADDRESS)
console.log('')

// USDC ABI for checking balance and allowance
const USDC_ABI = [
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// Subscription ABI for checking user subscription
const SUBSCRIPTION_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserSubscriptionInfo",
    "outputs": [
      {"name": "planName", "type": "string"},
      {"name": "nftsMinted", "type": "uint256"},
      {"name": "nftLimit", "type": "uint256"},
      {"name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

async function debugMasterPlanUpgrade() {
  try {
    // Create public client
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    console.log('📊 Step 1: Checking Contract Deployments')
    
    // Check if subscription contract exists
    const subscriptionBytecode = await publicClient.getBytecode({
      address: SUBSCRIPTION_ADDRESS
    })
    
    if (!subscriptionBytecode || subscriptionBytecode === '0x') {
      console.log('❌ Subscription contract does not exist')
      return
    }
    console.log('✅ Subscription contract exists')
    
    // Check if USDC contract exists
    const usdcBytecode = await publicClient.getBytecode({
      address: USDC_ADDRESS
    })
    
    if (!usdcBytecode || usdcBytecode === '0x') {
      console.log('❌ USDC contract does not exist')
      return
    }
    console.log('✅ USDC contract exists')
    
    console.log('')
    console.log('📊 Step 2: Checking Master Plan Pricing')
    
    // Master Plan price: $4.99 = 4990000 USDC (6 decimals)
    const masterPlanPrice = parseUnits('4.99', 6)
    console.log('💰 Master Plan Price:', formatUnits(masterPlanPrice, 6), 'USDC')
    
    if (TEST_USER_ADDRESS === '0x...') {
      console.log('')
      console.log('⚠️  Please replace TEST_USER_ADDRESS with an actual wallet address to continue')
      return
    }
    
    console.log('')
    console.log('📊 Step 3: Checking User USDC Balance')
    
    try {
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [TEST_USER_ADDRESS]
      })
      
      console.log('💳 User USDC Balance:', formatUnits(usdcBalance, 6), 'USDC')
      
      if (usdcBalance < masterPlanPrice) {
        console.log('❌ Insufficient USDC balance for Master Plan upgrade')
        console.log('   Required:', formatUnits(masterPlanPrice, 6), 'USDC')
        console.log('   Available:', formatUnits(usdcBalance, 6), 'USDC')
        console.log('   Shortfall:', formatUnits(masterPlanPrice - usdcBalance, 6), 'USDC')
      } else {
        console.log('✅ Sufficient USDC balance for Master Plan upgrade')
      }
    } catch (error) {
      console.log('❌ Error checking USDC balance:', error.message)
    }
    
    console.log('')
    console.log('📊 Step 4: Checking USDC Allowance')
    
    try {
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [TEST_USER_ADDRESS, SUBSCRIPTION_ADDRESS]
      })
      
      console.log('📝 Current USDC Allowance:', formatUnits(allowance, 6), 'USDC')
      
      if (allowance < masterPlanPrice) {
        console.log('❌ Insufficient USDC allowance for Master Plan upgrade')
        console.log('   Required:', formatUnits(masterPlanPrice, 6), 'USDC')
        console.log('   Approved:', formatUnits(allowance, 6), 'USDC')
        console.log('   Needs approval for:', formatUnits(masterPlanPrice - allowance, 6), 'USDC')
      } else {
        console.log('✅ Sufficient USDC allowance for Master Plan upgrade')
      }
    } catch (error) {
      console.log('❌ Error checking USDC allowance:', error.message)
    }
    
    console.log('')
    console.log('📊 Step 5: Checking Current Subscription Status')
    
    try {
      const subscriptionInfo = await publicClient.readContract({
        address: SUBSCRIPTION_ADDRESS,
        abi: SUBSCRIPTION_ABI,
        functionName: 'getUserSubscriptionInfo',
        args: [TEST_USER_ADDRESS]
      })
      
      console.log('📋 Current Subscription:')
      console.log('   Plan:', subscriptionInfo[0])
      console.log('   NFTs Minted:', subscriptionInfo[1].toString())
      console.log('   NFT Limit:', subscriptionInfo[2].toString())
      console.log('   Is Active:', subscriptionInfo[3])
      
      if (subscriptionInfo[0] === 'Master Plan') {
        console.log('ℹ️  User already has Master Plan subscription')
      } else if (subscriptionInfo[0] === 'Elite Creator Plan') {
        console.log('ℹ️  User has Elite Creator Plan (higher than Master)')
      } else {
        console.log('✅ User eligible for Master Plan upgrade')
      }
    } catch (error) {
      console.log('❌ Error checking subscription status:', error.message)
    }
    
    console.log('')
    console.log('📊 Step 6: Test API Endpoint')
    console.log('To test the upgrade API manually, use this command:')
    console.log('')
    console.log(\`curl -X POST http://localhost:3000/api/gasless-relay \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "type": "upgradeToMaster",
    "userAddress": "\${TEST_USER_ADDRESS}",
    "autoRenew": false,
    "chainId": 84532
  }'\`)
    
    console.log('')
    console.log('🔍 Debugging Tips:')
    console.log('1. Make sure user has at least 4.99 USDC in their wallet')
    console.log('2. Check browser console for JavaScript errors during upgrade')
    console.log('3. Verify wallet is connected and on Base Sepolia network')
    console.log('4. Try the upgrade with a fresh browser session')
    console.log('5. Check that the subscription contract supports Master Plan upgrades')
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

// Usage instructions if no test address provided
if (process.argv.length > 2) {
  const TEST_USER_ADDRESS = process.argv[2]
  console.log('Using test address:', TEST_USER_ADDRESS)
  debugMasterPlanUpgrade()
} else {
  console.log('Usage: node test-master-plan-upgrade.js <wallet_address>')
  console.log('')
  console.log('Example:')
  console.log('  node test-master-plan-upgrade.js 0x1234567890123456789012345678901234567890')
  console.log('')
  console.log('This will test the Master Plan upgrade process for the specified wallet address.')
}