// Script to update gasless relayer address on V6 contracts
const { createPublicClient, createWalletClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { baseSepolia } = require('viem/chains')

// Contract addresses (V6)
const FACTORY_V6_ADDRESS = '0x6A2a69a88b92B8566354ECE538aF46fC783b9DFd'
const SUBSCRIPTION_V6_ADDRESS = '0xd0611f925994fddD433a464886Ae3eF58Efb9EC9'

// New gasless relayer address we want to set
const NEW_GASLESS_RELAYER = '0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1'

// ABI for the updateGaslessRelayer function
const UPDATE_GASLESS_RELAYER_ABI = [
  {
    "inputs": [{"name": "newRelayer", "type": "address"}],
    "name": "updateGaslessRelayer", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gaslessRelayer",
    "outputs": [{"name": "", "type": "address"}],
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

async function updateGaslessRelayer() {
  try {
    console.log('🚀 Starting gasless relayer update process...')
    
    // Check if we have the admin private key
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      console.error('❌ ADMIN_PRIVATE_KEY not found in environment variables')
      console.log('Please set ADMIN_PRIVATE_KEY in your .env file with the private key for the admin wallet')
      return
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org')
    })

    const formattedPrivateKey = adminPrivateKey.startsWith('0x') 
      ? adminPrivateKey 
      : `0x${adminPrivateKey}`
    
    const adminAccount = privateKeyToAccount(formattedPrivateKey)
    const walletClient = createWalletClient({
      account: adminAccount,
      chain: baseSepolia,
      transport: http('https://sepolia.base.org')
    })

    console.log('🔧 Admin account:', adminAccount.address)
    console.log('🎯 New gasless relayer:', NEW_GASLESS_RELAYER)

    // Check current gasless relayer addresses
    console.log('\n📋 Checking current gasless relayer addresses...')
    
    const factoryCurrentRelayer = await publicClient.readContract({
      address: FACTORY_V6_ADDRESS,
      abi: UPDATE_GASLESS_RELAYER_ABI,
      functionName: 'gaslessRelayer'
    })
    
    const subscriptionCurrentRelayer = await publicClient.readContract({
      address: SUBSCRIPTION_V6_ADDRESS,
      abi: UPDATE_GASLESS_RELAYER_ABI,
      functionName: 'gaslessRelayer'
    })

    console.log('Factory current relayer:', factoryCurrentRelayer)
    console.log('Subscription current relayer:', subscriptionCurrentRelayer)

    // Check if admin is the owner
    console.log('\n🔍 Verifying admin ownership...')
    
    const factoryOwner = await publicClient.readContract({
      address: FACTORY_V6_ADDRESS,
      abi: UPDATE_GASLESS_RELAYER_ABI,
      functionName: 'owner'
    })
    
    const subscriptionOwner = await publicClient.readContract({
      address: SUBSCRIPTION_V6_ADDRESS,
      abi: UPDATE_GASLESS_RELAYER_ABI,
      functionName: 'owner'
    })

    console.log('Factory owner:', factoryOwner)
    console.log('Subscription owner:', subscriptionOwner)
    console.log('Admin account:', adminAccount.address)

    if (factoryOwner.toLowerCase() !== adminAccount.address.toLowerCase()) {
      console.error('❌ Admin account is not the factory owner!')
      return
    }

    if (subscriptionOwner.toLowerCase() !== adminAccount.address.toLowerCase()) {
      console.error('❌ Admin account is not the subscription owner!')
      return
    }

    // Update Factory gasless relayer
    console.log('\n🔄 Updating Factory gasless relayer...')
    if (factoryCurrentRelayer.toLowerCase() !== NEW_GASLESS_RELAYER.toLowerCase()) {
      try {
        const factoryHash = await walletClient.writeContract({
          address: FACTORY_V6_ADDRESS,
          abi: UPDATE_GASLESS_RELAYER_ABI,
          functionName: 'updateGaslessRelayer',
          args: [NEW_GASLESS_RELAYER]
        })
        
        console.log('📝 Factory update transaction:', factoryHash)
        
        const factoryReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: factoryHash 
        })
        
        if (factoryReceipt.status === 'success') {
          console.log('✅ Factory gasless relayer updated successfully!')
        } else {
          console.error('❌ Factory update transaction failed')
        }
      } catch (error) {
        console.error('❌ Error updating factory gasless relayer:', error)
      }
    } else {
      console.log('✅ Factory gasless relayer already set correctly')
    }

    // Update Subscription gasless relayer
    console.log('\n🔄 Updating Subscription gasless relayer...')
    if (subscriptionCurrentRelayer.toLowerCase() !== NEW_GASLESS_RELAYER.toLowerCase()) {
      try {
        const subscriptionHash = await walletClient.writeContract({
          address: SUBSCRIPTION_V6_ADDRESS,
          abi: UPDATE_GASLESS_RELAYER_ABI,
          functionName: 'updateGaslessRelayer',
          args: [NEW_GASLESS_RELAYER]
        })
        
        console.log('📝 Subscription update transaction:', subscriptionHash)
        
        const subscriptionReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: subscriptionHash 
        })
        
        if (subscriptionReceipt.status === 'success') {
          console.log('✅ Subscription gasless relayer updated successfully!')
        } else {
          console.error('❌ Subscription update transaction failed')
        }
      } catch (error) {
        console.error('❌ Error updating subscription gasless relayer:', error)
      }
    } else {
      console.log('✅ Subscription gasless relayer already set correctly')
    }

    // Verify the changes
    console.log('\n🔍 Verifying updates...')
    
    const newFactoryRelayer = await publicClient.readContract({
      address: FACTORY_V6_ADDRESS,
      abi: UPDATE_GASLESS_RELAYER_ABI,
      functionName: 'gaslessRelayer'
    })
    
    const newSubscriptionRelayer = await publicClient.readContract({
      address: SUBSCRIPTION_V6_ADDRESS,
      abi: UPDATE_GASLESS_RELAYER_ABI,
      functionName: 'gaslessRelayer'
    })

    console.log('New Factory relayer:', newFactoryRelayer)
    console.log('New Subscription relayer:', newSubscriptionRelayer)

    if (newFactoryRelayer.toLowerCase() === NEW_GASLESS_RELAYER.toLowerCase() &&
        newSubscriptionRelayer.toLowerCase() === NEW_GASLESS_RELAYER.toLowerCase()) {
      console.log('\n🎉 All gasless relayer addresses updated successfully!')
      console.log('You can now create NFTs with the new gasless relayer.')
    } else {
      console.log('\n⚠️ Some updates may have failed. Please check the transaction receipts.')
    }

  } catch (error) {
    console.error('❌ Error in update process:', error)
  }
}

// Run the update
updateGaslessRelayer().catch(console.error)