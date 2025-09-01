"use client"

import { PropsWithChildren, useState, useEffect } from "react"
import { detectEnvironment, logEnvironmentInfo, type AppEnvironment } from "@/lib/utils/environment-detection"
import { BrowserProviders } from "./browser-providers"
import { FarcasterWebProviders, FarcasterMobileProviders } from "./farcaster-providers"

/**
 * Multi-Environment Web3 Provider Router
 * 
 * Automatically detects environment and loads appropriate provider stack:
 * - Browser: Privy + Wagmi (existing working setup)  
 * - Farcaster Web: MiniKit + Farcaster SDK + Wagmi
 * - Farcaster Mobile: MiniKit + Farcaster SDK + Wagmi (mobile-optimized)
 */
export function Web3Providers({ children }: PropsWithChildren) {
  const [environment, setEnvironment] = useState<AppEnvironment>('browser')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Client-side environment detection to prevent SSR mismatch
    const env = detectEnvironment()
    setEnvironment(env)
    setIsLoading(false)
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      logEnvironmentInfo()
    }
  }, [])

  // Loading state to prevent hydration mismatch
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Route to appropriate provider stack based on detected environment
  switch (environment) {
    case 'farcaster-web':
      return <FarcasterWebProviders>{children}</FarcasterWebProviders>
    
    case 'farcaster-mobile':
      return <FarcasterMobileProviders>{children}</FarcasterMobileProviders>
    
    case 'browser':
    default:
      return <BrowserProviders>{children}</BrowserProviders>
  }
}