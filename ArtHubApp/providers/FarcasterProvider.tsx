"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context interface
interface FarcasterContextType {
  isFarcasterEnvironment: boolean;
  mounted: boolean;
  setFrameReady: () => void;
  isFrameReady: boolean;
  context: any;
  error: string | null;
}

// Create the context with safe defaults
const FarcasterContext = createContext<FarcasterContextType>({
  isFarcasterEnvironment: false,
  mounted: false,
  setFrameReady: () => {},
  isFrameReady: false,
  context: null,
  error: null,
});

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isFarcasterEnvironment, setIsFarcasterEnvironment] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Environment detection
  useEffect(() => {
    setMounted(true);
    
    const isInFarcaster = typeof window !== 'undefined' && (
      !!(window as any).webkit?.messageHandlers?.farcaster ||
      !!(window as any).farcaster ||
      window !== window.parent || // iframe check
      window.location.href.includes('farcaster') ||
      navigator.userAgent.includes('Farcaster')
    );
    
    console.log('📍 Farcaster Environment Detection:', {
      isInFarcaster,
      hasWebkit: !!(window as any).webkit,
      hasFarcasterHandler: !!(window as any).webkit?.messageHandlers?.farcaster,
      hasFarcasterGlobal: !!(window as any).farcaster,
      isIframe: window !== window.parent
    });
    
    setIsFarcasterEnvironment(isInFarcaster);
  }, []);


  // MiniKit initialization - only in Farcaster environment
  useEffect(() => {
    if (!mounted || !isFarcasterEnvironment) {
      return;
    }

    try {
      // Try to initialize MiniKit functionality
      if (typeof window !== 'undefined' && (window as any).farcaster) {
        setContext((window as any).farcaster);
        console.log('✅ Farcaster context initialized');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown MiniKit error';
      console.warn('⚠️ MiniKit initialization failed:', errorMessage);
      setError(errorMessage);
    }
  }, [mounted, isFarcasterEnvironment]);

  const setFrameReady = () => {
    if (!isFarcasterEnvironment) {
      console.log('🔍 setFrameReady called but not in Farcaster environment');
      return;
    }

    try {
      // Try to set frame ready using native Farcaster API
      if (typeof window !== 'undefined') {
        if ((window as any).webkit?.messageHandlers?.farcaster) {
          (window as any).webkit.messageHandlers.farcaster.postMessage({
            type: 'frame_ready'
          });
          setIsFrameReady(true);
          console.log('✅ Frame ready message sent via webkit');
        } else if ((window as any).parent && window !== window.parent) {
          (window as any).parent.postMessage({ type: 'frame_ready' }, '*');
          setIsFrameReady(true);
          console.log('✅ Frame ready message sent via postMessage');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'setFrameReady failed';
      console.warn('⚠️ setFrameReady error:', errorMessage);
      setError(errorMessage);
    }
  };

  const value: FarcasterContextType = {
    isFarcasterEnvironment,
    mounted,
    setFrameReady,
    isFrameReady,
    context,
    error
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

// Custom hook to use the Farcaster context
export function useFarcaster(): FarcasterContextType {
  const context = useContext(FarcasterContext);
  
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  
  return context;
}

// Safe hook that doesn't throw if used outside provider
export function useSafeFarcaster(): FarcasterContextType {
  const context = useContext(FarcasterContext);
  
  // Return safe defaults if used outside provider
  if (!context) {
    return {
      isFarcasterEnvironment: false,
      mounted: false,
      setFrameReady: () => {},
      isFrameReady: false,
      context: null,
      error: 'useSafeFarcaster called outside FarcasterProvider'
    };
  }
  
  return context;
}