// Network configurations for mainnet and testnet
export interface NetworkConfig {
  id: number
  name: string
  displayName: string
  testnet: {
    id: number
    name: string
    displayName: string
  }
  mainnet: {
    id: number
    name: string
    displayName: string
  }
  color: string
  icon: string
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 8453, // Base mainnet
    name: 'base',
    displayName: 'Base',
    testnet: {
      id: 84532,
      name: 'base-sepolia',
      displayName: 'Base Sepolia'
    },
    mainnet: {
      id: 8453,
      name: 'base',
      displayName: 'Base'
    },
    color: '#0052FF',
    icon: '🔵'
  },
  {
    id: 42220, // Celo mainnet
    name: 'celo',
    displayName: 'Celo',
    testnet: {
      id: 44787,
      name: 'celo-alfajores',
      displayName: 'Celo Alfajores'
    },
    mainnet: {
      id: 42220,
      name: 'celo',
      displayName: 'Celo'
    },
    color: '#35D07F',
    icon: '🌱'
  },
  {
    id: 7777777, // Zora mainnet
    name: 'zora',
    displayName: 'Zora',
    testnet: {
      id: 999999999,
      name: 'zora-sepolia',
      displayName: 'Zora Sepolia'
    },
    mainnet: {
      id: 7777777,
      name: 'zora',
      displayName: 'Zora'
    },
    color: '#000000',
    icon: '⚡'
  }
]

export function getNetworkConfig(networkName: string): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS.find(network => network.name === networkName)
}

export function getActiveNetwork(networkName: string, isTestingMode: boolean = false): { id: number; name: string; displayName: string } {
  const config = getNetworkConfig(networkName)
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}`)
  }
  
  return isTestingMode ? config.testnet : config.mainnet
}

export function getCurrentNetworkId(networkName: string): number {
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const activeNetwork = getActiveNetwork(networkName, isTestingMode)
  return activeNetwork.id
}

export function getDefaultNetwork(): string {
  return 'base' // Default to Base network
}