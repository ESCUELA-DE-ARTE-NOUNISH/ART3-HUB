require('dotenv').config({ path: '../ArtHubApp/.env' });
const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

// V6 contract addresses
const FACTORY_V6_ADDRESS = '0x6A2a69a88b92B8566354ECE538aF46fC783b9DFd';
const SUBSCRIPTION_V6_ADDRESS = '0xd0611f925994fddD433a464886Ae3eF58Efb9EC9';

// Test user address from the error
const TEST_USER = '0x499D377eF114cC1BF7798cECBB38412701400daF';

async function testUserSubscription() {
  console.log('🧪 Testing User Subscription Status...');
  
  try {
    // Create public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org')
    });

    console.log('🔍 Testing user:', TEST_USER);
    console.log('📋 Factory:', FACTORY_V6_ADDRESS);
    console.log('📋 Subscription:', SUBSCRIPTION_V6_ADDRESS);
    console.log('');

    // Test 1: Check user subscription from factory
    console.log('🔍 Test 1: Factory getUserSubscriptionInfoV5...');
    
    try {
      const factoryResult = await publicClient.readContract({
        address: FACTORY_V6_ADDRESS,
        abi: [
          {
            "inputs": [{"name": "user", "type": "address"}],
            "name": "getUserSubscriptionInfoV5",
            "outputs": [
              {"name": "planName", "type": "string"},
              {"name": "nftsMinted", "type": "uint256"},
              {"name": "nftLimit", "type": "uint256"},
              {"name": "isActive", "type": "bool"},
              {"name": "collectionsCreated", "type": "uint256"},
              {"name": "collectionNames", "type": "string[]"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'getUserSubscriptionInfoV5',
        args: [TEST_USER]
      });
      
      console.log('✅ Factory subscription info:', {
        planName: factoryResult[0],
        nftsMinted: factoryResult[1].toString(),
        nftLimit: factoryResult[2].toString(),
        isActive: factoryResult[3],
        collectionsCreated: factoryResult[4].toString(),
        collectionNames: factoryResult[5]
      });
    } catch (error) {
      console.log('❌ Factory getUserSubscriptionInfoV5 failed:', error.message);
    }

    // Test 2: Check subscription directly from subscription contract
    console.log('\n🔍 Test 2: Subscription contract getSubscription...');
    
    try {
      const subscriptionResult = await publicClient.readContract({
        address: SUBSCRIPTION_V6_ADDRESS,
        abi: [
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
        ],
        functionName: 'getSubscription',
        args: [TEST_USER]
      });
      
      console.log('✅ Subscription contract info:', {
        plan: subscriptionResult[0].toString(),
        expiresAt: new Date(Number(subscriptionResult[1]) * 1000).toISOString(),
        nftsMinted: subscriptionResult[2].toString(),
        nftLimit: subscriptionResult[3].toString(),
        isActive: subscriptionResult[4],
        hasGaslessMinting: subscriptionResult[5]
      });
    } catch (error) {
      console.log('❌ Subscription getSubscription failed:', error.message);
    }

    // Test 3: Check if user can mint
    console.log('\n🔍 Test 3: Can user mint check...');
    
    try {
      const canMint = await publicClient.readContract({
        address: SUBSCRIPTION_V6_ADDRESS,
        abi: [
          {
            "inputs": [{"name": "user", "type": "address"}, {"name": "amount", "type": "uint256"}],
            "name": "canUserMint",
            "outputs": [{"name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'canUserMint',
        args: [TEST_USER, 1n]
      });
      
      console.log('✅ Can user mint 1 NFT:', canMint);
    } catch (error) {
      console.log('❌ canUserMint failed:', error.message);
    }

    // Test 4: Check user's nonce
    console.log('\n🔍 Test 4: User nonce check...');
    
    try {
      const nonce = await publicClient.readContract({
        address: FACTORY_V6_ADDRESS,
        abi: [
          {
            "inputs": [{"name": "user", "type": "address"}],
            "name": "userNonces",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'userNonces',
        args: [TEST_USER]
      });
      
      console.log('✅ User nonce:', nonce.toString());
    } catch (error) {
      console.log('❌ userNonces failed:', error.message);
    }

    // Test 5: Try to subscribe to free plan
    console.log('\n🔍 Test 5: Check if user needs to subscribe to free plan...');
    console.log('💡 User should call subscribeToFreePlan() first if not enrolled');

  } catch (error) {
    console.error('❌ User subscription testing failed:', error);
  }
}

testUserSubscription();