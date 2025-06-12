import { useEffect, useState } from 'react'
import { usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { base, baseSepolia, celo, celoAlfajores, zora, zoraSepolia } from '@/lib/wagmi'

export function useNetworkClients() {
  const wagmiPublicClient = usePublicClient()
  const { data: wagmiWalletClient } = useWalletClient()
  const chainId = useChainId()
  
  // Force refresh when chain changes
  const [refreshKey, setRefreshKey] = useState(0)
  
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
  }, [chainId])
  
  // Create fresh clients that definitely match the current chain
  const createFreshClients = () => {
    let chain
    let rpcUrl
    
    switch (chainId) {
      case 84532:
        chain = baseSepolia
        rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
        break
      case 8453:
        chain = base
        rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
        break
      case 44787:
        chain = celoAlfajores
        rpcUrl = process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
        break
      case 42220:
        chain = celo
        rpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'
        break
      case 999999999:
        chain = zoraSepolia
        rpcUrl = process.env.NEXT_PUBLIC_ZORA_SEPOLIA_RPC_URL || 'https://sepolia.rpc.zora.energy'
        break
      case 7777777:
        chain = zora
        rpcUrl = process.env.NEXT_PUBLIC_ZORA_RPC_URL || 'https://rpc.zora.energy'
        break
      default:
        // Fallback to wagmi clients
        return { 
          publicClient: wagmiPublicClient, 
          walletClient: wagmiWalletClient,
          isCustom: false
        }
    }
    
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })
    
    // For wallet client, try to use the existing wallet connection
    let walletClient = wagmiWalletClient
    
    // If wallet client chain doesn't match, we'll still use it but log a warning
    if (wagmiWalletClient && wagmiWalletClient.chain?.id !== chainId) {
      console.warn(`⚠️ Wallet client chain (${wagmiWalletClient.chain?.id}) doesn't match current chain (${chainId})`)
    }
    
    return { 
      publicClient, 
      walletClient,
      isCustom: true,
      chainId,
      chain
    }
  }
  
  const clients = createFreshClients()
  
  console.log('🔄 Network clients update:', {
    chainId,
    refreshKey,
    isCustom: clients.isCustom,
    publicClientChain: clients.publicClient?.chain?.id,
    walletClientChain: clients.walletClient?.chain?.id
  })
  
  return clients
}