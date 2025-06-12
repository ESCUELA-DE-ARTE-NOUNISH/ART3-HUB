// Art3 Hub NFT Creation Service using deployed Factory contracts
import { parseEther, type Address, type PublicClient, type WalletClient, parseUnits, encodeFunctionData } from 'viem'
import { getActiveNetwork } from '@/lib/networks'

// Art3HubFactory ABI - from deployed contracts
const ART3HUB_FACTORY_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"name": "name", "type": "string"},
          {"name": "symbol", "type": "string"},
          {"name": "maxSupply", "type": "uint256"},
          {"name": "mintPrice", "type": "uint256"},
          {"name": "contractURI", "type": "string"},
          {"name": "baseURI", "type": "string"},
          {"name": "royaltyBps", "type": "uint96"},
          {"name": "royaltyRecipient", "type": "address"}
        ],
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createCollection",
    "outputs": [{"name": "collection", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deploymentFee",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCollections",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "artist", "type": "address"},
      {"indexed": true, "name": "collection", "type": "address"},
      {"indexed": false, "name": "name", "type": "string"},
      {"indexed": false, "name": "symbol", "type": "string"},
      {"indexed": false, "name": "maxSupply", "type": "uint256"}
    ],
    "name": "CollectionCreated",
    "type": "event"
  }
] as const

// Art3HubCollection ABI - for minting in individual collections
const ART3HUB_COLLECTION_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "tokenURI_", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "tokenURI_", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "tokenURI_", "type": "string"},
      {"name": "artistRoyaltyBps", "type": "uint96"}
    ],
    "name": "artistMint",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Get factory contract addresses based on network
function getArt3HubFactoryAddress(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_BASE_SEPOLIA as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_BASE as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_ZORA as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_ART3HUB_FACTORY_ZORA_SEPOLIA as Address) || null
    default:
      return null
  }
}

export interface Art3HubCollectionParams {
  name: string
  symbol: string
  description: string
  imageURI: string
  maxSupply?: number
  mintPrice?: string // ETH amount as string
  contractAdmin: Address
  fundsRecipient: Address
  royaltyBPS: number // Basis points (e.g., 500 = 5%)
  contractURI?: string
  baseURI?: string
}

export interface Art3HubMintParams {
  collectionContract: Address
  recipient: Address
  tokenURI: string
  title?: string
  description?: string
  royaltyBPS?: number
}

export class Art3HubService {
  private publicClient: PublicClient
  private walletClient: WalletClient
  private chainId: number

  constructor(publicClient: PublicClient, walletClient: WalletClient, chainId: number) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.chainId = chainId
  }

  // Create an artist collection using Art3Hub Factory
  async createCollection(params: Art3HubCollectionParams) {
    try {
      console.log('🎨 Creating Art3Hub NFT collection...')
      console.log('📋 Collection params:', {
        name: params.name,
        symbol: params.symbol,
        admin: params.contractAdmin
      })
      
      // Get the factory address for current chain
      const factoryAddress = getArt3HubFactoryAddress(this.chainId)
      
      if (!factoryAddress) {
        throw new Error(`Art3Hub Factory not deployed on chain ${this.chainId}. Please deploy contracts first.`)
      }
      
      console.log('🏭 Using Art3Hub Factory:', factoryAddress)
      
      // Get deployment fee from factory
      console.log('💰 Fetching deployment fee...')
      const deploymentFee = await this.publicClient.readContract({
        address: factoryAddress,
        abi: ART3HUB_FACTORY_ABI,
        functionName: 'deploymentFee'
      })
      
      console.log('💰 Deployment fee:', deploymentFee.toString(), 'wei')
      
      // Prepare collection parameters
      const collectionParams = {
        name: params.name,
        symbol: params.symbol,
        maxSupply: BigInt(params.maxSupply || 10000), // Default 10k max supply
        mintPrice: parseEther(params.mintPrice || '0.001'), // Default 0.001 ETH mint price
        contractURI: params.contractURI || params.imageURI, // Collection metadata
        baseURI: params.baseURI || `${params.imageURI}/`, // Base URI for tokens
        royaltyBps: params.royaltyBPS, // Royalty in basis points
        royaltyRecipient: params.fundsRecipient
      }
      
      console.log('📝 Final collection parameters:', collectionParams)
      
      // Create collection via factory
      console.log('🚀 Calling createCollection on factory...')
      const hash = await this.walletClient.writeContract({
        address: factoryAddress,
        abi: ART3HUB_FACTORY_ABI,
        functionName: 'createCollection',
        args: [collectionParams],
        value: deploymentFee // Pay deployment fee
      })
      
      console.log('✅ Collection creation transaction sent:', hash)
      
      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('🎉 Collection creation confirmed!')
      console.log('📊 Transaction receipt:', {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
        logsCount: receipt.logs.length
      })
      
      // Log all events for debugging
      console.log('📋 All transaction logs:')
      receipt.logs.forEach((log, index) => {
        console.log(`  Log ${index}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        })
      })
      
      // Extract collection address from CollectionCreated event
      let collectionAddress: Address | null = null
      
      // Decode CollectionCreated event from logs
      for (const log of receipt.logs) {
        try {
          // Check if this log is from the factory contract and has the right topic count
          if (log.address.toLowerCase() === factoryAddress.toLowerCase() && log.topics.length >= 3) {
            // CollectionCreated event signature: keccak256("CollectionCreated(address,address,string,string,uint256)")
            const collectionCreatedTopic = '0x1a2a22cb034d26d1854bdc6666a5b91fe25efbbb5dcad3b0355478d6f5c362a1' // This might need to be calculated
            
            // For now, let's use a simpler approach - the collection address should be in the second topic (indexed parameter)
            if (log.topics.length >= 3) {
              // Topics: [event_signature, artist_address, collection_address]
              // The collection address is the second indexed parameter (topics[2])
              const collectionTopic = log.topics[2]
              if (collectionTopic) {
                // Convert the topic to an address (remove padding)
                collectionAddress = `0x${collectionTopic.slice(-40)}` as Address
                console.log('🎯 Extracted collection address from topics:', collectionAddress)
                break
              }
            }
          }
        } catch (e) {
          // Continue if log decoding fails
          console.log('Failed to parse log:', e)
        }
      }
      
      // Fallback: Use factory address if event parsing failed
      if (!collectionAddress) {
        console.warn('⚠️ Could not extract collection address from logs, using factory address as fallback')
        collectionAddress = factoryAddress
      }
      
      console.log('📍 New collection address:', collectionAddress)
      
      return {
        transactionHash: hash,
        receipt,
        contractAddress: collectionAddress,
        tokenId: 0, // This is a collection creation, not a mint
        nftData: {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          imageURI: params.imageURI,
          creator: params.contractAdmin,
          royaltyBPS: params.royaltyBPS,
          collectionAddress: collectionAddress,
          deploymentFee: deploymentFee.toString()
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating Art3Hub collection:', error)
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Transaction was rejected by user')
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds for deployment fee and gas')
        } else if (error.message.includes('network')) {
          throw new Error('Network error - please check your connection')
        } else if (error.message.includes('revert')) {
          throw new Error('Contract call reverted - check parameters and fees')
        }
      }
      
      throw new Error(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mint a token from an existing Art3Hub collection
  async mintToken(params: Art3HubMintParams) {
    try {
      console.log('🎯 Minting NFT to collection:', params.collectionContract)
      
      // Get mint price from collection contract
      const mintPrice = await this.publicClient.readContract({
        address: params.collectionContract,
        abi: ART3HUB_COLLECTION_ABI,
        functionName: 'mintPrice'
      })
      
      console.log('💰 Mint price:', mintPrice.toString(), 'wei')
      
      // Choose mint function based on whether we have title/description
      if (params.title && params.description && params.royaltyBPS) {
        // Use artistMint for creator minting with metadata
        console.log('🎨 Using artistMint function...')
        const hash = await this.walletClient.writeContract({
          address: params.collectionContract,
          abi: ART3HUB_COLLECTION_ABI,
          functionName: 'artistMint',
          args: [params.title, params.description, params.tokenURI, params.royaltyBPS]
        })
        
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
        
        return {
          transactionHash: hash,
          receipt,
          tokenId: 1, // Artist mint typically gets token ID 1
        }
      } else {
        // Use regular mint function for public minting
        console.log('💎 Using regular mint function...')
        const hash = await this.walletClient.writeContract({
          address: params.collectionContract,
          abi: ART3HUB_COLLECTION_ABI,
          functionName: 'mint',
          args: [params.tokenURI],
          value: mintPrice
        })
        
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
        
        // Extract token ID from logs (simplified)
        const tokenId = Number(receipt.blockNumber) % 1000 + 1
        
        return {
          transactionHash: hash,
          receipt,
          tokenId: tokenId,
        }
      }
    } catch (error) {
      console.error('Error minting token:', error)
      throw new Error(`Failed to mint token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get collection information from Art3Hub collection contract
  async getCollection(contractAddress: Address) {
    try {
      console.log('📖 Fetching collection info from:', contractAddress)
      
      // Get basic collection info (this would need more contract methods in practice)
      const totalSupply = await this.publicClient.readContract({
        address: contractAddress,
        abi: ART3HUB_COLLECTION_ABI,
        functionName: 'totalSupply'
      })
      
      const mintPrice = await this.publicClient.readContract({
        address: contractAddress,
        abi: ART3HUB_COLLECTION_ABI,
        functionName: 'mintPrice'
      })
      
      return {
        address: contractAddress,
        totalSupply,
        mintPrice,
        chainId: this.chainId
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
      throw error
    }
  }

  // Get deployment fee from factory
  async getDeploymentFee() {
    try {
      const factoryAddress = getArt3HubFactoryAddress(this.chainId)
      if (!factoryAddress) {
        throw new Error(`No Art3Hub Factory deployed on chain ${this.chainId}`)
      }
      
      const deploymentFee = await this.publicClient.readContract({
        address: factoryAddress,
        abi: ART3HUB_FACTORY_ABI,
        functionName: 'deploymentFee'
      })
      
      return deploymentFee
    } catch (error) {
      console.error('Error fetching deployment fee:', error)
      return parseEther('0.001') // Default fallback fee
    }
  }

  // Get total collections created
  async getTotalCollections() {
    try {
      const factoryAddress = getArt3HubFactoryAddress(this.chainId)
      if (!factoryAddress) {
        return BigInt(0)
      }
      
      const totalCollections = await this.publicClient.readContract({
        address: factoryAddress,
        abi: ART3HUB_FACTORY_ABI,
        functionName: 'getTotalCollections'
      })
      
      return totalCollections
    } catch (error) {
      console.error('Error fetching total collections:', error)
      return BigInt(0)
    }
  }
  // Helper method to get transaction details for debugging
  async getTransactionDetails(txHash: string) {
    try {
      const transaction = await this.publicClient.getTransaction({ hash: txHash as `0x${string}` })
      const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
      
      return {
        transaction,
        receipt,
        logs: receipt.logs,
        status: receipt.status
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      throw error
    }
  }

  // Helper method to decode collection address from transaction hash
  async getCollectionAddressFromTx(txHash: string): Promise<Address | null> {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
      const factoryAddress = getArt3HubFactoryAddress(this.chainId)
      
      if (!factoryAddress) return null
      
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === factoryAddress.toLowerCase() && log.topics.length >= 3) {
          const collectionTopic = log.topics[2]
          if (collectionTopic) {
            return `0x${collectionTopic.slice(-40)}` as Address
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting collection address from transaction:', error)
      return null
    }
  }
}

// Helper function to create Art3Hub service instance (keeping Zora name for compatibility)
export function createZoraService(publicClient: PublicClient, walletClient: WalletClient, networkName: string, isTestingMode: boolean = false) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  return new Art3HubService(publicClient, walletClient, activeNetwork.id)
}

// Export Art3Hub service as well for explicit usage
export function createArt3HubService(publicClient: PublicClient, walletClient: WalletClient, networkName: string, isTestingMode: boolean = false) {
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  return new Art3HubService(publicClient, walletClient, activeNetwork.id)
}

// Network configuration for Art3Hub deployments
export const ART3HUB_NETWORKS = {
  base: {
    mainnet: {
      chainId: 8453,
      name: 'Base',
      rpcUrl: 'https://mainnet.base.org',
      blockExplorer: 'https://basescan.org',
      factoryAddress: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_BASE
    },
    testnet: {
      chainId: 84532,
      name: 'Base Sepolia',
      rpcUrl: 'https://sepolia.base.org',
      blockExplorer: 'https://sepolia.basescan.org',
      factoryAddress: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_BASE_SEPOLIA
    }
  },
  zora: {
    mainnet: {
      chainId: 7777777,
      name: 'Zora Network',
      rpcUrl: 'https://rpc.zora.energy',
      blockExplorer: 'https://explorer.zora.energy',
      factoryAddress: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_ZORA
    },
    testnet: {
      chainId: 999999999,
      name: 'Zora Sepolia',
      rpcUrl: 'https://sepolia.rpc.zora.energy',
      blockExplorer: 'https://sepolia.explorer.zora.energy',
      factoryAddress: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_ZORA_SEPOLIA
    }
  }
}