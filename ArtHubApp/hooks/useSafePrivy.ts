"use client"

import { usePrivy as usePrivyOriginal, useWallets as useWalletsOriginal } from '@privy-io/react-auth'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
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
  // Always call hooks in the same order, regardless of conditions
  let miniKitResult = null
  try {
    miniKitResult = useMiniKit()
  } catch {
    // MiniKit hook failed, continue
  }
  
  let privyResult = null
  try {
    privyResult = usePrivyOriginal()
  } catch {
    // Privy hook failed, will use fallback
  }
  
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return {
      authenticated: false,
      login: () => {},
      logout: () => {},
      user: null,
      ready: false,
    }
  }

  // Detect Farcaster environment using non-hook detection first
  const isInFarcaster = detectFarcasterEnvironment() || !!(miniKitResult?.context)
  
  // In Farcaster/MiniKit mode, return fallback values
  if (isInFarcaster) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 useSafePrivy: Using Farcaster fallback values')
    }
    return {
      authenticated: false,
      login: () => console.log('Login not available in Farcaster mode'),
      logout: () => console.log('Logout not available in Farcaster mode'),
      user: null,
      ready: true,
    }
  }
  
  // Only use Privy result in browser mode
  if (privyResult) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 useSafePrivy: Using real Privy hooks in browser mode')
    }
    return privyResult
  }
  
  // Final fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ useSafePrivy: Using final fallback values')
  }
  return {
    authenticated: false,
    login: () => {},
    logout: () => {},
    user: null,
    ready: true,
  }
}

// Safe Wallets hook that handles Farcaster/MiniKit mode gracefully
export function useSafeWallets() {
  // Always call hooks in the same order, regardless of conditions
  let miniKitResult = null
  try {
    miniKitResult = useMiniKit()
  } catch {
    // MiniKit hook failed, continue
  }
  
  let walletsResult = null
  try {
    walletsResult = useWalletsOriginal()
  } catch {
    // Wallets hook failed, will use fallback
  }
  
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return {
      wallets: [],
      ready: false,
    }
  }

  // Detect Farcaster environment using non-hook detection first
  const isInFarcaster = detectFarcasterEnvironment() || !!(miniKitResult?.context)
  
  // In Farcaster/MiniKit mode, return empty wallets array
  if (isInFarcaster) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 useSafeWallets: Using Farcaster fallback - empty wallets array')
    }
    return {
      wallets: [],
      ready: true,
    }
  }
  
  // Only use wallets result in browser mode
  if (walletsResult) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 useSafeWallets: Using real Privy wallets in browser mode')
    }
    return walletsResult
  }
  
  // Final fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ useSafeWallets: Using final fallback - empty wallets array')
  }
  return {
    wallets: [],
    ready: true,
  }
}