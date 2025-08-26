import { useEffect, useRef, useState } from 'react'
import { FirebaseUserSessionService } from '@/lib/services/firebase-user-session-service'

/**
 * Custom hook to track user authentication sessions with Firebase
 * Automatically captures Privy login data and stores it for analytics
 */
export function useUserSession() {
  // Use fallback values for SSR
  const [sessionState, setSessionState] = useState({
    user: null,
    authenticated: false,
    ready: false,
    address: ''
  })
  
  const hasTrackedLogin = useRef(false)
  const lastAuthState = useRef(false)

  // Initialize session tracking only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeSession = async () => {
      try {
        // Set ready state initially
        setSessionState(prev => ({ ...prev, ready: true }))
      } catch (error) {
        console.error('Error initializing user session:', error)
        setSessionState(prev => ({ ...prev, ready: true }))
      }
    }

    initializeSession()
  }, [])

  return {
    user: sessionState.user,
    authenticated: sessionState.authenticated,
    ready: sessionState.ready,
    address: sessionState.address,
    // Helper function to manually track analytics events
    trackEvent: async (eventType: 'profile_update' | 'nft_created' | 'collection_created' | 'subscription_purchased' | 'ai_interaction', eventData: Record<string, any> = {}) => {
      const { address } = sessionState
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
      const { address } = sessionState
      if (address) {
        await FirebaseUserSessionService.trackNFTCreation(address, nftData)
      }
    },
    trackCollectionCreation: async (collectionData: {
      contract_address: string
      collection_name: string
      transaction_hash?: string
    }) => {
      const { address } = sessionState
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
      const { address } = sessionState
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
      const { address } = sessionState
      if (address) {
        await FirebaseUserSessionService.trackAIInteraction(address, interactionData)
      }
    }
  }
}