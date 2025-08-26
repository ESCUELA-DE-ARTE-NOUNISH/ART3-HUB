"use client"

import { useState, useEffect } from 'react'
import { sdk } from "@farcaster/miniapp-sdk"
import { usePrivy, useWallets } from '@privy-io/react-auth'

// Extend window interface for debug flags
declare global {
  interface Window {
    __privyEnvLogged?: boolean
    __privyProviderLogged?: boolean
  }
}

// Non-hook environment detection function (no React hooks called)
function detectFarcasterEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Check for specific Farcaster indicators only - don't use iframe as a general indicator
    const hasFarcasterHandlers = !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster
    const isFarcasterUserAgent = navigator.userAgent.includes('Farcaster')
    const isFarcasterUrl = window.location.href.includes('farcaster')
    const hasMiniKitHandlers = !!(window as any).webkit?.messageHandlers?.miniKit || !!(window as any).ethereum?.__base
    
    const isInFarcaster = hasFarcasterHandlers || isFarcasterUserAgent || isFarcasterUrl || hasMiniKitHandlers
    
    // Only log once on initial detection for debugging
    if (process.env.NODE_ENV === 'development' && !window.__privyEnvLogged) {
      console.log('🎯 useSafePrivy: Environment detected:', { isInFarcaster })
      window.__privyEnvLogged = true
    }
    
    return isInFarcaster
  } catch (error) {
    console.log('⚠️ useSafePrivy: Error in environment detection, defaulting to browser mode:', error)
    return false
  }
}

// Safe Privy hook that handles Farcaster/MiniKit mode gracefully
export function useSafePrivy() {
  const [isInFarcaster, setIsInFarcaster] = useState(() => {
    if (typeof window === 'undefined') return false
    return detectFarcasterEnvironment()
  })

  // Always call Privy hooks (React rules requirement)
  let privyResult
  try {
    privyResult = usePrivy()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ useSafePrivy: Privy hook failed, likely in fallback provider context')
    }
    privyResult = null
  }

  // Update Farcaster detection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const detected = detectFarcasterEnvironment()
    setIsInFarcaster(detected)
  }, [])

  // In Farcaster environment, return fallback values
  if (isInFarcaster) {
    return {
      authenticated: false,
      login: () => console.log('Login not available in Farcaster mode'),
      logout: () => console.log('Logout not available in Farcaster mode'),
      user: null,
      ready: true,
    }
  }

  // In browser environment, use real Privy if available
  if (privyResult && process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return privyResult
  }

  // Fallback for cases where Privy is not available
  return {
    authenticated: false,
    login: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Privy not available - login disabled')
      }
    },
    logout: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Privy not available - logout disabled')
      }
    },
    user: null,
    ready: true,
  }
}

// Safe Wallets hook that handles Farcaster/MiniKit mode gracefully
export function useSafeWallets() {
  const [isInFarcaster, setIsInFarcaster] = useState(() => {
    if (typeof window === 'undefined') return false
    return detectFarcasterEnvironment()
  })

  // Always call Wallets hooks (React rules requirement)
  let walletsResult
  try {
    walletsResult = useWallets()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ useSafeWallets: Wallets hook failed, likely in fallback provider context')
    }
    walletsResult = null
  }

  // Update Farcaster detection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const detected = detectFarcasterEnvironment()
    setIsInFarcaster(detected)
  }, [])

  // In Farcaster environment, return fallback values
  if (isInFarcaster) {
    return {
      wallets: [],
      ready: true,
    }
  }

  // In browser environment, use real Wallets if available
  if (walletsResult && process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return {
      wallets: walletsResult,
      ready: true,
    }
  }

  // Fallback for cases where Privy is not available
  return {
    wallets: [],
    ready: true,
  }
}