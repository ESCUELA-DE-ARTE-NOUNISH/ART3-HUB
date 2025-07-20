// Simple NFT Service - One Collection Per NFT Architecture
// Each NFT gets its own collection contract, enabling marketplace functionality

import { parseEther, type Address, type PublicClient, type WalletClient } from 'viem'

export interface SimpleNFTCreationParams {
  name: string
  symbol: string
  description: string
  imageURI: string
  externalUrl?: string
  artist: Address
  royaltyBPS: number
  recipient: Address // The user who will receive the NFT
}

export interface SimpleNFTResult {
  transactionHash: string
  collectionAddress: Address
  tokenId: number
  gasless: boolean
  nftData: {
    name: string
    symbol: string
    description: string
    imageURI: string
    artist: Address
    royaltyBPS: number
  }
}

export class SimpleNFTService {
  private publicClient: PublicClient
  private walletClient: WalletClient | null
  private chainId: number

  constructor(
    publicClient: PublicClient, 
    walletClient: WalletClient | null, 
    chainId: number
  ) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.chainId = chainId
    
    console.log('🔧 SimpleNFTService initialized:', {
      chainId,
      hasWallet: !!walletClient
    })
  }

  // Create NFT with collection-per-NFT architecture
  async createNFT(params: SimpleNFTCreationParams): Promise<SimpleNFTResult> {
    console.log('🎨 Creating NFT with collection-per-NFT architecture...')
    console.log('📋 NFT params:', {
      name: params.name,
      symbol: params.symbol,
      artist: params.artist,
      recipient: params.recipient
    })

    try {
      // Call gasless relayer to create collection and mint NFT
      console.log('🚀 Submitting to gasless relayer for direct creation...')
      
      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'createNFTWithCollection',
          chainId: this.chainId,
          nftData: {
            name: params.name,
            symbol: params.symbol,
            description: params.description,
            imageURI: params.imageURI,
            externalUrl: params.externalUrl || '',
            artist: params.artist,
            royaltyBPS: params.royaltyBPS,
            recipient: params.recipient
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Relayer failed: ${error}`)
      }

      const result = await response.json()
      console.log('✅ Simple NFT creation successful:', result)

      return {
        transactionHash: result.transactionHash,
        collectionAddress: result.collectionAddress,
        tokenId: result.tokenId || 0,
        gasless: true,
        nftData: {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          imageURI: params.imageURI,
          artist: params.artist,
          royaltyBPS: params.royaltyBPS
        }
      }

    } catch (error) {
      console.error('❌ Error creating simple NFT:', error)
      throw new Error(`Failed to create NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mint additional copies to existing collection (for marketplace)
  async mintToCollection(params: {
    collectionAddress: Address
    recipient: Address
    tokenURI: string
  }): Promise<{ transactionHash: string; tokenId: number }> {
    console.log('🔄 Minting additional copy to existing collection...')
    
    try {
      const response = await fetch('/api/gasless-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'mintToExistingCollection',
          chainId: this.chainId,
          collectionAddress: params.collectionAddress,
          recipient: params.recipient,
          tokenURI: params.tokenURI
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Relayer failed: ${error}`)
      }

      const result = await response.json()
      console.log('✅ Additional mint successful:', result)

      return {
        transactionHash: result.transactionHash,
        tokenId: result.tokenId || 0
      }

    } catch (error) {
      console.error('❌ Error minting to collection:', error)
      throw new Error(`Failed to mint to collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Factory function to create service
export function createSimpleNFTService(
  publicClient: PublicClient,
  walletClient: WalletClient | null,
  chainId: number
): SimpleNFTService {
  return new SimpleNFTService(publicClient, walletClient, chainId)
}