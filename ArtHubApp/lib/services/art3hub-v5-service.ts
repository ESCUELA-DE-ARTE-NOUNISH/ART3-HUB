// Art3Hub V5 Service - Enhanced contract-based data service for Base-only deployment
import { parseEther, type Address, type PublicClient, type WalletClient, createPublicClient, http, keccak256, toBytes, encodePacked, decodeEventLog } from 'viem'
import { getActiveNetwork } from '@/lib/networks'
import { base, baseSepolia } from '@/lib/wagmi'

// Art3HubFactoryV5 ABI - Enhanced for contract-based data reading
const ART3HUB_FACTORY_V5_ABI = [
  // Collection creation functions
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "image", "type": "string"},
      {"name": "externalUrl", "type": "string"},
      {"name": "royaltyRecipient", "type": "address"},
      {"name": "royaltyFeeNumerator", "type": "uint96"},
      {"name": "category", "type": "string"},
      {"name": "creatorName", "type": "string"},
      {"name": "creatorUsername", "type": "string"},
      {"name": "creatorEmail", "type": "string"},
      {"name": "creatorProfilePicture", "type": "string"},
      {"name": "creatorSocialLinks", "type": "string"}
    ],
    "name": "createCollectionV5",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // NFT minting functions
  {
    "inputs": [
      {"name": "collection", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenURI", "type": "string"},
      {"name": "category", "type": "string"},
      {"name": "tags", "type": "string[]"},
      {"name": "ipfsImageHash", "type": "string"},
      {"name": "ipfsMetadataHash", "type": "string"},
      {"name": "royaltyBPS", "type": "uint256"},
      {"name": "additionalMetadata", "type": "string"}
    ],
    "name": "mintNFTV5",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Discovery and search functions
  {
    "inputs": [{"name": "category", "type": "string"}],
    "name": "getCollectionsByCategory",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCollectionCategories",
    "outputs": [{"name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "name", "type": "string"}],
    "name": "getCollectionByName",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "creator", "type": "address"}],
    "name": "getCreatorCollectionNames",
    "outputs": [{"name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "category", "type": "string"},
      {"name": "creator", "type": "address"},
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "searchCollections",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Enhanced subscription info
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

  // Platform statistics
  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      {"name": "totalCollectionsCount", "type": "uint256"},
      {"name": "totalCategories", "type": "uint256"},
      {"name": "totalCreators", "type": "uint256"},
      {"name": "baseNetworkId", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "collection", "type": "address"},
      {"indexed": true, "name": "artist", "type": "address"},
      {"indexed": false, "name": "name", "type": "string"},
      {"indexed": false, "name": "symbol", "type": "string"},
      {"indexed": false, "name": "category", "type": "string"},
      {"indexed": true, "name": "collectionId", "type": "uint256"}
    ],
    "name": "CollectionCreatedV5",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "collection", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "category", "type": "string"},
      {"indexed": false, "name": "tags", "type": "string[]"},
      {"indexed": false, "name": "gasless", "type": "bool"}
    ],
    "name": "NFTMintedV5",
    "type": "event"
  }
] as const

// Art3HubCollectionV5 ABI - Enhanced for comprehensive data reading
const ART3HUB_COLLECTION_V5_ABI = [
  // Creator profile functions
  {
    "inputs": [{"name": "creator", "type": "address"}],
    "name": "getCreatorProfile",
    "outputs": [
      {
        "components": [
          {"name": "name", "type": "string"},
          {"name": "username", "type": "string"},
          {"name": "email", "type": "string"},
          {"name": "profilePicture", "type": "string"},
          {"name": "bannerImage", "type": "string"},
          {"name": "socialLinks", "type": "string"},
          {"name": "isVerified", "type": "bool"},
          {"name": "profileCompleteness", "type": "uint256"},
          {"name": "createdAt", "type": "uint256"},
          {"name": "updatedAt", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "username", "type": "string"}],
    "name": "getCreatorByUsername",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },

  // NFT data functions
  {
    "inputs": [{"name": "creator", "type": "address"}],
    "name": "getCreatorNFTs",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "category", "type": "string"},
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "getNFTsByCategory",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tag", "type": "string"}],
    "name": "getNFTsByTag",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCategories",
    "outputs": [{"name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTags",
    "outputs": [{"name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  },

  // NFT extended data
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getNFTFullData",
    "outputs": [
      {
        "components": [
          {"name": "category", "type": "string"},
          {"name": "tags", "type": "string[]"},
          {"name": "ipfsImageHash", "type": "string"},
          {"name": "ipfsMetadataHash", "type": "string"},
          {"name": "createdTimestamp", "type": "uint256"},
          {"name": "royaltyBPS", "type": "uint256"},
          {"name": "isVisible", "type": "bool"},
          {"name": "isFeatured", "type": "bool"},
          {"name": "additionalMetadata", "type": "string"}
        ],
        "name": "extendedData",
        "type": "tuple"
      },
      {
        "components": [
          {"name": "totalViews", "type": "uint256"},
          {"name": "totalLikes", "type": "uint256"},
          {"name": "totalShares", "type": "uint256"},
          {"name": "averageRating", "type": "uint256"},
          {"name": "ratingCount", "type": "uint256"},
          {"name": "lastUpdated", "type": "uint256"}
        ],
        "name": "stats",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Social features
  {
    "inputs": [{"name": "creator", "type": "address"}],
    "name": "getFeaturedNFTs",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Search function
  {
    "inputs": [
      {"name": "category", "type": "string"},
      {"name": "tag", "type": "string"},
      {"name": "creator", "type": "address"},
      {"name": "onlyVisible", "type": "bool"},
      {"name": "onlyFeatured", "type": "bool"},
      {"name": "offset", "type": "uint256"},
      {"name": "limit", "type": "uint256"}
    ],
    "name": "searchNFTs",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Collection overview
  {
    "inputs": [],
    "name": "getCollectionOverview",
    "outputs": [
      {"name": "totalNFTs", "type": "uint256"},
      {"name": "totalCategories", "type": "uint256"},
      {"name": "totalTags", "type": "uint256"},
      {"name": "totalCreators", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Basic NFT functions
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
  }
] as const

// Helper function to create public client for Base network only
function createBasePublicClient(chainId: number): PublicClient {
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
    default:
      throw new Error(`Unsupported chain ID for Base-only deployment: ${chainId}`)
  }
}

// Get Art3HubFactoryV5 contract address based on Base network
function getArt3HubFactoryV5Address(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V5_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V5_8453 as Address) || null
    default:
      return null
  }
}

// Enhanced interfaces for V5 data structures
export interface CreatorProfile {
  name: string
  username: string
  email: string
  profilePicture: string // IPFS hash
  bannerImage: string // IPFS hash
  socialLinks: string // JSON string
  isVerified: boolean
  profileCompleteness: number
  createdAt: Date
  updatedAt: Date
}

export interface NFTExtendedData {
  category: string
  tags: string[]
  ipfsImageHash: string
  ipfsMetadataHash: string
  createdTimestamp: Date
  royaltyBPS: number
  isVisible: boolean
  isFeatured: boolean
  additionalMetadata: string
}

export interface NFTStats {
  totalViews: number
  totalLikes: number
  totalShares: number
  averageRating: number // Out of 5 stars * 100 (for decimals)
  ratingCount: number
  lastUpdated: Date
}

export interface NFTFullData {
  tokenId: number
  extendedData: NFTExtendedData
  stats: NFTStats
  tokenURI: string
}

export interface CollectionInfo {
  address: Address
  name: string
  symbol: string
  artist: Address
  totalNFTs: number
  totalCategories: number
  totalTags: number
  totalCreators: number
}

export interface PlatformStats {
  totalCollections: number
  totalCategories: number
  totalCreators: number
  baseNetworkId: number
}

export interface EnhancedSubscriptionInfo {
  planName: string
  nftsMinted: number
  nftLimit: number
  isActive: boolean
  collectionsCreated: number
  collectionNames: string[]
}

export interface SearchFilters {
  category?: string
  tag?: string
  creator?: Address
  onlyVisible?: boolean
  onlyFeatured?: boolean
  offset?: number
  limit?: number
}

export class Art3HubV5Service {
  private publicClient: PublicClient
  private walletClient: WalletClient | null
  private chainId: number
  public factoryAddress: Address

  constructor(
    publicClient: PublicClient, 
    walletClient: WalletClient | null, 
    chainId: number
  ) {
    this.publicClient = createBasePublicClient(chainId)
    this.walletClient = walletClient
    this.chainId = chainId
    
    const factoryAddress = getArt3HubFactoryV5Address(chainId)
    if (!factoryAddress) {
      throw new Error(`Art3HubFactoryV5 not deployed on Base chain ${chainId}`)
    }
    this.factoryAddress = factoryAddress
    
    console.log('🔧 Art3HubV5Service initialized for Base-only deployment:', {
      chainId,
      factory: this.factoryAddress,
      hasWallet: !!walletClient
    })
  }

  // ==================== CREATOR PROFILE FUNCTIONS ====================

  /**
   * Get creator profile from any V5 collection on Base
   */
  async getCreatorProfile(creatorAddress: Address, collectionAddress?: Address): Promise<CreatorProfile | null> {
    try {
      console.log('👤 Getting V5 creator profile for:', creatorAddress)
      
      // If no specific collection provided, try to find one
      if (!collectionAddress) {
        const collections = await this.getCreatorCollections(creatorAddress)
        if (collections.length === 0) {
          console.log('No collections found for creator')
          return null
        }
        collectionAddress = collections[0]
      }
      
      const profileResult = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getCreatorProfile',
        args: [creatorAddress]
      })
      
      // Convert contract result to CreatorProfile
      return {
        name: profileResult.name,
        username: profileResult.username,
        email: profileResult.email,
        profilePicture: profileResult.profilePicture,
        bannerImage: profileResult.bannerImage,
        socialLinks: profileResult.socialLinks,
        isVerified: profileResult.isVerified,
        profileCompleteness: Number(profileResult.profileCompleteness),
        createdAt: new Date(Number(profileResult.createdAt) * 1000),
        updatedAt: new Date(Number(profileResult.updatedAt) * 1000)
      }
      
    } catch (error) {
      console.error('❌ Error getting V5 creator profile:', error)
      return null
    }
  }

  /**
   * Get creator address by username
   */
  async getCreatorByUsername(username: string, collectionAddress?: Address): Promise<Address | null> {
    try {
      if (!collectionAddress) {
        // Would need to search across collections or maintain a username registry
        console.log('Collection address required for username lookup')
        return null
      }
      
      const creatorAddress = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getCreatorByUsername',
        args: [username]
      })
      
      return creatorAddress === '0x0000000000000000000000000000000000000000' ? null : creatorAddress
      
    } catch (error) {
      console.error('❌ Error getting creator by username:', error)
      return null
    }
  }

  // ==================== COLLECTION FUNCTIONS ====================

  /**
   * Get all collections by a creator
   */
  async getCreatorCollections(creatorAddress: Address): Promise<Address[]> {
    try {
      // This would need to be implemented by searching through events or maintaining a registry
      // For now, return empty array as placeholder
      console.log('🏗️ Getting creator collections - implementation needed')
      return []
      
    } catch (error) {
      console.error('❌ Error getting creator collections:', error)
      return []
    }
  }

  /**
   * Get collections by category
   */
  async getCollectionsByCategory(category: string): Promise<Address[]> {
    try {
      const collections = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'getCollectionsByCategory',
        args: [category]
      })
      
      return collections
      
    } catch (error) {
      console.error('❌ Error getting collections by category:', error)
      return []
    }
  }

  /**
   * Get all collection categories
   */
  async getAllCollectionCategories(): Promise<string[]> {
    try {
      const categories = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'getAllCollectionCategories'
      })
      
      return categories
      
    } catch (error) {
      console.error('❌ Error getting all categories:', error)
      return []
    }
  }

  /**
   * Get collection by name
   */
  async getCollectionByName(name: string): Promise<Address | null> {
    try {
      const collectionAddress = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'getCollectionByName',
        args: [name]
      })
      
      return collectionAddress === '0x0000000000000000000000000000000000000000' ? null : collectionAddress
      
    } catch (error) {
      console.error('❌ Error getting collection by name:', error)
      return null
    }
  }

  /**
   * Search collections with filters
   */
  async searchCollections(filters: SearchFilters): Promise<Address[]> {
    try {
      const collections = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'searchCollections',
        args: [
          filters.category || '',
          filters.creator || '0x0000000000000000000000000000000000000000',
          BigInt(filters.offset || 0),
          BigInt(filters.limit || 20)
        ]
      })
      
      return collections
      
    } catch (error) {
      console.error('❌ Error searching collections:', error)
      return []
    }
  }

  // ==================== NFT DATA FUNCTIONS ====================

  /**
   * Get all NFTs by creator
   */
  async getCreatorNFTs(creatorAddress: Address, collectionAddress: Address): Promise<number[]> {
    try {
      const nftIds = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getCreatorNFTs',
        args: [creatorAddress]
      })
      
      return nftIds.map(id => Number(id))
      
    } catch (error) {
      console.error('❌ Error getting creator NFTs:', error)
      return []
    }
  }

  /**
   * Get NFTs by category with pagination
   */
  async getNFTsByCategory(category: string, collectionAddress: Address, offset: number = 0, limit: number = 20): Promise<number[]> {
    try {
      const nftIds = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getNFTsByCategory',
        args: [category, BigInt(offset), BigInt(limit)]
      })
      
      return nftIds.map(id => Number(id))
      
    } catch (error) {
      console.error('❌ Error getting NFTs by category:', error)
      return []
    }
  }

  /**
   * Get NFTs by tag
   */
  async getNFTsByTag(tag: string, collectionAddress: Address): Promise<number[]> {
    try {
      const nftIds = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getNFTsByTag',
        args: [tag]
      })
      
      return nftIds.map(id => Number(id))
      
    } catch (error) {
      console.error('❌ Error getting NFTs by tag:', error)
      return []
    }
  }

  /**
   * Get complete NFT data including metadata and stats
   */
  async getNFTFullData(tokenId: number, collectionAddress: Address): Promise<NFTFullData | null> {
    try {
      const [fullDataResult, tokenURI] = await Promise.all([
        this.publicClient.readContract({
          address: collectionAddress,
          abi: ART3HUB_COLLECTION_V5_ABI,
          functionName: 'getNFTFullData',
          args: [BigInt(tokenId)]
        }),
        this.publicClient.readContract({
          address: collectionAddress,
          abi: ART3HUB_COLLECTION_V5_ABI,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        })
      ])
      
      const [extendedDataResult, statsResult] = fullDataResult
      
      return {
        tokenId,
        tokenURI,
        extendedData: {
          category: extendedDataResult.category,
          tags: extendedDataResult.tags,
          ipfsImageHash: extendedDataResult.ipfsImageHash,
          ipfsMetadataHash: extendedDataResult.ipfsMetadataHash,
          createdTimestamp: new Date(Number(extendedDataResult.createdTimestamp) * 1000),
          royaltyBPS: Number(extendedDataResult.royaltyBPS),
          isVisible: extendedDataResult.isVisible,
          isFeatured: extendedDataResult.isFeatured,
          additionalMetadata: extendedDataResult.additionalMetadata
        },
        stats: {
          totalViews: Number(statsResult.totalViews),
          totalLikes: Number(statsResult.totalLikes),
          totalShares: Number(statsResult.totalShares),
          averageRating: Number(statsResult.averageRating),
          ratingCount: Number(statsResult.ratingCount),
          lastUpdated: new Date(Number(statsResult.lastUpdated) * 1000)
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting NFT full data:', error)
      return null
    }
  }

  /**
   * Get featured NFTs by creator
   */
  async getFeaturedNFTs(creatorAddress: Address, collectionAddress: Address): Promise<number[]> {
    try {
      const nftIds = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getFeaturedNFTs',
        args: [creatorAddress]
      })
      
      return nftIds.map(id => Number(id))
      
    } catch (error) {
      console.error('❌ Error getting featured NFTs:', error)
      return []
    }
  }

  /**
   * Search NFTs with advanced filters
   */
  async searchNFTs(filters: SearchFilters, collectionAddress: Address): Promise<number[]> {
    try {
      const nftIds = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'searchNFTs',
        args: [
          filters.category || '',
          filters.tag || '',
          filters.creator || '0x0000000000000000000000000000000000000000',
          filters.onlyVisible || false,
          filters.onlyFeatured || false,
          BigInt(filters.offset || 0),
          BigInt(filters.limit || 20)
        ]
      })
      
      return nftIds.map(id => Number(id))
      
    } catch (error) {
      console.error('❌ Error searching NFTs:', error)
      return []
    }
  }

  // ==================== ANALYTICS AND STATS ====================

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const statsResult = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'getPlatformStats'
      })
      
      return {
        totalCollections: Number(statsResult.totalCollectionsCount),
        totalCategories: Number(statsResult.totalCategories),
        totalCreators: Number(statsResult.totalCreators),
        baseNetworkId: Number(statsResult.baseNetworkId)
      }
      
    } catch (error) {
      console.error('❌ Error getting platform stats:', error)
      return {
        totalCollections: 0,
        totalCategories: 0,
        totalCreators: 0,
        baseNetworkId: this.chainId
      }
    }
  }

  /**
   * Get collection overview
   */
  async getCollectionOverview(collectionAddress: Address): Promise<CollectionInfo | null> {
    try {
      const [overviewResult, artist] = await Promise.all([
        this.publicClient.readContract({
          address: collectionAddress,
          abi: ART3HUB_COLLECTION_V5_ABI,
          functionName: 'getCollectionOverview'
        }),
        this.publicClient.readContract({
          address: collectionAddress,
          abi: ART3HUB_COLLECTION_V5_ABI,
          functionName: 'artist'
        })
      ])
      
      return {
        address: collectionAddress,
        name: '', // Would need to be fetched separately
        symbol: '', // Would need to be fetched separately  
        artist,
        totalNFTs: Number(overviewResult.totalNFTs),
        totalCategories: Number(overviewResult.totalCategories),
        totalTags: Number(overviewResult.totalTags),
        totalCreators: Number(overviewResult.totalCreators)
      }
      
    } catch (error) {
      console.error('❌ Error getting collection overview:', error)
      return null
    }
  }

  /**
   * Get enhanced subscription info with collection data
   */
  async getEnhancedSubscriptionInfo(userAddress: Address): Promise<EnhancedSubscriptionInfo | null> {
    try {
      const subscriptionResult = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'getUserSubscriptionInfoV5',
        args: [userAddress]
      })
      
      return {
        planName: subscriptionResult.planName,
        nftsMinted: Number(subscriptionResult.nftsMinted),
        nftLimit: Number(subscriptionResult.nftLimit),
        isActive: subscriptionResult.isActive,
        collectionsCreated: Number(subscriptionResult.collectionsCreated),
        collectionNames: subscriptionResult.collectionNames
      }
      
    } catch (error) {
      console.error('❌ Error getting enhanced subscription info:', error)
      return null
    }
  }

  // ==================== DISCOVERY FUNCTIONS ====================

  /**
   * Get all available categories across the platform
   */
  async getAllCategories(collectionAddress?: Address): Promise<string[]> {
    try {
      if (collectionAddress) {
        // Get categories from specific collection
        const categories = await this.publicClient.readContract({
          address: collectionAddress,
          abi: ART3HUB_COLLECTION_V5_ABI,
          functionName: 'getAllCategories'
        })
        return categories
      } else {
        // Get categories from factory (platform-wide)
        return await this.getAllCollectionCategories()
      }
      
    } catch (error) {
      console.error('❌ Error getting all categories:', error)
      return []
    }
  }

  /**
   * Get all available tags
   */
  async getAllTags(collectionAddress: Address): Promise<string[]> {
    try {
      const tags = await this.publicClient.readContract({
        address: collectionAddress,
        abi: ART3HUB_COLLECTION_V5_ABI,
        functionName: 'getAllTags'
      })
      
      return tags
      
    } catch (error) {
      console.error('❌ Error getting all tags:', error)
      return []
    }
  }

  /**
   * Get creator's collection names
   */
  async getCreatorCollectionNames(creatorAddress: Address): Promise<string[]> {
    try {
      const names = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: ART3HUB_FACTORY_V5_ABI,
        functionName: 'getCreatorCollectionNames',
        args: [creatorAddress]
      })
      
      return names
      
    } catch (error) {
      console.error('❌ Error getting creator collection names:', error)
      return []
    }
  }
}

// Helper function to create Art3HubV5Service instance for Base-only deployment
export function createArt3HubV5Service(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
): Art3HubV5Service {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  
  // Validate Base-only deployment
  if (networkName !== 'base') {
    throw new Error(`V5 Service only supports Base network, got: ${networkName}`)
  }
  
  return new Art3HubV5Service(publicClient, walletClient, activeNetwork.id)
}

// Export convenience function with service for Base-only deployment
export function createArt3HubV5ServiceWithUtils(
  publicClient: PublicClient, 
  walletClient: WalletClient | null, 
  networkName: string, 
  isTestingMode: boolean = false
) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  
  // Validate Base-only deployment
  if (networkName !== 'base') {
    throw new Error(`V5 Service only supports Base network, got: ${networkName}`)
  }
  
  const art3hubV5Service = new Art3HubV5Service(publicClient, walletClient, activeNetwork.id)
  
  return {
    art3hubV5Service,
    chainId: activeNetwork.id,
    networkName: activeNetwork.displayName,
    isBaseOnly: true
  }
}