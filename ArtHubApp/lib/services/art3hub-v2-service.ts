// Art3Hub V2 Service - Subscription-based NFT creation with gasless transactions
import { parseEther, type Address, type PublicClient, type WalletClient, createPublicClient, http, keccak256, toBytes, encodePacked, decodeEventLog } from 'viem'
import { getActiveNetwork } from '@/lib/networks'
import { base, baseSepolia, zora, zoraSepolia } from '@/lib/wagmi'
import { SubscriptionService } from './subscription-service'

// Art3HubFactoryV2 ABI - from deployed V2 contracts
const ART3HUB_FACTORY_V2_ABI = [
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
      {
        "components": [
          {"name": "name", "type": "string"},
          {"name": "symbol", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "image", "type": "string"},
          {"name": "externalUrl", "type": "string"},
          {"name": "artist", "type": "address"},
          {"name": "royaltyRecipient", "type": "address"},
          {"name": "royaltyFeeNumerator", "type": "uint96"},
          {"name": "nonce", "type": "uint256"},
          {"name": "deadline", "type": "uint256"}
        ],
        "name": "voucher",
        "type": "tuple"
      },
      {"name": "signature", "type": "bytes"}
    ],
    "name": "gaslessCreateCollection",
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

// Art3HubCollectionV2 ABI - for minting in V2 collections
const ART3HUB_COLLECTION_V2_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "_tokenURI", "type": "string"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "_tokenURI", "type": "string"}
    ],
    "name": "artistMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {"name": "to", "type": "address"},
          {"name": "tokenURI", "type": "string"},
          {"name": "nonce", "type": "uint256"},
          {"name": "deadline", "type": "uint256"}
        ],
        "name": "voucher",
        "type": "tuple"
      },
      {"name": "signature", "type": "bytes"}
    ],
    "name": "gaslessMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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

// Get Art3HubFactoryV2 contract address based on network
function getArt3HubFactoryV2Address(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V2_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V2_8453 as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V2_999999999 as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V2_7777777 as Address) || null
    default:
      return null
  }
}

export interface Art3HubV2CollectionParams {
  name: string
  symbol: string
  description: string
  imageURI: string
  externalUrl?: string
  artist: Address
  royaltyRecipient: Address
  royaltyBPS: number // Basis points (e.g., 500 = 5%)
}

export interface Art3HubV2MintParams {
  collectionContract: Address
  recipient: Address
  tokenURI: string
  gasless?: boolean
}

export interface CollectionCreationResult {
  transactionHash: string
  contractAddress: Address
  collectionData: {
    name: string
    symbol: string
    description: string
    imageURI: string
    artist: Address
    royaltyBPS: number
  }
}

export interface MintResult {
  transactionHash: string
  tokenId?: number
  gasless: boolean
}

export class Art3HubV2Service {
  private publicClient: PublicClient
  private walletClient: WalletClient | null
  private chainId: number
  private factoryAddress: Address
  private subscriptionService: SubscriptionService

  constructor(
    publicClient: PublicClient, 
    walletClient: WalletClient | null, 
    chainId: number,
    subscriptionService: SubscriptionService
  ) {
    this.publicClient = createChainSpecificPublicClient(chainId)
    this.walletClient = walletClient
    this.chainId = chainId
    this.subscriptionService = subscriptionService
    
    const factoryAddress = getArt3HubFactoryV2Address(chainId)
    if (!factoryAddress) {
      throw new Error(`Art3HubFactoryV2 not deployed on chain ${chainId}`)
    }
    this.factoryAddress = factoryAddress
    
    console.log('🔧 Art3HubV2Service initialized:', {
      chainId,
      factory: this.factoryAddress,
      hasWallet: !!walletClient
    })
  }

  // Create a collection (subscription-based, no deployment fee)
  async createCollection(params: Art3HubV2CollectionParams): Promise<CollectionCreationResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎨 Creating Art3Hub V2 collection...')
      console.log('📋 Collection params:', {
        name: params.name,
        symbol: params.symbol,
        artist: params.artist
      })
      
      // Check subscription before creating collection
      const subscription = await this.subscriptionService.getUserSubscription(params.artist)
      if (!subscription.isActive) {
        throw new Error('Active subscription required to create collections. Please subscribe to a plan first.')
      }

      console.log('✅ User has active subscription:', subscription.planName)
      
      // Convert royalty BPS to fee numerator (out of 10000)
      const royaltyFeeNumerator = BigInt(params.royaltyBPS)
      
      console.log('🚀 Creating collection via factory...')
      
      const hash = await this.walletClient.writeContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V2_ABI,
        functionName: 'createCollection',
        args: [
          params.name,
          params.symbol,
          params.description,
          params.imageURI,
          params.externalUrl || '',
          params.royaltyRecipient,
          royaltyFeeNumerator
        ],
        chain: this.publicClient.chain
      })
      
      console.log('✅ Collection creation transaction sent:', hash)
      
      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('🎉 Collection creation confirmed!')
      console.log('📋 Transaction receipt:', receipt)
      
      // Extract collection address from CollectionCreated event
      let collectionAddress: Address | null = null
      
      console.log('🔍 Parsing transaction logs...')
      console.log('Factory address:', this.factoryAddress)
      console.log('Number of logs:', receipt.logs.length)
      
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i]
        console.log(`Log ${i}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        })
        
        try {
          if (log.address.toLowerCase() === this.factoryAddress.toLowerCase()) {
            console.log('✅ Found log from factory contract')
            
            // Try to decode the event using the ABI
            try {
              const decodedLog = decodeEventLog({
                abi: ART3HUB_FACTORY_V2_ABI,
                data: log.data,
                topics: log.topics,
              })
              
              console.log('🔍 Decoded log:', decodedLog)
              
              if (decodedLog.eventName === 'CollectionCreated') {
                collectionAddress = decodedLog.args.collection as Address
                console.log('🎯 Extracted collection address from decoded event:', collectionAddress)
                break
              }
            } catch (decodeError) {
              console.log('Failed to decode log with ABI:', decodeError)
              
              // Fallback: manual parsing
              if (log.topics.length >= 2) {
                // The collection address should be in the first indexed parameter (topics[1])
                const collectionTopic = log.topics[1]
                if (collectionTopic) {
                  collectionAddress = `0x${collectionTopic.slice(-40)}` as Address
                  console.log('🎯 Extracted collection address (fallback):', collectionAddress)
                  break
                }
              }
            }
          } else {
            console.log('❌ Log not from factory contract')
          }
        } catch (e) {
          console.log('Failed to parse log:', e)
        }
      }
      
      if (!collectionAddress) {
        console.error('❌ Could not extract collection address from any log')
        console.error('Available logs:', receipt.logs)
        throw new Error('Could not extract collection address from transaction logs')
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
      console.error('❌ Error creating Art3Hub V2 collection:', error)
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Transaction cancelled - you can try again when ready')
        } else if (error.message.includes('subscription')) {
          throw new Error(error.message) // Pass through subscription errors
        } else if (error.message.includes('network')) {
          throw new Error('Network error - please check your connection')
        } else if (error.message.includes('revert')) {
          throw new Error('Contract call reverted - please check your subscription status')
        }
      }
      
      throw new Error(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mint an NFT to an existing collection (subscription-gated)
  async mintNFT(params: Art3HubV2MintParams): Promise<MintResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎯 Minting NFT to collection:', params.collectionContract)
      
      // Check subscription and minting capability
      const mintCapability = await this.subscriptionService.canUserMint(params.recipient)
      if (!mintCapability.canMint) {
        throw new Error('You have reached your NFT limit for this subscription period. Please upgrade your plan or wait for the next period.')
      }

      console.log(`✅ User can mint ${mintCapability.remainingNFTs} more NFTs`)
      
      // For V2, we'll use artistMint which doesn't require payment (subscription covers it)
      console.log('🎨 Using subscription-based minting...')
      
      const hash = await this.walletClient.writeContract({
        address: params.collectionContract,
        abi: ART3HUB_COLLECTION_V2_ABI,
        functionName: 'artistMint',
        args: [params.recipient, params.tokenURI],
        chain: this.publicClient.chain
      })
      
      console.log('✅ NFT mint transaction sent:', hash)
      
      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('🎉 NFT minted successfully!')
      
      // Record the mint in the subscription system
      try {
        await this.subscriptionService.recordNFTMint(params.recipient, 1)
        console.log('📝 NFT mint recorded in subscription')
      } catch (recordError) {
        console.warn('⚠️ Failed to record mint in subscription (mint still successful):', recordError)
      }
      
      return {
        transactionHash: hash,
        gasless: params.gasless || false
      }
      
    } catch (error) {
      console.error('Error minting NFT:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          throw new Error('Transaction cancelled - you can try again when ready')
        } else if (error.message.includes('limit') || error.message.includes('subscription')) {
          throw new Error(error.message) // Pass through subscription/limit errors
        }
      }
      
      throw new Error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get collection information
  async getCollectionInfo(contractAddress: Address) {
    try {
      console.log('📖 Fetching collection info from:', contractAddress)
      
      const totalSupply = await this.publicClient.readContract({
        address: contractAddress,
        abi: ART3HUB_COLLECTION_V2_ABI,
        functionName: 'totalSupply'
      })
      
      return {
        address: contractAddress,
        totalSupply: Number(totalSupply),
        chainId: this.chainId
      }
    } catch (error) {
      console.error('Error fetching collection info:', error)
      throw error
    }
  }

  // Get total collections created by the factory
  async getTotalCollections(): Promise<number> {
    try {
      const totalCollections = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V2_ABI,
        functionName: 'totalCollections'
      })
      
      return Number(totalCollections)
    } catch (error) {
      console.error('Error fetching total collections:', error)
      return 0
    }
  }

  // Check if user can create collection (has active subscription)
  async canCreateCollection(userAddress: Address): Promise<boolean> {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userAddress)
      return subscription.isActive
    } catch (error) {
      console.error('Error checking collection creation capability:', error)
      return false
    }
  }

  // Get user's remaining NFT quota
  async getUserQuota(userAddress: Address): Promise<{ remaining: number; total: number; planName: string }> {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userAddress)
      return {
        remaining: subscription.remainingNFTs,
        total: subscription.nftLimit,
        planName: subscription.planName
      }
    } catch (error) {
      console.error('Error getting user quota:', error)
      return { remaining: 0, total: 0, planName: 'Unknown' }
    }
  }
}

// Helper function to create Art3HubV2Service instance
export function createArt3HubV2Service(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  
  // Create subscription service first
  const subscriptionService = new SubscriptionService(publicClient, walletClient, activeNetwork.id)
  
  // Create V2 service with subscription service
  return new Art3HubV2Service(publicClient, walletClient, activeNetwork.id, subscriptionService)
}

// Export convenience function with subscription service
export function createArt3HubV2ServiceWithSubscription(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  const subscriptionService = new SubscriptionService(publicClient, walletClient, activeNetwork.id)
  const art3hubService = new Art3HubV2Service(publicClient, walletClient, activeNetwork.id, subscriptionService)
  
  return {
    art3hubService,
    subscriptionService
  }
}