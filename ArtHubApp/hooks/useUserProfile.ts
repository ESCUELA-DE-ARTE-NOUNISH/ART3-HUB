"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSafePrivy, useSafeWallets } from '@/hooks/useSafePrivy'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { ApiService } from '@/lib/services/api-service'
import type { UserProfile } from '@/lib/firebase'

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get wallet connection state from different sources
  const { isConnected, address } = useAccount()
  const { context } = useMiniKit()
  const isMiniKit = !!context

  // Safe Privy hooks that handle MiniKit mode
  const { authenticated } = useSafePrivy()
  const { wallets } = useSafeWallets()

  // Determine the current wallet address based on environment
  const getCurrentWalletAddress = (): string | null => {
    const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID

    if (isMiniKit) {
      // In MiniKit, use wagmi's address
      return address || null
    } else if (hasPrivy && authenticated && wallets.length > 0) {
      // In browser with Privy, use Privy's wallet
      return wallets[0]?.address || null
    } else if (isConnected && address) {
      // Fallback to wagmi
      return address
    }

    return null
  }

  const currentWalletAddress = getCurrentWalletAddress()

  // Load user profile when wallet connects
  useEffect(() => {
    if (!currentWalletAddress) {
      setUserProfile(null)
      return
    }

    const loadUserProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        // First, try to get existing profile
        let profile = await ApiService.getUserProfile(currentWalletAddress)

        // If no profile exists, create one
        if (!profile) {
          profile = await ApiService.upsertUserProfile(currentWalletAddress)
        }

        setUserProfile(profile)
      } catch (err) {
        console.error('Error loading user profile:', err)
        setError('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [currentWalletAddress, isMiniKit, isConnected, authenticated, wallets.length])

  // Function to update profile completion
  const updateProfileCompletion = async (isComplete: boolean): Promise<boolean> => {
    if (!currentWalletAddress) return false

    setLoading(true)
    try {
      const success = await ApiService.updateProfileCompletion(currentWalletAddress, isComplete)
      
      if (success && userProfile) {
        setUserProfile({
          ...userProfile,
          profile_complete: isComplete,
          updated_at: new Date().toISOString()
        })
      }

      return success
    } catch (err) {
      console.error('Error updating profile completion:', err)
      setError('Failed to update profile')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (!currentWalletAddress) return

    setLoading(true)
    try {
      const profile = await ApiService.getUserProfile(currentWalletAddress)
      setUserProfile(profile)
    } catch (err) {
      console.error('Error refreshing profile:', err)
      setError('Failed to refresh profile')
    } finally {
      setLoading(false)
    }
  }

  return {
    userProfile,
    loading,
    error,
    isConnected: !!currentWalletAddress,
    walletAddress: currentWalletAddress,
    isProfileComplete: userProfile?.profile_complete || false,
    updateProfileCompletion,
    refreshProfile,
  }
}