"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showGif, setShowGif] = useState(true)
  const [showLogo, setShowLogo] = useState(false)
  const [gifLoaded, setGifLoaded] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [gifError, setGifError] = useState(false)

  // Log environment info for debugging
  useEffect(() => {
    console.log("SplashScreen mounted")
    console.log("User Agent:", navigator.userAgent)
    console.log("Window context:", window !== window.parent ? "iframe" : "top-level")
  }, [])

  useEffect(() => {
    // Set a timer for GIF duration (6 seconds)
    let gifTimer: NodeJS.Timeout
    let fadeTimer: NodeJS.Timeout
    
    if (gifLoaded) {
      console.log("GIF loaded, starting 6-second timer")
      // Start fade out 500ms before the end
      fadeTimer = setTimeout(() => {
        setFadeOut(true)
      }, 5500) // Start fade out at 5.5 seconds
      
      gifTimer = setTimeout(() => {
        console.log("GIF timer completed, moving to logo")
        handleGifEnd()
      }, 6000) // 6 seconds for GIF display
    }

    // Timeout to skip splash if GIF takes too long to load (5 seconds)
    const loadTimeout = setTimeout(() => {
      if (!gifLoaded) {
        console.log("GIF loading timeout, skipping to logo")
        handleGifEnd()
      }
    }, 5000)

    return () => {
      if (gifTimer) clearTimeout(gifTimer)
      if (fadeTimer) clearTimeout(fadeTimer)
      clearTimeout(loadTimeout)
    }
  }, [gifLoaded])

  // Preload the GIF to improve loading performance
  useEffect(() => {
    try {
      const img = new window.Image()
      img.src = "/assets/eanounish.gif"
      console.log("Preloading GIF...")
      
      // Add additional error handling for Farcaster environment
      img.onerror = () => {
        console.log("GIF preload failed, will try direct loading")
      }
      
      img.onload = () => {
        console.log("GIF preload successful")
      }
    } catch (error) {
      console.log("Error during GIF preload:", error)
    }
  }, [])

  const handleGifLoaded = () => {
    setGifLoaded(true)
    console.log("GIF loaded successfully")
  }

  const handleGifEnd = () => {
    setShowGif(false)
    setShowLogo(true)
    setFadeOut(false) // Reset fade out state
    
    // Show logo for 2 seconds then close splash
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  const handleGifError = (error: any) => {
    console.log("GIF loading failed:", error)
    setGifError(true)
    // If GIF fails to load, show logo immediately
    handleGifEnd()
  }

  const handleSkip = () => {
    // Allow users to skip the splash by clicking
    if (showGif) {
      handleGifEnd()
    } else if (showLogo) {
      onComplete()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={handleSkip}
    >
      {showGif && (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
          {/* Loading indicator while GIF loads */}
          {!gifLoaded && !gifError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-white text-sm opacity-70">Loading...</p>
              </div>
            </div>
          )}

          {/* Fallback when GIF fails to load */}
          {gifError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-2xl font-bold">A3</span>
                </div>
                <p className="text-white text-sm opacity-70">Art3 Hub</p>
              </div>
            </div>
          )}

          {/* Skip indicator */}
          {gifLoaded && (
            <div className="absolute top-4 right-4 z-10">
              <p className="text-white text-xs opacity-70 bg-black/20 px-2 py-1 rounded">
                Tap to skip
              </p>
            </div>
          )}
          
          {/* GIF element */}
          <div
            className="relative w-auto h-full max-w-none"
            style={{ 
              aspectRatio: '9/16', // TikTok-style vertical aspect ratio
              maxHeight: '100vh',
              maxWidth: '56.25vh', // Maintain 9:16 aspect ratio
              minHeight: '100vw', // For very wide screens
              minWidth: 'auto'
            }}
          >
            <Image
              src="/assets/eanounish.gif"
              alt="Art3 Hub Animation"
              fill
              className="object-cover"
              priority
              unoptimized // Important for GIFs to maintain animation
              onLoad={handleGifLoaded}
              onError={handleGifError}
            />
          </div>
        </div>
      )}

      {showLogo && (
        <div className="flex items-center justify-center w-full h-full bg-black">
          <div className="relative animate-fade-in">
            <Image
              src="/images/logo.png"
              alt="Art3 Hub Logo"
              width={200}
              height={200}
              className="w-auto h-auto max-w-[60vw] max-h-[60vh] object-contain"
              priority
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}