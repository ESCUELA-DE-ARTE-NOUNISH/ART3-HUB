"use client"

/**
 * Privy Debug Utilities for Production Authentication Issues
 * Utilities to help debug and resolve Privy authentication state persistence issues
 */

export interface PrivyStorageState {
  localStorage: Record<string, string | null>
  sessionStorage: Record<string, string | null>
  cookies: string[]
  domain: string
  timestamp: string
}

/**
 * Get current Privy storage state for debugging
 */
export function getPrivyStorageState(): PrivyStorageState {
  if (typeof window === 'undefined') {
    return {
      localStorage: {},
      sessionStorage: {},
      cookies: [],
      domain: 'server',
      timestamp: new Date().toISOString()
    }
  }

  const privyLocalStorageKeys = Object.keys(localStorage).filter(k => k.includes('privy'))
  const privySessionStorageKeys = Object.keys(sessionStorage).filter(k => k.includes('privy'))
  const privyCookies = document.cookie.split(';').filter(c => c.includes('privy'))

  return {
    localStorage: privyLocalStorageKeys.reduce((acc, key) => {
      acc[key] = localStorage.getItem(key)
      return acc
    }, {} as Record<string, string | null>),
    sessionStorage: privySessionStorageKeys.reduce((acc, key) => {
      acc[key] = sessionStorage.getItem(key)
      return acc
    }, {} as Record<string, string | null>),
    cookies: privyCookies,
    domain: window.location.hostname,
    timestamp: new Date().toISOString()
  }
}

/**
 * Clear all Privy-related storage (use with caution)
 * This function can be called from browser console if needed
 */
export function clearPrivyStorage(): PrivyStorageState {
  console.warn('🧹 CLEARING ALL PRIVY STORAGE - This will force logout')
  
  const stateBefore = getPrivyStorageState()
  console.log('🔍 Storage state before clearing:', stateBefore)

  if (typeof window !== 'undefined') {
    // Clear localStorage
    Object.keys(localStorage)
      .filter(k => k.includes('privy'))
      .forEach(key => {
        console.log(`🗑️ Removing localStorage: ${key}`)
        localStorage.removeItem(key)
      })

    // Clear sessionStorage
    Object.keys(sessionStorage)
      .filter(k => k.includes('privy'))
      .forEach(key => {
        console.log(`🗑️ Removing sessionStorage: ${key}`)
        sessionStorage.removeItem(key)
      })

    // Clear cookies (attempt - may be domain/path restricted)
    document.cookie.split(';')
      .filter(c => c.includes('privy'))
      .forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim()
        console.log(`🗑️ Attempting to clear cookie: ${cookieName}`)
        
        // Try multiple domain/path combinations to clear the cookie
        const domains = ['', `.${window.location.hostname}`, window.location.hostname]
        const paths = ['/', '/auth', '/login']
        
        domains.forEach(domain => {
          paths.forEach(path => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`
          })
        })
      })
  }

  const stateAfter = getPrivyStorageState()
  console.log('✅ Storage state after clearing:', stateAfter)
  
  return stateBefore
}

/**
 * Compare storage state between localhost and production
 */
export function logStorageComparison(): void {
  const state = getPrivyStorageState()
  const isLocalhost = state.domain === 'localhost'
  const isProduction = state.domain.includes('art3hub.xyz')
  
  console.log(`🏢 STORAGE ANALYSIS for ${state.domain}:`, {
    environment: isLocalhost ? 'LOCALHOST' : isProduction ? 'PRODUCTION' : 'OTHER',
    domain: state.domain,
    privyKeys: {
      localStorage: Object.keys(state.localStorage).length,
      sessionStorage: Object.keys(state.sessionStorage).length,
      cookies: state.cookies.length
    },
    storageDetails: state
  })
}

/**
 * Make debug functions available in global scope for console access
 * Call this once to enable manual debugging from browser console
 */
export function enableConsoleDebugging(): void {
  if (typeof window !== 'undefined') {
    // Make functions available in console
    (window as any).debugPrivy = {
      getState: getPrivyStorageState,
      clearStorage: clearPrivyStorage,
      logComparison: logStorageComparison,
      help: () => {
        console.log(`
🔧 Privy Debug Functions Available:
- debugPrivy.getState() - Get current Privy storage state
- debugPrivy.clearStorage() - Clear all Privy storage (forces logout)
- debugPrivy.logComparison() - Log detailed storage analysis
- debugPrivy.help() - Show this help message

⚠️  Use clearStorage() with caution - it will force logout!
        `)
      }
    }
    
    console.log('🔧 Privy debug functions enabled. Type debugPrivy.help() for usage.')
  }
}