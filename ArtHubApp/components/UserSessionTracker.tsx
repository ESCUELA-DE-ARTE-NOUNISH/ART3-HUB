"use client"

import { useEffect, useState } from 'react'

/**
 * Component that automatically tracks user sessions
 * This should be placed high in the component tree to capture all user activity
 */
export function UserSessionTracker({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('🚀 UserSessionTracker initialized')
  }, [])

  useEffect(() => {
    if (!mounted) return

    const initializeTracking = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { useUserSession } = await import('@/hooks/useUserSession')
        
        // Track page visibility changes to capture when users leave/return
        const handleVisibilityChange = () => {
          console.log(`📊 Page visibility changed: ${document.visibilityState}`)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      } catch (error) {
        console.warn('Error initializing user session tracking:', error)
      }
    }

    initializeTracking()
  }, [mounted])

  return <>{children}</>
}

export default UserSessionTracker