"use client"

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { SUPPORTED_NETWORKS, getActiveNetwork, type NetworkConfig } from '@/lib/networks'
import { useSwitchChain, useChainId, useAccount, useConfig } from 'wagmi'
import { useToast } from '@/hooks/use-toast'

interface NetworkSelectorProps {
  selectedNetwork: string
  onNetworkChange: (network: string) => void
  locale?: string
}

export function NetworkSelector({ selectedNetwork, onNetworkChange, locale = 'en' }: NetworkSelectorProps) {
  const { isPending } = useSwitchChain()
  const currentChainId = useChainId()
  const { isConnected } = useAccount()
  const config = useConfig()
  const { toast } = useToast()
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [manualChainId, setManualChainId] = useState<number | undefined>(currentChainId)
  
  // Use manual chain ID if available, otherwise use wagmi chain ID
  const effectiveChainId = manualChainId || currentChainId
  
  console.log('NetworkSelector render:', {
    currentChainId,
    manualChainId,
    effectiveChainId,
    isConnected,
    selectedNetwork,
    isTestingMode,
    isPending,
    refreshTrigger,
    configuredChains: config.chains.map(c => ({ id: c.id, name: c.name }))
  })

  // Force refresh when chain changes - but don't auto-update selected network
  useEffect(() => {
    console.log('Chain ID changed to:', currentChainId)
    setRefreshTrigger(prev => prev + 1)
    // Note: No longer auto-updating selected network - user controls this now
  }, [currentChainId, effectiveChainId])

  // Listen to MetaMask chain changes directly
  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum) return

    const handleChainChanged = (chainId: string) => {
      console.log('MetaMask chain changed to:', chainId, 'decimal:', parseInt(chainId, 16))
      const newChainId = parseInt(chainId, 16)
      
      // Update manual chain ID to force UI updates
      setManualChainId(newChainId)
      
      // Force refresh the component
      setRefreshTrigger(prev => prev + 1)
      
      // Update selected network based on new chain
      const matchingNetwork = SUPPORTED_NETWORKS.find(n => {
        const activeNet = getActiveNetwork(n.name, isTestingMode)
        return activeNet.id === newChainId
      })
      
      if (matchingNetwork) {
        console.log('MetaMask changed to network:', matchingNetwork.name)
        onNetworkChange(matchingNetwork.name)
      } else {
        console.log('No matching network found for chainId:', newChainId)
      }
    }

    ethereum.on('chainChanged', handleChainChanged)

    return () => {
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [isTestingMode, onNetworkChange])

  // Translations
  const translations = {
    en: {
      selectNetwork: 'Select Network',
      switchingNetwork: 'Switching...',
      networkSwitched: 'Network switched successfully',
      switchFailed: 'Failed to switch network'
    },
    es: {
      selectNetwork: 'Seleccionar Red',
      switchingNetwork: 'Cambiando...',
      networkSwitched: 'Red cambiada exitosamente', 
      switchFailed: 'Error al cambiar red'
    },
    pt: {
      selectNetwork: 'Selecionar Rede',
      switchingNetwork: 'Trocando...',
      networkSwitched: 'Rede trocada com sucesso',
      switchFailed: 'Falha ao trocar rede'
    },
    fr: {
      selectNetwork: 'Sélectionner le Réseau',
      switchingNetwork: 'Changement...',
      networkSwitched: 'Réseau changé avec succès',
      switchFailed: 'Échec du changement de réseau'
    }
  }

  const t = translations[locale as keyof typeof translations] || translations.en


  const handleNetworkSelect = (network: NetworkConfig) => {
    const activeNetwork = getActiveNetwork(network.name, isTestingMode)
    
    console.log('Network selected in UI:', {
      networkName: network.name,
      targetChainId: activeNetwork.id,
      displayName: activeNetwork.displayName,
      isTestingMode
    })
    
    // Simply update the selected network preference - no automatic switching
    onNetworkChange(network.name)
    
    // Show helpful information about the selected network
    if (isConnected) {
      toast({
        title: `${activeNetwork.displayName} Selected`,
        description: `Switch to ${activeNetwork.displayName} in your wallet before minting. Chain ID: ${activeNetwork.id}`,
        variant: "default",
      })
      
      // For Zora networks, provide additional helpful info
      if (activeNetwork.id === 999999999) {
        setTimeout(() => {
          toast({
            title: 'Zora Sepolia Network Details',
            description: `RPC: https://sepolia.rpc.zora.energy | Block Explorer: https://sepolia.explorer.zora.energy`,
            variant: "default",
          })
        }, 2000)
      } else if (activeNetwork.id === 7777777) {
        setTimeout(() => {
          toast({
            title: 'Zora Network Details',
            description: `RPC: https://rpc.zora.energy | Block Explorer: https://explorer.zora.energy`,
            variant: "default",
          })
        }, 2000)
      }
    } else {
      toast({
        title: `${activeNetwork.displayName} Selected`,
        description: 'Connect your wallet and switch to this network to mint NFTs.',
        variant: "default",
      })
    }
    
    // Update UI refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3">{t.selectNetwork}</label>
      
      {/* Current active network display */}
      {effectiveChainId && (
        <div 
          className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-sm" 
          key={`active-${effectiveChainId}-${refreshTrigger}`}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Currently Active</p>
              <p className="text-lg font-bold text-gray-800">
                {(() => {
                  console.log('Rendering active network - effectiveChainId:', effectiveChainId, 'refreshTrigger:', refreshTrigger)
                  const foundNetwork = SUPPORTED_NETWORKS.find(n => {
                    const activeNet = getActiveNetwork(n.name, isTestingMode)
                    console.log(`Checking ${n.name}: activeNet.id=${activeNet.id}, effectiveChainId=${effectiveChainId}`)
                    return activeNet.id === effectiveChainId
                  })
                  
                  if (foundNetwork) {
                    const activeNet = getActiveNetwork(foundNetwork.name, isTestingMode)
                    console.log('Found active network:', activeNet.displayName)
                    return (
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{foundNetwork.icon}</span>
                        {activeNet.displayName}
                      </span>
                    )
                  } else {
                    console.log('Network not found for chainId:', effectiveChainId)
                    return `Chain ${effectiveChainId}`
                  }
                })()}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
          </div>
        </div>
      )}
      
      {/* <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
        {SUPPORTED_NETWORKS.map((network) => {
          const activeNetwork = getActiveNetwork(network.name, isTestingMode)
          const isSelected = selectedNetwork === network.name
          const isCurrentChain = effectiveChainId === activeNetwork.id

          return (
            <Button
              key={network.name}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => handleNetworkSelect(network)}
              className={`flex items-center gap-2 transition-all ${
                isSelected 
                  ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-md' 
                  : isCurrentChain
                  ? 'border-green-500 bg-green-50 hover:bg-green-100'
                  : 'hover:border-pink-300 hover:bg-pink-50'
              }`}
              style={!isSelected && !isCurrentChain ? { borderColor: network.color } : {}}
            >
              <span className="text-lg">{network.icon}</span>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{network.displayName}</span>
                  {isCurrentChain && <span className="text-green-600 text-xs">●</span>}
                </div>
                <span className={`text-xs ${isSelected ? 'opacity-75' : 'opacity-60'}`}>
                  {activeNetwork.displayName}
                </span>
              </div>
              {isPending && isSelected && (
                <div className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
            </Button>
          )
        })}
      </div> */}
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {isTestingMode && (
            <p className="text-xs text-amber-600">
              🧪 Testing mode: Using testnets
            </p>
          )}
          {isPending && (
            <p className="text-xs text-blue-600">
              ⏳ Switching network...
            </p>
          )}
        </div>
        
      </div>
    </div>
  )
}