import { useState, useEffect, useCallback } from 'react'
import { FirebaseFavoritesService } from '@/lib/services/firebase-favorites-service'
import { useUserProfile } from '@/hooks/useUserProfile'
import type { NFT, UserFavorite } from '@/lib/firebase'

export function useFavorites() {
  const { walletAddress, isConnected } = useUserProfile()
  const [favoriteStatuses, setFavoriteStatuses] = useState<Record<string, boolean>>({})
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([])
  const [loading, setLoading] = useState(false)

  // Load user's favorites when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      loadUserFavorites()
    } else {
      setUserFavorites([])
      setFavoriteStatuses({})
    }
  }, [isConnected, walletAddress])

  const loadUserFavorites = async () => {
    if (!walletAddress) return
    
    try {
      setLoading(true)
      const favorites = await FirebaseFavoritesService.getUserFavorites(walletAddress)
      setUserFavorites(favorites)
      
      // Create a status map for quick lookup
      const statusMap: Record<string, boolean> = {}
      favorites.forEach(fav => {
        statusMap[fav.nft_id] = true
      })
      setFavoriteStatuses(statusMap)
    } catch (error) {
      console.error('Error loading user favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (nft: NFT): Promise<boolean> => {
    if (!isConnected || !walletAddress) {
      throw new Error('Please connect your wallet to add favorites')
    }

    try {
      const newStatus = await FirebaseFavoritesService.toggleFavorite(walletAddress, nft)
      
      // Update local state
      setFavoriteStatuses(prev => ({
        ...prev,
        [nft.id]: newStatus
      }))
      
      // Update user favorites list
      if (newStatus) {
        // Added to favorites
        const newFavorite: UserFavorite = {
          id: `${walletAddress.toLowerCase()}_${nft.id}`,
          user_wallet_address: walletAddress.toLowerCase(),
          nft_id: nft.id,
          nft_name: nft.name,
          nft_artist_name: nft.artist_name || '',
          nft_image_ipfs_hash: nft.image_ipfs_hash,
          nft_category: nft.category,
          nft_created_at: nft.created_at,
          favorited_at: new Date().toISOString()
        }
        setUserFavorites(prev => [newFavorite, ...prev])
      } else {
        // Removed from favorites
        setUserFavorites(prev => prev.filter(fav => fav.nft_id !== nft.id))
      }
      
      return newStatus
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  const isFavorited = useCallback((nftId: string): boolean => {
    return favoriteStatuses[nftId] || false
  }, [favoriteStatuses])

  const getFavoritesCount = useCallback((): number => {
    return userFavorites.length
  }, [userFavorites])

  return {
    userFavorites,
    favoriteStatuses,
    loading,
    toggleFavorite,
    isFavorited,
    getFavoritesCount,
    refreshFavorites: loadUserFavorites,
    isConnected
  }
}