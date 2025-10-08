import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  deleteDoc 
} from 'firebase/firestore'
import { 
  db, 
  type NFT, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

// Utility function to get current network configuration
export const getCurrentNetworkInfo = () => {
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  
  if (isTestingMode) {
    return {
      network: 'base-sepolia',
      contractAddress: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532,
      chainId: 84532
    }
  } else {
    return {
      network: 'base',
      contractAddress: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453,
      chainId: 8453
    }
  }
}

export class FirebaseNFTService {
  /**
   * Create a new NFT record
   */
  static async createNFT(nftData: Omit<NFT, 'id' | 'created_at' | 'updated_at'>): Promise<NFT | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT creation')
      return null
    }

    try {
      const nftId = generateId()
      const timestamp = getCurrentTimestamp()
      
      const newNFT: NFT = {
        id: nftId,
        ...nftData,
        wallet_address: nftData.wallet_address.toLowerCase(),
        source: nftData.source || 'user_created',
        created_at: timestamp,
        updated_at: timestamp
      }

      const nftRef = doc(db, COLLECTIONS.NFTS, nftId)
      await setDoc(nftRef, newNFT)

      return newNFT
    } catch (error) {
      console.error('Error creating NFT:', error)
      return null
    }
  }

  /**
   * Get NFT by ID
   */
  static async getNFT(nftId: string): Promise<NFT | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return null
    }

    try {
      const nftRef = doc(db, COLLECTIONS.NFTS, nftId)
      const nftDoc = await getDoc(nftRef)

      if (!nftDoc.exists()) {
        return null
      }

      return nftDoc.data() as NFT
    } catch (error) {
      console.error('Error fetching NFT:', error)
      return null
    }
  }

  /**
   * Get all NFTs for a wallet address (legacy method - no filtering)
   * @deprecated Use getNFTsByWalletAndNetwork for better network isolation
   */
  static async getNFTsByWallet(walletAddress: string): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      // First try with composite index query
      try {
        const q = query(
          collection(db, COLLECTIONS.NFTS),
          where('wallet_address', '==', walletAddress.toLowerCase()),
          orderBy('created_at', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => doc.data() as NFT)
      } catch (indexError) {
        console.log('🔄 Composite index not available, falling back to client-side sorting...')
        
        // Try simple wallet query without orderBy (should work even if indexes are building)
        try {
          const q = query(
            collection(db, COLLECTIONS.NFTS),
            where('wallet_address', '==', walletAddress.toLowerCase())
          )
          
          const querySnapshot = await getDocs(q)
          const nfts = querySnapshot.docs.map(doc => doc.data() as NFT)
          
          console.log(`📊 Simple wallet query found ${nfts.length} NFTs`)
          
          // Sort client-side by created_at descending
          return nfts.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return dateB - dateA // Newest first
          })
          
        } catch (simpleQueryError) {
          console.error('🚨 Even simple wallet query failed:', simpleQueryError)
          
          // Last resort: Get ALL NFTs and filter client-side
          console.log('🆘 LAST RESORT: Getting all NFTs and filtering client-side...')
          const allQ = query(collection(db, COLLECTIONS.NFTS))
          const allSnapshot = await getDocs(allQ)
          const allNfts = allSnapshot.docs.map(doc => doc.data() as NFT)
          
          const filteredNfts = allNfts
            .filter(nft => nft.wallet_address?.toLowerCase() === walletAddress.toLowerCase())
            .sort((a, b) => {
              const dateA = new Date(a.created_at).getTime()
              const dateB = new Date(b.created_at).getTime()
              return dateB - dateA // Newest first
            })
            
          console.log(`📊 Last resort filter: ${filteredNfts.length} of ${allNfts.length} NFTs belong to wallet`)
          return filteredNfts
        }
      }
    } catch (error) {
      console.error('Error fetching NFTs by wallet:', error)
      return []
    }
  }

  /**
   * Get NFTs for a wallet address with network and contract filtering
   * This prevents cross-network NFT display issues
   */
  static async getNFTsByWalletAndNetwork(
    walletAddress: string, 
    network?: string,
    contractAddress?: string
  ): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      // Build query filters
      const filters = [where('wallet_address', '==', walletAddress.toLowerCase())]
      
      console.log('🔍 Query filters being built:', {
        wallet: walletAddress.toLowerCase(),
        network,
        contractAddress: contractAddress?.substring(0, 10) + '...'
      })
      
      if (network) {
        filters.push(where('network', '==', network))
      }
      
      if (contractAddress) {
        filters.push(where('contract_address', '==', contractAddress))
      }

      // First try with composite index query
      try {
        const q = query(
          collection(db, COLLECTIONS.NFTS),
          ...filters,
          orderBy('created_at', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        const nfts = querySnapshot.docs.map(doc => doc.data() as NFT)
        
        console.log('📊 NFTs fetched with filters:', {
          wallet: walletAddress.substring(0, 10) + '...',
          network,
          contractAddress: contractAddress?.substring(0, 10) + '...',
          count: nfts.length
        })
        
        return nfts
      } catch (indexError) {
        console.log('🔄 Composite index not available, falling back to client-side sorting...')
        
        // Generate specific Firebase composite index creation link
        const indexFields = ['wallet_address', 'network', 'created_at']
        const projectId = 'art3-hub-78ef8' // Firebase project ID
        const indexUrl = `https://console.firebase.google.com/u/0/project/${projectId}/firestore/indexes?create_composite=Cl4KDgoIcHJvamVjdHMSAmFydDMtaHViLTc4ZWY4L2RhdGFiYXNlcy8oZGVmYXVsdCkvcmVmZXJlbmNlcy9uZnRzEAESEAoOd2FsbGV0X2FkZHJlc3MQARILCgduZXR3b3JrEAESDAoKY3JlYXRlZF9hdBAC`
        
        console.error(`🚨 FIREBASE INDEX REQUIRED for /my-nfts functionality`)
        console.error(`📊 Query fields: wallet_address == "${walletAddress}" + network == "${network}" + orderBy(created_at, desc)`)
        console.error(`🔗 Create composite index: ${indexUrl}`)
        console.error(`📝 Index fields needed: ${indexFields.join(' + ')}`)
        console.error(`⚡ Alternative: Visit Firebase Console > Firestore > Indexes > Add composite index`)
        console.error(`   Collection: nfts`)
        console.error(`   Fields: wallet_address (Ascending), network (Ascending), created_at (Descending)`)
        
        // Fallback: Get NFTs without orderBy and sort client-side
        const q = query(
          collection(db, COLLECTIONS.NFTS),
          ...filters
        )
        
        const querySnapshot = await getDocs(q)
        const nfts = querySnapshot.docs.map(doc => doc.data() as NFT)
        
        // Sort client-side by created_at descending
        return nfts.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Newest first
        })
      }
    } catch (error) {
      console.error('Error fetching NFTs by wallet and network:', error)
      return []
    }
  }

  /**
   * Get NFTs for current network only (recommended method)
   * Uses environment configuration to filter by current network and contract
   */
  static async getNFTsByWalletCurrentNetwork(walletAddress: string): Promise<NFT[]> {
    const networkInfo = getCurrentNetworkInfo()
    
    console.log('🌐 Using current network configuration:', {
      network: networkInfo.network,
      contractAddress: networkInfo.contractAddress?.substring(0, 10) + '...',
      chainId: networkInfo.chainId
    })
    
    // TEMPORARY FIX: Skip complex queries and go straight to simple fallback until indexes are built
    console.log('🔧 TEMPORARY: Using simple fallback while Firebase indexes build...')
    
    try {
      const allQ = query(collection(db, COLLECTIONS.NFTS))
      const allSnapshot = await getDocs(allQ)
      const allNfts = allSnapshot.docs.map(doc => doc.data() as NFT)
      
      console.log(`📊 Retrieved ${allNfts.length} total NFTs from database`)
      
      const filteredNFTs = allNfts
        .filter(nft => {
          const walletMatch = nft.wallet_address?.toLowerCase() === walletAddress.toLowerCase()
          const networkMatch = nft.network === networkInfo.network
          const contractMatch = !networkInfo.contractAddress || nft.contract_address === networkInfo.contractAddress
          return walletMatch && networkMatch && contractMatch
        })
        .sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA // Newest first
        })
      
      console.log(`📊 Client-side filtering result: ${filteredNFTs.length} NFTs match wallet + network`)
      
      return filteredNFTs
      
    } catch (fallbackError) {
      console.error('🚨 Even fallback query failed:', fallbackError)
      return []
    }
  }

  /**
   * Get all NFTs (for admin purposes)
   */
  static async getAllNFTs(): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.NFTS),
        orderBy('created_at', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as NFT)
    } catch (error) {
      console.error('Error fetching all NFTs:', error)
      return []
    }
  }

  /**
   * Update NFT data
   */
  static async updateNFT(
    nftId: string,
    updateData: Partial<Omit<NFT, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<NFT | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT update')
      return null
    }

    try {
      const nftRef = doc(db, COLLECTIONS.NFTS, nftId)
      const updatePayload = {
        ...updateData,
        updated_at: getCurrentTimestamp()
      }
      
      await updateDoc(nftRef, updatePayload)
      
      // Return updated NFT
      const nftDoc = await getDoc(nftRef)
      return nftDoc.exists() ? nftDoc.data() as NFT : null
    } catch (error) {
      console.error('Error updating NFT:', error)
      return null
    }
  }

  /**
   * Delete NFT
   */
  static async deleteNFT(nftId: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT deletion')
      return false
    }

    try {
      const nftRef = doc(db, COLLECTIONS.NFTS, nftId)
      await deleteDoc(nftRef)
      return true
    } catch (error) {
      console.error('Error deleting NFT:', error)
      return false
    }
  }

  /**
   * Get NFTs by network
   */
  static async getNFTsByNetwork(network: string): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.NFTS),
        where('network', '==', network),
        orderBy('created_at', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as NFT)
    } catch (error) {
      console.error('Error fetching NFTs by network:', error)
      return []
    }
  }

  /**
   * Search NFTs by name (basic text search)
   */
  static async searchNFTsByName(searchTerm: string): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT search')
      return []
    }

    try {
      // Note: Firestore doesn't have built-in full-text search
      // This is a basic implementation that gets all NFTs and filters client-side
      // For production, consider using Algolia or similar service for better search
      const q = query(
        collection(db, COLLECTIONS.NFTS),
        orderBy('created_at', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const allNFTs = querySnapshot.docs.map(doc => doc.data() as NFT)
      
      // Filter by name containing search term (case-insensitive)
      return allNFTs.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.description && nft.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    } catch (error) {
      console.error('Error searching NFTs:', error)
      return []
    }
  }

  /**
   * Get NFT statistics for analytics
   */
  static async getNFTStatistics(): Promise<{
    totalNFTs: number
    totalCreators: number
    networkDistribution: Record<string, number>
    averageRoyalty: number
  }> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT statistics')
      return {
        totalNFTs: 0,
        totalCreators: 0,
        networkDistribution: {},
        averageRoyalty: 0
      }
    }

    try {
      const q = query(collection(db, COLLECTIONS.NFTS))
      const querySnapshot = await getDocs(q)
      const allNFTs = querySnapshot.docs.map(doc => doc.data() as NFT)
      
      const uniqueCreators = new Set(allNFTs.map(nft => nft.wallet_address))
      
      const networkDistribution: Record<string, number> = {}
      let totalRoyalty = 0
      
      allNFTs.forEach(nft => {
        networkDistribution[nft.network] = (networkDistribution[nft.network] || 0) + 1
        totalRoyalty += nft.royalty_percentage
      })
      
      const averageRoyalty = allNFTs.length > 0 ? totalRoyalty / allNFTs.length : 0
      
      return {
        totalNFTs: allNFTs.length,
        totalCreators: uniqueCreators.size,
        networkDistribution,
        averageRoyalty
      }
    } catch (error) {
      console.error('Error getting NFT statistics:', error)
      return {
        totalNFTs: 0,
        totalCreators: 0,
        networkDistribution: {},
        averageRoyalty: 0
      }
    }
  }

  /**
   * Get NFTs by wallet address (only user-created NFTs for membership quota)
   * Now includes network filtering to prevent cross-network quota calculation
   */
  static async getUserCreatedNFTsByWallet(walletAddress: string): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      const networkInfo = getCurrentNetworkInfo()
      
      const q = query(
        collection(db, COLLECTIONS.NFTS),
        where('wallet_address', '==', walletAddress.toLowerCase()),
        where('source', '==', 'user_created'),
        where('network', '==', networkInfo.network)
      )
      
      const querySnapshot = await getDocs(q)
      const nfts = querySnapshot.docs.map(doc => doc.data() as NFT)
      
      console.log('📊 User-created NFTs fetched for quota (network-filtered):', {
        wallet: walletAddress.substring(0, 10) + '...',
        network: networkInfo.network,
        userCreatedCount: nfts.length,
        projectId: 'art3-hub-78ef8'
      })
      
      // Sort client-side by created_at descending
      return nfts.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA // Newest first
      })
    } catch (error) {
      console.error('Error fetching user-created NFTs:', error)
      return []
    }
  }

  /**
   * Get claimable NFTs by wallet address
   */
  static async getClaimableNFTsByWallet(walletAddress: string): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.NFTS),
        where('wallet_address', '==', walletAddress.toLowerCase()),
        where('source', '==', 'claimable')
      )
      
      const querySnapshot = await getDocs(q)
      const nfts = querySnapshot.docs.map(doc => doc.data() as NFT)
      
      // Sort client-side by created_at descending
      return nfts.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA // Newest first
      })
    } catch (error) {
      console.error('Error fetching claimable NFTs:', error)
      return []
    }
  }

  /**
   * Get all NFTs that are featured in the gallery
   */
  static async getGalleryNFTs(): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured')
      return []
    }

    try {
      const nftsRef = collection(db, COLLECTIONS.NFTS)
      const q = query(
        nftsRef,
        where('in_gallery', '==', true),
        orderBy('gallery_added_at', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as NFT)
    } catch (error) {
      console.error('Error fetching gallery NFTs:', error)
      return []
    }
  }

  /**
   * Get paginated NFTs for admin gallery management
   * @param page - Page number (1-indexed)
   * @param limit - Number of NFTs per page
   * @param filter - Filter type: 'all', 'gallery', 'not_gallery'
   */
  static async getAdminGalleryNFTs(
    page: number = 1,
    limit: number = 20,
    filter: 'all' | 'gallery' | 'not_gallery' = 'all'
  ): Promise<{ nfts: NFT[], total: number, page: number, totalPages: number }> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured')
      return { nfts: [], total: 0, page: 1, totalPages: 0 }
    }

    try {
      const nftsRef = collection(db, COLLECTIONS.NFTS)
      let q = query(nftsRef, orderBy('created_at', 'desc'))

      // Apply filter
      if (filter === 'gallery') {
        q = query(nftsRef, where('in_gallery', '==', true), orderBy('gallery_added_at', 'desc'))
      } else if (filter === 'not_gallery') {
        q = query(nftsRef, where('in_gallery', '!=', true), orderBy('created_at', 'desc'))
      }

      const querySnapshot = await getDocs(q)
      const allNfts = querySnapshot.docs.map(doc => doc.data() as NFT)

      // Calculate pagination
      const total = allNfts.length
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const nfts = allNfts.slice(startIndex, endIndex)

      return { nfts, total, page, totalPages }
    } catch (error) {
      console.error('Error fetching admin gallery NFTs:', error)
      return { nfts: [], total: 0, page: 1, totalPages: 0 }
    }
  }

  /**
   * Toggle NFT gallery status
   * @param nftId - NFT document ID
   * @param inGallery - Whether to add (true) or remove (false) from gallery
   * @param adminWallet - Admin wallet address performing the action
   */
  static async toggleGalleryStatus(
    nftId: string,
    inGallery: boolean,
    adminWallet: string
  ): Promise<NFT | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured')
      return null
    }

    try {
      const nftRef = doc(db, COLLECTIONS.NFTS, nftId)
      const nftDoc = await getDoc(nftRef)

      if (!nftDoc.exists()) {
        console.error('NFT not found:', nftId)
        return null
      }

      const updateData: Partial<NFT> = {
        in_gallery: inGallery,
        updated_at: getCurrentTimestamp()
      }

      if (inGallery) {
        updateData.gallery_added_at = getCurrentTimestamp()
        updateData.gallery_added_by = adminWallet
      } else {
        // Remove gallery metadata when removing from gallery
        updateData.gallery_added_at = undefined
        updateData.gallery_added_by = undefined
      }

      await updateDoc(nftRef, updateData as any)

      // Fetch and return updated NFT
      const updatedDoc = await getDoc(nftRef)
      return updatedDoc.data() as NFT
    } catch (error) {
      console.error('Error toggling gallery status:', error)
      return null
    }
  }

  /**
   * Bulk toggle gallery status for multiple NFTs
   * @param nftIds - Array of NFT document IDs
   * @param inGallery - Whether to add (true) or remove (false) from gallery
   * @param adminWallet - Admin wallet address performing the action
   */
  static async bulkToggleGalleryStatus(
    nftIds: string[],
    inGallery: boolean,
    adminWallet: string
  ): Promise<number> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured')
      return 0
    }

    let successCount = 0

    for (const nftId of nftIds) {
      const result = await this.toggleGalleryStatus(nftId, inGallery, adminWallet)
      if (result) successCount++
    }

    return successCount
  }
}