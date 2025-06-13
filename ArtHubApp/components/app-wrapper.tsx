"use client"

import { useState, useEffect } from "react"
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import SplashScreen from "./splash-screen"

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFarcaster, setIsFarcaster] = useState(false)

  // Use MiniKit context to detect Farcaster environment
  const { context } = useMiniKit()
  const isMiniKit = !!context

  useEffect(() => {
    setIsClient(true)
    
    // Detect if we're in Farcaster environment
    const detectFarcaster = () => {
      try {
        // First check MiniKit context
        if (isMiniKit) {
          console.log('MiniKit context detected')
          return true
        }
        
        // Check for Farcaster user agent
        const userAgent = navigator.userAgent
        const isFarcasterUA = userAgent.includes('farcaster') || userAgent.includes('Farcaster')
        
        // Check for window.parent differences (iframe context)
        const isIframe = window !== window.parent
        
        // Check for Farcaster SDK context
        const hasFarcasterSDK = typeof window !== 'undefined' && 
          (window as any).webkit?.messageHandlers?.farcaster ||
          (window as any).farcaster
        
        return isFarcasterUA || (isIframe && hasFarcasterSDK)
      } catch (error) {
        console.log('Error detecting Farcaster environment:', error)
        return false
      }
    }
    
    const farcasterDetected = detectFarcaster()
    setIsFarcaster(farcasterDetected)
    console.log('Farcaster detected:', farcasterDetected, 'MiniKit:', isMiniKit)
    
    // Small delay to ensure proper hydration
    const timer = setTimeout(() => {
      try {
        // In Farcaster, always show splash (ignore sessionStorage)
        if (farcasterDetected) {
          console.log('Farcaster environment detected, showing splash')
          setShowSplash(true)
        } else {
          // In browser, check sessionStorage
          const splashShown = sessionStorage.getItem('splashShown')
          if (splashShown) {
            setShowSplash(false)
          }
        }
      } catch (error) {
        console.log('Error accessing sessionStorage:', error)
        // If sessionStorage fails, show splash
        setShowSplash(true)
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isMiniKit])

  const handleSplashComplete = () => {
    try {
      // Only set sessionStorage in browser environment, not in Farcaster
      if (!isFarcaster) {
        sessionStorage.setItem('splashShown', 'true')
      }
    } catch (error) {
      console.log('Error setting sessionStorage:', error)
    }
    setShowSplash(false)
  }

  // Don't show splash on server-side rendering or while loading
  if (!isClient || isLoading) {
    return <>{children}</>
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={showSplash ? "hidden" : "block"}>
        {children}
      </div>
    </>
  )
}