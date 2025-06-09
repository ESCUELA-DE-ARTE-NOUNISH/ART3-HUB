"use client"

import { useState, useEffect } from 'react'

// MetaMask ethereum provider interface
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  isMetaMask?: boolean
}
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
  const { switchChain, isPending } = useSwitchChain()
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

  // Force refresh when chain changes
  useEffect(() => {
    console.log('Chain ID changed to:', currentChainId)
    setRefreshTrigger(prev => prev + 1)
    
    // Update selected network based on current chain
    if (effectiveChainId) {
      const matchingNetwork = SUPPORTED_NETWORKS.find(n => {
        const activeNet = getActiveNetwork(n.name, isTestingMode)
        return activeNet.id === effectiveChainId
      })
      if (matchingNetwork && matchingNetwork.name !== selectedNetwork) {
        console.log('Auto-updating selected network to:', matchingNetwork.name)
        onNetworkChange(matchingNetwork.name)
      }
    }
  }, [currentChainId, effectiveChainId, isTestingMode, selectedNetwork, onNetworkChange])

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

  // Function to add network to MetaMask if it doesn't exist
  const addNetworkToWallet = async (chainId: number) => {
    console.log('addNetworkToWallet called with chainId:', chainId)
    
    const ethereum = (window as any).ethereum as EthereumProvider | undefined
    if (!ethereum) {
      console.log('No ethereum provider found')
      return false
    }
    
    console.log('Ethereum provider found:', {
      isMetaMask: ethereum.isMetaMask,
      hasRequest: typeof ethereum.request === 'function'
    })

    const networkConfigs = {
      // Zora Mainnet
      7777777: {
        chainId: '0x76adf1',
        chainName: 'Zora Network',
        nativeCurrency: { 
          name: 'Ethereum', 
          symbol: 'ETH', 
          decimals: 18 
        },
        rpcUrls: ['https://rpc.zora.energy'],
        blockExplorerUrls: ['https://explorer.zora.energy/']
      },
      // Zora Sepolia Testnet
      999999999: {
        chainId: '0x3b9ac9ff',
        chainName: 'Zora Sepolia Testnet',
        nativeCurrency: { 
          name: 'Ethereum', 
          symbol: 'ETH', 
          decimals: 18 
        },
        rpcUrls: ['https://sepolia.rpc.zora.energy'],
        blockExplorerUrls: ['https://sepolia.explorer.zora.energy/']
      }
    }

    const networkConfig = networkConfigs[chainId as keyof typeof networkConfigs]
    if (!networkConfig) {
      console.log('No network config found for chainId:', chainId)
      return false
    }
    
    console.log('Network config for chainId', chainId, ':', networkConfig)

    try {
      console.log('Calling wallet_addEthereumChain...')
      const result = await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      })
      console.log('wallet_addEthereumChain result:', result)
      return true
    } catch (error: any) {
      console.error('Failed to add network:', error)
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        data: error?.data,
        stack: error?.stack
      })
      
      // Handle specific error codes
      if (error.code === 4001) {
        console.log('User rejected the request')
        return false
      } else if (error.code === -32603) {
        console.log('Internal error - possibly RPC issue, trying alternative config...')
        
        // Network-specific error handling could be added here if needed
      }
      
      return false
    }
  }

  const handleNetworkSelect = async (network: NetworkConfig) => {
    try {
      const activeNetwork = getActiveNetwork(network.name, isTestingMode)
      
      console.log('Attempting to switch to network:', {
        networkName: network.name,
        targetChainId: activeNetwork.id,
        currentChainId,
        isTestingMode,
        isMetaMask: (window as any).ethereum?.isMetaMask
      })
      
      // Update the selected network in the parent component immediately
      onNetworkChange(network.name)
      
      // Only try to switch chain if wallet is connected
      if (isConnected) {
        console.log('Wallet is connected, proceeding with network switch...')
        
        // For non-Base networks, try adding network first
        if (activeNetwork.id !== 8453 && activeNetwork.id !== 84532) {
          console.log('Non-Base network detected, adding to wallet first...')
          
          try {
            const networkAdded = await addNetworkToWallet(activeNetwork.id)
            console.log('Network addition result:', networkAdded)
            
            if (networkAdded) {
              console.log('Network added successfully, now switching...')
              // Small delay to let MetaMask process
              await new Promise(resolve => setTimeout(resolve, 1500))
              
              if (switchChain) {
                try {
                  const result = await switchChain({ chainId: activeNetwork.id })
                  console.log('Chain switch successful:', result)
                  
                  // Multiple refresh attempts to ensure UI updates
                  setTimeout(() => setRefreshTrigger(prev => prev + 1), 200)
                  setTimeout(() => setRefreshTrigger(prev => prev + 1), 1000)
                  setTimeout(() => setRefreshTrigger(prev => prev + 1), 2000)
                  
                  toast({
                    title: t.networkSwitched,
                    description: `Switched to ${activeNetwork.displayName}`,
                  })
                } catch (switchError) {
                  console.error('Switch failed after adding network:', switchError)
                  // Even if switch fails, the network was added
                  toast({
                    title: 'Network Added',
                    description: `${activeNetwork.displayName} was added to your wallet. Please switch manually.`,
                  })
                }
              }
            } else {
              console.log('Failed to add network or user cancelled')
              toast({
                title: 'Network Addition Cancelled',
                description: 'Please add the network manually in MetaMask',
                variant: "destructive",
              })
            }
          } catch (addError) {
            console.error('Error adding network:', addError)
            toast({
              title: t.switchFailed,
              description: `Failed to add ${activeNetwork.displayName} to wallet`,
              variant: "destructive",
            })
          }
        } else {
          // For Base networks, try direct switch
          console.log('Base network, trying direct switch...')
          if (switchChain) {
            try {
              const result = await switchChain({ chainId: activeNetwork.id })
              console.log('Direct switch successful:', result)
              
              // Multiple refresh attempts to ensure UI updates
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 200)
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 1000)
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 2000)
              
              toast({
                title: t.networkSwitched,
                description: `Switched to ${activeNetwork.displayName}`,
              })
            } catch (switchError) {
              console.error('Direct switch failed:', switchError)
              toast({
                title: t.switchFailed,
                description: `Failed to switch to ${activeNetwork.displayName}`,
                variant: "destructive",
              })
            }
          }
        }
      } else if (!isConnected) {
        console.log('Wallet not connected, cannot switch chain')
        toast({
          title: 'Wallet Required',
          description: 'Please connect your wallet to switch networks',
          variant: "destructive",
        })
      } else {
        console.log('switchChain function is not available')
        toast({
          title: t.switchFailed,
          description: 'Wallet switching not available',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to select network:', error)
      toast({
        title: t.switchFailed,
        description: t.switchFailed,
        variant: "destructive",
      })
    }
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
      
      <div className="flex gap-2 flex-wrap justify-center">
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
      </div>
      
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