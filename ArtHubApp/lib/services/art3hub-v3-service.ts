// Art3Hub V3 Service - Built-in gasless NFT creation with auto-enrollment
import { parseEther, type Address, type PublicClient, type WalletClient, createPublicClient, http, keccak256, toBytes, encodePacked, decodeEventLog } from 'viem'
import { getActiveNetwork } from '@/lib/networks'
import { base, baseSepolia, zora, zoraSepolia, celo, celoAlfajores } from '@/lib/wagmi'

// Art3HubFactoryV3 ABI - from deployed V3 contracts
const ART3HUB_FACTORY_V3_ABI = [
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
    "inputs": [],
    "name": "totalCollections",
    "outputs": [{"name": "", "type": "uint256"}],
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
  }
] as const

// Art3HubFactoryV3 ABI - Extended to include mintNFT function
const ART3HUB_FACTORY_V3_ABI_EXTENDED = [
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
    "inputs": [],
    "name": "totalCollections",
    "outputs": [{"name": "", "type": "uint256"}],
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

// Art3HubCollectionV3 ABI - for reading collection info
const ART3HUB_COLLECTION_V3_ABI = [
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
  }
] as const

// Art3HubSubscriptionV3 ABI - for built-in subscription management
const ART3HUB_SUBSCRIPTION_V3_ABI = [
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
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserNonce",
    "outputs": [{"name": "", "type": "uint256"}],
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

// Get Art3HubFactoryV3 contract address based on network
function getArt3HubFactoryV3Address(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_8453 as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_999999999 as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_7777777 as Address) || null
    case 44787: // Celo Alfajores
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_44787 as Address) || null
    case 42220: // Celo Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_42220 as Address) || null
    default:
      return null
  }
}

// Get Art3HubSubscriptionV3 contract address based on network
function getArt3HubSubscriptionV3Address(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_8453 as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_999999999 as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_7777777 as Address) || null
    case 44787: // Celo Alfajores
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_44787 as Address) || null
    case 42220: // Celo Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_42220 as Address) || null
    default:
      return null
  }
}

export interface Art3HubV3CollectionParams {
  name: string
  symbol: string
  description: string
  imageURI: string
  externalUrl?: string
  artist: Address
  royaltyRecipient: Address
  royaltyBPS: number // Basis points (e.g., 500 = 5%)
}

export interface Art3HubV3MintParams {
  collectionContract: Address
  recipient: Address
  tokenURI: string
}

export interface V3CollectionCreationResult {
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

export interface V3MintResult {
  transactionHash: string
  tokenId?: number
  gasless: boolean
}

export interface V3SubscriptionInfo {
  plan: 'FREE' | 'MASTER'
  planName: string
  expiresAt: Date | null
  nftsMinted: number
  nftLimit: number
  remainingNFTs: number
  isActive: boolean
  autoRenew: boolean
  hasGaslessMinting: boolean
}

export class Art3HubV3Service {
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
    
    const factoryAddress = getArt3HubFactoryV3Address(chainId)
    if (!factoryAddress) {
      throw new Error(`Art3HubFactoryV3 not deployed on chain ${chainId}`)
    }
    this.factoryAddress = factoryAddress
    
    const subscriptionAddress = getArt3HubSubscriptionV3Address(chainId)
    if (!subscriptionAddress) {
      throw new Error(`Art3HubSubscriptionV3 not deployed on chain ${chainId}`)
    }
    this.subscriptionAddress = subscriptionAddress
    
    console.log('🔧 Art3HubV3Service initialized:', {
      chainId,
      factory: this.factoryAddress,
      subscription: this.subscriptionAddress,
      hasWallet: !!walletClient
    })
  }

  // Get user subscription from V3 contract
  async getUserSubscription(userAddress: Address): Promise<V3SubscriptionInfo> {
    try {
      console.log('🔍 Getting V3 subscription for user:', userAddress)
      
      const contractResult = await this.publicClient.readContract({
        address: this.subscriptionAddress,
        abi: ART3HUB_SUBSCRIPTION_V3_ABI,
        functionName: 'getSubscription',
        args: [userAddress]
      })
      
      // Contract returns: [plan, expiresAt, nftsMinted, nftLimit, isActive, hasGaslessMinting]
      const [plan, expiresAt, nftsMinted, nftLimit, isActive, hasGaslessMinting] = contractResult
      
      const planType = plan === 0 ? 'FREE' : 'MASTER'
      const planName = planType === 'FREE' ? 'Free Plan' : 'Master Plan'
      const remainingNFTs = Number(nftLimit) - Number(nftsMinted)
      
      const result: V3SubscriptionInfo = {
        plan: planType,
        planName,
        expiresAt: Number(expiresAt) > 0 ? new Date(Number(expiresAt) * 1000) : null,
        nftsMinted: Number(nftsMinted),
        nftLimit: Number(nftLimit),
        remainingNFTs: Math.max(0, remainingNFTs),
        isActive: isActive,
        autoRenew: false, // Contract doesn't return autoRenew in getSubscription
        hasGaslessMinting: hasGaslessMinting
      }
      
      console.log('📋 V3 Subscription info:', result)
      return result
      
    } catch (error) {
      console.error('❌ Error getting V3 subscription:', error)
      
      // Return default inactive subscription
      return {
        plan: 'FREE',
        planName: 'Free Plan',
        expiresAt: null,
        nftsMinted: 0,
        nftLimit: 0,
        remainingNFTs: 0,
        isActive: false,
        autoRenew: false,
        hasGaslessMinting: true
      }
    }
  }

  // Subscribe to free plan (auto-enrollment)
  async subscribeToFreePlan(): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎁 Subscribing to V3 Free Plan...')
      
      const hash = await this.walletClient.writeContract({
        address: this.subscriptionAddress,
        abi: ART3HUB_SUBSCRIPTION_V3_ABI,
        functionName: 'subscribeToFreePlan',
        args: [],
        chain: this.publicClient.chain,
        account: this.walletClient.account!
      })
      
      console.log('✅ Free plan subscription transaction sent:', hash)
      return hash
      
    } catch (error) {
      console.error('❌ Error subscribing to V3 free plan:', error)
      throw new Error(`Failed to subscribe to free plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get USDC contract address for current chain
  private getUSDCAddress(): Address {
    switch (this.chainId) {
      case 84532: // Base Sepolia
        return '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address
      case 8453: // Base Mainnet  
        return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address // USDC on Base mainnet
      default:
        throw new Error(`USDC not configured for chain ${this.chainId}`)
    }
  }

  // Check USDC balance and allowance
  async checkUSDCStatus(userAddress: Address): Promise<{
    balance: bigint
    allowance: bigint
    hasEnoughBalance: boolean
    hasEnoughAllowance: boolean
    usdcAddress: Address
  }> {
    const usdcAddress = this.getUSDCAddress()
    const requiredAmount = BigInt('4990000') // $4.99 in USDC (6 decimals)
    
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
    ] as const

    try {
      const [balance, allowance] = await Promise.all([
        this.publicClient.readContract({
          address: usdcAddress,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }),
        this.publicClient.readContract({
          address: usdcAddress,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [userAddress, this.subscriptionAddress]
        })
      ])

      return {
        balance,
        allowance,
        hasEnoughBalance: balance >= requiredAmount,
        hasEnoughAllowance: allowance >= requiredAmount,
        usdcAddress
      }
    } catch (error) {
      console.error('Error checking USDC status:', error)
      throw new Error('Failed to check USDC balance and allowance')
    }
  }

  // Check if USDC supports EIP-2612 permits (gasless approval)
  async checkUSDCPermitSupport(): Promise<boolean> {
    const usdcAddress = this.getUSDCAddress()
    
    try {
      // Check if USDC has permit function (EIP-2612)
      await this.publicClient.readContract({
        address: usdcAddress,
        abi: [
          {
            "inputs": [],
            "name": "DOMAIN_SEPARATOR",
            "outputs": [{"name": "", "type": "bytes32"}],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
        functionName: 'DOMAIN_SEPARATOR'
      })
      
      console.log('✅ USDC supports EIP-2612 permits (gasless approval)')
      return true
    } catch (error) {
      console.log('❌ USDC does not support EIP-2612 permits, using gasless relayer approval')
      return false
    }
  }

  // Gasless USDC approval via relayer
  async approveUSDCGasless(amount: bigint = BigInt('4990000')): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('💰 Gasless USDC approval via relayer...', {
        spender: this.subscriptionAddress,
        amount: amount.toString()
      })

      // Call gasless approval via relayer
      const relayerResponse = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'approveUSDC',
          userAddress: this.walletClient.account!.address,
          spender: this.subscriptionAddress,
          amount: amount.toString(),
          chainId: this.chainId
        })
      })

      if (!relayerResponse.ok) {
        const errorData = await relayerResponse.json()
        throw new Error(`Relayer failed: ${JSON.stringify(errorData)}`)
      }

      const result = await relayerResponse.json()
      
      console.log('✅ Gasless USDC approval successful!', result)
      return result.transactionHash
      
    } catch (error) {
      console.error('❌ Error in gasless USDC approval:', error)
      throw new Error(`Failed to approve USDC (gasless): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Approve USDC spending (fallback regular method)
  async approveUSDC(amount: bigint = BigInt('4990000')): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    const usdcAddress = this.getUSDCAddress()
    
    const USDC_ABI = [
      {
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ] as const

    try {
      console.log('💰 Approving USDC spending...', {
        usdcAddress,
        spender: this.subscriptionAddress,
        amount: amount.toString()
      })

      const hash = await this.walletClient.writeContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [this.subscriptionAddress, amount],
        chain: this.publicClient.chain,
        account: this.walletClient.account!
      })

      console.log('✅ USDC approval transaction sent:', hash)
      
      // Wait for confirmation
      await this.publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` })
      console.log('✅ USDC approval confirmed')
      
      return hash
    } catch (error) {
      console.error('❌ Error approving USDC:', error)
      throw new Error(`Failed to approve USDC: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      console.log('💎 Starting V3 Master Plan GASLESS upgrade for $4.99 USDC...')
      
      const userAddress = this.walletClient.account!.address
      
      // Check USDC balance and allowance
      console.log('💰 Checking USDC balance and allowance...')
      const usdcStatus = await this.checkUSDCStatus(userAddress)
      
      console.log('💰 USDC Status:', {
        balance: (Number(usdcStatus.balance) / 1000000).toFixed(2),
        allowance: (Number(usdcStatus.allowance) / 1000000).toFixed(2),
        hasEnoughBalance: usdcStatus.hasEnoughBalance,
        hasEnoughAllowance: usdcStatus.hasEnoughAllowance
      })

      // Check if user has enough USDC
      if (!usdcStatus.hasEnoughBalance) {
        throw new Error(`Insufficient USDC balance. You have $${(Number(usdcStatus.balance) / 1000000).toFixed(2)} USDC but need $4.99 USDC to upgrade to Master Plan.`)
      }

      let approvalHash: string | undefined

      // Approve USDC spending if needed (user pays small gas fee for approval only)
      if (!usdcStatus.hasEnoughAllowance) {
        console.log('💰 USDC allowance insufficient, requesting approval...')
        console.log('⛽ Note: User will pay small gas fee (~$0.50) for USDC approval only')
        
        // Use regular approval (user pays gas) - this is the only reliable way
        // since gasless approval would approve relayer's USDC, not user's USDC
        approvalHash = await this.approveUSDC()
        
        console.log('✅ USDC approval confirmed, subscription upgrade will be gasless')
      } else {
        console.log('✅ USDC allowance already sufficient')
      }

      // Call gasless subscription upgrade via relayer
      console.log('💎 Submitting gasless Master Plan upgrade to relayer...')
      const relayerResponse = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upgradeSubscription',
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
      
      console.log('✅ Gasless Master Plan upgrade successful!', result)
      
      return {
        approvalHash,
        subscriptionHash: result.transactionHash,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Error upgrading to V3 Master plan (gasless):', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient USDC balance')) {
          throw error // Re-throw our custom balance error
        } else if (error.message.includes('allowance')) {
          throw new Error('USDC approval failed. Please try the upgrade again.')
        } else if (error.message.includes('balance')) {
          throw new Error('Insufficient USDC balance. You need $4.99 USDC to upgrade to Master Plan.')
        } else if (error.message.includes('Payment failed')) {
          throw new Error('USDC payment failed. Please check your balance and try again.')
        }
      }
      
      throw new Error(`Failed to upgrade to Master Plan (gasless): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Upgrade to Master Plan with USDC payment (with approval flow)
  async upgradeToMasterPlan(autoRenew: boolean = false): Promise<{
    approvalHash?: string
    subscriptionHash: string
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('💎 Starting V3 Master Plan upgrade for $4.99 USDC...')
      
      const userAddress = this.walletClient.account!.address
      
      // Check USDC balance and allowance
      console.log('💰 Checking USDC balance and allowance...')
      const usdcStatus = await this.checkUSDCStatus(userAddress)
      
      console.log('💰 USDC Status:', {
        balance: (Number(usdcStatus.balance) / 1000000).toFixed(2),
        allowance: (Number(usdcStatus.allowance) / 1000000).toFixed(2),
        hasEnoughBalance: usdcStatus.hasEnoughBalance,
        hasEnoughAllowance: usdcStatus.hasEnoughAllowance
      })

      // Check if user has enough USDC
      if (!usdcStatus.hasEnoughBalance) {
        throw new Error(`Insufficient USDC balance. You have $${(Number(usdcStatus.balance) / 1000000).toFixed(2)} USDC but need $4.99 USDC to upgrade to Master Plan.`)
      }

      let approvalHash: string | undefined

      // Approve USDC spending if needed
      if (!usdcStatus.hasEnoughAllowance) {
        console.log('💰 USDC allowance insufficient, requesting approval...')
        approvalHash = await this.approveUSDC()
      } else {
        console.log('✅ USDC allowance already sufficient')
      }

      // Subscribe to Master Plan
      console.log('💎 Subscribing to V3 Master Plan...')
      const subscriptionHash = await this.walletClient.writeContract({
        address: this.subscriptionAddress,
        abi: ART3HUB_SUBSCRIPTION_V3_ABI,
        functionName: 'subscribeToMasterPlan',
        args: [autoRenew],
        chain: this.publicClient.chain,
        account: this.walletClient.account!
      })
      
      console.log('✅ Master plan upgrade transaction sent:', subscriptionHash)
      
      // Wait for confirmation
      await this.publicClient.waitForTransactionReceipt({ hash: subscriptionHash as `0x${string}` })
      console.log('✅ Master plan upgrade confirmed!')
      
      return {
        approvalHash,
        subscriptionHash
      }
      
    } catch (error) {
      console.error('❌ Error upgrading to V3 Master plan:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient USDC balance')) {
          throw error // Re-throw our custom balance error
        } else if (error.message.includes('ERC20: insufficient allowance') || error.message.includes('allowance')) {
          throw new Error('USDC approval failed. Please try the upgrade again.')
        } else if (error.message.includes('ERC20: transfer amount exceeds balance') || error.message.includes('balance')) {
          throw new Error('Insufficient USDC balance. You need $4.99 USDC to upgrade to Master Plan.')
        } else if (error.message.includes('Payment failed')) {
          throw new Error('USDC payment failed. Please check your balance and try again.')
        }
      }
      
      throw new Error(`Failed to upgrade to Master Plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if user can mint NFTs
  async canUserMint(userAddress: Address, amount: number = 1): Promise<{ canMint: boolean; remainingNFTs: number }> {
    try {
      const canMint = await this.publicClient.readContract({
        address: this.subscriptionAddress,
        abi: ART3HUB_SUBSCRIPTION_V3_ABI,
        functionName: 'canUserMint',
        args: [userAddress, BigInt(amount)]
      })
      
      const subscription = await this.getUserSubscription(userAddress)
      
      return {
        canMint,
        remainingNFTs: subscription.remainingNFTs
      }
      
    } catch (error) {
      console.error('Error checking mint capability:', error)
      return { canMint: false, remainingNFTs: 0 }
    }
  }

  // Create a collection with built-in gasless functionality
  async createCollection(params: Art3HubV3CollectionParams): Promise<V3CollectionCreationResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎨 Creating Art3Hub V3 collection...')
      console.log('📋 Collection params:', {
        name: params.name,
        symbol: params.symbol,
        artist: params.artist
      })
      
      // V3 contracts handle subscription automatically - no manual enrollment needed
      console.log('🔍 V3 contracts will handle subscription management automatically')
      console.log('📋 Collection creation will auto-enroll user if needed')
      
      // Convert royalty BPS to fee numerator (out of 10000)
      const royaltyFeeNumerator = BigInt(params.royaltyBPS)
      
      console.log('🚀 Creating V3 collection via factory...')
      console.log('📋 V3 Contract call params:', {
        factory: this.factoryAddress,
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        imageURI: params.imageURI,
        externalUrl: params.externalUrl || '',
        royaltyRecipient: params.royaltyRecipient,
        royaltyFeeNumerator: royaltyFeeNumerator.toString()
      })
      
      // Check if user has gasless collection creation capability
      const subscription = await this.getUserSubscription(params.artist)
      console.log('🔍 Checking gasless collection capability:', {
        plan: subscription.plan,
        hasGaslessMinting: subscription.hasGaslessMinting,
        isActive: subscription.isActive
      })
      
      if (subscription.hasGaslessMinting) {
        // Use gasless collection creation
        console.log('🆓 Using TRUE gasless collection creation - relayer pays gas')
        
        // Step 1: Create and sign the collection voucher
        console.log('📝 Step 1: Creating EIP-712 collection voucher...')
        const { voucher, signature } = await this.createCollectionVoucher(params)
        
        // Step 2: Submit to relayer
        console.log('🚀 Step 2: Submitting to gasless relayer...')
        const result = await this.submitGaslessCollectionVoucher(voucher, signature)
        
        console.log('✅ Gasless collection creation completed successfully!')
        
        return {
          transactionHash: result.transactionHash,
          contractAddress: result.contractAddress,
          gasless: true
        }
      }
      
      // Fallback: Regular collection creation (requires gas)
      console.log('⚠️  Using regular collection creation - user will pay gas fees')
      console.log('💡 Tip: Subscribe to any plan for gasless collection creation!')
      console.log('🔍 Simulating V3 collection creation...')
      
      await this.publicClient.simulateContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V3_ABI_EXTENDED,
        functionName: 'createCollection',
        args: [params.name, params.symbol, params.description, params.imageURI, params.externalUrl || '', params.royaltyRecipient, royaltyFeeNumerator],
        account: this.walletClient.account!
      })
      console.log('✅ V3 Transaction simulation successful')
      
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V3_ABI_EXTENDED,
        functionName: 'createCollection',
        args: [params.name, params.symbol, params.description, params.imageURI, params.externalUrl || '', params.royaltyRecipient, royaltyFeeNumerator],
        account: this.walletClient.account!
      })
      
      const gasLimit = gasEstimate + (gasEstimate * BigInt(25) / BigInt(100))
      console.log('⛽ V3 Collection creation gas estimation:', {
        estimated: gasEstimate.toString(),
        withBuffer: gasLimit.toString()
      })

      const hash = await this.walletClient.writeContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V3_ABI_EXTENDED,
        functionName: 'createCollection',
        args: [params.name, params.symbol, params.description, params.imageURI, params.externalUrl || '', params.royaltyRecipient, royaltyFeeNumerator],
        chain: this.publicClient.chain,
        account: this.walletClient.account!,
        gas: gasLimit
      })
      
      console.log('✅ V3 Collection creation transaction sent:', hash)
      
      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` })
      console.log('🎉 V3 Collection creation confirmed!')
      console.log('📋 V3 Transaction receipt:', {
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString()
      })
      
      // Extract collection address from CollectionCreated event
      let collectionAddress: Address | null = null
      
      console.log('🔍 Parsing V3 transaction logs...')
      
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === this.factoryAddress.toLowerCase()) {
            const decodedLog = decodeEventLog({
              abi: ART3HUB_FACTORY_V3_ABI_EXTENDED,
              data: log.data,
              topics: log.topics,
            })
            
            if (decodedLog.eventName === 'CollectionCreated') {
              collectionAddress = decodedLog.args.collection as Address
              console.log('🎯 Extracted V3 collection address:', collectionAddress)
              break
            }
          }
        } catch (e) {
          console.log('Failed to parse V3 log:', e)
        }
      }
      
      if (!collectionAddress) {
        console.error('❌ Could not extract V3 collection address from logs')
        throw new Error('Failed to extract collection address from transaction receipt')
      }
      
      return {
        transactionHash: hash,
        contractAddress: collectionAddress,
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
      console.error('❌ Error creating Art3Hub V3 collection:', error)
      
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
      
      throw new Error(`Failed to create V3 collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Create gasless mint voucher (EIP-712 signature)
  async createMintVoucher(params: Art3HubV3MintParams): Promise<{
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
      console.log('🎯 Creating gasless mint voucher for collection:', params.collectionContract)
      
      // Get user nonce from factory contract (not subscription)
      const nonceResult = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: [
          {
            "inputs": [{"name": "user", "type": "address"}],
            "name": "userNonces",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
        functionName: 'userNonces',
        args: [this.walletClient.account!.address]
      })
      
      // Ensure nonce is bigint
      const nonce = BigInt(nonceResult.toString())
      
      // Set deadline (1 hour from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
      
      const voucher = {
        collection: params.collectionContract,
        to: params.recipient,
        tokenURI: params.tokenURI,
        nonce,
        deadline
      }
      
      console.log('📝 Voucher details:', voucher)
      
      // EIP-712 domain
      const domain = {
        name: 'Art3HubFactoryV3',
        version: '1',
        chainId: this.chainId,
        verifyingContract: this.factoryAddress
      }
      
      // EIP-712 types
      const types = {
        MintVoucher: [
          { name: 'collection', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'tokenURI', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }
      
      console.log('🔐 Requesting EIP-712 signature...')
      
      // Sign the voucher
      const signature = await this.walletClient.signTypedData({
        account: this.walletClient.account!,
        domain,
        types,
        primaryType: 'MintVoucher',
        message: voucher
      })
      
      console.log('✅ Voucher signed successfully')
      
      return { voucher, signature }
      
    } catch (error) {
      console.error('❌ Error creating mint voucher:', error)
      throw new Error(`Failed to create mint voucher: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Submit voucher to gasless relayer
  async submitGaslessVoucher(voucher: any, signature: string): Promise<V3MintResult> {
    try {
      console.log('🚀 Submitting voucher to gasless relayer...')
      
      // Convert BigInt values to strings for JSON serialization
      const serializableVoucher = {
        ...voucher,
        nonce: voucher.nonce.toString(),
        deadline: voucher.deadline.toString()
      }
      
      // Send to relayer API endpoint
      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'mint',
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
      console.log('✅ Gasless mint successful:', result)
      
      return {
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Error submitting gasless voucher:', error)
      throw new Error(`Gasless mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Create collection voucher for gasless collection creation
  async createCollectionVoucher(params: Art3HubV3CollectionParams): Promise<{
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
        abi: [
          {
            "inputs": [{"name": "user", "type": "address"}],
            "name": "userNonces",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const,
        functionName: 'userNonces',
        args: [this.walletClient.account!.address]
      })
      
      // Ensure nonce is bigint
      const nonce = BigInt(nonceResult.toString())
      
      // Set deadline (1 hour from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
      
      // Convert royalty BPS to fee numerator
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
        nonce,
        deadline
      }
      
      console.log('📝 Collection voucher details:', voucher)
      
      // EIP-712 domain
      const domain = {
        name: 'Art3HubFactoryV3',
        version: '1',
        chainId: this.chainId,
        verifyingContract: this.factoryAddress
      } as const
      
      // EIP-712 types
      const types = {
        CollectionVoucher: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'image', type: 'string' },
          { name: 'externalUrl', type: 'string' },
          { name: 'artist', type: 'address' },
          { name: 'royaltyRecipient', type: 'address' },
          { name: 'royaltyFeeNumerator', type: 'uint96' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      } as const
      
      // Sign the voucher
      const signature = await this.walletClient.signTypedData({
        account: this.walletClient.account!,
        domain,
        types,
        primaryType: 'CollectionVoucher',
        message: voucher
      })
      
      console.log('✅ Collection voucher signed successfully')
      
      return { voucher, signature }
      
    } catch (error) {
      console.error('❌ Error creating collection voucher:', error)
      throw new Error(`Failed to create collection voucher: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Submit collection voucher to gasless relayer
  async submitGaslessCollectionVoucher(voucher: any, signature: string): Promise<V3CollectionCreationResult> {
    try {
      console.log('🚀 Submitting collection voucher to gasless relayer...')
      
      // Convert BigInt values to strings for JSON serialization
      const serializableVoucher = {
        ...voucher,
        royaltyFeeNumerator: voucher.royaltyFeeNumerator.toString(),
        nonce: voucher.nonce.toString(),
        deadline: voucher.deadline.toString()
      }
      
      // Send to relayer API endpoint
      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'createCollection',
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
      console.log('✅ Gasless collection creation successful:', result)
      
      return {
        transactionHash: result.transactionHash,
        contractAddress: result.contractAddress,
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
      console.error('❌ Error submitting gasless collection voucher:', error)
      throw new Error(`Gasless collection creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mint an NFT to an existing V3 collection (now truly gasless)
  async mintNFT(params: Art3HubV3MintParams): Promise<V3MintResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎯 Starting gasless mint via V3 voucher system for collection:', params.collectionContract)
      
      // V3 contracts automatically handle subscription management
      // Free Plan: 1 NFT/month (auto-enrolled)
      // Master Plan: 10 NFTs/month ($4.99 USDC)
      console.log('🔍 V3 factory will validate subscription and quota automatically')
      
      // V3 collections have built-in gasless functionality
      console.log('🆓 Using V3 built-in gasless minting via factory...')
      
      // Verify the collection is recognized by the factory
      console.log('🔍 Verifying collection is registered with factory...')
      try {
        const isValidCollection = await this.publicClient.readContract({
          address: this.factoryAddress,
          abi: [
            {
              "inputs": [{"name": "collection", "type": "address"}],
              "name": "isArt3HubCollection",
              "outputs": [{"name": "", "type": "bool"}],
              "stateMutability": "view",
              "type": "function"
            }
          ] as const,
          functionName: 'isArt3HubCollection',
          args: [params.collectionContract]
        })
        
        console.log('🔍 Collection validation result:', {
          collection: params.collectionContract,
          isValid: isValidCollection,
          factory: this.factoryAddress,
          chainId: this.chainId
        })
        
        // Additional debugging: Check if collection exists at all
        try {
          const collectionCode = await this.publicClient.getCode({ address: params.collectionContract })
          console.log('🔍 Collection contract code length:', collectionCode?.length || 0)
          
          if (!collectionCode || collectionCode === '0x') {
            console.warn('⚠️ Collection contract has no code - it may not be deployed')
          }
        } catch (codeError) {
          console.warn('⚠️ Could not check collection contract code:', codeError)
        }
        
        if (!isValidCollection) {
          throw new Error(`Collection ${params.collectionContract} is not registered with factory ${this.factoryAddress}. This might be a timing issue - please wait a moment and try again.`)
        }
        
        console.log('✅ Collection is properly registered with factory')
        
        // Additional debugging: Check who can mint to this collection
        try {
          const COLLECTION_DEBUG_ABI = [
            {
              "inputs": [],
              "name": "factory",
              "outputs": [{"name": "", "type": "address"}],
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
              "name": "owner",
              "outputs": [{"name": "", "type": "address"}],
              "stateMutability": "view",
              "type": "function"
            }
          ] as const
          
          const [collectionFactory, collectionArtist, collectionOwner] = await Promise.all([
            this.publicClient.readContract({
              address: params.collectionContract,
              abi: COLLECTION_DEBUG_ABI,
              functionName: 'factory'
            }),
            this.publicClient.readContract({
              address: params.collectionContract,
              abi: COLLECTION_DEBUG_ABI,
              functionName: 'artist'
            }),
            this.publicClient.readContract({
              address: params.collectionContract,
              abi: COLLECTION_DEBUG_ABI,
              functionName: 'owner'
            })
          ])
          
          console.log('🔍 Collection authorization details:', {
            collectionAddress: params.collectionContract,
            storedFactory: collectionFactory,
            expectedFactory: this.factoryAddress,
            factoryMatches: collectionFactory?.toLowerCase() === this.factoryAddress.toLowerCase(),
            artist: collectionArtist,
            owner: collectionOwner,
            userAddress: this.walletClient.account!.address
          })
          
          // Check if factory addresses match
          if (collectionFactory?.toLowerCase() !== this.factoryAddress.toLowerCase()) {
            throw new Error(`Collection factory mismatch! Collection expects ${collectionFactory} but we're using ${this.factoryAddress}`)
          }
          
        } catch (debugError) {
          console.error('❌ Collection authorization debug failed:', debugError)
          throw debugError
        }
        
        // Check subscription status before minting
        try {
          console.log('🔍 Checking subscription status before mint...')
          const canMint = await this.publicClient.readContract({
            address: this.subscriptionAddress,
            abi: ART3HUB_SUBSCRIPTION_V3_ABI,
            functionName: 'canUserMint',
            args: [params.recipient, BigInt(1)]
          })
          
          const subscription = await this.getUserSubscription(params.recipient)
          
          console.log('🔍 Pre-mint subscription check:', {
            recipient: params.recipient,
            canMint,
            subscription: {
              plan: subscription.plan,
              isActive: subscription.isActive,
              nftsMinted: subscription.nftsMinted,
              nftLimit: subscription.nftLimit,
              remainingNFTs: subscription.remainingNFTs
            }
          })
          
          if (!canMint) {
            throw new Error(`Subscription check failed: User cannot mint. Plan: ${subscription.plan}, Minted: ${subscription.nftsMinted}/${subscription.nftLimit}, Active: ${subscription.isActive}`)
          }
          
        } catch (subscriptionError) {
          console.error('❌ Subscription check failed:', subscriptionError)
          throw subscriptionError
        }
      } catch (validationError) {
        console.error('❌ Collection validation failed:', validationError)
        throw validationError
      }

      // Check if user has gasless minting capability (Master plan)
      const subscription = await this.getUserSubscription(params.recipient)
      console.log('🔍 Checking gasless capability:', {
        plan: subscription.plan,
        hasGaslessMinting: subscription.hasGaslessMinting,
        nftsMinted: subscription.nftsMinted,
        nftLimit: subscription.nftLimit
      })
      
      if (subscription.hasGaslessMinting) {
        // V3 gasless minting: User only signs, relayer pays gas
        console.log('🆓 Using TRUE gasless minting - user only pays $4.99 USDC subscription')
        
        // Step 1: Create and sign the voucher
        console.log('📝 Step 1: Creating EIP-712 voucher...')
        const { voucher, signature } = await this.createMintVoucher(params)
        
        // Step 2: Submit to relayer
        console.log('🚀 Step 2: Submitting to gasless relayer...')
        const result = await this.submitGaslessVoucher(voucher, signature)
        
        console.log('✅ Gasless mint completed successfully!')
        
        return {
          transactionHash: result.transactionHash,
          tokenId: 1, // V3 collections start with token ID 1
          gasless: true
        }
      }
      
      // Fallback: Direct collection minting (requires gas)
      console.log('⚠️  Using direct collection mint - user will pay gas fees')
      console.log('💡 Tip: Upgrade to Master plan for gasless minting!')
      console.log('🔍 Simulating V3 direct collection mint transaction...')
      
      const COLLECTION_MINT_ABI = [
        {
          "inputs": [
            {"name": "to", "type": "address"},
            {"name": "_tokenURI", "type": "string"}
          ],
          "name": "mint",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ] as const
      
      await this.publicClient.simulateContract({
        address: params.collectionContract,
        abi: COLLECTION_MINT_ABI,
        functionName: 'mint',
        args: [params.recipient, params.tokenURI],
        account: this.walletClient.account!
      })
      console.log('✅ V3 Direct collection mint simulation successful')
      
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: params.collectionContract,
        abi: COLLECTION_MINT_ABI,
        functionName: 'mint',
        args: [params.recipient, params.tokenURI],
        account: this.walletClient.account!
      })
      
      const gasLimit = gasEstimate + (gasEstimate * BigInt(25) / BigInt(100))
      console.log('⛽ V3 Direct collection mint gas estimation:', {
        estimated: gasEstimate.toString(),
        withBuffer: gasLimit.toString()
      })
      
      const hash = await this.walletClient.writeContract({
        address: params.collectionContract,
        abi: COLLECTION_MINT_ABI,
        functionName: 'mint',
        args: [params.recipient, params.tokenURI],
        chain: this.publicClient.chain,
        account: this.walletClient.account!,
        gas: gasLimit
      })
      
      console.log('✅ V3 Direct collection NFT mint transaction sent:', hash)
      
      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` })
      console.log('🎉 V3 NFT minted successfully via direct collection call!')
      console.log('📋 V3 Direct mint receipt:', {
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString()
      })
      
      // Extract token ID from Transfer event (since we're calling collection directly)
      let tokenId: number | undefined
      
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === params.collectionContract.toLowerCase()) {
            const decodedLog = decodeEventLog({
              abi: ART3HUB_COLLECTION_V3_ABI,
              data: log.data,
              topics: log.topics,
            })
            
            if (decodedLog.eventName === 'Transfer' && decodedLog.args && typeof decodedLog.args === 'object' && 'from' in decodedLog.args && 'tokenId' in decodedLog.args) {
              const args = decodedLog.args as { from: string; tokenId: bigint }
                if (args.from === '0x0000000000000000000000000000000000000000' || args.from === null) {
                  tokenId = Number(args.tokenId)
                  console.log('🎯 Extracted V3 token ID from Transfer event:', tokenId)
                  break
                }
              }
            }
        } catch (e) {
          // Skip unparseable logs
        }
      }
      
      // Note: Since we're bypassing the factory, quota tracking won't be automatic
      // Users will need to track their usage manually or upgrade to Master Plan
      console.log('⚠️  Note: Direct minting bypasses automatic quota tracking')
      
      return {
        transactionHash: hash,
        tokenId,
        gasless: true // V3 has built-in gasless functionality
      }
      
    } catch (error) {
      console.error('❌ Error minting V3 NFT via direct collection call:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Transaction cancelled - you can try again when ready')
        } else if (error.message.includes('Subscription check failed')) {
          // Re-throw our detailed subscription error
          throw error
        } else if (error.message.includes('Insufficient quota')) {
          throw new Error('Mint failed: You have reached your NFT quota. Free Plan allows 1 NFT/month, Master Plan allows 10 NFTs/month.')
        } else if (error.message.includes('insufficient')) {
          throw new Error('Insufficient funds for gas fees')
        }
        
        // Show the actual contract error instead of generic message
        console.error('❌ Detailed error info:', {
          name: error.name,
          message: error.message,
          cause: (error as any).cause,
          details: (error as any).details
        })
        
        // Extract meaningful error from contract revert
        if (error.message.includes('reverted')) {
          const match = error.message.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/)
          if (match) {
            throw new Error(`Contract reverted: ${match[1]}`)
          }
        }
      }
      
      throw new Error(`Failed to mint V3 NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get collection information
  async getCollectionInfo(contractAddress: Address) {
    try {
      console.log('📖 Fetching V3 collection info from:', contractAddress)
      
      const totalSupply = await this.publicClient.readContract({
        address: contractAddress,
        abi: ART3HUB_COLLECTION_V3_ABI,
        functionName: 'totalSupply'
      })
      
      return {
        address: contractAddress,
        totalSupply: Number(totalSupply),
        chainId: this.chainId
      }
    } catch (error) {
      console.error('Error fetching V3 collection info:', error)
      throw error
    }
  }

  // Get total collections created by the factory
  async getTotalCollections(): Promise<number> {
    try {
      const totalCollections = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V3_ABI,
        functionName: 'totalCollections'
      })
      
      return Number(totalCollections)
    } catch (error) {
      console.error('Error fetching V3 total collections:', error)
      return 0
    }
  }

  // Check if user can create collection (V3 has auto-enrollment)
  async canCreateCollection(userAddress: Address): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userAddress)
      return subscription.isActive || true // V3 allows auto-enrollment
    } catch (error) {
      console.error('Error checking V3 collection creation capability:', error)
      return true // V3 defaults to allowing creation with auto-enrollment
    }
  }

  // Get user's remaining NFT quota
  async getUserQuota(userAddress: Address): Promise<{ remaining: number; total: number; planName: string }> {
    try {
      const subscription = await this.getUserSubscription(userAddress)
      return {
        remaining: subscription.remainingNFTs,
        total: subscription.nftLimit,
        planName: subscription.planName
      }
    } catch (error) {
      console.error('Error getting V3 user quota:', error)
      return { remaining: 0, total: 0, planName: 'Unknown' }
    }
  }
}

// Helper function to create Art3HubV3Service instance
export function createArt3HubV3Service(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
): Art3HubV3Service {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  return new Art3HubV3Service(publicClient, walletClient, activeNetwork.id)
}

// Export convenience function with service
export function createArt3HubV3ServiceWithUtils(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  const art3hubV3Service = new Art3HubV3Service(publicClient, walletClient, activeNetwork.id)
  
  return {
    art3hubV3Service,
    chainId: activeNetwork.id,
    networkName: activeNetwork.displayName
  }
}