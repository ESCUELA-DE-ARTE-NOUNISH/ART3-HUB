import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore'
import { 
  db, 
  type UserFavorite,
  type NFT, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

export class FirebaseFavoritesService {
  /**
   * Add an NFT to user's favorites
   */
  static async addToFavorites(walletAddress: string, nft: NFT): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping add to favorites')
      return false
    }

    try {
      // Create a composite ID for the favorite (user_wallet + nft_id)
      const favoriteId = `${walletAddress.toLowerCase()}_${nft.id}`
      
      // Check if already favorited
      const favoriteRef = doc(db, COLLECTIONS.USER_FAVORITES, favoriteId)
      const existingFavorite = await getDoc(favoriteRef)
      
      if (existingFavorite.exists()) {
        console.log('NFT already in favorites')
        return true
      }

      const favorite: UserFavorite = {
        id: favoriteId,
        user_wallet_address: walletAddress.toLowerCase(),
        nft_id: nft.id,
        nft_name: nft.name,
        nft_artist_name: nft.artist_name || '',
        nft_image_ipfs_hash: nft.image_ipfs_hash,
        nft_category: nft.category,
        nft_created_at: nft.created_at,
        favorited_at: getCurrentTimestamp()
      }

      await setDoc(favoriteRef, favorite)
      console.log('NFT added to favorites successfully')
      return true
    } catch (error) {
      console.error('Error adding NFT to favorites:', error)
      return false
    }
  }

  /**
   * Remove an NFT from user's favorites
   */
  static async removeFromFavorites(walletAddress: string, nftId: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping remove from favorites')
      return false
    }

    try {
      const favoriteId = `${walletAddress.toLowerCase()}_${nftId}`
      const favoriteRef = doc(db, COLLECTIONS.USER_FAVORITES, favoriteId)
      
      await deleteDoc(favoriteRef)
      console.log('NFT removed from favorites successfully')
      return true
    } catch (error) {
      console.error('Error removing NFT from favorites:', error)
      return false
    }
  }

  /**
   * Check if an NFT is favorited by user
   */
  static async isFavorited(walletAddress: string, nftId: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping favorite check')
      return false
    }

    try {
      const favoriteId = `${walletAddress.toLowerCase()}_${nftId}`
      const favoriteRef = doc(db, COLLECTIONS.USER_FAVORITES, favoriteId)
      const favoriteDoc = await getDoc(favoriteRef)
      
      return favoriteDoc.exists()
    } catch (error) {
      console.error('Error checking if NFT is favorited:', error)
      return false
    }
  }

  /**
   * Get all favorites for a user
   */
  static async getUserFavorites(walletAddress: string): Promise<UserFavorite[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping get user favorites')
      return []
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.USER_FAVORITES),
        where('user_wallet_address', '==', walletAddress.toLowerCase()),
        orderBy('favorited_at', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => doc.data() as UserFavorite)
    } catch (error) {
      console.error('Error fetching user favorites:', error)
      return []
    }
  }

  /**
   * Get favorites count for a user
   */
  static async getFavoritesCount(walletAddress: string): Promise<number> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping favorites count')
      return 0
    }

    try {
      const favorites = await this.getUserFavorites(walletAddress)
      return favorites.length
    } catch (error) {
      console.error('Error getting favorites count:', error)
      return 0
    }
  }

  /**
   * Get multiple favorite statuses for NFTs (batch check)
   */
  static async getFavoriteStatuses(walletAddress: string, nftIds: string[]): Promise<Record<string, boolean>> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping batch favorite check')
      return {}
    }

    try {
      const statuses: Record<string, boolean> = {}
      
      // Check each NFT individually (Firebase doesn't support IN queries with composite keys)
      await Promise.all(
        nftIds.map(async (nftId) => {
          statuses[nftId] = await this.isFavorited(walletAddress, nftId)
        })
      )
      
      return statuses
    } catch (error) {
      console.error('Error getting batch favorite statuses:', error)
      return {}
    }
  }

  /**
   * Get total likes count for a specific NFT (count of all users who favorited it)
   */
  static async getNFTLikesCount(nftId: string): Promise<number> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping NFT likes count')
      return 0
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.USER_FAVORITES),
        where('nft_id', '==', nftId)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.size // Returns the number of documents
    } catch (error) {
      console.error('Error getting NFT likes count:', error)
      return 0
    }
  }

  /**
   * Get likes count for multiple NFTs (batch operation)
   */
  static async getBatchNFTLikesCount(nftIds: string[]): Promise<Record<string, number>> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping batch NFT likes count')
      return {}
    }

    try {
      const counts: Record<string, number> = {}
      
      // Process in batches to avoid too many concurrent requests
      await Promise.all(
        nftIds.map(async (nftId) => {
          counts[nftId] = await this.getNFTLikesCount(nftId)
        })
      )
      
      return counts
    } catch (error) {
      console.error('Error getting batch NFT likes count:', error)
      return {}
    }
  }

  /**
   * Toggle favorite status for an NFT
   */
  static async toggleFavorite(walletAddress: string, nft: NFT): Promise<boolean> {
    try {
      const isCurrentlyFavorited = await this.isFavorited(walletAddress, nft.id)
      
      if (isCurrentlyFavorited) {
        await this.removeFromFavorites(walletAddress, nft.id)
        return false // Not favorited anymore
      } else {
        await this.addToFavorites(walletAddress, nft)
        return true // Now favorited
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }
}