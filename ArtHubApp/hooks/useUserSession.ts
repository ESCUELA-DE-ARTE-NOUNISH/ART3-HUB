import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { FirebaseUserSessionService } from '@/lib/services/firebase-user-session-service'

/**
 * Custom hook to track user authentication sessions with Firebase
 * Automatically captures Privy login data and stores it for analytics
 */
export function useUserSession() {
  const { user, authenticated, ready } = usePrivy()
  const { address } = useAccount()
  const hasTrackedLogin = useRef(false)
  const lastAuthState = useRef(authenticated)

  useEffect(() => {
    // Only process when Privy is ready and we have authentication state change
    if (!ready) return

    const handleAuthStateChange = async () => {
      // User just logged in
      if (authenticated && !lastAuthState.current && user && address && !hasTrackedLogin.current) {
        try {
          console.log('🔐 Tracking user login session...', { 
            userId: user.id, 
            walletAddress: address 
          })

          await FirebaseUserSessionService.trackUserLogin(user, address)
          hasTrackedLogin.current = true
          
          console.log('✅ User session tracked successfully')
        } catch (error) {
          console.error('❌ Error tracking user login:', error)
        }
      }

      // User just logged out
      if (!authenticated && lastAuthState.current && address) {
        try {
          console.log('👋 Tracking user logout...', { walletAddress: address })
          
          await FirebaseUserSessionService.trackUserLogout(address)
          hasTrackedLogin.current = false
          
          console.log('✅ User logout tracked successfully')
        } catch (error) {
          console.error('❌ Error tracking user logout:', error)
        }
      }

      lastAuthState.current = authenticated
    }

    handleAuthStateChange()
  }, [authenticated, ready, user, address])

  // Reset tracking flag when user changes
  useEffect(() => {
    if (!authenticated) {
      hasTrackedLogin.current = false
    }
  }, [authenticated])

  return {
    user,
    authenticated,
    ready,
    address,
    // Helper function to manually track analytics events
    trackEvent: async (eventType: 'profile_update' | 'nft_created' | 'collection_created' | 'subscription_purchased' | 'ai_interaction', eventData: Record<string, any> = {}) => {
      if (address) {
        await FirebaseUserSessionService.logAnalyticsEvent(address, eventType, eventData)
      }
    },
    // Helper functions for specific tracking
    trackNFTCreation: async (nftData: {
      contract_address: string
      token_id?: number
      collection_name?: string
      transaction_hash?: string
    }) => {
      if (address) {
        await FirebaseUserSessionService.trackNFTCreation(address, nftData)
      }
    },
    trackCollectionCreation: async (collectionData: {
      contract_address: string
      collection_name: string
      transaction_hash?: string
    }) => {
      if (address) {
        await FirebaseUserSessionService.trackCollectionCreation(address, collectionData)
      }
    },
    trackSubscriptionPurchase: async (subscriptionData: {
      plan_type: string
      amount_paid: string
      currency: string
      transaction_hash?: string
    }) => {
      if (address) {
        await FirebaseUserSessionService.trackSubscriptionPurchase(address, subscriptionData)
      }
    },
    trackAIInteraction: async (interactionData: {
      message_count: number
      session_duration?: number
      topics_discussed?: string[]
      outcome?: string
    }) => {
      if (address) {
        await FirebaseUserSessionService.trackAIInteraction(address, interactionData)
      }
    }
  }
}