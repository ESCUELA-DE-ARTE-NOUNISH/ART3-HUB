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
  type Community, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

export class FirebaseCommunitiesService {
  
  /**
   * Create a new community
   */
  static async createCommunity(
    communityData: Omit<Community, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Community | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping community creation')
      return null
    }

    try {
      const communityId = generateId()
      const timestamp = getCurrentTimestamp()
      
      const newCommunity: Community = {
        id: communityId,
        ...communityData,
        status: communityData.status || 'draft',
        featured: communityData.featured || false,
        created_at: timestamp,
        updated_at: timestamp
      }

      // Filter out undefined values to prevent Firestore errors
      const cleanedCommunity = Object.fromEntries(
        Object.entries(newCommunity).filter(([_, value]) => value !== undefined)
      )

      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId)
      await setDoc(communityRef, cleanedCommunity)

      console.log('✅ Created community:', communityId)
      return newCommunity
    } catch (error) {
      console.error('Error creating community:', error)
      return null
    }
  }

  /**
   * Get community by ID
   */
  static async getCommunity(communityId: string): Promise<Community | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping community fetch')
      return null
    }

    try {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId)
      const communityDoc = await getDoc(communityRef)

      if (!communityDoc.exists()) {
        return null
      }

      return communityDoc.data() as Community
    } catch (error) {
      console.error('Error fetching community:', error)
      return null
    }
  }

  /**
   * Get all published communities
   */
  static async getPublishedCommunities(
    limit?: number,
    featuredOnly?: boolean
  ): Promise<Community[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping communities fetch')
      return []
    }

    try {
      let queryConstraints = [
        where('status', '==', 'published'),
        orderBy('created_at', 'desc')
      ]

      if (featuredOnly) {
        queryConstraints.unshift(where('featured', '==', true))
      }

      if (limit) {
        queryConstraints.push(firestoreLimit(limit))
      }

      const q = query(collection(db, COLLECTIONS.COMMUNITIES), ...queryConstraints)
      const querySnapshot = await getDocs(q)
      
      const communities = querySnapshot.docs.map(doc => doc.data() as Community)
      
      console.log(`📊 Fetched ${communities.length} published communities`, {
        limit,
        featuredOnly
      })
      
      return communities
    } catch (error) {
      console.error('Error fetching published communities:', error)
      
      // Fallback: Get all communities and filter client-side
      try {
        const q = query(
          collection(db, COLLECTIONS.COMMUNITIES),
          where('status', '==', 'published')
        )
        const querySnapshot = await getDocs(q)
        let communities = querySnapshot.docs.map(doc => doc.data() as Community)
        
        communities = communities
          .filter(community => !featuredOnly || community.featured)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        if (limit) {
          communities = communities.slice(0, limit)
        }
        
        console.log('📊 Fallback client-side filtering applied')
        return communities
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Get all communities (for admin)
   */
  static async getAllCommunities(status?: string): Promise<Community[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping communities fetch')
      return []
    }

    try {
      let queryConstraints = [orderBy('created_at', 'desc')]
      
      if (status) {
        queryConstraints.unshift(where('status', '==', status))
      }

      const q = query(collection(db, COLLECTIONS.COMMUNITIES), ...queryConstraints)
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => doc.data() as Community)
    } catch (error) {
      console.error('Error fetching all communities:', error)
      return []
    }
  }

  /**
   * Get featured communities
   */
  static async getFeaturedCommunities(limit: number = 6): Promise<Community[]> {
    return this.getPublishedCommunities(limit, true)
  }

  /**
   * Search communities by title or description
   */
  static async searchCommunities(searchTerm: string): Promise<Community[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping community search')
      return []
    }

    try {
      // Note: Firestore doesn't have built-in full-text search
      // This is a basic implementation that gets all published communities and filters client-side
      const communities = await this.getPublishedCommunities()
      
      return communities.filter(community => 
        community.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    } catch (error) {
      console.error('Error searching communities:', error)
      return []
    }
  }

  /**
   * Update community
   */
  static async updateCommunity(
    communityId: string,
    updateData: Partial<Omit<Community, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Community | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping community update')
      return null
    }

    try {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId)
      
      const updatePayload: any = {
        ...updateData,
        updated_at: getCurrentTimestamp()
      }
      
      // Filter out undefined values to prevent Firestore errors
      const cleanedUpdatePayload = Object.fromEntries(
        Object.entries(updatePayload).filter(([_, value]) => value !== undefined)
      )
      
      await updateDoc(communityRef, cleanedUpdatePayload)
      
      // Return updated community
      const communityDoc = await getDoc(communityRef)
      const updatedCommunity = communityDoc.exists() ? communityDoc.data() as Community : null
      
      console.log('✅ Updated community:', communityId)
      return updatedCommunity
    } catch (error) {
      console.error('Error updating community:', error)
      return null
    }
  }

  /**
   * Delete community
   */
  static async deleteCommunity(communityId: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping community deletion')
      return false
    }

    try {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId)
      await deleteDoc(communityRef)
      
      console.log('✅ Deleted community:', communityId)
      return true
    } catch (error) {
      console.error('Error deleting community:', error)
      return false
    }
  }

  /**
   * Get community statistics
   */
  static async getCommunitiesStatistics(): Promise<{
    totalDraft: number
    totalPublished: number
    totalArchived: number
    totalFeatured: number
  }> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping community statistics')
      return {
        totalDraft: 0,
        totalPublished: 0,
        totalArchived: 0,
        totalFeatured: 0
      }
    }

    try {
      const q = query(collection(db, COLLECTIONS.COMMUNITIES))
      const querySnapshot = await getDocs(q)
      const allCommunities = querySnapshot.docs.map(doc => doc.data() as Community)
      
      const totalDraft = allCommunities.filter(community => community.status === 'draft').length
      const totalPublished = allCommunities.filter(community => community.status === 'published').length
      const totalArchived = allCommunities.filter(community => community.status === 'archived').length
      const totalFeatured = allCommunities.filter(community => community.featured).length
      
      return {
        totalDraft,
        totalPublished,
        totalArchived,
        totalFeatured
      }
    } catch (error) {
      console.error('Error getting community statistics:', error)
      return {
        totalDraft: 0,
        totalPublished: 0,
        totalArchived: 0,
        totalFeatured: 0
      }
    }
  }
}