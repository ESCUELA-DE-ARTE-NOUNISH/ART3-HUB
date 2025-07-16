"use client"

import { useState, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { SUPPORTED_NETWORKS, getActiveNetwork, isBaseOnlyDeployment, type NetworkConfig } from '@/lib/networks'
import { useSwitchChain, useChainId, useAccount, useConfig } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { useMiniKit } from '@coinbase/onchainkit/minikit'

interface NetworkSelectorProps {
  selectedNetwork: string
  onNetworkChange: (network: string) => void
  locale?: string
  baseOnly?: boolean // New prop for Base-only mode
}

export function NetworkSelector({ selectedNetwork, onNetworkChange, locale = 'en', baseOnly = false }: NetworkSelectorProps) {
  const { switchChain, isPending } = useSwitchChain()
  const currentChainId = useChainId()
  const { isConnected } = useAccount()
  const config = useConfig()
  const { toast } = useToast()
  const { context } = useMiniKit()
  const isMiniKit = !!context
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const isBaseOnlyMode = baseOnly || isBaseOnlyDeployment()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [detectedChainId, setDetectedChainId] = useState<number | undefined>(currentChainId)
  const toastShownRef = useRef<number | undefined>()
  
  // Use detected chain ID as fallback when wagmi is slow to update
  const effectiveChainId = detectedChainId || currentChainId
  
  // Translations - moved up to avoid initialization issues
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
  
  // Function to add/switch networks to MetaMask
  const addOrSwitchNetworkInMetaMask = async (chainId: number) => {
    if (typeof window === 'undefined') {
      throw new Error('Window not available')
    }

    // Get ethereum provider - try multiple approaches
    const ethereum = (window as any).ethereum || (window as any).web3?.currentProvider
    
    if (!ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask.')
    }

    let networkParams
    
    switch (chainId) {
      case 999999999: // Zora Sepolia
        networkParams = {
          chainId: '0x3B9AC9FF',
          chainName: 'Zora Sepolia',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia.rpc.zora.energy'],
          blockExplorerUrls: ['https://sepolia.explorer.zora.energy'],
        }
        break
      case 7777777: // Zora Mainnet
        networkParams = {
          chainId: '0x76ADF1',
          chainName: 'Zora',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://rpc.zora.energy'],
          blockExplorerUrls: ['https://explorer.zora.energy'],
        }
        break
      case 84532: // Base Sepolia
        networkParams = {
          chainId: '0x14A34', // 84532 in hex
          chainName: 'Base Sepolia',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org'],
        }
        break
      case 8453: // Base Mainnet
        networkParams = {
          chainId: '0x2105', // 8453 in hex
          chainName: 'Base',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org'],
        }
        break
      default:
        throw new Error(`Unsupported network: ${chainId}`)
    }

    console.log('Attempting to add network:', networkParams)

    try {
      // First try to switch to the network (in case it already exists)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkParams.chainId }],
        })
        console.log(`Switched to existing ${networkParams.chainName}`)
        return chainId // Return the chain ID for immediate UI update
      } catch (switchError: any) {
        // If network doesn't exist (error 4902), we'll add it below
        if (switchError.code !== 4902) {
          throw switchError
        }
        console.log(`${networkParams.chainName} doesn't exist, adding it...`)
      }

      // Add the network if it doesn't exist
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkParams],
      })
      console.log(`Added ${networkParams.chainName} to MetaMask`)
      return chainId // Return the chain ID for immediate UI update
      
    } catch (error: any) {
      console.error('Failed to add/switch network:', error)
      
      // Handle specific error codes
      if (error.code === 4001) {
        throw new Error('User rejected the request')
      } else if (error.code === -32602) {
        throw new Error('Invalid parameters')
      } else if (error.code === -32603) {
        throw new Error('Internal error - please try again or add the network manually')
      } else {
        throw new Error(error.message || 'Failed to add network')
      }
    }
  }
  
  console.log('NetworkSelector render:', {
    currentChainId,
    effectiveChainId,
    isConnected,
    selectedNetwork,
    isTestingMode,
    isPending,
    refreshTrigger,
    configuredChains: config.chains.map(c => ({ id: c.id, name: c.name }))
  })

  // Sync detected chain ID with wagmi when wagmi updates
  useEffect(() => {
    if (currentChainId) {
      setDetectedChainId(currentChainId)
    }
  }, [currentChainId])

  // Force refresh when chain changes and show success message if it matches selected network
  useEffect(() => {
    console.log('Chain ID changed to:', currentChainId)
    
    setRefreshTrigger(prev => prev + 1)
    
    // Check if the new chain matches the selected network and show success (avoid duplicates)
    if (currentChainId && isConnected && currentChainId !== toastShownRef.current) {
      const selectedNetworkConfig = SUPPORTED_NETWORKS.find(n => n.name === selectedNetwork)
      if (selectedNetworkConfig) {
        const activeNetwork = getActiveNetwork(selectedNetworkConfig.name, isTestingMode)
        if (currentChainId === activeNetwork.id) {
          // Network switch was successful
          toastShownRef.current = currentChainId
          toast({
            title: t.networkSwitched,
            description: `Successfully switched to ${activeNetwork.displayName}`,
            variant: "default",
          })
        }
      }
    }
  }, [currentChainId, selectedNetwork, isConnected, isTestingMode])

  // Listen to MetaMask chain changes directly
  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum) return

    const handleChainChanged = (chainId: string) => {
      console.log('MetaMask chain changed to:', chainId, 'decimal:', parseInt(chainId, 16))
      const newChainId = parseInt(chainId, 16)
      
      // Immediately update detected chain ID for faster UI response
      setDetectedChainId(newChainId)
      
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

  const handleNetworkSelect = async (network: NetworkConfig) => {
    const activeNetwork = getActiveNetwork(network.name, isTestingMode)
    
    console.log('Network selected in UI:', {
      networkName: network.name,
      targetChainId: activeNetwork.id,
      displayName: activeNetwork.displayName,
      isTestingMode,
      currentChainId,
      isConnected
    })
    
    // Update the selected network preference
    onNetworkChange(network.name)
    
    // Check if we need to switch networks or just update the UI
    if (isConnected) {
      console.log('Network switching check:', {
        currentChainId,
        targetChainId: activeNetwork.id,
        detectedChainId,
        effectiveChainId,
        networkName: activeNetwork.displayName,
        isMiniKit,
        needsSwitch: currentChainId !== activeNetwork.id
      })
      
      // If MetaMask is already on the target network but UI shows wrong network, fix the UI
      if (currentChainId === activeNetwork.id && detectedChainId !== activeNetwork.id) {
        console.log('MetaMask is already on target network, updating UI')
        setDetectedChainId(activeNetwork.id)
        setRefreshTrigger(prev => prev + 1)
        toast({
          title: 'Network Updated',
          description: `Already on ${activeNetwork.displayName}`,
          variant: "default",
        })
      }
      // If we need to actually switch networks
      else if (currentChainId !== activeNetwork.id) {
        console.log('Attempting to switch chain:', {
          from: currentChainId,
          to: activeNetwork.id,
          networkName: activeNetwork.displayName,
          isMiniKit,
          switchChainAvailable: !!switchChain
        })
        
        try {
          // Check if switchChain is available
          if (!switchChain) {
            throw new Error('switchChain function not available')
          }
          
          if (isMiniKit) {
            console.log('Switching chain in MiniKit environment')
            // In MiniKit, just attempt the switch without adding network
            switchChain({ chainId: activeNetwork.id })
          } else {
            // For all networks in browser, handle directly through MetaMask for better reliability
            toast({
              title: 'Switching Network...',
              description: `Switching to ${activeNetwork.displayName}`,
              variant: "default",
            })
            const switchedChainId = await addOrSwitchNetworkInMetaMask(activeNetwork.id)
            
            // Immediately update the detected chain ID for faster UI response
            if (switchedChainId) {
              setDetectedChainId(switchedChainId)
              setRefreshTrigger(prev => prev + 1)
            }
          }
          
        } catch (error) {
          console.error('Failed to switch network:', error)
          
          // More specific error handling for different environments
          let errorMessage = `Please manually switch to ${activeNetwork.displayName} in your wallet. Chain ID: ${activeNetwork.id}`
          
          if (isMiniKit) {
            errorMessage = `Unable to switch networks automatically in Farcaster. Please use the network selector in your Farcaster wallet to switch to ${activeNetwork.displayName}.`
          } else if (error instanceof Error) {
            errorMessage = `Failed to switch: ${error.message}. Please try manually switching to ${activeNetwork.displayName} in your wallet.`
          }
          
          toast({
            title: t.switchFailed,
            description: errorMessage,
            variant: "destructive",
          })
          
          // Show network details for manual switching (only for non-MiniKit)
          if (!isMiniKit) {
            if (activeNetwork.id === 999999999) {
              setTimeout(() => {
                toast({
                  title: 'Zora Sepolia Network Details',
                  description: `RPC: https://sepolia.rpc.zora.energy | Chain ID: 999999999`,
                  variant: "default",
                })
              }, 2000)
            } else if (activeNetwork.id === 7777777) {
              setTimeout(() => {
                toast({
                  title: 'Zora Network Details',
                  description: `RPC: https://rpc.zora.energy | Chain ID: 7777777`,
                  variant: "default",
                })
              }, 2000)
            }
          }
        }
      }
    } else {
      toast({
        title: `${activeNetwork.displayName} Selected`,
        description: 'Connect your wallet to switch to this network.',
        variant: "default",
      })
    }
    
    // Update UI refresh
    setRefreshTrigger(prev => prev + 1)
  }

  // Base-only mode: Show simplified interface
  if (isBaseOnlyMode) {
    const baseNetwork = SUPPORTED_NETWORKS[0] // Base is the only network
    const activeNetwork = getActiveNetwork(baseNetwork.name, isTestingMode)
    const isCurrentChain = effectiveChainId === activeNetwork.id

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Network</label>
        
        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔵</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-900">Base Network</span>
                  {isCurrentChain && <span className="text-green-600 text-xs">● CONNECTED</span>}
                </div>
                <span className="text-sm text-blue-700">
                  {activeNetwork.displayName} {isTestingMode ? '(Testnet)' : '(Mainnet)'}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                SELECTED
              </div>
              {isTestingMode && (
                <p className="text-xs text-amber-600 mt-1">
                  🧪 Testnet Mode
                </p>
              )}
            </div>
          </div>
          
          {!isCurrentChain && isConnected && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleNetworkSelect(baseNetwork)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? (
                  <>
                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Switching to Base...
                  </>
                ) : (
                  'Switch to Base Network'
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            🎯 Optimized for Base Network - Fast, Low-cost, Secure
          </p>
        </div>
      </div>
    )
  }

  // Original multi-network interface (for backward compatibility)
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
      
      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
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