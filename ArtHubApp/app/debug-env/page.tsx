"use client"

import { useEffect, useState } from 'react'
import { getEnvironmentInfo } from '@/lib/utils/environment'
import { useSafeFarcaster } from '@/providers/FarcasterProvider'

export default function DebugEnvironment() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const { context, isFarcasterEnvironment } = useSafeFarcaster()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getEnvironmentInfo()
      setEnvInfo(info)
      console.log('🐛 Debug Environment Info:', info)
    }
  }, [])

  if (!envInfo) return <div>Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Provider Detection</h2>
          <ul className="space-y-1">
            <li>Provider isFarcasterEnvironment: <span className={isFarcasterEnvironment ? 'text-green-600' : 'text-red-600'}>{String(isFarcasterEnvironment)}</span></li>
            <li>Has Context: <span className={context ? 'text-green-600' : 'text-red-600'}>{String(!!context)}</span></li>
          </ul>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Utils Detection</h2>
          <ul className="space-y-1">
            <li>Utils isFarcaster: <span className={envInfo.isFarcaster ? 'text-green-600' : 'text-red-600'}>{String(envInfo.isFarcaster)}</span></li>
            <li>Environment Type: <span className="font-mono">{envInfo.type}</span></li>
          </ul>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Detection Details</h2>
          <ul className="space-y-1">
            <li>Is Iframe: <span className={envInfo.isIframe ? 'text-green-600' : 'text-red-600'}>{String(envInfo.isIframe)}</span></li>
            <li>Has Farcaster SDK: <span className={envInfo.hasFarcasterSDK ? 'text-green-600' : 'text-red-600'}>{String(envInfo.hasFarcasterSDK)}</span></li>
            <li>Has MiniKit: <span className={envInfo.hasMiniKit ? 'text-green-600' : 'text-red-600'}>{String(envInfo.hasMiniKit)}</span></li>
            <li>Is Warpcast: <span className={envInfo.isWarpcast ? 'text-green-600' : 'text-red-600'}>{String(envInfo.isWarpcast)}</span></li>
            <li>Farcaster User Agent: <span className={envInfo.isFarcasterUserAgent ? 'text-green-600' : 'text-red-600'}>{String(envInfo.isFarcasterUserAgent)}</span></li>
            <li>Has Frame Context: <span className={envInfo.hasFrameContext ? 'text-green-600' : 'text-red-600'}>{String(envInfo.hasFrameContext)}</span></li>
          </ul>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Browser Info</h2>
          <ul className="space-y-1">
            <li>URL: <span className="font-mono text-sm break-all">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</span></li>
            <li>URL Params: <span className="font-mono text-sm">{envInfo.urlParams || 'none'}</span></li>
            <li>Referrer: <span className="font-mono text-sm break-all">{typeof document !== 'undefined' ? document.referrer || 'none' : 'N/A'}</span></li>
            <li>User Agent: <span className="font-mono text-xs break-all">{envInfo.userAgent}</span></li>
          </ul>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test URLs</h2>
          <ul className="space-y-2">
            <li>
              <a 
                href="?farcaster=true" 
                className="text-blue-600 underline"
              >
                Force Farcaster Mode (?farcaster=true)
              </a>
            </li>
            <li>
              <a 
                href="?fc_frame=true" 
                className="text-blue-600 underline"
              >
                Force Frame Mode (?fc_frame=true)
              </a>
            </li>
            <li>
              <a 
                href="/debug-env" 
                className="text-blue-600 underline"
              >
                Reset (normal mode)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}