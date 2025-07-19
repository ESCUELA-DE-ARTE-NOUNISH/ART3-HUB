export type NFTClaimStatus = 'draft' | 'published' | 'unpublished'

export interface ClaimableNFT {
  id: string
  title: string
  description: string
  image: string
  imageUrl?: string
  imagePath?: string
  claimCode: string
  startDate: string // ISO date string
  endDate: string | null // ISO date string or null
  status: NFTClaimStatus
  contractAddress?: string
  deploymentTxHash?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  maxClaims?: number
  currentClaims?: number
  network?: string
  metadataIpfsHash?: string
  metadataUrl?: string
}

export interface NFTClaim {
  id: string
  nftId: string
  userWallet: string
  claimDate: string
  txHash?: string
  tokenId?: number
  contractAddress?: string
  claimCode?: string
  status: 'pending' | 'minted' | 'failed'
}

export interface CreateClaimableNFTInput {
  title: string
  description: string
  image: File | string // File object for new uploads, string for existing image hash
  imageUrl?: string // URL for the uploaded image
  claimCode: string
  startDate: Date | string
  endDate?: Date | string | null
  status: NFTClaimStatus
  maxClaims?: number
  network?: string
  contractAddress?: string
  deploymentTxHash?: string
}

export interface UpdateClaimableNFTInput extends Partial<CreateClaimableNFTInput> {
  id: string
  imageUrl?: string
} 