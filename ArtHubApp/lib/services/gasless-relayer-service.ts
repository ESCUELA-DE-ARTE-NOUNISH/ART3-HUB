// Gasless Relayer Service - EIP-712 Meta-transactions for Art3Hub V2
import { 
  type Address, 
  type PublicClient, 
  type WalletClient, 
  keccak256, 
  toBytes, 
  encodePacked,
  parseEther,
  createPublicClient,
  http
} from 'viem'
import { base, baseSepolia, zora, zoraSepolia } from '@/lib/wagmi'

// EIP-712 Domain for Art3Hub V2
const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
] as const

// Mint Voucher Type for EIP-712
const MINT_VOUCHER_TYPE = [
  { name: 'to', type: 'address' },
  { name: 'tokenURI', type: 'string' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' }
] as const

// Collection Voucher Type for EIP-712
const COLLECTION_VOUCHER_TYPE = [
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
] as const

// Gasless Relayer ABI
const GASLESS_RELAYER_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "to", "type": "address" },
          { "name": "tokenURI", "type": "string" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" },
      { "name": "collectionAddress", "type": "address" }
    ],
    "name": "gaslessMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "name", "type": "string" },
          { "name": "symbol", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "image", "type": "string" },
          { "name": "externalUrl", "type": "string" },
          { "name": "artist", "type": "address" },
          { "name": "royaltyRecipient", "type": "address" },
          { "name": "royaltyFeeNumerator", "type": "uint96" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "gaslessCreateCollection",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getNonce",
    "outputs": [{ "name": "", "type": "uint256" }],
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

// Get Gasless Relayer contract address based on network
function getGaslessRelayerAddress(chainId: number): Address | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return (process.env.NEXT_PUBLIC_GASLESS_RELAYER_84532 as Address) || null
    case 8453: // Base Mainnet
      return (process.env.NEXT_PUBLIC_GASLESS_RELAYER_8453 as Address) || null
    case 999999999: // Zora Sepolia
      return (process.env.NEXT_PUBLIC_GASLESS_RELAYER_999999999 as Address) || null
    case 7777777: // Zora Mainnet
      return (process.env.NEXT_PUBLIC_GASLESS_RELAYER_7777777 as Address) || null
    default:
      return null
  }
}

export interface MintVoucher {
  to: Address
  tokenURI: string
  nonce: bigint
  deadline: bigint
}

export interface CollectionVoucher {
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

export interface GaslessMintParams {
  collectionAddress: Address
  recipient: Address
  tokenURI: string
}

export interface GaslessCollectionParams {
  name: string
  symbol: string
  description: string
  imageURI: string
  externalUrl?: string
  artist: Address
  royaltyRecipient: Address
  royaltyBPS: number
}

export class GaslessRelayerService {
  private publicClient: PublicClient
  private walletClient: WalletClient | null
  private chainId: number
  private relayerAddress: Address
  private domain: any

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient | null,
    chainId: number
  ) {
    this.publicClient = createChainSpecificPublicClient(chainId)
    this.walletClient = walletClient
    this.chainId = chainId
    
    const relayerAddress = getGaslessRelayerAddress(chainId)
    if (!relayerAddress) {
      throw new Error(`Gasless Relayer not deployed on chain ${chainId}`)
    }
    this.relayerAddress = relayerAddress

    // Set up EIP-712 domain
    this.domain = {
      name: 'Art3HubGaslessRelayer',
      version: '1',
      chainId: BigInt(chainId),
      verifyingContract: this.relayerAddress
    }

    console.log('🚀 GaslessRelayerService initialized:', {
      chainId,
      relayer: this.relayerAddress,
      hasWallet: !!walletClient
    })
  }

  // Get user's current nonce for meta-transactions
  async getUserNonce(userAddress: Address): Promise<bigint> {
    try {
      const nonce = await this.publicClient.readContract({
        address: this.relayerAddress,
        abi: GASLESS_RELAYER_ABI,
        functionName: 'getNonce',
        args: [userAddress]
      })
      return nonce as bigint
    } catch (error) {
      console.error('Error getting user nonce:', error)
      throw new Error('Failed to get user nonce for meta-transaction')
    }
  }

  // Create and sign a mint voucher
  async createMintVoucher(params: GaslessMintParams): Promise<{ voucher: MintVoucher; signature: string }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎫 Creating mint voucher for gasless transaction...')
      
      // Get user's nonce
      const nonce = await this.getUserNonce(params.recipient)
      
      // Create deadline (15 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 900)
      
      const voucher: MintVoucher = {
        to: params.recipient,
        tokenURI: params.tokenURI,
        nonce,
        deadline
      }

      console.log('📋 Mint voucher data:', voucher)

      // Sign the voucher using EIP-712
      const signature = await this.walletClient.signTypedData({
        domain: this.domain,
        types: {
          MintVoucher: MINT_VOUCHER_TYPE
        },
        primaryType: 'MintVoucher',
        message: voucher
      })

      console.log('✅ Mint voucher signed:', signature)

      return { voucher, signature }
    } catch (error) {
      console.error('Error creating mint voucher:', error)
      throw new Error(`Failed to create mint voucher: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Create and sign a collection voucher
  async createCollectionVoucher(params: GaslessCollectionParams): Promise<{ voucher: CollectionVoucher; signature: string }> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('🎫 Creating collection voucher for gasless transaction...')
      
      // Get user's nonce
      const nonce = await this.getUserNonce(params.artist)
      
      // Create deadline (15 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 900)
      
      const voucher: CollectionVoucher = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.imageURI,
        externalUrl: params.externalUrl || '',
        artist: params.artist,
        royaltyRecipient: params.royaltyRecipient,
        royaltyFeeNumerator: BigInt(params.royaltyBPS),
        nonce,
        deadline
      }

      console.log('📋 Collection voucher data:', voucher)

      // Sign the voucher using EIP-712
      const signature = await this.walletClient.signTypedData({
        domain: this.domain,
        types: {
          CollectionVoucher: COLLECTION_VOUCHER_TYPE
        },
        primaryType: 'CollectionVoucher',
        message: voucher
      })

      console.log('✅ Collection voucher signed:', signature)

      return { voucher, signature }
    } catch (error) {
      console.error('Error creating collection voucher:', error)
      throw new Error(`Failed to create collection voucher: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Execute gasless mint using the backend relayer API (truly gasless)
  async executeGaslessMint(
    voucher: MintVoucher, 
    signature: string, 
    collectionAddress: Address
  ): Promise<string> {
    try {
      console.log('🚀 Submitting gasless mint to backend relayer...')
      console.log('📋 Relayer API params:', {
        voucher,
        signature,
        collectionAddress,
        chainId: this.chainId
      })

      console.log('✅ TRUE GASLESS: Backend relayer will pay all gas fees')

      // Call the backend gasless relay API
      // Convert BigInt values to strings for JSON serialization
      const serializedVoucher = {
        ...voucher,
        nonce: voucher.nonce.toString(),
        deadline: voucher.deadline.toString()
      }

      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'mint',
          voucher: serializedVoucher,
          signature,
          collectionAddress,
          chainId: this.chainId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.demo) {
          console.log('⚠️ Demo mode: Gasless relayer not fully configured')
          console.log('🔄 Falling back to user-paid transaction for demo purposes')
          
          // Fallback to user-paid transaction for demo
          if (!this.walletClient) {
            throw new Error('Wallet client not available for fallback')
          }

          const hash = await this.walletClient.writeContract({
            address: this.relayerAddress,
            abi: GASLESS_RELAYER_ABI,
            functionName: 'gaslessMint',
            args: [voucher, signature as `0x${string}`, collectionAddress],
            chain: this.publicClient.chain,
            account: this.walletClient.account!
          })

          console.log('📝 Fallback transaction sent (user pays gas):', hash)
          return hash
        }
        
        throw new Error(`Gasless relay failed: ${result.error}`)
      }

      console.log('🎉 Gasless mint executed by backend relayer!')
      console.log('💰 User paid $0 in gas fees')
      console.log('✅ Transaction hash:', result.transactionHash)

      return result.transactionHash
    } catch (error) {
      console.error('Error executing gasless mint:', error)
      throw new Error(`Failed to execute gasless mint: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Execute gasless collection creation using the backend relayer API (truly gasless)
  async executeGaslessCreateCollection(voucher: CollectionVoucher, signature: string): Promise<string> {
    try {
      console.log('🚀 Submitting gasless collection creation to backend relayer...')
      console.log('📋 Relayer API params:', {
        voucher,
        signature,
        chainId: this.chainId
      })

      console.log('✅ TRUE GASLESS: Backend relayer will pay all gas fees')

      // Call the backend gasless relay API
      // Convert BigInt values to strings for JSON serialization
      const serializedVoucher = {
        ...voucher,
        royaltyFeeNumerator: voucher.royaltyFeeNumerator.toString(),
        nonce: voucher.nonce.toString(),
        deadline: voucher.deadline.toString()
      }

      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'createCollection',
          voucher: serializedVoucher,
          signature,
          chainId: this.chainId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.log('❌ Gasless relay API failed:', result)
        
        if (result.demo) {
          console.log('⚠️ Demo mode: Gasless relayer not fully configured')
        } else {
          console.log('⚠️ Gasless relayer contract issue, falling back to regular factory call')
        }
        
        console.log('🔄 Falling back to user-paid transaction')
        
        // Fallback to user-paid transaction
        if (!this.walletClient) {
          throw new Error('Wallet client not available for fallback')
        }

        // Instead of calling the relayer, call the factory directly (user pays gas)
        console.log('🏭 Calling Art3HubFactoryV2 directly (user pays gas)...')
        
        // We need to get the factory address and create the collection directly
        const factoryAddress = this.getFactoryAddress()
        if (!factoryAddress) {
          throw new Error('Factory address not available for fallback')
        }

        const hash = await this.walletClient.writeContract({
          address: factoryAddress,
          abi: this.getFactoryABI(),
          functionName: 'createCollection',
          args: [
            voucher.name,
            voucher.symbol,
            voucher.description,
            voucher.image,
            voucher.externalUrl,
            voucher.royaltyRecipient,
            voucher.royaltyFeeNumerator
          ],
          chain: this.publicClient.chain,
          account: this.walletClient.account!
        })

        console.log('📝 Fallback factory transaction sent (user pays gas):', hash)
        return hash
      }

      console.log('🎉 Gasless collection creation executed by backend relayer!')
      console.log('💰 User paid $0 in gas fees')
      console.log('✅ Transaction hash:', result.transactionHash)

      return result.transactionHash
    } catch (error) {
      console.error('Error executing gasless collection creation:', error)
      throw new Error(`Failed to execute gasless collection creation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper method to get factory address for fallback
  private getFactoryAddress(): Address | null {
    switch (this.chainId) {
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

  // Helper method to get factory ABI for fallback
  private getFactoryABI() {
    return [
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
      }
    ] as const
  }

  // Check if relayer has sufficient funds
  async checkRelayerBalance(): Promise<{ balance: bigint; sufficient: boolean }> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.relayerAddress
      })

      // Consider sufficient if > 0.01 ETH
      const minBalance = parseEther('0.01')
      const sufficient = balance > minBalance

      console.log('💰 Relayer balance check:', {
        address: this.relayerAddress,
        balance: balance.toString(),
        balanceETH: (Number(balance) / 1e18).toFixed(4),
        sufficient
      })

      return { balance, sufficient }
    } catch (error) {
      console.error('Error checking relayer balance:', error)
      return { balance: 0n, sufficient: false }
    }
  }
}

// Helper function to create GaslessRelayerService instance
export function createGaslessRelayerService(
  publicClient: PublicClient,
  walletClient: WalletClient | null,
  chainId: number
) {
  return new GaslessRelayerService(publicClient, walletClient, chainId)
}