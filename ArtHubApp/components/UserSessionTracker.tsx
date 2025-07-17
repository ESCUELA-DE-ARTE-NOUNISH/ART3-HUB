"use client"

import { useUserSession } from '@/hooks/useUserSession'
import { useEffect } from 'react'

/**
 * Component that automatically tracks user sessions
 * This should be placed high in the component tree to capture all user activity
 */
export function UserSessionTracker({ children }: { children: React.ReactNode }) {
  const { user, authenticated, address } = useUserSession()

  useEffect(() => {
    // Track page visibility changes to capture when users leave/return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && authenticated && address) {
        // User is leaving the page - could track this as a session pause
        console.log('📊 Page hidden - user may be leaving')
      } else if (document.visibilityState === 'visible' && authenticated && address) {
        // User returned to the page
        console.log('📊 Page visible - user returned')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authenticated, address])

  // Track when component mounts (app startup)
  useEffect(() => {
    console.log('🚀 UserSessionTracker initialized')
  }, [])

  return <>{children}</>
}

export default UserSessionTracker