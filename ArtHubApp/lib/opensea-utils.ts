// OpenSea utility functions for generating links to NFT collections and tokens

export interface OpenSeaLinkParams {
  contractAddress: string
  tokenId?: string | number
  network: string
  isTestingMode?: boolean
}

/**
 * Generate OpenSea link for an NFT or collection
 * @param params - Contract address, token ID (optional), network, and testing mode
 * @returns OpenSea URL
 */
export function getOpenSeaLink(params: OpenSeaLinkParams): string {
  const { contractAddress, tokenId, network, isTestingMode = false } = params

  // OpenSea network mappings
  const networkMappings = {
    // Mainnet networks
    ethereum: 'ethereum',
    base: 'base',
    zora: 'zora',
    polygon: 'matic',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    // Testnet networks
    sepolia: 'sepolia',
    'base-sepolia': 'base_sepolia',
    'base_sepolia': 'base_sepolia',
    'zora-sepolia': 'zora_sepolia', 
    'zora_sepolia': 'zora_sepolia',
    'polygon-mumbai': 'mumbai',
    'arbitrum-sepolia': 'arbitrum_sepolia',
    'optimism-sepolia': 'optimism_sepolia'
  }

  // Determine OpenSea network identifier
  let openSeaNetwork: string
  
  if (isTestingMode) {
    // Handle testnet networks
    switch (network.toLowerCase()) {
      case 'base':
        openSeaNetwork = 'base_sepolia'
        break
      case 'zora':
        openSeaNetwork = 'zora_sepolia'
        break
      case 'ethereum':
        openSeaNetwork = 'sepolia'
        break
      default:
        // Try to find in mappings
        const testnetKey = `${network.toLowerCase()}-sepolia` as keyof typeof networkMappings
        openSeaNetwork = networkMappings[testnetKey] || `${network.toLowerCase()}_sepolia`
    }
  } else {
    // Handle mainnet networks
    const mainnetKey = network.toLowerCase() as keyof typeof networkMappings
    openSeaNetwork = networkMappings[mainnetKey] || network.toLowerCase()
  }

  // Determine base URL
  const baseUrl = isTestingMode ? 'https://testnets.opensea.io' : 'https://opensea.io'

  // Generate URL
  if (tokenId !== undefined && tokenId !== null) {
    // Link to specific NFT
    return `${baseUrl}/assets/${openSeaNetwork}/${contractAddress}/${tokenId}`
  } else {
    // Link to collection
    return `${baseUrl}/collection/${contractAddress}`
  }
}

/**
 * Parse network string from database to extract network name and testing mode
 * @param networkString - Network string from database (e.g., "base testnet", "zora mainnet")
 * @returns Object with network name and testing mode
 */
export function parseNetworkString(networkString: string): { network: string; isTestingMode: boolean } {
  const lower = networkString.toLowerCase()
  
  // Extract network name
  let network = 'base' // default
  if (lower.includes('zora')) network = 'zora'
  else if (lower.includes('ethereum')) network = 'ethereum'
  else if (lower.includes('polygon')) network = 'polygon'
  else if (lower.includes('arbitrum')) network = 'arbitrum'
  else if (lower.includes('optimism')) network = 'optimism'
  else if (lower.includes('base')) network = 'base'
  
  // Determine if testnet
  const isTestingMode = lower.includes('testnet') || lower.includes('sepolia')
  
  return { network, isTestingMode }
}

/**
 * Get OpenSea link from NFT database record
 * @param nft - NFT record from database
 * @returns OpenSea URL or null if insufficient data
 */
export function getOpenSeaLinkFromNFT(nft: {
  contract_address?: string | null
  token_id?: string | number | null
  network?: string
}): string | null {
  if (!nft.contract_address) {
    return null
  }

  const { network, isTestingMode } = parseNetworkString(nft.network || 'base testnet')

  return getOpenSeaLink({
    contractAddress: nft.contract_address,
    tokenId: nft.token_id || undefined,
    network,
    isTestingMode
  })
}

/**
 * Get collection link from contract address and network
 * @param contractAddress - Contract address
 * @param networkString - Network string from database
 * @returns OpenSea collection URL
 */
export function getOpenSeaCollectionLink(contractAddress: string, networkString: string = 'base testnet'): string {
  const { network, isTestingMode } = parseNetworkString(networkString)
  
  return getOpenSeaLink({
    contractAddress,
    network,
    isTestingMode
  })
}