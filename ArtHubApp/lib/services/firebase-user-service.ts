import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore'
import { 
  db, 
  type UserProfile, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

export class FirebaseUserService {
  /**
   * Create or update user profile on wallet connection
   */
  static async upsertUserProfile(walletAddress: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping user profile upsert')
      return null
    }

    try {
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, walletAddress.toLowerCase())
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile
      }

      const newProfile: UserProfile = {
        id: walletAddress.toLowerCase(),
        wallet_address: walletAddress.toLowerCase(),
        profile_complete: false,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      }

      await setDoc(userRef, newProfile)
      return newProfile
    } catch (error) {
      console.error('Error upserting user profile:', error)
      return null
    }
  }

  /**
   * Get user profile by wallet address
   */
  static async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping user profile fetch')
      return null
    }

    try {
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, walletAddress.toLowerCase())
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        return null
      }

      return userDoc.data() as UserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  /**
   * Update user profile with full profile data
   */
  static async updateUserProfile(
    walletAddress: string,
    profileData: Partial<Omit<UserProfile, 'id' | 'wallet_address' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping profile update')
      return null
    }

    try {
      // Validate uniqueness constraints
      const validation = await this.validateProfileData(
        { username: profileData.username, email: profileData.email },
        walletAddress
      )
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Validation failed')
      }

      // Get current profile to merge with new data
      const currentProfile = await this.getUserProfile(walletAddress)
      if (!currentProfile) {
        throw new Error('User profile not found')
      }

      const mergedData = { ...currentProfile, ...profileData }
      
      // Check if profile is complete based on required fields after merge
      const isComplete = this.checkProfileCompletion(mergedData)
      
      const updateData = {
        ...profileData,
        profile_complete: isComplete,
        updated_at: getCurrentTimestamp()
      }

      const userRef = doc(db, COLLECTIONS.USER_PROFILES, walletAddress.toLowerCase())
      await updateDoc(userRef, updateData)

      // Return updated profile
      const updatedProfile = { ...currentProfile, ...updateData }
      return updatedProfile
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  }

  /**
   * Check if profile is complete based on required fields
   */
  private static checkProfileCompletion(profileData: Partial<UserProfile>): boolean {
    const requiredFields = ['name', 'username', 'email']
    return requiredFields.every(field => {
      const value = profileData[field as keyof UserProfile]
      return value && typeof value === 'string' && value.trim().length > 0
    })
  }

  /**
   * Update profile completion status
   */
  static async updateProfileCompletion(
    walletAddress: string, 
    isComplete: boolean
  ): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping profile completion update')
      return false
    }

    try {
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, walletAddress.toLowerCase())
      await updateDoc(userRef, { 
        profile_complete: isComplete,
        updated_at: getCurrentTimestamp()
      })

      return true
    } catch (error) {
      console.error('Error updating profile completion:', error)
      return false
    }
  }

  /**
   * Check if user profile is complete
   */
  static async isProfileComplete(walletAddress: string): Promise<boolean> {
    const profile = await this.getUserProfile(walletAddress)
    return profile?.profile_complete || false
  }

  /**
   * Get all users with incomplete profiles (for admin use)
   */
  static async getUsersWithIncompleteProfiles(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USER_PROFILES), 
        where('profile_complete', '==', false)
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => doc.data() as UserProfile)
    } catch (error) {
      console.error('Error fetching incomplete profiles:', error)
      return []
    }
  }

  /**
   * Check if username is already taken by another user
   */
  static async isUsernameAvailable(username: string, currentWalletAddress?: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping username check')
      return true
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.USER_PROFILES),
        where('username', '==', username.toLowerCase())
      )
      const querySnapshot = await getDocs(q)

      // If updating existing profile, exclude current user
      if (currentWalletAddress) {
        const results = querySnapshot.docs.filter(
          doc => doc.id !== currentWalletAddress.toLowerCase()
        )
        return results.length === 0
      }

      return querySnapshot.empty
    } catch (error) {
      console.error('Error checking username availability:', error)
      return false
    }
  }

  /**
   * Check if email is already taken by another user
   */
  static async isEmailAvailable(email: string, currentWalletAddress?: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping email check')
      return true
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.USER_PROFILES),
        where('email', '==', email.toLowerCase())
      )
      const querySnapshot = await getDocs(q)

      // If updating existing profile, exclude current user
      if (currentWalletAddress) {
        const results = querySnapshot.docs.filter(
          doc => doc.id !== currentWalletAddress.toLowerCase()
        )
        return results.length === 0
      }

      return querySnapshot.empty
    } catch (error) {
      console.error('Error checking email availability:', error)
      return false
    }
  }

  /**
   * Validate profile data for uniqueness constraints
   */
  static async validateProfileData(
    profileData: { username?: string; email?: string },
    currentWalletAddress?: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check username availability
      if (profileData.username) {
        const usernameAvailable = await this.isUsernameAvailable(profileData.username, currentWalletAddress)
        if (!usernameAvailable) {
          return { isValid: false, error: 'Username is already taken' }
        }
      }

      // Check email availability
      if (profileData.email) {
        const emailAvailable = await this.isEmailAvailable(profileData.email, currentWalletAddress)
        if (!emailAvailable) {
          return { isValid: false, error: 'Email is already registered' }
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error in validateProfileData:', error)
      return { isValid: false, error: 'Validation failed' }
    }
  }

  /**
   * Delete user profile (for cleanup purposes)
   */
  static async deleteUserProfile(walletAddress: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, walletAddress.toLowerCase())
      await deleteDoc(userRef)
      return true
    } catch (error) {
      console.error('Error deleting user profile:', error)
      return false
    }
  }
}