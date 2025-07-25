// Art3Hub V4 Service - Advanced Gasless NFT creation with Elite Creator Plan
import { parseEther, type Address, type PublicClient, type WalletClient, createPublicClient, http, keccak256, toBytes, encodePacked, decodeEventLog } from 'viem'
import { getActiveNetwork } from '@/lib/networks'
import { base, baseSepolia, zora, zoraSepolia, celo, celoAlfajores } from '@/lib/wagmi'

// Art3HubFactoryV4 ABI - from deployed V4 contracts
const ART3HUB_FACTORY_V4_ABI = [
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "image", "type": "string"},
      {"name": "externalUrl", "type": "string"},
      {"name": "royaltyRecipient", "type": "address"},
      {"name": "royaltyFeeNumerator", "type": "uint96"}
    ],
    "name": "createCollection",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "collection", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenURI", "type": "string"}
    ],
    "name": "mintNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
  },
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
  },
  {
    "inputs": [],
    "name": "totalCollections",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "userNonces",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "collection", "type": "address"}],
    "name": "isArt3HubCollection",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "collection", "type": "address"},
      {"indexed": true, "name": "artist", "type": "address"},
      {"indexed": false, "name": "name", "type": "string"},
      {"indexed": false, "name": "symbol", "type": "string"},
      {"indexed": true, "name": "collectionId", "type": "uint256"}
    ],
    "name": "CollectionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "collection", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "tokenURI", "type": "string"},
      {"indexed": false, "name": "gasless", "type": "bool"}
    ],
    "name": "NFTMinted",
    "type": "event"
  }
] as const

// Art3HubSubscriptionV4 ABI - Enhanced with Elite Creator Plan
const ART3HUB_SUBSCRIPTION_V4_ABI = [
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
  },
  {
    "inputs": [{"name": "plan", "type": "uint8"}],
    "name": "getPlanName",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "canUserMint",
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
    "inputs": [{"name": "autoRenew", "type": "bool"}],
    "name": "subscribeToMasterPlan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "autoRenew", "type": "bool"}],
    "name": "subscribeToElitePlan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "newPlan", "type": "uint8"}],
    "name": "downgradeSubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserNonce",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Art3HubCollectionV4 ABI - for reading collection info
const ART3HUB_COLLECTION_V4_ABI = [
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "artist",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "factory",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

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
    case 44787: // Celo Alfajores
      return createPublicClient({
        chain: celoAlfajores,
        transport: http(process.env.NEXT_PUBLIC_CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org')
      })
    case 42220: // Celo Mainnet
      return createPublicClient({
        chain: celo,
        transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org')
      })
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

// Get Art3HubFactoryV4 contract address based on network (Updated to use V6 contracts)
function getArt3HubFactoryV4Address(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V5_84532 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V5_8453 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_8453 as Address) || null
    case 999999999: // Zora Sepolia - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_999999999 as Address) || null
    case 7777777: // Zora Mainnet - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_7777777 as Address) || null
    case 44787: // Celo Alfajores - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_44787 as Address) || null
    case 42220: // Celo Mainnet - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_42220 as Address) || null
    default:
      return null
  }
}

// Get Art3HubSubscriptionV4 contract address based on network (Updated to use V6 contracts)
function getArt3HubSubscriptionV4Address(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_84532 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_8453 as Address) || (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_8453 as Address) || null
    case 999999999: // Zora Sepolia - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_999999999 as Address) || null
    case 7777777: // Zora Mainnet - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_7777777 as Address) || null
    case 44787: // Celo Alfajores - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_44787 as Address) || null
    case 42220: // Celo Mainnet - V6 Base-only, fallback to V4
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_42220 as Address) || null
    default:
      return null
  }
}

export interface Art3HubV4CollectionParams {
  name: string
  symbol: string
  description: string
  imageURI: string
  externalUrl?: string
  artist: Address
  royaltyRecipient: Address
  royaltyBPS: number // Basis points (e.g., 500 = 5%)
}

export interface Art3HubV4MintParams {
  collectionContract: Address
  recipient: Address
  tokenURI: string
}

export interface V4CollectionCreationResult {
  transactionHash: string
  contractAddress: Address
  gasless?: boolean
  collectionData: {
    name: string
    symbol: string
    description: string
    imageURI: string
    artist: Address
    royaltyBPS: number
  }
}

export interface V4MintResult {
  transactionHash: string
  tokenId?: number
  gasless: boolean
}

export interface V4SubscriptionInfo {
  plan: 'FREE' | 'MASTER' | 'ELITE'
  planName: string
  expiresAt: Date | null
  nftsMinted: number
  nftLimit: number
  remainingNFTs: number
  isActive: boolean
  autoRenew: boolean
  hasGaslessMinting: boolean
  totalNFTs?: number // Total NFTs including claimable NFTs (for information display)
  userCreatedNFTs?: number // Only user-created NFTs (for clarity)
}

export class Art3HubV4Service {
  private publicClient: PublicClient
  private walletClient: WalletClient | null
  private chainId: number
  public factoryAddress: Address
  public subscriptionAddress: Address

  constructor(
    publicClient: PublicClient, 
    walletClient: WalletClient | null, 
    chainId: number
  ) {
    this.publicClient = createChainSpecificPublicClient(chainId)
    this.walletClient = walletClient
    this.chainId = chainId
    
    const factoryAddress = getArt3HubFactoryV4Address(chainId)
    if (!factoryAddress) {
      throw new Error(`Art3HubFactoryV4 not deployed on chain ${chainId}`)
    }
    this.factoryAddress = factoryAddress
    
    const subscriptionAddress = getArt3HubSubscriptionV4Address(chainId)
    if (!subscriptionAddress) {
      throw new Error(`Art3HubSubscriptionV4 not deployed on chain ${chainId}`)
    }
    this.subscriptionAddress = subscriptionAddress
    
    console.log('🔧 Art3HubV4Service initialized:', {
      chainId,
      factory: this.factoryAddress,
      subscription: this.subscriptionAddress,
      hasWallet: !!walletClient
    })
  }

  // Get user subscription from V6 contract
  async getUserSubscription(userAddress: Address): Promise<V4SubscriptionInfo> {
    try {
      console.log('🔍 Getting V6 subscription for user:', userAddress)
      
      try {
        // V6 contracts - get subscription data directly from subscription contract
        const subscriptionResult = await this.publicClient.readContract({
          address: this.subscriptionAddress,
          abi: ART3HUB_SUBSCRIPTION_V4_ABI,
          functionName: 'getSubscription',
          args: [userAddress]
        })
        console.log('✅ V6 subscription contract call successful')
        
        // Subscription returns: [plan, expiresAt, nftsMinted, nftLimit, isActive, hasGaslessMinting]
        const [plan, expiresAt, nftsMinted, nftLimit, isActive, hasGaslessMinting] = subscriptionResult
        
        // Map plan numbers to plan names
        const planName = plan === 0 ? 'FREE Plan' : plan === 1 ? 'MASTER Plan' : plan === 2 ? 'ELITE Plan' : 'Unknown Plan'
        
        // Map plan numbers to types
        let planType: 'FREE' | 'MASTER' | 'ELITE'
        switch (plan) {
          case 0: planType = 'FREE'; break
          case 1: planType = 'MASTER'; break
          case 2: planType = 'ELITE'; break
          default: planType = 'FREE'
        }
        
        const remainingNFTs = Number(nftLimit) - Number(nftsMinted)
        
        const result: V4SubscriptionInfo = {
          plan: planType,
          planName: planName,
          expiresAt: Number(expiresAt) > 0 ? new Date(Number(expiresAt) * 1000) : null,
          nftsMinted: Number(nftsMinted),
          nftLimit: Number(nftLimit),
          remainingNFTs: Math.max(0, remainingNFTs),
          isActive: isActive,
          autoRenew: false, // V6 doesn't return autoRenew in getSubscription
          hasGaslessMinting: hasGaslessMinting
        }
        
        console.log('📋 V6 Subscription info:', result)
        return result
        
      } catch (subscriptionError) {
        console.log('❌ V6 subscription contract failed:', subscriptionError)
        
        // For V6 contracts, if subscription call fails, user likely needs to be enrolled
        // Return default free plan that will trigger enrollment
        return {
          plan: 'FREE',
          planName: 'Free Plan',
          expiresAt: null,
          nftsMinted: 0,
          nftLimit: 1, // V6 Free Plan: 1 NFT/month
          remainingNFTs: 1,
          isActive: false, // Not active, will trigger enrollment
          autoRenew: false,
          hasGaslessMinting: true // V6 has built-in gasless for all plans
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting V6 subscription:', error)
      
      // Return default inactive subscription for V6
      return {
        plan: 'FREE',
        planName: 'Free Plan',
        expiresAt: null,
        nftsMinted: 0,
        nftLimit: 1, // V6 Free Plan: 1 NFT/month
        remainingNFTs: 1,
        isActive: false,
        autoRenew: false,
        hasGaslessMinting: true // V6 has built-in gasless for all plans
      }
    }
  }

  // Subscribe to free plan (auto-enrollment)
  async subscribeToFreePlan(): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎁 Subscribing to V4 Free Plan...')
      
      const hash = await this.walletClient.writeContract({
        address: this.subscriptionAddress,
        abi: ART3HUB_SUBSCRIPTION_V4_ABI,
        functionName: 'subscribeToFreePlan',
        args: [],
        chain: this.publicClient.chain,
        account: this.walletClient.account!
      })
      
      console.log('✅ Free plan subscription transaction sent:', hash)
      return hash
      
    } catch (error) {
      console.error('❌ Error subscribing to V4 free plan:', error)
      throw new Error(`Failed to subscribe to free plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get USDC contract address for current chain
  private getUSDCAddress(): Address {
    switch (this.chainId) {
      case 84532: // Base Sepolia
        return '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address
      case 8453: // Base Mainnet  
        return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address
      case 999999999: // Zora Sepolia
        return '0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4' as Address
      case 7777777: // Zora Mainnet
        return (process.env.NEXT_PUBLIC_USDC_ZORA_MAINNET as Address) || '0x0' as Address
      case 44787: // Celo Alfajores
        return '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' as Address
      case 42220: // Celo Mainnet
        return (process.env.NEXT_PUBLIC_USDC_CELO_MAINNET as Address) || '0x0' as Address
      default:
        throw new Error(`USDC not configured for chain ${this.chainId}`)
    }
  }

  // Check and approve USDC for subscription payments
  async checkAndApproveUSDC(amount: bigint): Promise<{
    needsApproval: boolean
    approvalHash?: string
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      const userAddress = this.walletClient.account!.address
      const usdcAddress = this.getUSDCAddress()
      
      console.log(`💰 Checking USDC allowance for ${amount.toString()} tokens...`)
      
      // Check current allowance
      const allowance = await this.publicClient.readContract({
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
        args: [userAddress, this.subscriptionAddress]
      })
      
      console.log(`Current USDC allowance: ${allowance.toString()}`)
      
      if (allowance >= amount) {
        console.log('✅ Sufficient USDC allowance already exists')
        return { needsApproval: false }
      }
      
      console.log('⚠️  Insufficient USDC allowance, requesting approval...')
      
      // Request approval from user wallet
      const approvalHash = await this.walletClient.writeContract({
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
        args: [this.subscriptionAddress, amount]
      })
      
      console.log(`💰 USDC approval transaction sent: ${approvalHash}`)
      
      // Wait for approval confirmation
      await this.publicClient.waitForTransactionReceipt({ hash: approvalHash })
      
      console.log('✅ USDC approval confirmed')
      
      return {
        needsApproval: true,
        approvalHash
      }
      
    } catch (error) {
      console.error('❌ Error with USDC approval:', error)
      throw new Error(`USDC approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Gasless upgrade to Master Plan - relayer pays gas, user pays USDC
  async upgradeToMasterPlanGasless(autoRenew: boolean = false): Promise<{
    approvalHash?: string
    subscriptionHash: string
    gasless: boolean
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('💎 Starting V4 Master Plan GASLESS upgrade for $4.99 USDC...')
      
      const userAddress = this.walletClient.account!.address
      
      // Step 1: Check and approve USDC (Master Plan: $4.99 = 4.99 * 10^6 USDC tokens)
      const masterPlanPrice = BigInt(4990000) // $4.99 in USDC (6 decimals: 4.99 * 10^6)
      console.log(`💰 Master Plan price: ${masterPlanPrice.toString()} USDC tokens (4.99 USDC)`)
      
      const approvalResult = await this.checkAndApproveUSDC(masterPlanPrice)
      
      // Step 2: Call gasless subscription upgrade via relayer
      console.log('💎 Submitting gasless Master Plan upgrade to relayer...')
      const relayerResponse = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upgradeToMaster',
          userAddress,
          autoRenew,
          chainId: this.chainId
        })
      })

      if (!relayerResponse.ok) {
        const errorData = await relayerResponse.json()
        throw new Error(`Relayer failed: ${JSON.stringify(errorData)}`)
      }

      const result = await relayerResponse.json()
      
      console.log('✅ Gasless V4 Master Plan upgrade successful!', result)
      
      return {
        approvalHash: approvalResult.approvalHash,
        subscriptionHash: result.transactionHash,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Error upgrading to V4 Master plan (gasless):', error)
      throw new Error(`Failed to upgrade to Master Plan (gasless): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Gasless upgrade to Elite Creator Plan (NEW in V4)
  async upgradeToElitePlanGasless(autoRenew: boolean = false): Promise<{
    approvalHash?: string
    subscriptionHash: string
    gasless: boolean
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('👑 Starting V4 Elite Creator Plan GASLESS upgrade for $9.99 USDC...')
      
      const userAddress = this.walletClient.account!.address
      
      // Step 1: Check and approve USDC (Elite Plan: $9.99 = 9.99 * 10^6 USDC tokens)
      const elitePlanPrice = BigInt(9990000) // $9.99 in USDC (6 decimals: 9.99 * 10^6)
      console.log(`👑 Elite Plan price: ${elitePlanPrice.toString()} USDC tokens (9.99 USDC)`)
      
      const approvalResult = await this.checkAndApproveUSDC(elitePlanPrice)
      
      // Step 2: Call gasless subscription upgrade via relayer
      console.log('👑 Submitting gasless Elite Creator Plan upgrade to relayer...')
      const relayerResponse = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upgradeToElite',
          userAddress,
          autoRenew,
          chainId: this.chainId
        })
      })

      if (!relayerResponse.ok) {
        const errorData = await relayerResponse.json()
        throw new Error(`Relayer failed: ${JSON.stringify(errorData)}`)
      }

      const result = await relayerResponse.json()
      
      console.log('✅ Gasless V4 Elite Creator Plan upgrade successful!', result)
      
      return {
        approvalHash: approvalResult.approvalHash,
        subscriptionHash: result.transactionHash,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Error upgrading to V4 Elite plan (gasless):', error)
      throw new Error(`Failed to upgrade to Elite Creator Plan (gasless): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Gasless downgrade subscription (NEW in V4)
  async downgradeSubscriptionGasless(newPlan: 0 | 1 | 2): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('⬇️ Starting V4 subscription downgrade...')
      
      const userAddress = this.walletClient.account!.address
      
      // Call gasless downgrade via relayer
      const relayerResponse = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'downgradeSubscription',
          userAddress,
          newPlan,
          chainId: this.chainId
        })
      })

      if (!relayerResponse.ok) {
        const errorData = await relayerResponse.json()
        throw new Error(`Relayer failed: ${JSON.stringify(errorData)}`)
      }

      const result = await relayerResponse.json()
      
      console.log('✅ Gasless V4 subscription downgrade successful!', result)
      return result.transactionHash
      
    } catch (error) {
      console.error('❌ Error downgrading V4 subscription (gasless):', error)
      throw new Error(`Failed to downgrade subscription (gasless): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if user can mint NFTs (V6 subscription-based checking)
  async canUserMint(userAddress: Address, amount: number = 1): Promise<{ canMint: boolean; remainingNFTs: number }> {
    try {
      console.log('🔍 Checking if user can mint NFTs (V6):', { userAddress, amount })
      
      // Get subscription info from V6 contract
      const subscription = await this.getUserSubscription(userAddress)
      
      // Check if user has remaining NFTs in their quota
      const canMint = subscription.isActive && subscription.remainingNFTs >= amount
      
      console.log('📋 V6 Mint capability check:', {
        isActive: subscription.isActive,
        remainingNFTs: subscription.remainingNFTs,
        requestedAmount: amount,
        canMint
      })
      
      return {
        canMint,
        remainingNFTs: subscription.remainingNFTs
      }
      
    } catch (error) {
      console.error('❌ Error checking V6 mint capability:', error)
      return { canMint: false, remainingNFTs: 0 }
    }
  }

  // Create a collection with built-in gasless functionality (V6)
  async createCollection(params: Art3HubV4CollectionParams): Promise<V4CollectionCreationResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎨 Creating Art3Hub V4 collection...')
      console.log('📋 Collection params:', {
        name: params.name,
        symbol: params.symbol,
        artist: params.artist
      })
      
      // Check user subscription status first
      const userAddress = this.walletClient.account!.address
      console.log('🔍 Checking subscription for user:', userAddress)
      
      let subscription
      try {
        subscription = await this.getUserSubscription(userAddress)
        console.log('🔍 User subscription status:', {
          isActive: subscription.isActive,
          plan: subscription.plan,
          remainingNFTs: subscription.remainingNFTs
        })
      } catch (error) {
        console.error('❌ Error getting subscription status:', error)
        // Set default subscription if check fails
        subscription = {
          plan: 'FREE' as const,
          planName: 'Free Plan',
          expiresAt: null,
          nftsMinted: 0,
          nftLimit: 1,
          remainingNFTs: 1,
          isActive: false,
          autoRenew: false,
          hasGaslessMinting: true
        }
        console.log('⚠️ Using default subscription, will attempt enrollment')
      }
      
      // If user is not active, subscribe to free plan first
      if (!subscription.isActive) {
        console.log('📝 User not enrolled, subscribing to Free Plan...')
        try {
          const subscriptionHash = await this.subscribeToFreePlan()
          console.log('✅ Free plan subscription successful:', subscriptionHash)
          
          // Wait for subscription to be confirmed
          await this.publicClient.waitForTransactionReceipt({ hash: subscriptionHash as `0x${string}` })
          console.log('✅ Subscription confirmed, proceeding with collection creation')
        } catch (error) {
          console.error('❌ Failed to subscribe to free plan:', error)
          throw new Error('Please try again - subscription enrollment failed')
        }
      } else {
        console.log('✅ User has active subscription, proceeding with collection creation')
      }
      
      // Convert royalty BPS to fee numerator (out of 10000)
      const royaltyFeeNumerator = BigInt(params.royaltyBPS)
      
      console.log('🚀 Creating V4 collection via factory...')
      
      // V4 uses gasless collection creation by default
      console.log('🆓 Using V4 gasless collection creation - relayer pays gas')
      
      // Step 1: Create and sign the collection voucher
      console.log('📝 Step 1: Creating EIP-712 collection voucher...')
      const { voucher, signature } = await this.createCollectionVoucher(params)
      
      // Step 2: Submit to relayer
      console.log('🚀 Step 2: Submitting to gasless relayer...')
      const result = await this.submitGaslessCollectionVoucher(voucher, signature)
      
      console.log('✅ Gasless V4 collection creation completed successfully!')
      
      return {
        transactionHash: result.transactionHash,
        contractAddress: result.contractAddress,
        gasless: true,
        collectionData: {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          imageURI: params.imageURI,
          artist: params.artist,
          royaltyBPS: params.royaltyBPS
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating Art3Hub V4 collection:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Transaction cancelled - you can try again when ready')
        } else if (error.message.includes('subscription')) {
          throw new Error(error.message)
        } else if (error.message.includes('network')) {
          throw new Error('Network error - please check your connection')
        } else if (error.message.includes('revert')) {
          throw new Error('Contract call reverted - please check your subscription status')
        }
      }
      
      throw new Error(`Failed to create V4 collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Create collection voucher for gasless collection creation (V4)
  async createCollectionVoucher(params: Art3HubV4CollectionParams): Promise<{
    voucher: {
      name: string
      symbol: string
      description: string
      image: string
      externalUrl: string
      artist: Address
      royaltyRecipient: Address
      royaltyFeeNumerator: bigint
      nonce: bigint
      deadline: bigint
    }
    signature: string
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎯 Creating gasless collection voucher for:', params.name)
      
      // Get user nonce for factory
      const nonceResult = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V4_ABI,
        functionName: 'userNonces',
        args: [this.walletClient.account!.address]
      })
      
      const nonce = BigInt(nonceResult.toString())
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour
      const royaltyFeeNumerator = BigInt(params.royaltyBPS)
      
      const voucher = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.imageURI,
        externalUrl: params.externalUrl || '',
        artist: params.artist,
        royaltyRecipient: params.royaltyRecipient,
        royaltyFeeNumerator,
        // V6 (V5) additional creator profile fields
        creatorName: params.name, // Use collection name as creator name for now
        creatorUsername: params.artist, // Use artist address as username for now
        creatorEmail: '', // Empty for now
        creatorProfilePicture: '', // Empty for now
        creatorSocialLinks: '', // Empty for now
        nonce,
        deadline
      }
      
      console.log('📝 V6 Collection voucher details:', voucher)
      
      // EIP-712 domain for V6 (V5)
      const domain = {
        name: 'Art3HubFactoryV5',
        version: '1',
        chainId: this.chainId,
        verifyingContract: this.factoryAddress
      } as const
      
      // EIP-712 types for V6 (V5)
      const types = {
        CollectionVoucherV5: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'image', type: 'string' },
          { name: 'externalUrl', type: 'string' },
          { name: 'artist', type: 'address' },
          { name: 'royaltyRecipient', type: 'address' },
          { name: 'royaltyFeeNumerator', type: 'uint96' },
          { name: 'creatorName', type: 'string' },
          { name: 'creatorUsername', type: 'string' },
          { name: 'creatorEmail', type: 'string' },
          { name: 'creatorProfilePicture', type: 'string' },
          { name: 'creatorSocialLinks', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      } as const
      
      // Sign the voucher
      const signature = await this.walletClient.signTypedData({
        account: this.walletClient.account!,
        domain,
        types,
        primaryType: 'CollectionVoucherV5',
        message: voucher
      })
      
      console.log('✅ V4 Collection voucher signed successfully')
      
      return { voucher, signature }
      
    } catch (error) {
      console.error('❌ Error creating V4 collection voucher:', error)
      throw new Error(`Failed to create collection voucher: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Submit collection voucher to gasless relayer (V4)
  async submitGaslessCollectionVoucher(voucher: any, signature: string): Promise<V4CollectionCreationResult> {
    try {
      console.log('🚀 Submitting V4 collection voucher to gasless relayer...')
      
      // Convert BigInt values to strings for JSON serialization
      const serializableVoucher = {
        ...voucher,
        royaltyFeeNumerator: voucher.royaltyFeeNumerator.toString(),
        nonce: voucher.nonce.toString(),
        deadline: voucher.deadline.toString()
      }
      
      // Send to relayer API endpoint with V6 type
      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'createCollectionV6',
          voucher: serializableVoucher,
          signature,
          chainId: this.chainId
        })
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Relayer failed: ${error}`)
      }
      
      const result = await response.json()
      console.log('✅ Gasless V4 collection creation successful:', result)
      
      // Extract contract address from the response - check multiple possible fields
      let contractAddress = result.contractAddress
      if (!contractAddress && result.collectionAddress) {
        contractAddress = result.collectionAddress
      }
      if (!contractAddress && result.address) {
        contractAddress = result.address
      }
      
      console.log('📋 Extracted contract address:', contractAddress)
      
      return {
        transactionHash: result.transactionHash,
        contractAddress: contractAddress as Address,
        gasless: true,
        collectionData: {
          name: voucher.name,
          symbol: voucher.symbol,
          description: voucher.description,
          imageURI: voucher.image,
          artist: voucher.artist,
          royaltyBPS: Number(voucher.royaltyFeeNumerator)
        }
      }
      
    } catch (error) {
      console.error('❌ Error submitting V4 gasless collection voucher:', error)
      throw new Error(`Gasless collection creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mint an NFT to an existing V4 collection (gasless)
  async mintNFT(params: Art3HubV4MintParams): Promise<V4MintResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎯 Starting gasless mint via V4 voucher system for collection:', params.collectionContract)
      
      // V4 contracts automatically handle subscription management
      // Free Plan: 1 NFT/month (auto-enrolled)
      // Master Plan: 10 NFTs/month ($4.99 USDC)
      // Elite Creator Plan: 25 NFTs/month ($9.99 USDC)
      console.log('🔍 V4 factory will validate subscription and quota automatically')
      
      // V4 uses gasless minting by default
      console.log('🆓 Using V4 gasless minting via factory...')
      
      // Step 1: Create and sign the mint voucher
      console.log('📝 Step 1: Creating EIP-712 mint voucher...')
      const { voucher, signature } = await this.createMintVoucher(params)
      
      // Step 2: Submit to relayer
      console.log('🚀 Step 2: Submitting to gasless relayer...')
      const result = await this.submitGaslessVoucher(voucher, signature)
      
      console.log('✅ Gasless V4 mint completed successfully!')
      
      return {
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Error minting V4 NFT:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Transaction cancelled - you can try again when ready')
        } else if (error.message.includes('Subscription check failed')) {
          throw error
        } else if (error.message.includes('Insufficient quota')) {
          throw new Error('Mint failed: You have reached your NFT quota. Free Plan: 1 NFT/month, Master Plan: 10 NFTs/month, Elite Plan: 25 NFTs/month.')
        }
      }
      
      throw new Error(`Failed to mint V4 NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Create gasless mint voucher (EIP-712 signature) for V4
  async createMintVoucher(params: Art3HubV4MintParams): Promise<{
    voucher: {
      collection: Address
      to: Address
      tokenURI: string
      nonce: bigint
      deadline: bigint
    }
    signature: string
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎯 Creating gasless mint voucher for V4 collection:', params.collectionContract)
      
      // Get user nonce from factory contract
      const nonceResult = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V4_ABI,
        functionName: 'userNonces',
        args: [this.walletClient.account!.address]
      })
      
      const nonce = BigInt(nonceResult.toString())
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour
      
      const voucher = {
        collection: params.collectionContract,
        to: params.recipient,
        tokenURI: params.tokenURI,
        nonce,
        deadline
      }
      
      console.log('📝 V4 Mint voucher details:', voucher)
      
      // EIP-712 domain for V4
      const domain = {
        name: 'Art3HubFactoryV4',
        version: '1',
        chainId: this.chainId,
        verifyingContract: this.factoryAddress
      }
      
      // EIP-712 types for V4
      const types = {
        MintVoucher: [
          { name: 'collection', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'tokenURI', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }
      
      console.log('🔐 Requesting EIP-712 signature for V4...')
      
      // Sign the voucher
      const signature = await this.walletClient.signTypedData({
        account: this.walletClient.account!,
        domain,
        types,
        primaryType: 'MintVoucher',
        message: voucher
      })
      
      console.log('✅ V4 Voucher signed successfully')
      
      return { voucher, signature }
      
    } catch (error) {
      console.error('❌ Error creating V4 mint voucher:', error)
      throw new Error(`Failed to create mint voucher: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Submit voucher to gasless relayer (V4)
  async submitGaslessVoucher(voucher: any, signature: string): Promise<V4MintResult> {
    try {
      console.log('🚀 Submitting V4 voucher to gasless relayer...')
      
      // Convert BigInt values to strings for JSON serialization
      const serializableVoucher = {
        ...voucher,
        nonce: voucher.nonce.toString(),
        deadline: voucher.deadline.toString()
      }
      
      // Send to relayer API endpoint with V4 type
      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'mintV4',
          voucher: serializableVoucher,
          signature,
          chainId: this.chainId
        })
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Relayer failed: ${error}`)
      }
      
      const result = await response.json()
      console.log('✅ Gasless V4 mint successful:', result)
      
      return {
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Error submitting V4 gasless voucher:', error)
      throw new Error(`Gasless mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get collection information (V4)
  async getCollectionInfo(contractAddress: Address) {
    try {
      console.log('📖 Fetching V4 collection info from:', contractAddress)
      
      const totalSupply = await this.publicClient.readContract({
        address: contractAddress,
        abi: ART3HUB_COLLECTION_V4_ABI,
        functionName: 'totalSupply'
      })
      
      return {
        address: contractAddress,
        totalSupply: Number(totalSupply),
        chainId: this.chainId
      }
    } catch (error) {
      console.error('Error fetching V4 collection info:', error)
      throw error
    }
  }

  // Get total collections created by the factory (V4)
  async getTotalCollections(): Promise<number> {
    try {
      const totalCollections = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V4_ABI,
        functionName: 'totalCollections'
      })
      
      return Number(totalCollections)
    } catch (error) {
      console.error('Error fetching V4 total collections:', error)
      return 0
    }
  }

  // Check if user can create collection (V4 has auto-enrollment)
  async canCreateCollection(userAddress: Address): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userAddress)
      return subscription.isActive || true // V4 allows auto-enrollment
    } catch (error) {
      console.error('Error checking V4 collection creation capability:', error)
      return true // V4 defaults to allowing creation with auto-enrollment
    }
  }

  // Get user's remaining NFT quota (V4)
  async getUserQuota(userAddress: Address): Promise<{ remaining: number; total: number; planName: string }> {
    try {
      const subscription = await this.getUserSubscription(userAddress)
      return {
        remaining: subscription.remainingNFTs,
        total: subscription.nftLimit,
        planName: subscription.planName
      }
    } catch (error) {
      console.error('Error getting V4 user quota:', error)
      return { remaining: 0, total: 0, planName: 'Unknown' }
    }
  }
}

// Helper function to create Art3HubV4Service instance
export function createArt3HubV4Service(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
): Art3HubV4Service {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  return new Art3HubV4Service(publicClient, walletClient, activeNetwork.id)
}

// Export convenience function with service
export function createArt3HubV4ServiceWithUtils(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  const art3hubV4Service = new Art3HubV4Service(publicClient, walletClient, activeNetwork.id)
  
  return {
    art3hubV4Service,
    chainId: activeNetwork.id,
    networkName: activeNetwork.displayName
  }
}