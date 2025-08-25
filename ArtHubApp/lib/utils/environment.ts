/**
 * Environment detection utilities for dual browser/Farcaster support
 */

export const isFarcasterEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator?.userAgent || ''
  
  return (
    // Check user agent for Farcaster (case insensitive)
    userAgent.toLowerCase().includes('farcaster') ||
    // Check for Warpcast mobile app
    userAgent.toLowerCase().includes('warpcast') ||
    // Check if we're in an iframe (common for Mini Apps)
    window !== window.parent ||
    // Check for Farcaster SDK context (iOS)
    !!(window as any).webkit?.messageHandlers?.farcaster ||
    // Check for Farcaster global object
    !!(window as any).farcaster ||
    // Check for MiniKit SDK
    !!(window as any).MiniKit ||
    // Check for Farcaster frame context
    !!(window as any).__FARCASTER_FRAME__ ||
    // Check URL parameters that indicate Farcaster context
    window.location.search.includes('farcaster=true') ||
    window.location.search.includes('fc_frame=true')
  )
}

export const isBrowserEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !isFarcasterEnvironment()
}

export const getEnvironmentInfo = () => {
  if (typeof window === 'undefined') {
    return {
      type: 'server',
      isFarcaster: false,
      isBrowser: false,
      userAgent: 'unknown'
    }
  }

  const isFarcaster = isFarcasterEnvironment()
  const userAgent = window.navigator.userAgent || ''
  
  return {
    type: isFarcaster ? 'farcaster' : 'browser',
    isFarcaster,
    isBrowser: !isFarcaster,
    userAgent,
    isIframe: window !== window.parent,
    hasFarcasterSDK: !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster,
    hasMiniKit: !!(window as any).MiniKit,
    isWarpcast: userAgent.toLowerCase().includes('warpcast'),
    isFarcasterUserAgent: userAgent.toLowerCase().includes('farcaster'),
    hasFrameContext: !!(window as any).__FARCASTER_FRAME__,
    urlParams: window.location.search
  }
}

// Debug logging for environment detection
export const logEnvironmentInfo = () => {
  if (typeof window !== 'undefined') {
    const info = getEnvironmentInfo()
    console.log('🌍 Environment Info:', info)
  }
}