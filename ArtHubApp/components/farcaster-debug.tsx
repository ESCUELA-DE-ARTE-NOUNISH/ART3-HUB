"use client"

import { useState, useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { useMiniKit } from '@coinbase/onchainkit/minikit'

export default function FarcasterDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [readyCallStatus, setReadyCallStatus] = useState<string>('Not called')
  const { context, setFrameReady, isFrameReady } = useMiniKit()

  useEffect(() => {
    const info = {
      // Environment checks
      userAgent: typeof window !== 'undefined' ? navigator?.userAgent : 'N/A',
      isIframe: typeof window !== 'undefined' ? window !== window.parent : false,
      hasWebkit: typeof window !== 'undefined' ? !!(window as any).webkit : false,
      hasFarcasterHandler: typeof window !== 'undefined' ? !!(window as any).webkit?.messageHandlers?.farcaster : false,
      hasFarcasterGlobal: typeof window !== 'undefined' ? !!(window as any).farcaster : false,
      
      // MiniKit status
      isMiniKit: !!context,
      contextExists: !!context,
      isFrameReady,
      
      // SDK status
      sdkExists: !!sdk,
      actionsExists: !!sdk?.actions,
      readyExists: !!sdk?.actions?.ready,
      readyType: typeof sdk?.actions?.ready,
      sdkKeys: sdk ? Object.keys(sdk) : [],
      actionsKeys: sdk?.actions ? Object.keys(sdk.actions) : []
    }
    
    setDebugInfo(info)
  }, [context, isFrameReady])

  const callReady = async () => {
    try {
      setReadyCallStatus('Calling...')
      console.log('🔄 Manual ready() call starting')
      
      if (sdk?.actions?.ready && typeof sdk.actions.ready === 'function') {
        const result = await sdk.actions.ready()
        console.log('✅ Manual ready() call success:', result)
        setReadyCallStatus('Success!')
      } else {
        console.error('❌ SDK ready function not available')
        setReadyCallStatus('SDK ready function not available')
      }
    } catch (error) {
      console.error('❌ Manual ready() call failed:', error)
      setReadyCallStatus(`Error: ${error.message}`)
    }
  }

  const callMiniKitReady = () => {
    try {
      console.log('🔄 Manual MiniKit setFrameReady() call')
      setFrameReady()
      console.log('✅ Manual MiniKit setFrameReady() success')
    } catch (error) {
      console.error('❌ Manual MiniKit setFrameReady() failed:', error)
    }
  }

  if (typeof window === 'undefined') return null

  return (
    <div className="fixed top-0 left-0 w-full bg-black text-white p-4 text-xs z-50 overflow-auto max-h-64">
      <h3 className="font-bold mb-2">🔍 Farcaster Debug Info</h3>
      
      <div className="mb-2">
        <strong>Ready Call Status:</strong> {readyCallStatus}
        <button 
          onClick={callReady} 
          className="ml-2 bg-blue-600 px-2 py-1 rounded text-xs"
        >
          Call sdk.actions.ready()
        </button>
        <button 
          onClick={callMiniKitReady} 
          className="ml-2 bg-green-600 px-2 py-1 rounded text-xs"
        >
          Call setFrameReady()
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(debugInfo).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong> {String(value)}
          </div>
        ))}
      </div>
    </div>
  )
}