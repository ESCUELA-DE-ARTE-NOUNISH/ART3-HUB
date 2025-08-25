"use client";

import { useState, useEffect } from 'react';

// Safe MiniKit hook that works both inside and outside Farcaster environment
export function useSafeMiniKit() {
  const [isFarcasterEnvironment, setIsFarcasterEnvironment] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Return safe defaults when not in Farcaster environment
  if (!mounted || !isFarcasterEnvironment) {
    return {
      setFrameReady: () => {},
      isFrameReady: false,
      context: null,
      isFarcasterEnvironment: false,
      mounted
    };
  }

  // Only import and use actual MiniKit when in Farcaster environment
  try {
    // Dynamic import to avoid SSR issues
    const { useMiniKit } = require('@coinbase/onchainkit/minikit');
    const miniKitResult = useMiniKit();
    
    return {
      ...miniKitResult,
      isFarcasterEnvironment: true,
      mounted: true
    };
  } catch (error) {
    console.warn('MiniKit not available:', error);
    return {
      setFrameReady: () => {},
      isFrameReady: false,
      context: null,
      isFarcasterEnvironment: false,
      mounted: true
    };
  }
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

  if (!isFarcasterEnvironment) {
    return () => {
      console.log('Add frame not available outside Farcaster environment');
    };
  }

  try {
    const { useAddFrame } = require('@coinbase/onchainkit/minikit');
    return useAddFrame();
  } catch (error) {
    return () => {
      console.warn('useAddFrame not available:', error);
    };
  }
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

  if (!isFarcasterEnvironment) {
    return () => {
      console.log('Open URL not available outside Farcaster environment');
    };
  }

  try {
    const { useOpenUrl } = require('@coinbase/onchainkit/minikit');
    return useOpenUrl();
  } catch (error) {
    return () => {
      console.warn('useOpenUrl not available:', error);
    };
  }
}