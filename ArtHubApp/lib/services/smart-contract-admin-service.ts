/**
 * Smart Contract Admin Service - Production-ready admin validation using on-chain contracts
 * Replaces Firebase and localStorage admin management with smart contract-based validation
 */

import { createPublicClient, http, Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'

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

  constructor() {
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
  }

  /**
   * Check if an address is an admin by verifying contract ownership
   */
  async isAdmin(address: string | undefined): Promise<boolean> {
    if (!address) return false

    try {
      const normalizedAddress = address.toLowerCase() as Address
      const adminAddress = this.contracts.adminWallet.toLowerCase()

      // Primary check: Direct admin wallet match
      if (normalizedAddress === adminAddress) {
        return true
      }

      // Secondary check: Contract owner verification
      const factoryOwner = await this.publicClient.readContract({
        address: this.contracts.factoryV6,
        abi: OWNABLE_ABI,
        functionName: 'owner',
      })

      const subscriptionOwner = await this.publicClient.readContract({
        address: this.contracts.subscriptionV6,
        abi: OWNABLE_ABI,
        functionName: 'owner',
      })

      // Check if address matches any contract owner
      const isFactoryOwner = normalizedAddress === factoryOwner.toLowerCase()
      const isSubscriptionOwner = normalizedAddress === subscriptionOwner.toLowerCase()

      return isFactoryOwner || isSubscriptionOwner

    } catch (error) {
      console.error('SmartContractAdminService: Error checking admin status:', error)
      
      // Fallback to environment admin check if contracts are unavailable
      const envAdmin = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()
      return envAdmin ? address.toLowerCase() === envAdmin : false
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
        this.publicClient.readContract({
          address: this.contracts.factoryV6,
          abi: OWNABLE_ABI,
          functionName: 'owner',
        }),
        this.publicClient.readContract({
          address: this.contracts.subscriptionV6,
          abi: OWNABLE_ABI,
          functionName: 'owner',
        }),
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
    if (!address) {
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

      const [factoryOwner, subscriptionOwner] = await Promise.all([
        this.publicClient.readContract({
          address: this.contracts.factoryV6,
          abi: OWNABLE_ABI,
          functionName: 'owner',
        }),
        this.publicClient.readContract({
          address: this.contracts.subscriptionV6,
          abi: OWNABLE_ABI,
          functionName: 'owner',
        }),
      ])

      const isAdminWallet = normalizedAddress === adminAddress
      const isFactoryOwner = normalizedAddress === (factoryOwner as string).toLowerCase()
      const isSubscriptionOwner = normalizedAddress === (subscriptionOwner as string).toLowerCase()
      const isAdmin = isAdminWallet || isFactoryOwner || isSubscriptionOwner

      return {
        isAdmin,
        isFactoryOwner,
        isSubscriptionOwner,
        isAdminWallet,
        contractAddresses: this.contracts,
      }
    } catch (error) {
      console.error('SmartContractAdminService: Error verifying admin permissions:', error)
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
}

// Create singleton instance
export const smartContractAdminService = new SmartContractAdminService()

// Hook for React components
export function useSmartContractAdminService() {
  return smartContractAdminService
}

// Export types for TypeScript
export type AdminPermissions = Awaited<ReturnType<SmartContractAdminService['verifyAdminPermissions']>>
export type AdminInfo = Awaited<ReturnType<SmartContractAdminService['getAdminInfo']>>