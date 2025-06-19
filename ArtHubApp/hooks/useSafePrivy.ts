"use client"

import { usePrivy as usePrivyOriginal, useWallets as useWalletsOriginal } from '@privy-io/react-auth'
import { useMiniKit } from '@coinbase/onchainkit/minikit'

// Safe Privy hook that handles MiniKit mode gracefully
export function useSafePrivy() {
  try {
    const { context } = useMiniKit()
    const isMiniKit = !!context
    
    // In MiniKit mode, return fallback values
    if (isMiniKit) {
      return {
        authenticated: false,
        login: () => {},
        logout: () => {},
        user: null,
        ready: true,
      }
    }
    
    // Use real Privy in browser mode
    return usePrivyOriginal()
  } catch (error) {
    console.warn('Privy hook error, returning fallback:', error)
    return {
      authenticated: false,
      login: () => {},
      logout: () => {},
      user: null,
      ready: true,
    }
  }
}

// Safe Wallets hook that handles MiniKit mode gracefully
export function useSafeWallets() {
  try {
    const { context } = useMiniKit()
    const isMiniKit = !!context
    
    // In MiniKit mode, return empty wallets array
    if (isMiniKit) {
      return {
        wallets: [],
        ready: true,
      }
    }
    
    // Use real Privy wallets in browser mode
    return useWalletsOriginal()
  } catch (error) {
    console.warn('Privy wallets hook error, returning fallback:', error)
    return {
      wallets: [],
      ready: true,
    }
  }
}