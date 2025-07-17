import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, COLLECTIONS, isFirebaseConfigured, generateId, getCurrentTimestamp } from '../firebase'
import { FirebaseStorageService } from './firebase-storage-service'
import { IPFSService } from './ipfs-service'
import { 
  ClaimableNFT, 
  NFTClaim, 
  CreateClaimableNFTInput, 
  UpdateClaimableNFTInput 
} from '@/types/nft-claim'

// Service for managing claimable NFTs
export class NFTClaimService {
  // Create a new claimable NFT
  static async createClaimableNFT(
    input: CreateClaimableNFTInput, 
    creatorWallet: string
  ): Promise<ClaimableNFT> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured')
    }

    try {
      const id = generateId()
      const now = getCurrentTimestamp()
      
      // Format dates to ISO strings if they are Date objects
      const startDate = input.startDate instanceof Date 
        ? input.startDate.toISOString() 
        : input.startDate
      
      const endDate = input.endDate instanceof Date 
        ? input.endDate.toISOString() 
        : input.endDate || null
      
      // Handle image upload if it's a File object
      let imageUrl = ''
      let imagePath = ''
      
      if (input.image instanceof File) {
        // Upload to Firebase Storage
        const uploadResult = await FirebaseStorageService.uploadFile(
          input.image, 
          `nft-images/${creatorWallet}`
        )
        imageUrl = uploadResult.url
        imagePath = uploadResult.path
      } else if (typeof input.image === 'string') {
        // Use existing image URL or path
        imageUrl = input.image
        imagePath = input.image
      }
      
      // Create NFT document
      const nftData: ClaimableNFT = {
        id,
        title: input.title,
        description: input.description,
        image: imagePath,
        imageUrl: imageUrl,
        claimCode: input.claimCode,
        startDate,
        endDate,
        status: input.status || 'draft',
        createdAt: now,
        updatedAt: now,
        createdBy: creatorWallet,
        maxClaims: input.maxClaims || 0, // 0 means unlimited
        currentClaims: 0,
        network: input.network || 'base', // Default to Base network
      }
      
      const nftRef = doc(db, COLLECTIONS.CLAIMABLE_NFTS, id)
      await setDoc(nftRef, nftData)
      
      // If published, create metadata on IPFS
      if (nftData.status === 'published') {
        try {
          await this.uploadMetadataToPinata(nftData)
        } catch (error) {
          console.error('Failed to upload metadata to Pinata, continuing without metadata:', error)
          // Continue without metadata if Pinata is not configured
        }
      }
      
      return nftData
    } catch (error) {
      console.error('Error creating claimable NFT:', error)
      throw new Error('Failed to create claimable NFT')
    }
  }
  
  // Upload NFT metadata to Pinata
  static async uploadMetadataToPinata(nft: ClaimableNFT): Promise<string> {
    try {
      // Create metadata object
      const metadata = {
        name: nft.title,
        description: nft.description,
        image: nft.imageUrl || nft.image || '',
        attributes: [
          {
            trait_type: 'Network',
            value: nft.network || 'base'
          },
          {
            trait_type: 'Creator',
            value: nft.createdBy
          },
          {
            trait_type: 'Creation Date',
            value: new Date(nft.createdAt).toLocaleDateString()
          }
        ]
      }
      
      // Upload to IPFS via Pinata
      const result = await IPFSService.uploadMetadata(metadata)
      
      // Update NFT with metadata hash
      await updateDoc(doc(db, COLLECTIONS.CLAIMABLE_NFTS, nft.id), {
        metadataIpfsHash: result.ipfsHash,
        metadataUrl: result.ipfsUrl,
        updatedAt: getCurrentTimestamp()
      })
      
      return result.ipfsHash
    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error)
      throw new Error('Failed to upload metadata')
    }
  }
  
  // Get all claimable NFTs
  static async getAllClaimableNFTs(): Promise<ClaimableNFT[]> {
    if (!isFirebaseConfigured()) {
      return []
    }
    
    try {
      const nftsRef = collection(db, COLLECTIONS.CLAIMABLE_NFTS)
      const q = query(nftsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as ClaimableNFT
        return {
          ...data,
          id: doc.id
        }
      })
    } catch (error) {
      console.error('Error getting claimable NFTs:', error)
      return []
    }
  }
  
  // Get a specific claimable NFT by ID
  static async getClaimableNFT(id: string): Promise<ClaimableNFT | null> {
    if (!isFirebaseConfigured()) {
      return null
    }
    
    try {
      const nftRef = doc(db, COLLECTIONS.CLAIMABLE_NFTS, id)
      const snapshot = await getDoc(nftRef)
      
      if (!snapshot.exists()) {
        return null
      }
      
      return {
        ...snapshot.data() as ClaimableNFT,
        id: snapshot.id
      }
    } catch (error) {
      console.error('Error getting claimable NFT:', error)
      return null
    }
  }
  
  // Update a claimable NFT
  static async updateClaimableNFT(
    input: UpdateClaimableNFTInput,
    updaterWallet: string
  ): Promise<ClaimableNFT | null> {
    if (!isFirebaseConfigured()) {
      return null
    }
    
    try {
      const { id, ...updateData } = input
      const nftRef = doc(db, COLLECTIONS.CLAIMABLE_NFTS, id)
      
      // Format dates if provided
      let formattedData: any = { ...updateData }
      
      if (updateData.startDate) {
        formattedData.startDate = updateData.startDate instanceof Date 
          ? updateData.startDate.toISOString() 
          : updateData.startDate
      }
      
      if (updateData.endDate !== undefined) {
        formattedData.endDate = updateData.endDate instanceof Date 
          ? updateData.endDate.toISOString() 
          : updateData.endDate
      }
      
      // Add updatedAt timestamp
      formattedData.updatedAt = getCurrentTimestamp()
      
      await updateDoc(nftRef, formattedData)
      
      // Get updated NFT
      return await this.getClaimableNFT(id)
    } catch (error) {
      console.error('Error updating claimable NFT:', error)
      return null
    }
  }
  
  // Delete a claimable NFT
  static async deleteClaimableNFT(id: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      return false
    }
    
    try {
      const nftRef = doc(db, COLLECTIONS.CLAIMABLE_NFTS, id)
      
      // Instead of deleting, mark as deleted
      await updateDoc(nftRef, {
        status: 'unpublished',
        updatedAt: getCurrentTimestamp()
      })
      
      return true
    } catch (error) {
      console.error('Error deleting claimable NFT:', error)
      return false
    }
  }
  
  // Verify a claim code without requiring a wallet address
  static async validateCodeOnly(
    claimCode: string
  ): Promise<{ valid: boolean; nft?: ClaimableNFT; message?: string }> {
    if (!isFirebaseConfigured()) {
      return { valid: false, message: 'Service not available' }
    }
    
    try {
      // Find NFT with this claim code - case insensitive comparison
      const nftsRef = collection(db, COLLECTIONS.CLAIMABLE_NFTS)
      const snapshot = await getDocs(nftsRef)
      
      // Manual filtering for case-insensitive comparison
      const matchingDocs = snapshot.docs.filter(doc => {
        const data = doc.data()
        return data.claimCode && 
               data.claimCode.toLowerCase() === claimCode.toLowerCase() &&
               data.status === 'published'
      })
      
      if (matchingDocs.length === 0) {
        return { valid: false, message: 'Invalid claim code' }
      }
      
      const nft = matchingDocs[0].data() as ClaimableNFT
      nft.id = matchingDocs[0].id
      
      const now = new Date()
      const startDate = new Date(nft.startDate)
      const endDate = nft.endDate ? new Date(nft.endDate) : null
      
      // Check if claim period is active
      if (now < startDate) {
        return { valid: false, message: 'Claim period has not started yet' }
      }
      
      if (endDate && now > endDate) {
        return { valid: false, message: 'Claim period has ended' }
      }
      
      // Check if max claims reached
      if (nft.maxClaims && nft.currentClaims && nft.currentClaims >= nft.maxClaims) {
        return { valid: false, message: 'Maximum claims reached' }
      }
      
      return { valid: true, nft }
    } catch (error) {
      console.error('Error validating claim code:', error)
      return { valid: false, message: 'Error validating claim code' }
    }
  }
  
  // Verify a claim code
  static async verifyClaimCode(
    claimCode: string, 
    userWallet: string
  ): Promise<{ valid: boolean; nft?: ClaimableNFT; message?: string }> {
    if (!isFirebaseConfigured()) {
      return { valid: false, message: 'Service not available' }
    }
    
    try {
      // Find NFT with this claim code
      const nftsRef = collection(db, COLLECTIONS.CLAIMABLE_NFTS)
      const q = query(nftsRef, where('claimCode', '==', claimCode), where('status', '==', 'published'))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return { valid: false, message: 'Invalid claim code' }
      }
      
      const nft = snapshot.docs[0].data() as ClaimableNFT
      nft.id = snapshot.docs[0].id
      
      const now = new Date()
      const startDate = new Date(nft.startDate)
      const endDate = nft.endDate ? new Date(nft.endDate) : null
      
      // Check if claim period is active
      if (now < startDate) {
        return { valid: false, message: 'Claim period has not started yet' }
      }
      
      if (endDate && now > endDate) {
        return { valid: false, message: 'Claim period has ended' }
      }
      
      // Check if max claims reached
      if (nft.maxClaims && nft.currentClaims && nft.currentClaims >= nft.maxClaims) {
        return { valid: false, message: 'Maximum claims reached' }
      }
      
      // Check if user has already claimed
      const claimsRef = collection(db, COLLECTIONS.NFT_CLAIMS)
      const userClaimQuery = query(
        claimsRef,
        where('nftId', '==', nft.id),
        where('userWallet', '==', userWallet.toLowerCase())
      )
      const userClaimSnapshot = await getDocs(userClaimQuery)
      
      if (!userClaimSnapshot.empty) {
        return { valid: false, message: 'You have already claimed this NFT' }
      }
      
      return { valid: true, nft }
    } catch (error) {
      console.error('Error verifying claim code:', error)
      return { valid: false, message: 'Error verifying claim code' }
    }
  }
  
  // Process a claim
  static async processClaim(
    nftId: string, 
    userWallet: string,
    txHash?: string,
    tokenId?: number,
    contractAddress?: string
  ): Promise<{ 
    success: boolean; 
    message: string; 
    claim?: NFTClaim;
    txHash?: string;
    tokenId?: number;
    contractAddress?: string;
    network?: string;
  }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Service not available' }
    }
    
    try {
      const nft = await this.getClaimableNFT(nftId)
      
      if (!nft) {
        return { success: false, message: 'NFT not found' }
      }
      
      // Create claim record
      const claimId = generateId()
      const now = getCurrentTimestamp()
      
      // Use provided transaction hash or generate a mock one
      const finalTxHash = txHash || 
        `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      
      // Use provided token ID or generate a mock one
      const finalTokenId = tokenId !== undefined ? tokenId : Math.floor(Math.random() * 10000)
      
      // Use provided contract address or the one from the NFT
      const finalContractAddress = contractAddress || nft.contractAddress || '0x1234567890123456789012345678901234567890'
      
      const claimData: NFTClaim = {
        id: claimId,
        nftId,
        userWallet: userWallet.toLowerCase(),
        claimDate: now,
        txHash: finalTxHash,
        tokenId: finalTokenId,
        contractAddress: finalContractAddress,
        claimCode: nft.claimCode, // Include the claim code in the claim record
        status: 'minted'
      }
      
      const claimRef = doc(db, COLLECTIONS.NFT_CLAIMS, claimId)
      await setDoc(claimRef, claimData)
      
      // Update NFT claim count and contract address
      const nftRef = doc(db, COLLECTIONS.CLAIMABLE_NFTS, nftId)
      await updateDoc(nftRef, {
        currentClaims: (nft.currentClaims || 0) + 1,
        updatedAt: now,
        // Update the contract address if provided
        ...(contractAddress ? { contractAddress } : {})
      })
      
      console.log("NFT claimed successfully:", {
        nftId,
        userWallet,
        txHash: finalTxHash,
        tokenId: finalTokenId,
        contractAddress: finalContractAddress,
        claimCode: nft.claimCode
      })
      
      return { 
        success: true, 
        message: 'NFT claimed successfully', 
        claim: claimData,
        txHash: finalTxHash,
        tokenId: finalTokenId,
        contractAddress: finalContractAddress,
        network: nft.network || 'base'
      }
    } catch (error) {
      console.error('Error processing claim:', error)
      return { success: false, message: 'Error processing claim' }
    }
  }
} 