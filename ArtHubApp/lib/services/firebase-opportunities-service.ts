import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit,
  deleteDoc 
} from 'firebase/firestore'
import { 
  db, 
  type Opportunity, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

export class FirebaseOpportunitiesService {
  
  /**
   * Create a new opportunity
   */
  static async createOpportunity(
    opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Opportunity | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunity creation')
      return null
    }

    try {
      const opportunityId = generateId()
      const timestamp = getCurrentTimestamp()
      
      const newOpportunity: Opportunity = {
        id: opportunityId,
        ...opportunityData,
        deadline_date: new Date(opportunityData.deadline).toISOString(),
        status: opportunityData.status || 'draft',
        featured: opportunityData.featured || false,
        created_at: timestamp,
        updated_at: timestamp
      }

      // Filter out undefined values to prevent Firestore errors
      const cleanedOpportunity = Object.fromEntries(
        Object.entries(newOpportunity).filter(([_, value]) => value !== undefined)
      )

      const opportunityRef = doc(db, COLLECTIONS.OPPORTUNITIES, opportunityId)
      await setDoc(opportunityRef, cleanedOpportunity)

      console.log('✅ Created opportunity:', opportunityId)
      return newOpportunity
    } catch (error) {
      console.error('Error creating opportunity:', error)
      return null
    }
  }

  /**
   * Get opportunity by ID
   */
  static async getOpportunity(opportunityId: string): Promise<Opportunity | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunity fetch')
      return null
    }

    try {
      const opportunityRef = doc(db, COLLECTIONS.OPPORTUNITIES, opportunityId)
      const opportunityDoc = await getDoc(opportunityRef)

      if (!opportunityDoc.exists()) {
        return null
      }

      return opportunityDoc.data() as Opportunity
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      return null
    }
  }

  /**
   * Get all published opportunities
   */
  static async getPublishedOpportunities(
    category?: string,
    limit?: number,
    featuredOnly?: boolean
  ): Promise<Opportunity[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunities fetch')
      return []
    }

    try {
      const currentDate = new Date().toISOString()
      let queryConstraints = [
        where('status', '==', 'published'),
        where('deadline_date', '>=', currentDate),
        orderBy('deadline_date', 'asc')
      ]

      if (category) {
        queryConstraints.unshift(where('category', '==', category))
      }

      if (featuredOnly) {
        queryConstraints.unshift(where('featured', '==', true))
      }

      if (limit) {
        queryConstraints.push(firestoreLimit(limit))
      }

      const q = query(collection(db, COLLECTIONS.OPPORTUNITIES), ...queryConstraints)
      const querySnapshot = await getDocs(q)
      
      const opportunities = querySnapshot.docs.map(doc => doc.data() as Opportunity)
      
      console.log(`📊 Fetched ${opportunities.length} active opportunities`, {
        category,
        limit,
        featuredOnly
      })
      
      return opportunities
    } catch (error) {
      console.error('Error fetching active opportunities:', error)
      
      // Fallback: Get all opportunities and filter client-side
      try {
        const q = query(
          collection(db, COLLECTIONS.OPPORTUNITIES),
          where('status', '==', 'published')
        )
        const querySnapshot = await getDocs(q)
        let opportunities = querySnapshot.docs.map(doc => doc.data() as Opportunity)
        
        const currentDate = new Date()
        opportunities = opportunities
          .filter(opp => new Date(opp.deadline_date) >= currentDate)
          .filter(opp => !category || opp.category === category)
          .filter(opp => !featuredOnly || opp.featured)
          .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime())
        
        if (limit) {
          opportunities = opportunities.slice(0, limit)
        }
        
        console.log('📊 Fallback client-side filtering applied')
        return opportunities
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Get all opportunities (for admin)
   */
  static async getAllOpportunities(status?: string): Promise<Opportunity[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunities fetch')
      return []
    }

    try {
      let queryConstraints = [orderBy('created_at', 'desc')]
      
      if (status) {
        queryConstraints.unshift(where('status', '==', status))
      }

      const q = query(collection(db, COLLECTIONS.OPPORTUNITIES), ...queryConstraints)
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => doc.data() as Opportunity)
    } catch (error) {
      console.error('Error fetching all opportunities:', error)
      return []
    }
  }

  /**
   * Get featured opportunities
   */
  static async getFeaturedOpportunities(limit: number = 6): Promise<Opportunity[]> {
    return this.getPublishedOpportunities(undefined, limit, true)
  }

  /**
   * Get opportunities by category
   */
  static async getOpportunitiesByCategory(category: string, limit?: number): Promise<Opportunity[]> {
    return this.getPublishedOpportunities(category, limit)
  }

  /**
   * Search opportunities by title or organization
   */
  static async searchOpportunities(searchTerm: string): Promise<Opportunity[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunity search')
      return []
    }

    try {
      // Note: Firestore doesn't have built-in full-text search
      // This is a basic implementation that gets all published opportunities and filters client-side
      const opportunities = await this.getPublishedOpportunities()
      
      return opportunities.filter(opp => 
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.tags && opp.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    } catch (error) {
      console.error('Error searching opportunities:', error)
      return []
    }
  }

  /**
   * Update opportunity
   */
  static async updateOpportunity(
    opportunityId: string,
    updateData: Partial<Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Opportunity | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunity update')
      return null
    }

    try {
      const opportunityRef = doc(db, COLLECTIONS.OPPORTUNITIES, opportunityId)
      
      const updatePayload: any = {
        ...updateData,
        updated_at: getCurrentTimestamp()
      }
      
      // If deadline is being updated, update deadline_date too
      if (updateData.deadline) {
        updatePayload.deadline_date = new Date(updateData.deadline).toISOString()
      }
      
      // Filter out undefined values to prevent Firestore errors
      const cleanedUpdatePayload = Object.fromEntries(
        Object.entries(updatePayload).filter(([_, value]) => value !== undefined)
      )
      
      await updateDoc(opportunityRef, cleanedUpdatePayload)
      
      // Return updated opportunity
      const opportunityDoc = await getDoc(opportunityRef)
      const updatedOpportunity = opportunityDoc.exists() ? opportunityDoc.data() as Opportunity : null
      
      console.log('✅ Updated opportunity:', opportunityId)
      return updatedOpportunity
    } catch (error) {
      console.error('Error updating opportunity:', error)
      return null
    }
  }

  /**
   * Delete opportunity
   */
  static async deleteOpportunity(opportunityId: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunity deletion')
      return false
    }

    try {
      const opportunityRef = doc(db, COLLECTIONS.OPPORTUNITIES, opportunityId)
      await deleteDoc(opportunityRef)
      
      console.log('✅ Deleted opportunity:', opportunityId)
      return true
    } catch (error) {
      console.error('Error deleting opportunity:', error)
      return false
    }
  }

  /**
   * Mark expired opportunities
   * Should be called periodically to update status
   */
  static async markExpiredOpportunities(): Promise<number> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping expired opportunities update')
      return 0
    }

    try {
      const currentDate = new Date().toISOString()
      
      // Get active opportunities that have passed their deadline
      const q = query(
        collection(db, COLLECTIONS.OPPORTUNITIES),
        where('status', '==', 'published'),
        where('deadline_date', '<', currentDate)
      )
      
      const querySnapshot = await getDocs(q)
      const expiredOpportunities = querySnapshot.docs
      
      console.log(`📊 Found ${expiredOpportunities.length} opportunities to mark as expired`)
      
      // Update each expired opportunity
      const updatePromises = expiredOpportunities.map(doc => 
        updateDoc(doc.ref, { 
          status: 'expired',
          updated_at: getCurrentTimestamp()
        })
      )
      
      await Promise.all(updatePromises)
      
      console.log(`✅ Marked ${expiredOpportunities.length} opportunities as expired`)
      return expiredOpportunities.length
    } catch (error) {
      console.error('Error marking expired opportunities:', error)
      return 0
    }
  }

  /**
   * Get opportunity statistics
   */
  static async getOpportunityStatistics(): Promise<{
    totalDraft: number
    totalPublished: number
    totalExpired: number
    totalByCategory: Record<string, number>
    averageAmount: number
    upcomingDeadlines: Opportunity[]
  }> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping opportunity statistics')
      return {
        totalDraft: 0,
        totalPublished: 0,
        totalExpired: 0,
        totalByCategory: {},
        averageAmount: 0,
        upcomingDeadlines: []
      }
    }

    try {
      const q = query(collection(db, COLLECTIONS.OPPORTUNITIES))
      const querySnapshot = await getDocs(q)
      const allOpportunities = querySnapshot.docs.map(doc => doc.data() as Opportunity)
      
      const totalDraft = allOpportunities.filter(opp => opp.status === 'draft').length
      const totalPublished = allOpportunities.filter(opp => opp.status === 'published').length
      const totalExpired = allOpportunities.filter(opp => opp.status === 'expired').length
      
      const totalByCategory: Record<string, number> = {}
      let totalAmount = 0
      let amountCount = 0
      
      allOpportunities.forEach(opp => {
        // Category count
        totalByCategory[opp.category] = (totalByCategory[opp.category] || 0) + 1
        
        // Average amount calculation
        if (opp.amount_min) {
          totalAmount += opp.amount_min
          amountCount++
        }
      })
      
      const averageAmount = amountCount > 0 ? totalAmount / amountCount : 0
      
      // Get upcoming deadlines (next 30 days)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      
      const upcomingDeadlines = allOpportunities
        .filter(opp => 
          opp.status === 'published' &&
          new Date(opp.deadline_date) <= futureDate &&
          new Date(opp.deadline_date) >= new Date()
        )
        .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime())
        .slice(0, 5)
      
      return {
        totalDraft,
        totalPublished,
        totalExpired,
        totalByCategory,
        averageAmount,
        upcomingDeadlines
      }
    } catch (error) {
      console.error('Error getting opportunity statistics:', error)
      return {
        totalDraft: 0,
        totalPublished: 0,
        totalExpired: 0,
        totalByCategory: {},
        averageAmount: 0,
        upcomingDeadlines: []
      }
    }
  }

  /**
   * Get opportunities with personalized recommendations
   * Based on user profile and difficulty level
   */
  static async getRecommendedOpportunities(
    userWalletAddress?: string,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'any' = 'any'
  ): Promise<Opportunity[]> {
    try {
      let opportunities = await this.getPublishedOpportunities()
      
      // Filter by difficulty level
      if (difficultyLevel !== 'any') {
        opportunities = opportunities.filter(opp => 
          opp.difficulty_level === difficultyLevel || opp.difficulty_level === 'any'
        )
      }
      
      // TODO: Add more sophisticated recommendation logic based on user profile
      // This could include:
      // - User's art interests from user memory
      // - Previous application history
      // - Geographic location matching
      // - Amount range preferences
      
      // For now, prioritize featured opportunities and recent additions
      return opportunities
        .sort((a, b) => {
          // Featured opportunities first
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          
          // Then by deadline (sooner first)
          return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
        })
        .slice(0, 10)
        
    } catch (error) {
      console.error('Error getting recommended opportunities:', error)
      return []
    }
  }
}