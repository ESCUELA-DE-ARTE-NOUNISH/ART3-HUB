"use client";

import { type ReactNode, useEffect, useState } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

export function Providers(props: { children: ReactNode }) {
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
    
    console.log('🔍 Environment Detection:', {
      isInFarcaster,
      hasWebkit: !!(window as any).webkit,
      hasFarcasterHandler: !!(window as any).webkit?.messageHandlers?.farcaster,
      hasFarcasterGlobal: !!(window as any).farcaster,
      isIframe: window !== window.parent,
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    setIsFarcasterEnvironment(isInFarcaster);
  }, []);

  // Don't render anything on server
  if (!mounted) {
    return <>{props.children}</>;
  }

  // Only wrap with MiniKitProvider if we're actually in Farcaster environment
  if (isFarcasterEnvironment) {
    console.log('✅ Loading MiniKitProvider for Farcaster environment');
    return (
      <MiniKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
            theme: "mini-app-theme",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            logo: process.env.NEXT_PUBLIC_ICON_URL,
          },
        }}
      >
        {props.children}
      </MiniKitProvider>
    );
  }

  // In browser environment, don't use MiniKitProvider
  console.log('✅ Browser environment detected - skipping MiniKitProvider');
  return <>{props.children}</>;
}
