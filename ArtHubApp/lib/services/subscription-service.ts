// Art3Hub V2 Subscription Service
import { type Address, type PublicClient, type WalletClient, parseUnits, createPublicClient, http } from 'viem'
import { getActiveNetwork } from '@/lib/networks'
import { base, baseSepolia, zora, zoraSepolia } from '@/lib/wagmi'

// Simple cache to prevent excessive API calls
const subscriptionCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 60000 // 60 seconds - longer cache to reduce RPC calls

// SubscriptionManager ABI - from deployed V2 contracts
const SUBSCRIPTION_MANAGER_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "canMintNFT",
    "outputs": [
      {"name": "canMint", "type": "bool"},
      {"name": "remainingNFTs", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "user", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "recordNFTMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "hasGaslessMinting",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "subscribeToFreePlan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "paymentToken", "type": "address"}
    ],
    "name": "subscribeToMasterPlan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getSubscription",
    "outputs": [
      {"name": "plan", "type": "uint8"},
      {"name": "expiresAt", "type": "uint256"},
      {"name": "nftsMinted", "type": "uint256"},
      {"name": "nftLimit", "type": "uint256"},
      {"name": "isActive", "type": "bool"},
      {"name": "isExpired", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "plan", "type": "uint8"}],
    "name": "planConfigs",
    "outputs": [
      {"name": "price", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "nftLimit", "type": "uint256"},
      {"name": "gasless", "type": "bool"},
      {"name": "name", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Plan types enum to match contract
export enum PlanType {
  FREE = 0,
  MASTER = 1
}

export interface SubscriptionInfo {
  plan: PlanType
  planName: string
  expiresAt: Date | null
  nftsMinted: number
  nftLimit: number
  isActive: boolean
  hasGaslessMinting: boolean
  remainingNFTs: number
}

export interface PlanConfig {
  price: bigint
  duration: number
  nftLimit: number
  gasless: boolean
  name: string
}

// Helper function to create public client for specific chain
function createChainSpecificPublicClient(chainId: number): PublicClient {
  switch (chainId) {
    case 84532: // Base Sepolia
      return createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      })
    case 8453: // Base Mainnet
      return createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
      })
    case 999999999: // Zora Sepolia
      return createPublicClient({
        chain: zoraSepolia,
        transport: http(process.env.NEXT_PUBLIC_ZORA_SEPOLIA_RPC_URL || 'https://sepolia.rpc.zora.energy')
      })
    case 7777777: // Zora Mainnet
      return createPublicClient({
        chain: zora,
        transport: http(process.env.NEXT_PUBLIC_ZORA_RPC_URL || 'https://rpc.zora.energy')
      })
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

// Get SubscriptionManager contract address based on network
function getSubscriptionManagerAddress(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_8453 as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_999999999 as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_7777777 as Address) || null
    default:
      return null
  }
}

// Get USDC contract address based on network
function getUSDCAddress(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_USDC_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_USDC_8453 as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_USDC_999999999 as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_USDC_7777777 as Address) || null
    default:
      return null
  }
}

export class SubscriptionService {
  private publicClient: PublicClient
  private walletClient: WalletClient | null
  private chainId: number
  private subscriptionManagerAddress: Address

  constructor(publicClient: PublicClient, walletClient: WalletClient | null, chainId: number) {
    this.publicClient = createChainSpecificPublicClient(chainId)
    this.walletClient = walletClient
    this.chainId = chainId
    
    const managerAddress = getSubscriptionManagerAddress(chainId)
    console.log('🔍 Looking for SubscriptionManager on chain', chainId, ':', managerAddress)
    
    if (!managerAddress) {
      console.warn(`⚠️ SubscriptionManager not deployed on chain ${chainId}, using fallback mode`)
      // Use a placeholder address - the service will provide default Free Plan for all users
      this.subscriptionManagerAddress = '0x0000000000000000000000000000000000000000' as Address
    } else {
      this.subscriptionManagerAddress = managerAddress
      console.log('✅ SubscriptionManager found:', managerAddress)
    }
    
    console.log('🔧 SubscriptionService initialized:', {
      chainId,
      subscriptionManager: this.subscriptionManagerAddress,
      isUsingFallback: this.subscriptionManagerAddress === '0x0000000000000000000000000000000000000000',
      hasWallet: !!walletClient
    })
  }

  // Check user's subscription status
  async getUserSubscription(userAddress: Address): Promise<SubscriptionInfo> {
    try {
      console.log('📋 Getting subscription for user:', userAddress)
      
      // If no valid contract address, return default Free Plan
      if (this.subscriptionManagerAddress === '0x0000000000000000000000000000000000000000') {
        console.log('🆓 No subscription contract available, returning default Free Plan')
        const defaultPlan = {
          plan: PlanType.FREE,
          planName: 'Free Plan',
          expiresAt: null,
          nftsMinted: 0,
          nftLimit: 1,
          isActive: true,
          hasGaslessMinting: false,
          remainingNFTs: 1
        }
        return defaultPlan
      }
      
      // Check cache first
      const cacheKey = `subscription_${userAddress}_${this.chainId}`
      const cached = subscriptionCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('🎯 Returning cached subscription data')
        return cached.data
      }
      
      let subscription
      let canMint = false
      let remainingNFTs = 0
      let hasGaslessMinting = false

      try {
        // Try to get user subscription
        console.log('🔍 Querying blockchain for subscription:', {
          contract: this.subscriptionManagerAddress,
          user: userAddress,
          chainId: this.chainId
        })
        const subscriptionResult = await this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'getSubscription',
          args: [userAddress]
        })
        
        // Convert array result to object format
        subscription = {
          plan: subscriptionResult[0],
          expiresAt: subscriptionResult[1],
          nftsMinted: subscriptionResult[2],
          nftLimit: subscriptionResult[3],
          isActive: subscriptionResult[4],
          isExpired: subscriptionResult[5]
        }
        console.log('✅ Blockchain subscription data:', subscription)
        console.log('🔍 Detailed subscription breakdown:', {
          plan: subscription.plan,
          expiresAt: subscription.expiresAt?.toString(),
          nftsMinted: subscription.nftsMinted?.toString(),
          isActive: subscription.isActive,
          raw: subscription
        })
      } catch (subscriptionError) {
        const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error'
        
        // Check for rate limiting
        if (errorMessage.includes('over rate limit') || errorMessage.includes('429')) {
          console.warn('🚫 RPC rate limit hit, using cached data if available')
          // For rate limiting, use any cached data even if expired
          const cachedResult = subscriptionCache.get(cacheKey)
          if (cachedResult) {
            console.log('📦 Using expired cached data due to rate limit')
            // Extend cache time to prevent more calls
            cachedResult.timestamp = Date.now()
            return cachedResult.data
          }
        }
        
        console.log('🟡 User has no subscription, returning default active free plan')
      }
      
      // If no subscription found after retries, check database for actual NFT count
      if (!subscription) {
        let actualNftsMinted = 0
        try {
          const response = await fetch(`/api/nfts?wallet_address=${userAddress}`)
          if (response.ok) {
            const nftData = await response.json()
            actualNftsMinted = nftData.nfts?.length || 0
            console.log('📊 Database NFT count for user:', userAddress, '=', actualNftsMinted)
          }
        } catch (dbError) {
          console.warn('Could not fetch NFT count from database:', dbError)
        }
        
        // User has no subscription, return active free plan by default
        const defaultPlan = {
          plan: PlanType.FREE,
          planName: 'Free Plan',
          expiresAt: null,
          nftsMinted: actualNftsMinted, // Use actual count from database
          nftLimit: 1,
          isActive: true,
          hasGaslessMinting: false,
          remainingNFTs: Math.max(0, 1 - actualNftsMinted) // Calculate remaining based on actual count
        }
        
        // Cache the result
        subscriptionCache.set(cacheKey, { data: defaultPlan, timestamp: Date.now() })
        return defaultPlan
      }

      // Try to get remaining NFTs and minting capability
      try {
        const mintData = await this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'canMintNFT',
          args: [userAddress]
        })
        canMint = mintData[0]
        remainingNFTs = Number(mintData[1])
      } catch (mintError) {
        console.log('Could not check minting capability, using defaults')
        canMint = false
        remainingNFTs = 0
      }

      // Try to get gasless minting status
      try {
        hasGaslessMinting = await this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'hasGaslessMinting',
          args: [userAddress]
        })
      } catch (gaslessError) {
        console.log('Could not check gasless minting status, using default false')
        hasGaslessMinting = false
      }

      // Get plan configuration - returns [price, duration, nftLimit, gasless, name]
      const planConfigData = await this.publicClient.readContract({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'planConfigs',
        args: [subscription.plan]
      })

      const [, , , gasless, name] = planConfigData
      const nftLimit = subscription.nftLimit // Use nftLimit from subscription data

      const expiresAt = subscription.expiresAt > 0 ? new Date(Number(subscription.expiresAt) * 1000) : null

      // Check database for actual NFT count (more accurate than blockchain)
      let actualNftsMinted = Number(subscription.nftsMinted)
      try {
        const response = await fetch(`/api/nfts?wallet_address=${userAddress}`)
        if (response.ok) {
          const nftData = await response.json()
          const dbNftCount = nftData.nfts?.length || 0
          // Use database count if it's higher (more accurate)
          actualNftsMinted = Math.max(actualNftsMinted, dbNftCount)
          console.log('📊 NFT count comparison for user:', userAddress, {
            blockchain: Number(subscription.nftsMinted),
            database: dbNftCount,
            using: actualNftsMinted
          })
        }
      } catch (dbError) {
        console.warn('Could not fetch NFT count from database:', dbError)
      }

      const result = {
        plan: subscription.plan as PlanType,
        planName: name,
        expiresAt,
        nftsMinted: actualNftsMinted, // Use actual count from database/blockchain comparison
        nftLimit: Number(nftLimit),
        isActive: subscription.isActive && canMint,
        hasGaslessMinting: gasless,
        remainingNFTs: Math.max(0, Number(nftLimit) - actualNftsMinted) // Recalculate based on actual count
      }
      
      // Cache the result
      subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Error getting user subscription:', error)
      // Return default active free plan if any error occurs
      const errorDefaultPlan = {
        plan: PlanType.FREE,
        planName: 'Free Plan',
        expiresAt: null,
        nftsMinted: 0,
        nftLimit: 1,
        isActive: true,
        hasGaslessMinting: false,
        remainingNFTs: 1
      }
      
      // Cache the error result (shorter cache duration)
      const cacheKey = `subscription_${userAddress}_${this.chainId}`
      subscriptionCache.set(cacheKey, { data: errorDefaultPlan, timestamp: Date.now() - (CACHE_DURATION - 5000) })
      return errorDefaultPlan
    }
  }

  // Subscribe to free plan
  async subscribeToFreePlan(): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🆓 Subscribing to free plan...')
      
      // Estimate gas for free plan subscription
      console.log('⛽ Estimating gas for free plan subscription...')
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToFreePlan',
        account: this.walletClient.account!
      })
      
      // Add 20% buffer to gas estimate for safety
      const gasLimit = gasEstimate + (gasEstimate * BigInt(20) / BigInt(100))
      console.log('⛽ Free plan subscription gas estimation:', {
        estimated: gasEstimate.toString(),
        withBuffer: gasLimit.toString()
      })
      
      const hash = await this.walletClient.writeContract({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToFreePlan',
        chain: this.publicClient.chain,
        account: this.walletClient.account!,
        gas: gasLimit
      })

      console.log('✅ Free plan subscription transaction sent:', hash)
      
      // Wait for confirmation
      await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('🎉 Free plan subscription confirmed!')
      
      return hash
    } catch (error) {
      console.error('Error subscribing to free plan:', error)
      throw new Error(`Failed to subscribe to free plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Subscribe to master plan (requires USDC payment)
  async subscribeToMasterPlan(): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('💎 Subscribing to master plan...')
      
      const usdcAddress = getUSDCAddress(this.chainId)
      if (!usdcAddress) {
        throw new Error(`USDC not configured for chain ${this.chainId}`)
      }

      // Get user address
      const userAddress = this.walletClient.account?.address
      if (!userAddress) {
        throw new Error('No wallet address available')
      }

      // Get plan configuration to know the price
      const planConfig = await this.publicClient.readContract({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'planConfigs',
        args: [PlanType.MASTER]
      })

      // planConfig is a tuple: [price, duration, nftLimit, gasless, name]
      const [price, duration, nftLimit, gasless, name] = planConfig
      console.log('💰 Master plan price:', price.toString(), 'USDC (6 decimals) - Monthly subscription')
      console.log('📊 Master plan config details:', {
        price: price.toString(),
        duration: duration.toString(),
        nftLimit: nftLimit.toString(),
        gasless,
        name
      })

      // Verify the plan is properly configured
      if (price === BigInt(0)) {
        throw new Error('Master plan price is not configured in the smart contract')
      }
      
      if (duration === BigInt(0)) {
        throw new Error('Master plan duration is not configured in the smart contract')
      }

      // Check user's USDC balance
      const usdcBalance = await this.publicClient.readContract({
        address: usdcAddress,
        abi: [
          {
            "inputs": [{"name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'balanceOf',
        args: [userAddress]
      })

      console.log('💳 User USDC balance:', usdcBalance.toString(), 'USDC (6 decimals)')

      if (usdcBalance < price) {
        throw new Error(`Insufficient USDC balance. Need ${price.toString()}, have ${usdcBalance.toString()}. Please get USDC from a faucet first. (Monthly subscription: $4.99/month)`)
      }

      // Check and approve USDC spending if needed
      const currentAllowance = await this.publicClient.readContract({
        address: usdcAddress,
        abi: [
          {
            "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
            "name": "allowance",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'allowance',
        args: [userAddress, this.subscriptionManagerAddress]
      })

      console.log('🔍 Current USDC allowance:', currentAllowance.toString())

      if (currentAllowance < price) {
        console.log('⚠️ Insufficient USDC allowance, requesting approval...')
        
        const approveHash = await this.walletClient.writeContract({
          address: usdcAddress,
          abi: [
            {
              "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
              "name": "approve",
              "outputs": [{"name": "", "type": "bool"}],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'approve',
          args: [this.subscriptionManagerAddress, price],
          chain: this.publicClient.chain,
          account: this.walletClient.account!
        })

        console.log('✅ USDC approval transaction sent:', approveHash)
        console.log('⏳ Waiting for USDC approval confirmation...')
        const approveReceipt = await this.publicClient.waitForTransactionReceipt({ hash: approveHash })
        
        if (approveReceipt.status === 'reverted') {
          console.error('❌ USDC approval transaction reverted!')
          throw new Error('USDC approval transaction failed. The transaction was reverted on the blockchain.')
        }
        
        console.log('🎉 USDC approval confirmed successfully!')
      }

      // Verify final allowance before subscription
      const finalAllowance = await this.publicClient.readContract({
        address: usdcAddress,
        abi: [
          {
            "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
            "name": "allowance",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'allowance',
        args: [userAddress, this.subscriptionManagerAddress]
      })
      
      console.log('🔍 Final verification before subscription:', {
        allowance: finalAllowance.toString(),
        required: price.toString(),
        sufficient: finalAllowance >= price
      })

      // Check if user already has an active subscription
      try {
        const existingSubResult = await this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'getSubscription',
          args: [userAddress]
        })
        
        const existingSubscription = {
          plan: existingSubResult[0],
          expiresAt: existingSubResult[1],
          nftsMinted: existingSubResult[2],
          nftLimit: existingSubResult[3],
          isActive: existingSubResult[4],
          isExpired: existingSubResult[5]
        }
        
        console.log('📋 Existing subscription check:', {
          plan: existingSubscription.plan,
          isActive: existingSubscription.isActive,
          expiresAt: existingSubscription.expiresAt.toString(),
          nftsMinted: existingSubscription.nftsMinted.toString()
        })
        
        if (existingSubscription.isActive && existingSubscription.plan === PlanType.MASTER) {
          throw new Error('User already has an active Master plan subscription')
        }
      } catch (existingSubError) {
        console.log('ℹ️ No existing subscription found (this is normal for new users)')
      }

      // Check if USDC token is accepted by the contract
      try {
        console.log('🔍 Checking if USDC token is accepted by contract...')
        const isTokenAccepted = await this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: [
            {
              "inputs": [{"name": "token", "type": "address"}],
              "name": "acceptedTokens",
              "outputs": [{"name": "", "type": "bool"}],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'acceptedTokens',
          args: [usdcAddress]
        })
        
        if (!isTokenAccepted) {
          console.error('❌ USDC token is not whitelisted in the contract!')
          throw new Error(`USDC token (${usdcAddress}) is not accepted by the subscription contract. The contract owner needs to whitelist this token first.`)
        }
        
        console.log('✅ USDC token is accepted by the contract')
      } catch (tokenCheckError) {
        if (tokenCheckError instanceof Error && tokenCheckError.message.includes('not accepted')) {
          throw tokenCheckError
        }
        console.warn('Could not verify token acceptance, proceeding with transaction...')
      }

      // Simulate the transaction first to check for revert reasons
      try {
        console.log('🧪 Simulating Master plan subscription transaction...')
        await this.publicClient.simulateContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'subscribeToMasterPlan',
          args: [usdcAddress],
          account: userAddress
        })
        console.log('✅ Transaction simulation successful')
      } catch (simulationError) {
        console.error('❌ Transaction simulation failed:', simulationError)
        
        // Check for specific error patterns
        const errorMessage = simulationError instanceof Error ? simulationError.message : 'Unknown simulation error'
        
        if (errorMessage.includes('execution reverted') && errorMessage.includes('unknown reason')) {
          throw new Error(`The Master plan subscription failed. This usually means the USDC token (${usdcAddress}) is not whitelisted in the subscription contract. Please contact support.`)
        }
        
        throw new Error(`Transaction will fail: ${errorMessage}`)
      }

      // Now attempt the master plan subscription
      console.log('🚀 Attempting subscription with parameters:', {
        contract: this.subscriptionManagerAddress,
        usdcAddress,
        userAddress,
        function: 'subscribeToMasterPlan',
        note: 'Price is hardcoded in contract config'
      })
      
      const hash = await this.walletClient.writeContract({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToMasterPlan',
        args: [usdcAddress],
        chain: this.publicClient.chain,
        account: this.walletClient.account!
      })

      console.log('✅ Master plan subscription transaction sent:', hash)
      
      // Wait for confirmation and check if it reverted
      console.log('⏳ Waiting for Master plan subscription confirmation...')
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'reverted') {
        console.error('❌ Master plan subscription transaction reverted!')
        throw new Error('Master plan subscription transaction failed. The transaction was reverted on the blockchain.')
      }
      
      console.log('🎉 Master plan subscription confirmed successfully!')
      console.log('📋 Transaction receipt:', {
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString()
      })
      
      // Immediately verify the subscription was written to blockchain
      try {
        console.log('🔍 Verifying Master plan subscription was written to blockchain...')
        await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds for state propagation
        
        const verificationResult = await this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'getSubscription',
          args: [userAddress]
        })
        
        const verificationSubscription = {
          plan: verificationResult[0],
          expiresAt: verificationResult[1],
          nftsMinted: verificationResult[2],
          nftLimit: verificationResult[3],
          isActive: verificationResult[4],
          isExpired: verificationResult[5]
        }
        
        console.log('✅ Verification - subscription found:', {
          plan: verificationSubscription.plan,
          expiresAt: verificationSubscription.expiresAt?.toString(),
          nftsMinted: verificationSubscription.nftsMinted?.toString(),
          isActive: verificationSubscription.isActive
        })
        
        if (verificationSubscription.plan === PlanType.MASTER && verificationSubscription.isActive) {
          console.log('✅ Master plan subscription successfully verified on blockchain!')
        } else {
          console.warn('⚠️ Master plan subscription verification failed - unexpected data:', verificationSubscription)
        }
        
      } catch (verifyError) {
        console.warn('⚠️ Could not immediately verify Master plan subscription:', verifyError)
      }
      
      return hash
    } catch (error) {
      console.error('Error subscribing to master plan:', error)
      throw new Error(`Failed to subscribe to master plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get plan configurations
  async getPlanConfigs(): Promise<{ free: PlanConfig; master: PlanConfig }> {
    try {
      const [freePlan, masterPlan] = await Promise.all([
        this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'planConfigs',
          args: [PlanType.FREE]
        }),
        this.publicClient.readContract({
          address: this.subscriptionManagerAddress,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'planConfigs',
          args: [PlanType.MASTER]
        })
      ])

      // Both plans return tuples: [price, duration, nftLimit, gasless, name]
      const [freePrice, freeDuration, freeNftLimit, freeGasless, freeName] = freePlan
      const [masterPrice, masterDuration, masterNftLimit, masterGasless, masterName] = masterPlan

      return {
        free: {
          price: freePrice,
          duration: Number(freeDuration),
          nftLimit: Number(freeNftLimit),
          gasless: freeGasless,
          name: freeName
        },
        master: {
          price: masterPrice,
          duration: Number(masterDuration),
          nftLimit: Number(masterNftLimit),
          gasless: masterGasless,
          name: masterName
        }
      }
    } catch (error) {
      console.error('Error getting plan configs:', error)
      throw error
    }
  }

  // Check if user can mint NFT
  async canUserMint(userAddress: Address): Promise<{ canMint: boolean; remainingNFTs: number }> {
    try {
      // Get subscription info first to know the limit
      const subscription = await this.getUserSubscription(userAddress)
      
      // Check database for actual NFT count
      let actualNftsMinted = subscription.nftsMinted
      try {
        const response = await fetch(`/api/nfts?wallet_address=${userAddress}`)
        if (response.ok) {
          const nftData = await response.json()
          const dbNftCount = nftData.nfts?.length || 0
          // Use database count if it's higher (more accurate)
          actualNftsMinted = Math.max(actualNftsMinted, dbNftCount)
          console.log('📊 canUserMint NFT count comparison:', {
            blockchain: subscription.nftsMinted,
            database: dbNftCount,
            using: actualNftsMinted,
            limit: subscription.nftLimit
          })
        }
      } catch (dbError) {
        console.warn('Could not fetch NFT count from database in canUserMint:', dbError)
      }

      const remainingNFTs = Math.max(0, subscription.nftLimit - actualNftsMinted)
      
      // Be more lenient with minting validation - allow Free Plan access for new users
      let canMint = subscription.isActive && remainingNFTs > 0
      
      // If user is not active but has Free Plan (new user case), allow minting if within limits
      if (!canMint && subscription.plan === PlanType.FREE && remainingNFTs > 0) {
        console.log('🆓 Allowing Free Plan minting for new user (not explicitly subscribed but within limits)')
        canMint = true
      }

      console.log('🔍 Final mint capability:', {
        isActive: subscription.isActive,
        plan: subscription.plan,
        actualNftsMinted,
        nftLimit: subscription.nftLimit,
        remainingNFTs,
        canMint
      })

      return {
        canMint,
        remainingNFTs
      }
    } catch (error) {
      console.error('Error checking mint capability:', error)
      // Default to free plan limits
      return { canMint: true, remainingNFTs: 1 }
    }
  }

  // Record NFT mint (called by factory/collection contracts)
  async recordNFTMint(userAddress: Address, amount: number = 1): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log(`📝 Recording ${amount} NFT mint for user:`, userAddress)
      
      // Estimate gas for recording NFT mint
      console.log('⛽ Estimating gas for NFT mint recording...')
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'recordNFTMint',
        args: [userAddress, BigInt(amount)],
        account: this.walletClient.account!
      })
      
      // Add 20% buffer to gas estimate for safety
      const gasLimit = gasEstimate + (gasEstimate * BigInt(20) / BigInt(100))
      console.log('⛽ NFT mint recording gas estimation:', {
        estimated: gasEstimate.toString(),
        withBuffer: gasLimit.toString()
      })
      
      const hash = await this.walletClient.writeContract({
        address: this.subscriptionManagerAddress,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'recordNFTMint',
        args: [userAddress, BigInt(amount)],
        chain: this.publicClient.chain,
        account: this.walletClient.account!,
        gas: gasLimit
      })

      console.log('✅ NFT mint record transaction sent:', hash)
      
      // Clear cache for this user to ensure fresh data on next fetch
      this.clearUserCache(userAddress)
      
      return hash
    } catch (error) {
      console.error('Error recording NFT mint:', error)
      throw new Error(`Failed to record NFT mint: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Clear cache for a specific user
  clearUserCache(userAddress: Address): void {
    const cacheKey = `subscription_${userAddress}_${this.chainId}`
    subscriptionCache.delete(cacheKey)
    console.log('🗑️ Cleared subscription cache for user:', userAddress)
  }

  // Clear all cache (for testing or admin purposes)
  static clearAllCache(): void {
    subscriptionCache.clear()
    console.log('🗑️ Cleared all subscription cache')
  }
}

// Helper function to create SubscriptionService instance
export function createSubscriptionService(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  return new SubscriptionService(publicClient, walletClient, activeNetwork.id)
}

// Export plan type utilities
export const PLAN_NAMES = {
  [PlanType.FREE]: 'Plan Gratuito',
  [PlanType.MASTER]: 'Plan Master'
} as const

export const PLAN_DESCRIPTIONS = {
  [PlanType.FREE]: 'Basic Web3 onboarding with 1 gasless NFT mint',
  [PlanType.MASTER]: 'Premium features with 10 NFTs/month and exclusive content'
} as const