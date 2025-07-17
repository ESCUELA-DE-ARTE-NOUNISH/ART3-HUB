import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db, COLLECTIONS, isFirebaseConfigured, generateId, getCurrentTimestamp } from '../firebase'
import type { UserSession, PrivyLinkedAccount, UserAnalytics } from '../firebase'

export class FirebaseUserSessionService {
  /**
   * Track user login from Privy authentication
   */
  static async trackUserLogin(privyUser: any, walletAddress: string): Promise<UserSession | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping user session tracking')
      return null
    }

    try {
      const sessionId = `session_${walletAddress.toLowerCase()}`
      const sessionRef = doc(db, COLLECTIONS.USER_SESSIONS, sessionId)
      
      // Get existing session or create new one
      const existingSession = await getDoc(sessionRef)
      const now = getCurrentTimestamp()
      
      // Process linked accounts from Privy
      const linkedAccounts: PrivyLinkedAccount[] = privyUser.linkedAccounts?.map((account: any) => ({
        type: account.type,
        address: account.address,
        email: account.email,
        phone: account.phoneNumber,
        subject: account.subject,
        name: account.name,
        username: account.username,
        first_verified_at: account.firstVerifiedAt || now,
        latest_verified_at: account.latestVerifiedAt || now
      })) || []

      let sessionData: UserSession

      if (existingSession.exists()) {
        // Update existing session
        const currentData = existingSession.data() as UserSession
        sessionData = {
          ...currentData,
          last_login_date: now,
          total_logins: currentData.total_logins + 1,
          email: privyUser.email?.address ?? currentData.email ?? null,
          phone: privyUser.phone?.number ?? currentData.phone ?? null,
          linked_accounts: linkedAccounts,
          updated_at: now
        }
        
        await updateDoc(sessionRef, {
          last_login_date: now,
          total_logins: increment(1),
          email: privyUser.email?.address ?? null,
          phone: privyUser.phone?.number ?? null,
          linked_accounts: linkedAccounts,
          updated_at: now
        })
      } else {
        // Create new session
        sessionData = {
          id: sessionId,
          wallet_address: walletAddress.toLowerCase(),
          privy_user_id: privyUser.id,
          email: privyUser.email?.address ?? null,
          phone: privyUser.phone?.number ?? null,
          linked_accounts: linkedAccounts,
          first_login_date: now,
          last_login_date: now,
          total_logins: 1,
          created_at: now,
          updated_at: now
        }
        
        await setDoc(sessionRef, sessionData)
      }

      // Log analytics event
      await this.logAnalyticsEvent(walletAddress, 'login', {
        privy_user_id: privyUser.id,
        linked_accounts_count: linkedAccounts.length,
        total_logins: sessionData.total_logins,
        session_type: existingSession.exists() ? 'returning' : 'first_time'
      })

      console.log('✅ User session tracked successfully:', sessionId)
      return sessionData
    } catch (error) {
      console.error('❌ Error tracking user session:', error)
      return null
    }
  }

  /**
   * Get user session data
   */
  static async getUserSession(walletAddress: string): Promise<UserSession | null> {
    if (!isFirebaseConfigured()) {
      return null
    }

    try {
      const sessionId = `session_${walletAddress.toLowerCase()}`
      const sessionRef = doc(db, COLLECTIONS.USER_SESSIONS, sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (sessionDoc.exists()) {
        return sessionDoc.data() as UserSession
      }
      return null
    } catch (error) {
      console.error('❌ Error getting user session:', error)
      return null
    }
  }

  /**
   * Log analytics event
   */
  static async logAnalyticsEvent(
    walletAddress: string, 
    eventType: UserAnalytics['event_type'], 
    eventData: Record<string, any> = {},
    additionalInfo: Partial<UserAnalytics> = {}
  ): Promise<string | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping analytics logging')
      return null
    }

    try {
      const analyticsData: Omit<UserAnalytics, 'id'> = {
        wallet_address: walletAddress.toLowerCase(),
        event_type: eventType,
        event_data: eventData,
        user_agent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
        session_id: additionalInfo.session_id,
        ip_address: additionalInfo.ip_address,
        created_at: getCurrentTimestamp()
      }

      const analyticsRef = collection(db, COLLECTIONS.USER_ANALYTICS)
      const docRef = await addDoc(analyticsRef, analyticsData)
      
      console.log('📊 Analytics event logged:', eventType, docRef.id)
      return docRef.id
    } catch (error) {
      console.error('❌ Error logging analytics event:', error)
      return null
    }
  }

  /**
   * Track user logout
   */
  static async trackUserLogout(walletAddress: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      return
    }

    try {
      await this.logAnalyticsEvent(walletAddress, 'logout', {
        logout_time: getCurrentTimestamp()
      })
      
      console.log('👋 User logout tracked successfully')
    } catch (error) {
      console.error('❌ Error tracking user logout:', error)
    }
  }

  /**
   * Get user analytics for admin dashboard
   */
  static async getUserAnalytics(
    walletAddress?: string, 
    eventType?: UserAnalytics['event_type'],
    limitCount: number = 100
  ): Promise<UserAnalytics[]> {
    if (!isFirebaseConfigured()) {
      return []
    }

    try {
      let q = query(
        collection(db, COLLECTIONS.USER_ANALYTICS),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      )

      if (walletAddress) {
        q = query(
          collection(db, COLLECTIONS.USER_ANALYTICS),
          where('wallet_address', '==', walletAddress.toLowerCase()),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        )
      }

      if (eventType) {
        q = query(
          collection(db, COLLECTIONS.USER_ANALYTICS),
          where('event_type', '==', eventType),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        )
      }

      const querySnapshot = await getDocs(q)
      const analytics: UserAnalytics[] = []
      
      querySnapshot.forEach((doc) => {
        analytics.push({
          id: doc.id,
          ...doc.data()
        } as UserAnalytics)
      })

      return analytics
    } catch (error) {
      console.error('❌ Error getting user analytics:', error)
      return []
    }
  }

  /**
   * Get platform statistics for admin dashboard
   */
  static async getPlatformStats(): Promise<{
    totalUsers: number
    newUsersToday: number
    totalLogins: number
    activeUsersToday: number
    topEvents: Array<{ event_type: string; count: number }>
  } | null> {
    if (!isFirebaseConfigured()) {
      return null
    }

    try {
      // Get all user sessions
      const sessionsQuery = query(collection(db, COLLECTIONS.USER_SESSIONS))
      const sessionsSnapshot = await getDocs(sessionsQuery)
      
      // Get today's analytics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      
      const todayAnalyticsQuery = query(
        collection(db, COLLECTIONS.USER_ANALYTICS),
        where('created_at', '>=', todayISO),
        orderBy('created_at', 'desc')
      )
      const todayAnalyticsSnapshot = await getDocs(todayAnalyticsQuery)

      // Calculate stats
      let totalLogins = 0
      let newUsersToday = 0
      const uniqueUsersToday = new Set<string>()
      const eventCounts: Record<string, number> = {}

      sessionsSnapshot.forEach((doc) => {
        const session = doc.data() as UserSession
        totalLogins += session.total_logins
        
        if (session.first_login_date >= todayISO) {
          newUsersToday++
        }
      })

      todayAnalyticsSnapshot.forEach((doc) => {
        const analytics = doc.data() as UserAnalytics
        uniqueUsersToday.add(analytics.wallet_address)
        eventCounts[analytics.event_type] = (eventCounts[analytics.event_type] || 0) + 1
      })

      const topEvents = Object.entries(eventCounts)
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalUsers: sessionsSnapshot.size,
        newUsersToday,
        totalLogins,
        activeUsersToday: uniqueUsersToday.size,
        topEvents
      }
    } catch (error) {
      console.error('❌ Error getting platform stats:', error)
      return null
    }
  }

  /**
   * Track AI interaction
   */
  static async trackAIInteraction(
    walletAddress: string, 
    interactionData: {
      message_count: number
      session_duration?: number
      topics_discussed?: string[]
      outcome?: string
    }
  ): Promise<void> {
    await this.logAnalyticsEvent(walletAddress, 'ai_interaction', interactionData)
  }

  /**
   * Track NFT creation
   */
  static async trackNFTCreation(
    walletAddress: string, 
    nftData: {
      contract_address: string
      token_id?: number
      collection_name?: string
      transaction_hash?: string
    }
  ): Promise<void> {
    await this.logAnalyticsEvent(walletAddress, 'nft_created', nftData)
  }

  /**
   * Track collection creation
   */
  static async trackCollectionCreation(
    walletAddress: string, 
    collectionData: {
      contract_address: string
      collection_name: string
      transaction_hash?: string
    }
  ): Promise<void> {
    await this.logAnalyticsEvent(walletAddress, 'collection_created', collectionData)
  }

  /**
   * Track subscription purchase
   */
  static async trackSubscriptionPurchase(
    walletAddress: string, 
    subscriptionData: {
      plan_type: string
      amount_paid: string
      currency: string
      transaction_hash?: string
    }
  ): Promise<void> {
    await this.logAnalyticsEvent(walletAddress, 'subscription_purchased', subscriptionData)
  }
}