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
   * Get all NFTs for a wallet address
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
        
        // Fallback: Get NFTs without orderBy and sort client-side
        const q = query(
          collection(db, COLLECTIONS.NFTS),
          where('wallet_address', '==', walletAddress.toLowerCase())
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
      console.error('Error fetching NFTs by wallet:', error)
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
   */
  static async getUserCreatedNFTsByWallet(walletAddress: string): Promise<NFT[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT fetch')
      return []
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.NFTS),
        where('wallet_address', '==', walletAddress.toLowerCase()),
        where('source', '==', 'user_created')
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
}