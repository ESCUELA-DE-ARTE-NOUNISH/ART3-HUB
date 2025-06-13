"use client"

import { useState, useEffect } from "react"
import SplashScreen from "./splash-screen"

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    
    // Small delay to ensure proper hydration
    const timer = setTimeout(() => {
      // Check if splash has been shown in this session
      const splashShown = sessionStorage.getItem('splashShown')
      if (splashShown) {
        setShowSplash(false)
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleSplashComplete = () => {
    // Mark splash as shown for this session
    sessionStorage.setItem('splashShown', 'true')
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