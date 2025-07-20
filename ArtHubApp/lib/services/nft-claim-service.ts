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
        imagePath = input.image
        // Use provided imageUrl if available, otherwise use the image path
        imageUrl = input.imageUrl || input.image
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
        contractAddress: input.contractAddress || null,
        deploymentTxHash: input.deploymentTxHash || null,
      }
      
      const nftRef = doc(db, COLLECTIONS.CLAIMABLE_NFTS, id)
      await setDoc(nftRef, nftData)
      
      // If published, create metadata on IPFS
      if (nftData.status === 'published') {
        try {
          console.log('🔄 Attempting to upload metadata to IPFS...')
          const metadataHash = await this.uploadMetadataToPinata(nftData)
          console.log('✅ Metadata upload successful, hash:', metadataHash)
        } catch (error) {
          console.error('❌ Failed to upload metadata to Pinata, continuing without metadata:')
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          })
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
      let imageUrl = ''
      let ipfsImageHash = ''
      
      // If we have a Firebase Storage URL, we need to download the image and upload it to IPFS
      if (nft.imageUrl && nft.imageUrl.includes('firebasestorage.googleapis.com')) {
        console.log('📤 Uploading image to IPFS from Firebase Storage...')
        try {
          // Download the image from Firebase Storage
          const imageResponse = await fetch(nft.imageUrl)
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
          }
          
          // Convert to blob and then to File
          const imageBlob = await imageResponse.blob()
          const imageFile = new File([imageBlob], `${nft.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, { 
            type: imageBlob.type || 'image/jpeg' 
          })
          
          // Upload image to IPFS
          const imageUploadResult = await IPFSService.uploadFile(imageFile)
          imageUrl = imageUploadResult.gatewayUrl
          ipfsImageHash = imageUploadResult.ipfsHash
          
          console.log('✅ Image uploaded to IPFS:', {
            hash: ipfsImageHash,
            url: imageUrl
          })
        } catch (imageError) {
          console.error('⚠️ Failed to upload image to IPFS, using Firebase Storage URL as fallback:', imageError)
          console.error('Image error details:', {
            message: imageError.message,
            stack: imageError.stack,
            response: imageError.response?.data
          })
          imageUrl = nft.imageUrl
        }
      } else {
        // Use existing image URL (could be IPFS or other)
        imageUrl = nft.imageUrl || nft.image || ''
      }
      
      // Create metadata object with IPFS image URL
      const metadata = {
        name: nft.title,
        description: nft.description,
        image: imageUrl,
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
      
      console.log('📤 Uploading metadata to IPFS:', {
        name: metadata.name,
        imageUrl: metadata.image.substring(0, 50) + '...'
      })
      
      // Upload metadata to IPFS via Pinata
      const result = await IPFSService.uploadMetadata(metadata)
      
      // Update NFT with both image and metadata IPFS hashes
      const updateData: any = {
        metadataIpfsHash: result.ipfsHash,
        metadataUrl: result.ipfsUrl,
        updatedAt: getCurrentTimestamp()
      }
      
      // If we uploaded the image to IPFS, store that hash too
      if (ipfsImageHash) {
        updateData.imageIpfsHash = ipfsImageHash
        updateData.ipfsImageUrl = imageUrl
      }
      
      await updateDoc(doc(db, COLLECTIONS.CLAIMABLE_NFTS, nft.id), updateData)
      
      console.log('✅ Metadata uploaded to IPFS:', {
        metadataHash: result.ipfsHash,
        imageHash: ipfsImageHash || 'using_existing'
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
      
      // If multiple matches, prioritize the most recent one (by createdAt)
      matchingDocs.sort((a, b) => {
        const aData = a.data()
        const bData = b.data()
        const aCreated = aData.createdAt || '1970-01-01T00:00:00.000Z'
        const bCreated = bData.createdAt || '1970-01-01T00:00:00.000Z'
        return new Date(bCreated).getTime() - new Date(aCreated).getTime()
      })
      
      const nft = matchingDocs[0].data() as ClaimableNFT
      nft.id = matchingDocs[0].id
      
      console.log(`Found ${matchingDocs.length} NFT(s) with claim code "${claimCode}", using most recent:`, {
        id: nft.id,
        title: nft.title,
        contractAddress: nft.contractAddress,
        createdAt: nft.createdAt
      })
      
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
      
      // IMPORTANT: Create an NFT record in the NFTS collection so it appears in /my-nfts
      // This is what the FirebaseNFTService.getNFTsByWallet() function looks for
      try {
        const { FirebaseNFTService } = await import('./firebase-nft-service')
        
        // Extract IPFS hash from imageUrl if it's a gateway URL
        let imageIpfsHash = ''
        if (nft.imageUrl) {
          const ipfsMatch = nft.imageUrl.match(/\/ipfs\/([^/?]+)/)
          if (ipfsMatch) {
            imageIpfsHash = ipfsMatch[1]
          } else {
            // If not an IPFS URL, use a placeholder hash
            imageIpfsHash = 'QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L'
          }
        }
        
        // Create NFT record that matches the expected structure for /my-nfts
        // Use the actual Firebase Storage URL as the image_ipfs_hash when available
        const actualImageHash = nft.imageUrl && nft.imageUrl.includes('firebasestorage.googleapis.com') 
          ? nft.imageUrl // Store Firebase Storage URL as image_ipfs_hash for compatibility
          : imageIpfsHash
        
        const nftRecord = await FirebaseNFTService.createNFT({
          wallet_address: userWallet.toLowerCase(),
          name: nft.title,
          description: nft.description || '',
          image_ipfs_hash: actualImageHash,
          metadata_ipfs_hash: nft.metadataIpfsHash || '',
          transaction_hash: finalTxHash,
          network: nft.network || 'base',
          royalty_percentage: 0, // Default for claimable NFTs
          contract_address: finalContractAddress,
          token_id: finalTokenId,
          source: 'claimable'
        })
        
        console.log("✅ NFT record created for /my-nfts page:", {
          nftRecordId: nftRecord?.id,
          wallet_address: userWallet,
          name: nft.title,
          contract_address: finalContractAddress,
          token_id: finalTokenId,
          image_ipfs_hash: imageIpfsHash
        })
      } catch (nftCreationError) {
        console.error('⚠️ Failed to create NFT record for /my-nfts (claim still successful):', nftCreationError)
        // Don't fail the entire claim if NFT record creation fails
      }
      
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