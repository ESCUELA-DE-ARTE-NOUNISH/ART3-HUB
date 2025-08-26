"use client"

import { useState, useEffect } from 'react'
import { sdk } from "@farcaster/miniapp-sdk"

// Non-hook environment detection function (no React hooks called)
function detectFarcasterEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Primary: Check for MiniKit-specific window properties (Base documentation method)
    if ((window as any).webkit?.messageHandlers?.miniKit || (window as any).ethereum?.__base) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 useSafePrivy: Farcaster detected via MiniKit window properties')
      }
      return true
    }
    
    // Secondary: Check for Farcaster user agent patterns
    const userAgent = navigator.userAgent
    const isFarcasterUA = userAgent.includes('farcaster') || userAgent.includes('Farcaster')
    
    if (isFarcasterUA) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 useSafePrivy: Farcaster detected via user agent')
      }
      return true
    }
    
    // Tertiary: Check for iframe context (less reliable but still useful)
    const isIframe = window !== window.parent
    if (isIframe) {
      // In iframe, be more conservative - only detect if we have clear Farcaster indicators
      const hasFarcasterSDK = !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster
      
      if (hasFarcasterSDK) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 useSafePrivy: Farcaster detected via iframe + Farcaster SDK handlers')
        }
        return true
      }
    }
    
    // Quaternary: Check if Farcaster SDK is available and functional (most permissive check)
    if (sdk && typeof sdk.actions?.ready === 'function' && isIframe) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 useSafePrivy: Farcaster detected via functional SDK in iframe context')
      }
      return true
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 useSafePrivy: No Farcaster environment detected - using browser mode')
    }
    return false
  } catch (error) {
    console.log('⚠️ useSafePrivy: Error in environment detection, defaulting to browser mode:', error)
    return false
  }
}

// Safe Privy hook that handles Farcaster/MiniKit mode gracefully
export function useSafePrivy() {
  const [privyState, setPrivyState] = useState({
    authenticated: false,
    login: () => {},
    logout: () => {},
    user: null,
    ready: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializePrivy = async () => {
      try {
        // Detect Farcaster environment
        const isInFarcaster = detectFarcasterEnvironment()
        
        if (isInFarcaster) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 useSafePrivy: Using Farcaster fallback values')
          }
          setPrivyState({
            authenticated: false,
            login: () => console.log('Login not available in Farcaster mode'),
            logout: () => console.log('Logout not available in Farcaster mode'),
            user: null,
            ready: true,
          })
          return
        }

        // Try to load Privy dynamically
        try {
          const { usePrivy } = await import('@privy-io/react-auth')
          // Since we can't use hooks dynamically, we'll use fallback values
          // The actual Privy integration should be handled in the provider level
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ useSafePrivy: Privy not available, using fallback')
          }
        }

        setPrivyState({
          authenticated: false,
          login: () => {},
          logout: () => {},
          user: null,
          ready: true,
        })
      } catch (error) {
        console.error('Error initializing Safe Privy:', error)
        setPrivyState({
          authenticated: false,
          login: () => {},
          logout: () => {},
          user: null,
          ready: true,
        })
      }
    }

    initializePrivy()
  }, [])

  return privyState
}

// Safe Wallets hook that handles Farcaster/MiniKit mode gracefully
export function useSafeWallets() {
  const [walletsState, setWalletsState] = useState({
    wallets: [],
    ready: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeWallets = async () => {
      try {
        // Detect Farcaster environment
        const isInFarcaster = detectFarcasterEnvironment()
        
        if (isInFarcaster) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 useSafeWallets: Using Farcaster fallback - empty wallets array')
          }
          setWalletsState({
            wallets: [],
            ready: true,
          })
          return
        }

        // Try to load Privy wallets dynamically
        try {
          const { useWallets } = await import('@privy-io/react-auth')
          // Since we can't use hooks dynamically, we'll use fallback values
          // The actual Privy integration should be handled in the provider level
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ useSafeWallets: Privy wallets not available, using fallback')
          }
        }

        setWalletsState({
          wallets: [],
          ready: true,
        })
      } catch (error) {
        console.error('Error initializing Safe Wallets:', error)
        setWalletsState({
          wallets: [],
          ready: true,
        })
      }
    }

    initializeWallets()
  }, [])

  return walletsState
}