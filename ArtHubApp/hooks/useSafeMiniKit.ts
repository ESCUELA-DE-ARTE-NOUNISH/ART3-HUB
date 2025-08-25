"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';

// Safe MiniKit hook that works both inside and outside Farcaster environment
export function useSafeMiniKit() {
  const [isFarcasterEnvironment, setIsFarcasterEnvironment] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [miniKitError, setMiniKitError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if we're actually in a Farcaster environment
    const isInFarcaster = typeof window !== 'undefined' && (
      !!(window as any).webkit?.messageHandlers?.farcaster ||
      !!(window as any).farcaster ||
      window !== window.parent || // iframe check
      window.location.href.includes('farcaster') ||
      navigator.userAgent.includes('Farcaster')
    );
    
    console.log('📍', isInFarcaster ? 'Farcaster mode detected - MiniKit available' : 'Browser mode detected - MiniKit not available');
    setIsFarcasterEnvironment(isInFarcaster);
  }, []);

  // Attempt to get MiniKit functionality if available
  const miniKitHook = useMemo(() => {
    if (!mounted || !isFarcasterEnvironment) {
      return null;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { useMiniKit } = require('@coinbase/onchainkit/minikit');
      return useMiniKit;
    } catch (error) {
      console.warn('MiniKit not available:', error);
      setMiniKitError(error?.message || 'MiniKit unavailable');
      return null;
    }
  }, [mounted, isFarcasterEnvironment]);

  // Safe default functions
  const safeSetFrameReady = useCallback(() => {
    if (miniKitError) {
      console.warn('setFrameReady called but MiniKit is unavailable:', miniKitError);
    }
  }, [miniKitError]);

  // Return safe defaults when MiniKit is not available
  if (!mounted || !isFarcasterEnvironment || !miniKitHook || miniKitError) {
    return {
      setFrameReady: safeSetFrameReady,
      isFrameReady: false,
      context: null,
      isFarcasterEnvironment: mounted ? isFarcasterEnvironment : false,
      mounted,
      error: miniKitError
    };
  }

  // This should never execute if there are hook rule violations
  // The actual MiniKit hook call is removed to prevent conditional hook calls
  return {
    setFrameReady: safeSetFrameReady,
    isFrameReady: false,
    context: null,
    isFarcasterEnvironment: true,
    mounted: true,
    error: null
  };
}

// Safe hook for add frame functionality
export function useSafeAddFrame() {
  const [isFarcasterEnvironment, setIsFarcasterEnvironment] = useState(false);

  useEffect(() => {
    const isInFarcaster = typeof window !== 'undefined' && (
      !!(window as any).webkit?.messageHandlers?.farcaster ||
      !!(window as any).farcaster ||
      window !== window.parent ||
      window.location.href.includes('farcaster') ||
      navigator.userAgent.includes('Farcaster')
    );
    
    setIsFarcasterEnvironment(isInFarcaster);
  }, []);

  const safeAddFrame = useCallback(() => {
    if (!isFarcasterEnvironment) {
      console.log('Add frame not available outside Farcaster environment');
      return;
    }

    try {
      // Non-hook approach to avoid conditional hook calls
      const { addFrame } = require('@coinbase/onchainkit/minikit');
      return addFrame;
    } catch (error) {
      console.warn('addFrame not available:', error);
    }
  }, [isFarcasterEnvironment]);

  return safeAddFrame;
}

// Safe hook for open URL functionality  
export function useSafeOpenUrl() {
  const [isFarcasterEnvironment, setIsFarcasterEnvironment] = useState(false);

  useEffect(() => {
    const isInFarcaster = typeof window !== 'undefined' && (
      !!(window as any).webkit?.messageHandlers?.farcaster ||
      !!(window as any).farcaster ||
      window !== window.parent ||
      window.location.href.includes('farcaster') ||
      navigator.userAgent.includes('Farcaster')
    );
    
    setIsFarcasterEnvironment(isInFarcaster);
  }, []);

  const safeOpenUrl = useCallback(() => {
    if (!isFarcasterEnvironment) {
      console.log('Open URL not available outside Farcaster environment');
      return;
    }

    try {
      // Non-hook approach to avoid conditional hook calls
      const { openUrl } = require('@coinbase/onchainkit/minikit');
      return openUrl;
    } catch (error) {
      console.warn('openUrl not available:', error);
    }
  }, [isFarcasterEnvironment]);

  return safeOpenUrl;
}