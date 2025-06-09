import { supabase, type UserProfile, isSupabaseConfigured } from '@/lib/supabase'

export class UserService {
  /**
   * Create or update user profile on wallet connection
   */
  static async upsertUserProfile(walletAddress: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping user profile upsert')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            wallet_address: walletAddress.toLowerCase(),
            profile_complete: false
          },
          {
            onConflict: 'wallet_address',
            ignoreDuplicates: false
          }
        )
        .select()
        .single()

      if (error) {
        console.error('Error upserting user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in upsertUserProfile:', error)
      return null
    }
  }

  /**
   * Get user profile by wallet address
   */
  static async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping user profile fetch')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user profile:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Error in getUserProfile:', error)
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
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping profile update')
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
      const mergedData = { ...currentProfile, ...profileData }
      
      // Check if profile is complete based on required fields after merge
      const isComplete = this.checkProfileCompletion(mergedData)
      
      const updateData = {
        ...profileData,
        profile_complete: isComplete,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('wallet_address', walletAddress.toLowerCase())
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
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
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping profile completion update')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          profile_complete: isComplete,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress.toLowerCase())

      if (error) {
        console.error('Error updating profile completion:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateProfileCompletion:', error)
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('profile_complete', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching incomplete profiles:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUsersWithIncompleteProfiles:', error)
      return []
    }
  }

  /**
   * Check if username is already taken by another user
   */
  static async isUsernameAvailable(username: string, currentWalletAddress?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping username check')
      return true
    }

    try {
      let query = supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('username', username.toLowerCase())

      // If updating existing profile, exclude current user
      if (currentWalletAddress) {
        query = query.neq('wallet_address', currentWalletAddress.toLowerCase())
      }

      const { data, error } = await query

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking username availability:', error)
        return false
      }

      return !data || data.length === 0
    } catch (error) {
      console.error('Error in isUsernameAvailable:', error)
      return false
    }
  }

  /**
   * Check if email is already taken by another user
   */
  static async isEmailAvailable(email: string, currentWalletAddress?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping email check')
      return true
    }

    try {
      let query = supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('email', email.toLowerCase())

      // If updating existing profile, exclude current user
      if (currentWalletAddress) {
        query = query.neq('wallet_address', currentWalletAddress.toLowerCase())
      }

      const { data, error } = await query

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking email availability:', error)
        return false
      }

      return !data || data.length === 0
    } catch (error) {
      console.error('Error in isEmailAvailable:', error)
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
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('wallet_address', walletAddress.toLowerCase())

      if (error) {
        console.error('Error deleting user profile:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteUserProfile:', error)
      return false
    }
  }
}