"use client"

// Environment detection utilities for ART3-HUB Multi-Platform support
// Supports: Web Browser, Farcaster Web Client, Farcaster Mobile App

export type AppEnvironment = 'browser' | 'farcaster-web' | 'farcaster-mobile'

/**
 * Detect the current application environment
 * Returns the environment type for proper provider and wallet configuration
 */
export function detectEnvironment(): AppEnvironment {
  // Server-side rendering - default to browser
  if (typeof window === 'undefined') {
    return 'browser'
  }

  // PRIORITY 1: Use official Farcaster SDK context (most reliable)
  try {
    // Try to import SDK dynamically to check availability
    const { sdk } = require('@farcaster/miniapp-sdk')
    if (sdk && sdk.context && sdk.context.client && sdk.context.client.name === 'farcaster') {
      console.log('🎯 Official Farcaster SDK context detected')
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth < 768
      return isMobile ? 'farcaster-mobile' : 'farcaster-web'
    }
  } catch (error) {
    // SDK not available or context not ready, continue to other checks
    console.log('🔍 Farcaster SDK not available yet, checking other indicators')
  }

  // PRIORITY 2: Check for Farcaster SDK availability (indicates Farcaster environment)
  const hasFarcasterSDK = !!(window as any).farcaster || !!(window as any).sdk || !!(window as any).minikit
  const hasReadyFunction = typeof (window as any).ready === 'function'
  
  if (hasFarcasterSDK || hasReadyFunction) {
    console.log('🎯 Farcaster environment detected', {
      farcaster: !!(window as any).farcaster,
      sdk: !!(window as any).sdk,
      minikit: !!(window as any).minikit,
      ready: hasReadyFunction
    })
    
    // Check if mobile based on user agent and viewport
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth < 768

    return isMobile ? 'farcaster-mobile' : 'farcaster-web'
  }

  // PRIORITY 3: Check user agent for Farcaster-specific strings
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('farcaster') || userAgent.includes('miniapp') || userAgent.includes('warpcast')) {
      console.log('🎯 Farcaster user agent detected')
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent)
      return isMobile ? 'farcaster-mobile' : 'farcaster-web'
    }
  }

  // PRIORITY 4: Check if running in iframe (strong Farcaster indicator)
  const inFrame = window !== window.parent || window !== window.top
  if (inFrame) {
    const referrer = document.referrer
    const hostname = window.location?.hostname || ''
    
    if (referrer.includes('farcaster') || referrer.includes('warpcast') || 
        hostname.includes('art3hub.xyz') || hostname.includes('codalabs.ngrok.io') || 
        hostname.includes('ngrok.io') || hostname.includes('vercel.app') ||
        hostname === 'localhost') {
      console.log(`🎯 iframe + domain/referrer detected: ${hostname} - Farcaster environment`)
      const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent)
      return isMobile ? 'farcaster-mobile' : 'farcaster-web'
    }
  }

  // PRIORITY 5: Check for your specific deployment domains (dev and prod)
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname || ''
    const href = window.location?.href || ''
    
    // Your development environments (localhost and ngrok)
    if (hostname === 'localhost' || hostname.includes('codalabs.ngrok.io') || hostname.includes('ngrok.io')) {
      console.log(`🔧 Development domain detected: ${hostname} - checking for Farcaster indicators`)
      
      // In dev, be more liberal with Farcaster detection
      if (inFrame || href.includes('miniapp') || href.includes('farcaster')) {
        console.log(`🎯 Dev environment Farcaster context detected`)
        const isMobile = window.innerWidth < 768
        return isMobile ? 'farcaster-mobile' : 'farcaster-web'
      }
    }
    
    // Your production environment
    if (hostname.includes('art3hub.xyz')) {
      console.log(`🚀 Production domain detected: ${hostname}`)
      
      // In production, if in iframe, likely Farcaster
      if (inFrame) {
        console.log(`🎯 Production iframe detected - Farcaster environment`)
        const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent)
        return isMobile ? 'farcaster-mobile' : 'farcaster-web'
      }
    }
  }

  // Default to browser environment
  console.log('🌐 Browser environment detected (default)')
  return 'browser'
}

/**
 * Check if running in any Farcaster environment
 */
export function isFarcasterEnvironment(): boolean {
  const env = detectEnvironment()
  return env === 'farcaster-web' || env === 'farcaster-mobile'
}

/**
 * Check if running in browser environment
 */
export function isBrowserEnvironment(): boolean {
  return detectEnvironment() === 'browser'
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(environment: AppEnvironment) {
  const baseConfig = {
    appName: 'ART3-HUB - NFT Creation Platform',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  }

  switch (environment) {
    case 'browser':
      return {
        ...baseConfig,
        providersNeeded: ['wagmi', 'privy', 'auth'],
        walletSupport: 'full', // All wallet types supported
        features: ['privy-auth', 'manual-network-switch', 'full-ui']
      }
      
    case 'farcaster-web':
      return {
        ...baseConfig,
        providersNeeded: ['wagmi', 'minikit', 'auth'],
        walletSupport: 'farcaster-native', // Farcaster wallet integration
        features: ['farcaster-auth', 'embedded-wallet', 'frame-integration']
      }
      
    case 'farcaster-mobile':
      return {
        ...baseConfig,
        providersNeeded: ['wagmi', 'minikit', 'auth'],
        walletSupport: 'farcaster-native', // Mobile Farcaster wallet
        features: ['mobile-optimized', 'farcaster-auth', 'native-ui']
      }
      
    default:
      return baseConfig
  }
}

/**
 * Environment-specific logging
 */
export function logEnvironmentInfo() {
  const env = detectEnvironment()
  const config = getEnvironmentConfig(env)
  
  console.log('🎯 Environment Detection Results:')
  console.log('📱 Environment:', env)
  console.log('⚙️ Configuration:', config)
  console.log('🔗 User Agent:', navigator?.userAgent || 'N/A')
  console.log('📏 Viewport:', `${window?.innerWidth || 0}x${window?.innerHeight || 0}`)
  console.log('🌐 Domain:', window?.location?.hostname || 'N/A')
  console.log('🪟 Window objects:', {
    farcaster: !!(window as any)?.farcaster,
    minikit: !!(window as any)?.minikit,
    sdk: !!(window as any)?.sdk,
    ethereum: !!(window as any)?.ethereum
  })
  console.log('🖼️ Frame context:', {
    inFrame: window !== window.parent || window !== window.top,
    referrer: document?.referrer || 'N/A'
  })
}