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
      console.error('Firebase not configured, cannot update profile')
      throw new Error('Firebase not configured')
    }

    try {
      console.log('FirebaseUserService: Starting profile update for', walletAddress)
      console.log('FirebaseUserService: Profile data to update:', profileData)

      // Get current profile to merge with new data
      const currentProfile = await this.getUserProfile(walletAddress)
      if (!currentProfile) {
        console.error('FirebaseUserService: User profile not found for', walletAddress)
        throw new Error('User profile not found')
      }

      console.log('FirebaseUserService: Current profile found:', currentProfile)

      const mergedData = { ...currentProfile, ...profileData }
      console.log('FirebaseUserService: Merged data:', mergedData)
      
      // Check if profile is complete based on required fields after merge
      const isComplete = this.checkProfileCompletion(mergedData)
      console.log('FirebaseUserService: Profile completeness check:', isComplete)
      
      const updateData = {
        ...profileData,
        profile_complete: isComplete,
        updated_at: getCurrentTimestamp()
      }

      console.log('FirebaseUserService: Final update data:', updateData)

      const userRef = doc(db, COLLECTIONS.USER_PROFILES, walletAddress.toLowerCase())
      console.log('FirebaseUserService: Updating document at:', userRef.path)
      
      await updateDoc(userRef, updateData)
      console.log('FirebaseUserService: Update completed successfully')

      // Return updated profile
      const updatedProfile = { ...currentProfile, ...updateData }
      console.log('FirebaseUserService: Returning updated profile:', updatedProfile)
      return updatedProfile
    } catch (error) {
      console.error('FirebaseUserService: Error updating user profile:', error)
      if (error instanceof Error) {
        throw error // Re-throw with original message
      }
      throw new Error('Failed to update profile')
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
      console.log('FirebaseUserService: Checking username availability for:', username)
      
      const q = query(
        collection(db, COLLECTIONS.USER_PROFILES),
        where('username', '==', username.toLowerCase())
      )
      const querySnapshot = await getDocs(q)

      console.log('FirebaseUserService: Username query results:', querySnapshot.size, 'documents found')

      // If updating existing profile, exclude current user
      if (currentWalletAddress) {
        const results = querySnapshot.docs.filter(
          doc => doc.id !== currentWalletAddress.toLowerCase()
        )
        console.log('FirebaseUserService: After filtering current user:', results.length, 'conflicting documents')
        return results.length === 0
      }

      const isAvailable = querySnapshot.empty
      console.log('FirebaseUserService: Username available:', isAvailable)
      return isAvailable
    } catch (error) {
      console.error('FirebaseUserService: Error checking username availability:', error)
      throw new Error(`Failed to check username availability: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      console.log('FirebaseUserService: Checking email availability for:', email)
      
      const q = query(
        collection(db, COLLECTIONS.USER_PROFILES),
        where('email', '==', email.toLowerCase())
      )
      const querySnapshot = await getDocs(q)

      console.log('FirebaseUserService: Email query results:', querySnapshot.size, 'documents found')

      // If updating existing profile, exclude current user
      if (currentWalletAddress) {
        const results = querySnapshot.docs.filter(
          doc => doc.id !== currentWalletAddress.toLowerCase()
        )
        console.log('FirebaseUserService: After filtering current user:', results.length, 'conflicting documents')
        return results.length === 0
      }

      const isAvailable = querySnapshot.empty
      console.log('FirebaseUserService: Email available:', isAvailable)
      return isAvailable
    } catch (error) {
      console.error('FirebaseUserService: Error checking email availability:', error)
      throw new Error(`Failed to check email availability: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      console.log('FirebaseUserService: Starting validation for profile data:', profileData)
      console.log('FirebaseUserService: Current wallet address:', currentWalletAddress)

      // Check username availability
      if (profileData.username) {
        console.log('FirebaseUserService: Validating username...')
        try {
          const usernameAvailable = await this.isUsernameAvailable(profileData.username, currentWalletAddress)
          if (!usernameAvailable) {
            console.log('FirebaseUserService: Username not available')
            return { isValid: false, error: 'Username is already taken' }
          }
          console.log('FirebaseUserService: Username validation passed')
        } catch (error) {
          console.error('FirebaseUserService: Username validation failed:', error)
          return { isValid: false, error: `Username validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
        }
      }

      // Check email availability
      if (profileData.email) {
        console.log('FirebaseUserService: Validating email...')
        try {
          const emailAvailable = await this.isEmailAvailable(profileData.email, currentWalletAddress)
          if (!emailAvailable) {
            console.log('FirebaseUserService: Email not available')
            return { isValid: false, error: 'Email is already registered' }
          }
          console.log('FirebaseUserService: Email validation passed')
        } catch (error) {
          console.error('FirebaseUserService: Email validation failed:', error)
          return { isValid: false, error: `Email validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
        }
      }

      console.log('FirebaseUserService: All validations passed')
      return { isValid: true }
    } catch (error) {
      console.error('FirebaseUserService: Error in validateProfileData:', error)
      return { isValid: false, error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` }
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