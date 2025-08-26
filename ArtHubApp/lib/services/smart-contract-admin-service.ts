/**
 * Smart Contract Admin Service - Production-ready admin validation using on-chain contracts
 * Replaces Firebase and localStorage admin management with smart contract-based validation
 */

import { createPublicClient, http, Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
interface CacheEntry {
  data: any
  timestamp: number
}

// Module-level cache to persist across service instances
const moduleCache = new Map<string, CacheEntry>()

// Request deduplication to prevent concurrent calls for the same data
const pendingRequests = new Map<string, Promise<any>>()

// Contract addresses from CLAUDE.md
const CONTRACT_ADDRESSES = {
  [base.id]: {
    factoryV6: '0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D' as Address,
    subscriptionV6: '0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8' as Address,
    adminWallet: '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f' as Address,
  },
  [baseSepolia.id]: {
    factoryV6: '0x87DfC71B55a41825fe8EAA8a8724D8982b92DeBe' as Address,
    subscriptionV6: '0x3B2D7fD4972077Fa1dbE60335c6CDF84b02fE555' as Address,
    adminWallet: '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f' as Address,
  },
} as const

// Simple ABI for Ownable contract owner() function
const OWNABLE_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Get current network configuration
function getNetworkConfig() {
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const chain = isTestingMode ? baseSepolia : base
  return {
    chain,
    contracts: CONTRACT_ADDRESSES[chain.id],
  }
}

class SmartContractAdminService {
  private publicClient: any
  private contracts: any
  private static instance: SmartContractAdminService | null = null

  private constructor() {
    console.log('🔧 Creating SmartContractAdminService instance...')
    const { chain, contracts } = getNetworkConfig()
    
    // Create viem public client for reading contract data with reliable RPC and timeout config
    const rpcUrl = chain.id === 8453 
      ? process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
      : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
      
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl, {
        timeout: 10000, // 10 second timeout
        retryCount: 2,
        retryDelay: 1000
      }),
    })
    
    this.contracts = contracts
    console.log(`✅ SmartContractAdminService initialized for ${chain.name} (chainId: ${chain.id})`)
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SmartContractAdminService {
    if (!SmartContractAdminService.instance) {
      SmartContractAdminService.instance = new SmartContractAdminService()
    }
    return SmartContractAdminService.instance
  }

  /**
   * Cache helper methods
   */
  private getCacheKey(contractAddress: string, functionName: string): string {
    return `${contractAddress}_${functionName}`
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_TTL
  }

  private getFromCache(key: string): any | null {
    const entry = moduleCache.get(key)
    if (entry && this.isCacheValid(entry)) {
      return entry.data
    }
    if (entry) {
      moduleCache.delete(key) // Remove expired entry
    }
    return null
  }

  private setCache(key: string, data: any): void {
    moduleCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Read contract with caching
   */
  private async readContractWithCache(address: Address, functionName: string): Promise<any> {
    const cacheKey = this.getCacheKey(address, functionName)
    const cachedResult = this.getFromCache(cacheKey)
    
    console.log(`🔍 [CACHE DEBUG] Looking for ${cacheKey}`)
    console.log(`🔍 [CACHE DEBUG] Module cache size: ${moduleCache.size}`)
    console.log(`🔍 [CACHE DEBUG] All cache keys:`, Array.from(moduleCache.keys()))
    
    if (cachedResult !== null) {
      console.log(`✅ [CACHE HIT] Found cached data for ${cacheKey}:`, cachedResult)
      console.log(`⏰ [CACHE HIT] Cache age: ${Date.now() - (moduleCache.get(cacheKey)?.timestamp || 0)}ms`)
      return cachedResult
    }

    // Check if there's already a pending request for this key
    const pendingRequest = pendingRequests.get(cacheKey)
    if (pendingRequest) {
      console.log(`⏳ [REQUEST DEDUP] Waiting for ongoing request: ${cacheKey}`)
      console.log(`🔄 [REQUEST DEDUP] Pending requests count: ${pendingRequests.size}`)
      return await pendingRequest
    }

    console.log(`❌ [CACHE MISS] No cached data for ${cacheKey}, making RPC call...`)
    console.log(`📊 [CACHE STATS] Current stats:`, this.getCacheStats())
    console.log(`🌐 [RPC CALL] About to call contract ${address} function ${functionName}`)

    // Create and store the pending request
    const requestPromise = this.publicClient.readContract({
      address,
      abi: OWNABLE_ABI,
      functionName,
    }).then((result) => {
      // Cache the successful result
      this.setCache(cacheKey, result)
      console.log(`✅ [CACHE STORE] Stored result for ${cacheKey}:`, result)
      console.log(`📦 [CACHE STORE] Cache now has ${moduleCache.size} entries`)
      return result
    }).catch((error) => {
      console.error(`❌ [RPC ERROR] Call failed for ${cacheKey}:`, error.message)
      console.error(`🚫 [RPC ERROR] Full error:`, error)
      throw error
    }).finally(() => {
      // Remove the pending request regardless of success/failure
      pendingRequests.delete(cacheKey)
      console.log(`🧹 [CLEANUP] Removed pending request for ${cacheKey}`)
    })

    pendingRequests.set(cacheKey, requestPromise)
    console.log(`⏳ [PENDING] Added request to pending queue: ${cacheKey}`)
    return await requestPromise
  }

  /**
   * Check if an address is an admin by verifying contract ownership
   */
  async isAdmin(address: string | undefined): Promise<boolean> {
    console.log(`🔐 [isAdmin] Checking admin status for: ${address}`)
    
    if (!address) {
      console.log(`🔐 [isAdmin] No address provided, returning false`)
      return false
    }

    try {
      const normalizedAddress = address.toLowerCase() as Address
      const adminAddress = this.contracts.adminWallet.toLowerCase()
      
      console.log(`🔐 [isAdmin] Normalized address: ${normalizedAddress}`)
      console.log(`🔐 [isAdmin] Known admin wallet: ${adminAddress}`)

      // Primary check: Direct admin wallet match
      if (normalizedAddress === adminAddress) {
        console.log(`✅ [isAdmin] Address matches known admin wallet`)
        return true
      }

      console.log(`🔍 [isAdmin] Starting contract owner verification...`)
      
      // Secondary check: Contract owner verification (with caching)
      const factoryOwner = await this.readContractWithCache(
        this.contracts.factoryV6,
        'owner'
      )

      const subscriptionOwner = await this.readContractWithCache(
        this.contracts.subscriptionV6,
        'owner'
      )

      console.log(`🏭 [isAdmin] Factory owner: ${factoryOwner}`)
      console.log(`📋 [isAdmin] Subscription owner: ${subscriptionOwner}`)

      // Check if address matches any contract owner
      const isFactoryOwner = normalizedAddress === factoryOwner.toLowerCase()
      const isSubscriptionOwner = normalizedAddress === subscriptionOwner.toLowerCase()

      console.log(`🔍 [isAdmin] Is factory owner: ${isFactoryOwner}`)
      console.log(`🔍 [isAdmin] Is subscription owner: ${isSubscriptionOwner}`)

      const result = isFactoryOwner || isSubscriptionOwner
      console.log(`🔐 [isAdmin] Final result: ${result}`)
      
      return result

    } catch (error) {
      console.error('❌ [isAdmin] Error checking admin status:', error)
      
      // Fallback to environment admin check if contracts are unavailable
      const envAdmin = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()
      const fallbackResult = envAdmin ? address.toLowerCase() === envAdmin : false
      console.log(`🆘 [isAdmin] Using fallback result: ${fallbackResult}`)
      return fallbackResult
    }
  }

  /**
   * Synchronous admin check using cached environment data
   * Used as fallback when contract calls are not available
   */
  isAdminSync(address: string | undefined): boolean {
    if (!address) return false

    const normalizedAddress = address.toLowerCase()
    
    // Check against known admin addresses
    const adminAddresses = [
      this.contracts.adminWallet.toLowerCase(),
      process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase(),
    ].filter(Boolean)

    return adminAddresses.some(admin => admin === normalizedAddress)
  }

  /**
   * Get admin information from smart contracts
   */
  async getAdminInfo(): Promise<{
    adminWallet: string
    factoryOwner: string
    subscriptionOwner: string
    network: string
  }> {
    try {
      const [factoryOwner, subscriptionOwner] = await Promise.all([
        this.readContractWithCache(this.contracts.factoryV6, 'owner'),
        this.readContractWithCache(this.contracts.subscriptionV6, 'owner'),
      ])

      return {
        adminWallet: this.contracts.adminWallet,
        factoryOwner: factoryOwner as string,
        subscriptionOwner: subscriptionOwner as string,
        network: getNetworkConfig().chain.name,
      }
    } catch (error) {
      console.error('SmartContractAdminService: Error getting admin info:', error)
      throw new Error('Failed to retrieve admin information from smart contracts')
    }
  }

  /**
   * Verify contract ownership and admin permissions
   */
  async verifyAdminPermissions(address: string): Promise<{
    isAdmin: boolean
    isFactoryOwner: boolean
    isSubscriptionOwner: boolean
    isAdminWallet: boolean
    contractAddresses: typeof this.contracts
  }> {
    console.log(`🔐 [verifyAdminPermissions] Verifying permissions for: ${address}`)
    
    if (!address) {
      console.log(`🔐 [verifyAdminPermissions] No address provided, returning empty permissions`)
      return {
        isAdmin: false,
        isFactoryOwner: false,
        isSubscriptionOwner: false,
        isAdminWallet: false,
        contractAddresses: this.contracts,
      }
    }

    try {
      const normalizedAddress = address.toLowerCase()
      const adminAddress = this.contracts.adminWallet.toLowerCase()

      console.log(`🔐 [verifyAdminPermissions] Normalized address: ${normalizedAddress}`)
      console.log(`🔐 [verifyAdminPermissions] Known admin wallet: ${adminAddress}`)
      console.log(`🔍 [verifyAdminPermissions] Making parallel contract calls...`)

      const [factoryOwner, subscriptionOwner] = await Promise.all([
        this.readContractWithCache(this.contracts.factoryV6, 'owner'),
        this.readContractWithCache(this.contracts.subscriptionV6, 'owner'),
      ])

      console.log(`🏭 [verifyAdminPermissions] Factory owner: ${factoryOwner}`)
      console.log(`📋 [verifyAdminPermissions] Subscription owner: ${subscriptionOwner}`)

      const isAdminWallet = normalizedAddress === adminAddress
      const isFactoryOwner = normalizedAddress === (factoryOwner as string).toLowerCase()
      const isSubscriptionOwner = normalizedAddress === (subscriptionOwner as string).toLowerCase()
      const isAdmin = isAdminWallet || isFactoryOwner || isSubscriptionOwner

      console.log(`🔍 [verifyAdminPermissions] Results:`)
      console.log(`  - Is admin wallet: ${isAdminWallet}`)
      console.log(`  - Is factory owner: ${isFactoryOwner}`)
      console.log(`  - Is subscription owner: ${isSubscriptionOwner}`)
      console.log(`  - Final admin status: ${isAdmin}`)

      const result = {
        isAdmin,
        isFactoryOwner,
        isSubscriptionOwner,
        isAdminWallet,
        contractAddresses: this.contracts,
      }

      console.log(`✅ [verifyAdminPermissions] Returning permissions:`, result)
      return result
    } catch (error) {
      console.error('❌ [verifyAdminPermissions] Error verifying admin permissions:', error)
      throw new Error('Failed to verify admin permissions from smart contracts')
    }
  }

  /**
   * Get contract addresses for current network
   */
  getContractAddresses() {
    return {
      ...this.contracts,
      network: getNetworkConfig().chain.name,
      chainId: getNetworkConfig().chain.id,
    }
  }

  /**
   * Clear cache (for administrative purposes or troubleshooting)
   */
  clearCache(): void {
    moduleCache.clear()
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: moduleCache.size,
      entries: Array.from(moduleCache.keys())
    }
  }
}

// Export singleton instance
export const smartContractAdminService = SmartContractAdminService.getInstance()

// Hook for React components
export function useSmartContractAdminService() {
  return SmartContractAdminService.getInstance()
}

// Export types for TypeScript
export type AdminPermissions = Awaited<ReturnType<SmartContractAdminService['verifyAdminPermissions']>>
export type AdminInfo = Awaited<ReturnType<SmartContractAdminService['getAdminInfo']>>