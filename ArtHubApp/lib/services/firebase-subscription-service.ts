/**
 * Firebase Subscription Service V6
 * Firebase-based subscription management replacing expensive smart contract calls
 * Following user insight: "firebase database and no necesary use smart contracts what its using more for transactions"
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore'
import { 
  db, 
  isFirebaseConfigured, 
  getCurrentTimestamp 
} from '@/lib/firebase'

// V6 Subscription Types
export type V6PlanType = 'FREE' | 'MASTER' | 'ELITE'

export interface V6SubscriptionRecord {
  id: string // wallet_address
  wallet_address: string
  plan: V6PlanType
  plan_name: string
  is_active: boolean
  expires_at: string | null // ISO string
  nfts_minted: number // user-created only
  nft_limit: number
  auto_renew: boolean
  has_gasless_minting: boolean
  created_at: string
  updated_at: string
  // Additional metadata
  subscription_hash?: string // transaction hash when upgraded via contract
  last_reset_date?: string // for monthly quotas
}

export interface V6SubscriptionInfo {
  plan: V6PlanType
  planName: string
  isActive: boolean
  expiresAt: Date | null
  nftsMinted: number // user-created NFTs only
  nftLimit: number
  remainingNFTs: number
  autoRenew: boolean
  hasGaslessMinting: boolean
  // Additional display data
  totalNFTs?: number // includes claimable NFTs for info display
  userCreatedNFTs?: number // explicit user-created count for clarity
}

// V6 Plan Configurations
const V6_PLAN_CONFIGS = {
  FREE: {
    plan: 'FREE' as V6PlanType,
    planName: 'Free Plan',
    nftLimit: 1,
    hasGaslessMinting: true,
    duration: null, // no expiration
    price: 0
  },
  MASTER: {
    plan: 'MASTER' as V6PlanType,
    planName: 'Master Plan',
    nftLimit: 10,
    hasGaslessMinting: true,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    price: 4.99
  },
  ELITE: {
    plan: 'ELITE' as V6PlanType,
    planName: 'Elite Creator',
    nftLimit: 25,
    hasGaslessMinting: true,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    price: 9.99
  }
} as const

export class FirebaseSubscriptionService {
  private static readonly COLLECTION_NAME = 'user_subscriptions_v6'

  /**
   * Get user subscription from Firebase (replaces expensive contract calls)
   */
  static async getUserSubscription(walletAddress: string): Promise<V6SubscriptionInfo> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, returning default Free Plan')
      return this.getDefaultFreePlan()
    }

    try {
      const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
      const subscriptionDoc = await getDoc(subscriptionRef)

      let subscriptionData: V6SubscriptionRecord
      
      if (!subscriptionDoc.exists()) {
        // Create default Free Plan subscription for new users
        console.log('🆓 Creating default Free Plan for new user:', walletAddress)
        subscriptionData = await this.createDefaultSubscription(walletAddress)
      } else {
        subscriptionData = subscriptionDoc.data() as V6SubscriptionRecord
        
        // Check if subscription has expired and needs reset
        if (this.isSubscriptionExpired(subscriptionData)) {
          console.log('⏰ Subscription expired, resetting to Free Plan:', walletAddress)
          subscriptionData = await this.resetToFreePlan(walletAddress)
        }
        
        // Check if monthly quota needs reset
        if (this.shouldResetMonthlyQuota(subscriptionData)) {
          console.log('📅 Resetting monthly NFT quota for user:', walletAddress)
          subscriptionData = await this.resetMonthlyQuota(subscriptionData)
        }
      }

      // Get actual NFT counts from database for accurate display
      const nftCounts = await this.getUserNFTCounts(walletAddress)
      
      // Calculate remaining NFTs based on user-created count only
      const actualNftsMinted = Math.max(subscriptionData.nfts_minted, nftCounts.userCreatedCount)
      const remainingNFTs = Math.max(0, subscriptionData.nft_limit - actualNftsMinted)

      const result: V6SubscriptionInfo = {
        plan: subscriptionData.plan,
        planName: subscriptionData.plan_name,
        isActive: subscriptionData.is_active,
        expiresAt: subscriptionData.expires_at ? new Date(subscriptionData.expires_at) : null,
        nftsMinted: actualNftsMinted,
        nftLimit: subscriptionData.nft_limit,
        remainingNFTs,
        autoRenew: subscriptionData.auto_renew,
        hasGaslessMinting: subscriptionData.has_gasless_minting,
        // Additional display data
        totalNFTs: nftCounts.totalCount,
        userCreatedNFTs: nftCounts.userCreatedCount
      }

      // Update stored minted count if database has higher count
      if (actualNftsMinted > subscriptionData.nfts_minted) {
        await this.updateNFTMintedCount(walletAddress, actualNftsMinted)
      }

      console.log('📊 Firebase subscription loaded:', {
        wallet: walletAddress.substring(0, 10) + '...',
        plan: result.plan,
        nftsMinted: result.nftsMinted,
        nftLimit: result.nftLimit,
        remainingNFTs: result.remainingNFTs,
        totalNFTs: result.totalNFTs,
        userCreatedNFTs: result.userCreatedNFTs
      })

      return result

    } catch (error) {
      console.error('❌ Error loading Firebase subscription:', error)
      return this.getDefaultFreePlan()
    }
  }

  /**
   * Get user NFT counts from Firebase (user-created vs total)
   */
  private static async getUserNFTCounts(walletAddress: string): Promise<{
    totalCount: number
    userCreatedCount: number
  }> {
    try {
      // Get user-created NFTs count
      const userCreatedResponse = await fetch(`/api/nfts/user-created?wallet_address=${walletAddress}`)
      let userCreatedCount = 0
      if (userCreatedResponse.ok) {
        const userCreatedData = await userCreatedResponse.json()
        userCreatedCount = userCreatedData.count || 0
      }

      // Get total NFT count (includes claimable)
      const totalResponse = await fetch(`/api/nfts?wallet_address=${walletAddress}`)
      let totalCount = 0
      if (totalResponse.ok) {
        const totalData = await totalResponse.json()
        totalCount = totalData.nfts?.length || 0
      }

      return { totalCount, userCreatedCount }
    } catch (error) {
      console.warn('Could not fetch NFT counts:', error)
      return { totalCount: 0, userCreatedCount: 0 }
    }
  }

  /**
   * Create default Free Plan subscription for new users
   */
  private static async createDefaultSubscription(walletAddress: string): Promise<V6SubscriptionRecord> {
    const defaultSubscription: V6SubscriptionRecord = {
      id: walletAddress.toLowerCase(),
      wallet_address: walletAddress.toLowerCase(),
      plan: 'FREE',
      plan_name: 'Free Plan',
      is_active: true,
      expires_at: null,
      nfts_minted: 0,
      nft_limit: V6_PLAN_CONFIGS.FREE.nftLimit,
      auto_renew: false,
      has_gasless_minting: V6_PLAN_CONFIGS.FREE.hasGaslessMinting,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
      last_reset_date: getCurrentTimestamp()
    }

    const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
    await setDoc(subscriptionRef, defaultSubscription)
    
    return defaultSubscription
  }

  /**
   * Upgrade user subscription to Master Plan (called after successful transaction)
   */
  static async upgradeToMasterPlan(
    walletAddress: string, 
    transactionHash?: string
  ): Promise<V6SubscriptionRecord> {
    const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
    const expiresAt = new Date(Date.now() + V6_PLAN_CONFIGS.MASTER.duration!)

    const upgradeData: Partial<V6SubscriptionRecord> = {
      plan: 'MASTER',
      plan_name: V6_PLAN_CONFIGS.MASTER.planName,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      nft_limit: V6_PLAN_CONFIGS.MASTER.nftLimit,
      has_gasless_minting: V6_PLAN_CONFIGS.MASTER.hasGaslessMinting,
      auto_renew: false,
      updated_at: getCurrentTimestamp(),
      last_reset_date: getCurrentTimestamp()
    }

    if (transactionHash) {
      upgradeData.subscription_hash = transactionHash
    }

    // Get existing subscription or create new one
    const existingDoc = await getDoc(subscriptionRef)
    if (existingDoc.exists()) {
      await updateDoc(subscriptionRef, upgradeData)
      return { ...existingDoc.data(), ...upgradeData } as V6SubscriptionRecord
    } else {
      const newSubscription: V6SubscriptionRecord = {
        id: walletAddress.toLowerCase(),
        wallet_address: walletAddress.toLowerCase(),
        nfts_minted: 0,
        created_at: getCurrentTimestamp(),
        ...upgradeData
      } as V6SubscriptionRecord
      
      await setDoc(subscriptionRef, newSubscription)
      return newSubscription
    }
  }

  /**
   * Upgrade user subscription to Elite Plan (called after successful transaction)
   */
  static async upgradeToElitePlan(
    walletAddress: string, 
    transactionHash?: string
  ): Promise<V6SubscriptionRecord> {
    const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
    const expiresAt = new Date(Date.now() + V6_PLAN_CONFIGS.ELITE.duration!)

    const upgradeData: Partial<V6SubscriptionRecord> = {
      plan: 'ELITE',
      plan_name: V6_PLAN_CONFIGS.ELITE.planName,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      nft_limit: V6_PLAN_CONFIGS.ELITE.nftLimit,
      has_gasless_minting: V6_PLAN_CONFIGS.ELITE.hasGaslessMinting,
      auto_renew: false,
      updated_at: getCurrentTimestamp(),
      last_reset_date: getCurrentTimestamp()
    }

    if (transactionHash) {
      upgradeData.subscription_hash = transactionHash
    }

    // Get existing subscription or create new one
    const existingDoc = await getDoc(subscriptionRef)
    if (existingDoc.exists()) {
      await updateDoc(subscriptionRef, upgradeData)
      return { ...existingDoc.data(), ...upgradeData } as V6SubscriptionRecord
    } else {
      const newSubscription: V6SubscriptionRecord = {
        id: walletAddress.toLowerCase(),
        wallet_address: walletAddress.toLowerCase(),
        nfts_minted: 0,
        created_at: getCurrentTimestamp(),
        ...upgradeData
      } as V6SubscriptionRecord
      
      await setDoc(subscriptionRef, newSubscription)
      return newSubscription
    }
  }

  /**
   * Record NFT mint (only for user-created NFTs, not claimable)
   */
  static async recordNFTMint(walletAddress: string, amount: number = 1): Promise<void> {
    try {
      const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
      const subscriptionDoc = await getDoc(subscriptionRef)

      if (!subscriptionDoc.exists()) {
        // Create default subscription if none exists
        await this.createDefaultSubscription(walletAddress)
        return this.recordNFTMint(walletAddress, amount)
      }

      const currentData = subscriptionDoc.data() as V6SubscriptionRecord
      const newCount = currentData.nfts_minted + amount

      await updateDoc(subscriptionRef, {
        nfts_minted: newCount,
        updated_at: getCurrentTimestamp()
      })

      console.log('📝 Recorded NFT mint in Firebase:', {
        wallet: walletAddress.substring(0, 10) + '...',
        amount,
        newCount
      })
    } catch (error) {
      console.error('❌ Error recording NFT mint in Firebase:', error)
    }
  }

  /**
   * Check if user can mint NFT based on Firebase subscription
   */
  static async canUserMint(walletAddress: string): Promise<{
    canMint: boolean
    remainingNFTs: number
    reason?: string
  }> {
    try {
      const subscription = await this.getUserSubscription(walletAddress)
      
      const canMint = subscription.isActive && subscription.remainingNFTs > 0
      
      let reason: string | undefined
      if (!subscription.isActive) {
        reason = 'Subscription is not active'
      } else if (subscription.remainingNFTs <= 0) {
        reason = `Monthly limit reached (${subscription.nfts_minted}/${subscription.nftLimit})`
      }

      return {
        canMint,
        remainingNFTs: subscription.remainingNFTs,
        reason
      }
    } catch (error) {
      console.error('❌ Error checking mint capability:', error)
      // Default to allowing Free Plan minting on error
      return { canMint: true, remainingNFTs: 1 }
    }
  }

  /**
   * Update NFT minted count if database has higher accurate count
   */
  private static async updateNFTMintedCount(walletAddress: string, newCount: number): Promise<void> {
    try {
      const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
      await updateDoc(subscriptionRef, {
        nfts_minted: newCount,
        updated_at: getCurrentTimestamp()
      })
    } catch (error) {
      console.warn('Could not update NFT minted count:', error)
    }
  }

  /**
   * Check if subscription has expired
   */
  private static isSubscriptionExpired(subscription: V6SubscriptionRecord): boolean {
    if (!subscription.expires_at) return false // Free plan never expires
    
    const expirationDate = new Date(subscription.expires_at)
    return new Date() > expirationDate
  }

  /**
   * Check if monthly quota should be reset (for paid plans)
   */
  private static shouldResetMonthlyQuota(subscription: V6SubscriptionRecord): boolean {
    if (subscription.plan === 'FREE') return false // Free plan doesn't have monthly reset
    if (!subscription.last_reset_date) return true // No reset date recorded
    
    const lastReset = new Date(subscription.last_reset_date)
    const now = new Date()
    
    // Check if it's been more than 30 days since last reset
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceReset >= 30
  }

  /**
   * Reset subscription to Free Plan (when expired)
   */
  private static async resetToFreePlan(walletAddress: string): Promise<V6SubscriptionRecord> {
    const subscriptionRef = doc(db, this.COLLECTION_NAME, walletAddress.toLowerCase())
    
    const resetData: Partial<V6SubscriptionRecord> = {
      plan: 'FREE',
      plan_name: V6_PLAN_CONFIGS.FREE.planName,
      is_active: true,
      expires_at: null,
      nfts_minted: 0, // Reset NFT count for new month
      nft_limit: V6_PLAN_CONFIGS.FREE.nftLimit,
      has_gasless_minting: V6_PLAN_CONFIGS.FREE.hasGaslessMinting,
      auto_renew: false,
      updated_at: getCurrentTimestamp(),
      last_reset_date: getCurrentTimestamp()
    }

    await updateDoc(subscriptionRef, resetData)
    
    // Get updated document
    const updatedDoc = await getDoc(subscriptionRef)
    return updatedDoc.data() as V6SubscriptionRecord
  }

  /**
   * Reset monthly NFT quota for paid plans
   */
  private static async resetMonthlyQuota(subscription: V6SubscriptionRecord): Promise<V6SubscriptionRecord> {
    const subscriptionRef = doc(db, this.COLLECTION_NAME, subscription.wallet_address)
    
    const resetData: Partial<V6SubscriptionRecord> = {
      nfts_minted: 0,
      updated_at: getCurrentTimestamp(),
      last_reset_date: getCurrentTimestamp()
    }

    await updateDoc(subscriptionRef, resetData)
    
    return { ...subscription, ...resetData } as V6SubscriptionRecord
  }

  /**
   * Get default Free Plan info
   */
  private static getDefaultFreePlan(): V6SubscriptionInfo {
    return {
      plan: 'FREE',
      planName: 'Free Plan',
      isActive: true,
      expiresAt: null,
      nftsMinted: 0,
      nftLimit: V6_PLAN_CONFIGS.FREE.nftLimit,
      remainingNFTs: V6_PLAN_CONFIGS.FREE.nftLimit,
      autoRenew: false,
      hasGaslessMinting: V6_PLAN_CONFIGS.FREE.hasGaslessMinting
    }
  }

  /**
   * Get subscription statistics for admin
   */
  static async getSubscriptionStats(): Promise<{
    totalUsers: number
    freePlanUsers: number
    masterPlanUsers: number
    elitePlanUsers: number
    activeSubscriptions: number
  }> {
    try {
      const subscriptionsRef = collection(db, this.COLLECTION_NAME)
      const allSubscriptions = await getDocs(subscriptionsRef)
      
      let totalUsers = 0
      let freePlanUsers = 0
      let masterPlanUsers = 0
      let elitePlanUsers = 0
      let activeSubscriptions = 0

      allSubscriptions.forEach((doc) => {
        const subscription = doc.data() as V6SubscriptionRecord
        totalUsers++
        
        if (subscription.is_active) {
          activeSubscriptions++
        }
        
        switch (subscription.plan) {
          case 'FREE':
            freePlanUsers++
            break
          case 'MASTER':
            masterPlanUsers++
            break
          case 'ELITE':
            elitePlanUsers++
            break
        }
      })

      return {
        totalUsers,
        freePlanUsers,
        masterPlanUsers,
        elitePlanUsers,
        activeSubscriptions
      }
    } catch (error) {
      console.error('❌ Error getting subscription stats:', error)
      return {
        totalUsers: 0,
        freePlanUsers: 0,
        masterPlanUsers: 0,
        elitePlanUsers: 0,
        activeSubscriptions: 0
      }
    }
  }

  /**
   * Get all plan configurations
   */
  static getPlanConfigs() {
    return V6_PLAN_CONFIGS
  }
}

// Export types and configurations for use in components
export { V6_PLAN_CONFIGS }
export type { V6SubscriptionRecord, V6SubscriptionInfo, V6PlanType }