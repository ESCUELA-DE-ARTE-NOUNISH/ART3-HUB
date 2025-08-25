"use client"

import { useState, useEffect } from "react"
import { useSafeMiniKit } from '@/hooks/useSafeMiniKit'
import { sdk } from "@farcaster/miniapp-sdk"
import SplashScreen from "./splash-screen"
import FarcasterDebug from "./farcaster-debug"

// IMMEDIATE ready() call at module level for Farcaster Mini Apps
if (typeof window !== 'undefined') {
  // Simple check if we might be in Farcaster
  const isFarcasterLike = window.navigator?.userAgent?.includes('farcaster') || window !== window.parent
  
  if (isFarcasterLike) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 FARCASTER DETECTED - CALLING READY IMMEDIATELY')
    }
    setTimeout(async () => {
      try {
        if (sdk?.actions?.ready) {
          await sdk.actions.ready()
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ MODULE LEVEL - sdk.actions.ready() SUCCESS')
          }
        }
      } catch (error) {
        console.error('❌ MODULE LEVEL - Error calling ready():', error)
      }
    }, 1)
  }
}

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFarcaster, setIsFarcaster] = useState(false)
  const [farcasterReady, setFarcasterReady] = useState(false)

  // Check if splash screen is enabled via environment variable
  const splashEnabled = process.env.NEXT_PUBLIC_ENABLE_SPLASH_SCREEN !== 'false'

  // Try to use MiniKit context if available, but handle gracefully if not
  let context, setFrameReady, isFrameReady;
  let isMiniKit = false;
  
  try {
    const miniKitData = useSafeMiniKit();
    context = miniKitData.context;
    setFrameReady = miniKitData.setFrameReady;
    isFrameReady = miniKitData.isFrameReady;
    isMiniKit = !!context;
  } catch (error) {
    // MiniKitProvider not available (browser mode)
    console.log('📍 Browser mode detected - MiniKit not available');
    context = null;
    setFrameReady = () => {};
    isFrameReady = false;
    isMiniKit = false;
  }

  // DEBUG: Log SDK availability immediately (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 SDK Debug Info:', {
      sdkExists: !!sdk,
      actionsExists: !!sdk?.actions,
      readyExists: !!sdk?.actions?.ready,
      readyType: typeof sdk?.actions?.ready,
      isMiniKit,
      context: !!context
    })
  }

  // Function to call both Farcaster SDK ready and MiniKit ready when app is fully loaded
  const callFarcasterReady = async () => {
    // Only call if we're actually in Farcaster Mini App environment
    const isActuallyFarcaster = isMiniKit || (
      typeof window !== 'undefined' && 
      (window.navigator.userAgent.includes('farcaster') || 
       window !== window.parent ||
       !!(window as any).webkit?.messageHandlers?.farcaster)
    )
    
    if (isActuallyFarcaster && !farcasterReady) {
      try {
        console.log('🚀 Calling Farcaster sdk.actions.ready()')
        
        // First, call the Farcaster SDK ready() to hide splash screen
        if (typeof sdk?.actions?.ready === 'function') {
          await sdk.actions.ready()
          console.log('✅ Farcaster sdk.actions.ready() completed')
        } else {
          console.warn('⚠️ Farcaster sdk.actions.ready() not available')
        }
        
        // Then, call MiniKit setFrameReady if available
        if (isMiniKit && !isFrameReady) {
          console.log('🚀 Calling MiniKit setFrameReady()')
          setFrameReady()
          console.log('✅ MiniKit setFrameReady() completed')
        }
        
        setFarcasterReady(true)
      } catch (error) {
        console.error('❌ Error calling Farcaster ready functions:', error)
      }
    }
  }

  useEffect(() => {
    setIsClient(true)
    
    // Detect if we're in Farcaster environment
    const detectFarcaster = () => {
      try {
        // Primary: Check MiniKit context first
        if (isMiniKit) {
          console.log('✅ Farcaster detected via MiniKit context')
          return true
        }
        
        // Secondary: Check for MiniKit-specific window properties (Base documentation method)
        if (typeof window !== 'undefined') {
          if ((window as any).webkit?.messageHandlers?.miniKit || (window as any).ethereum?.__base) {
            console.log('✅ Farcaster detected via MiniKit window properties')
            return true
          }
          
          // Tertiary: Check for Farcaster user agent
          const userAgent = navigator.userAgent
          const isFarcasterUA = userAgent.includes('farcaster') || userAgent.includes('Farcaster')
          
          if (isFarcasterUA) {
            console.log('✅ Farcaster detected via user agent:', userAgent)
            return true
          }
          
          // Quaternary: Check for iframe context (be more conservative)
          const isIframe = window !== window.parent
          if (isIframe) {
            // In iframe, only detect if we have clear Farcaster indicators
            const hasFarcasterSDK = !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster
            
            if (hasFarcasterSDK) {
              console.log('✅ Farcaster detected via iframe + Farcaster SDK handlers')
              return true
            }
            
            // Check if Farcaster SDK is available and functional in iframe context
            if (sdk && typeof sdk.actions?.ready === 'function') {
              console.log('✅ Farcaster detected via functional SDK in iframe context')
              return true
            }
          }
        }
        
        console.log('❌ No Farcaster environment detected')
        return false
      } catch (error) {
        console.log('⚠️ Error detecting Farcaster environment:', error)
        return false
      }
    }
    
    const farcasterDetected = detectFarcaster()
    setIsFarcaster(farcasterDetected)
    console.log('🔍 Environment Detection Result - Farcaster:', farcasterDetected, 'MiniKit:', isMiniKit)
    
    // Small delay to ensure proper hydration
    const timer = setTimeout(async () => {
      try {
        // If splash screen is disabled via env var, never show it
        if (!splashEnabled) {
          console.log('Splash screen disabled via environment variable')
          setShowSplash(false)
          
          // Call Farcaster ready immediately if splash is disabled in Farcaster
          if (farcasterDetected) {
            await callFarcasterReady()
          }
        } else if (farcasterDetected) {
          // In Farcaster, always show splash (ignore sessionStorage)
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
        // If sessionStorage fails, show splash only if enabled
        setShowSplash(splashEnabled)
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isMiniKit, splashEnabled])

  // Effect to call Farcaster ready when app is fully loaded and no splash is shown
  useEffect(() => {
    if (isClient && !isLoading && !showSplash && isFarcaster) {
      callFarcasterReady()
    }
  }, [isClient, isLoading, showSplash, isFarcaster, isMiniKit, isFrameReady, farcasterReady])

  // Backup ready() call - ensures ready is called in component context too
  useEffect(() => {
    const backupReady = async () => {
      try {
        if (sdk?.actions?.ready && typeof sdk.actions.ready === 'function') {
          await sdk.actions.ready()
          setFarcasterReady(true)
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Backup ready() call successful')
          }
        }
      } catch (error) {
        console.error('❌ Backup ready() call failed:', error)
      }
    }
    
    // Small delay to avoid duplicate with module-level call
    setTimeout(backupReady, 50)
  }, []) // Run only once on mount

  // Additional effect specifically for MiniKit setFrameReady
  useEffect(() => {
    if (isMiniKit && !isFrameReady) {
      console.log('🎯 MiniKit detected, calling setFrameReady()')
      try {
        setFrameReady()
        console.log('✅ MiniKit setFrameReady() completed')
      } catch (error) {
        console.error('❌ Error in setFrameReady():', error)
      }
    }
  }, [isMiniKit, isFrameReady, setFrameReady])

  const handleSplashComplete = async () => {
    try {
      // Only set sessionStorage in browser environment, not in Farcaster
      if (!isFarcaster) {
        sessionStorage.setItem('splashShown', 'true')
      }
    } catch (error) {
      console.log('Error setting sessionStorage:', error)
    }
    
    setShowSplash(false)
    
    // Call Farcaster ready after splash completes
    await callFarcasterReady()
  }

  // Don't show splash on server-side rendering or while loading
  if (!isClient || isLoading) {
    return <>{children}</>
  }

  return (
    <>
      {/* Debug component - only show in development AND localhost */}
      {process.env.NODE_ENV === 'development' && 
       typeof window !== 'undefined' && 
       (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
       <FarcasterDebug />}
      
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={showSplash ? "hidden" : "block"}>
        {children}
      </div>
    </>
  )
}