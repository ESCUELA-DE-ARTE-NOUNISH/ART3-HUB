/**
 * Environment detection utilities for dual browser/Farcaster support
 */

export const isFarcasterEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return (
    // Check user agent for Farcaster
    window.navigator?.userAgent?.includes('farcaster') ||
    // Check if we're in an iframe (common for Mini Apps)
    window !== window.parent ||
    // Check for Farcaster SDK context
    !!(window as any).webkit?.messageHandlers?.farcaster ||
    !!(window as any).farcaster
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
  
  return {
    type: isFarcaster ? 'farcaster' : 'browser',
    isFarcaster,
    isBrowser: !isFarcaster,
    userAgent: window.navigator.userAgent,
    isIframe: window !== window.parent,
    hasFarcasterSDK: !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster
  }
}

// Debug logging for environment detection
export const logEnvironmentInfo = () => {
  if (typeof window !== 'undefined') {
    const info = getEnvironmentInfo()
    console.log('🌍 Environment Info:', info)
  }
}