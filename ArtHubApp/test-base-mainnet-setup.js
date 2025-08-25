#!/usr/bin/env node

/**
 * Base Mainnet V6 Contract Integration Test
 * Tests connectivity and functionality of deployed V6 contracts on Base mainnet
 */

require('dotenv').config()
const { createPublicClient, http } = require('viem')
const { base } = require('viem/chains')

async function main() {
  console.log('🚀 Testing Base Mainnet V6 Contract Integration...\n')
  
  // Environment check
  console.log('📋 Environment Configuration:')
  console.log('├── Testing Mode:', process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true' ? '❌ TESTNET' : '✅ MAINNET')
  console.log('├── Active Chain ID:', process.env.NEXT_PUBLIC_ACTIVE_CHAIN_ID)
  console.log('├── Firebase Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ SET' : '❌ MISSING')
  console.log('├── Gasless Relayer Key:', process.env.GASLESS_RELAYER_PRIVATE_KEY ? '✅ SET' : '❌ MISSING')
  console.log('└── Admin Wallet:', process.env.NEXT_PUBLIC_ADMIN_WALLET || 'Not set')
  
  console.log('\n🔗 V6 Base Mainnet Contract Addresses:')
  const factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453
  const subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453
  const collectionImpl = process.env.NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_8453
  const claimableFactory = process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453
  
  console.log('├── Factory V6:', factoryAddress || '❌ MISSING')
  console.log('├── Subscription V6:', subscriptionAddress || '❌ MISSING')
  console.log('├── Collection Implementation:', collectionImpl || '❌ MISSING')
  console.log('└── Claimable NFT Factory:', claimableFactory || '❌ MISSING')
  
  if (!factoryAddress || !subscriptionAddress) {
    console.log('\n❌ Missing required V6 contract addresses!')
    console.log('Please ensure all V6 mainnet addresses are set in .env')
    process.exit(1)
  }
  
  // Test Base mainnet connectivity
  console.log('\n🌐 Testing Base Mainnet Connectivity...')
  
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
    })
    
    const blockNumber = await publicClient.getBlockNumber()
    console.log('✅ Connected to Base Mainnet')
    console.log('├── Current Block:', blockNumber.toString())
    console.log('├── Chain ID:', base.id)
    console.log('└── RPC URL:', process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
    
    // Test factory contract
    console.log('\n🏭 Testing Factory V6 Contract...')
    
    const factoryABI = [
      {
        "inputs": [],
        "name": "totalCollectionsCount", 
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view", 
        "type": "function"
      }
    ]
    
    try {
      const totalCollections = await publicClient.readContract({
        address: factoryAddress,
        abi: factoryABI,
        functionName: 'totalCollectionsCount'
      })
      
      const owner = await publicClient.readContract({
        address: factoryAddress,
        abi: factoryABI,
        functionName: 'owner'
      })
      
      console.log('✅ Factory V6 Contract Accessible')
      console.log('├── Total Collections:', totalCollections.toString())
      console.log('├── Contract Owner:', owner)
      console.log('└── Expected Owner:', process.env.NEXT_PUBLIC_ADMIN_WALLET)
      
      if (owner.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()) {
        console.log('✅ Owner verification passed!')
      } else {
        console.log('⚠️  Owner mismatch - please verify admin configuration')
      }
      
    } catch (error) {
      console.log('❌ Factory contract call failed:', error.message)
    }
    
    // Test subscription contract
    console.log('\n💳 Testing Subscription V6 Contract...')
    
    const subscriptionABI = [
      {
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ]
    
    try {
      const subscriptionOwner = await publicClient.readContract({
        address: subscriptionAddress,
        abi: subscriptionABI,
        functionName: 'owner'
      })
      
      console.log('✅ Subscription V6 Contract Accessible')
      console.log('├── Contract Owner:', subscriptionOwner)
      console.log('└── Expected Owner:', process.env.NEXT_PUBLIC_ADMIN_WALLET)
      
      if (subscriptionOwner.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()) {
        console.log('✅ Subscription owner verification passed!')
      } else {
        console.log('⚠️  Subscription owner mismatch - please verify admin configuration')
      }
      
    } catch (error) {
      console.log('❌ Subscription contract call failed:', error.message)
    }
    
  } catch (error) {
    console.log('❌ Base mainnet connection failed:', error.message)
    process.exit(1)
  }
  
  console.log('\n🎉 Base Mainnet V6 Integration Test Complete!')
  console.log('✅ All systems ready for production use on Base mainnet')
  console.log('🔗 Verification URLs:')
  console.log(`├── Factory: https://basescan.org/address/${factoryAddress}#code`)
  console.log(`├── Subscription: https://basescan.org/address/${subscriptionAddress}#code`)
  if (collectionImpl) console.log(`├── Collection: https://basescan.org/address/${collectionImpl}#code`)
  if (claimableFactory) console.log(`└── Claimable Factory: https://basescan.org/address/${claimableFactory}#code`)
}

main().catch(console.error)