import type { UserProfile } from '@/lib/supabase'

export class ApiService {
  /**
   * Create or update user profile on wallet connection
   */
  static async upsertUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      console.log('API: Upserting user profile for:', walletAddress)
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress.toLowerCase(),
        }),
      })

      console.log('API: Upsert response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to upsert user profile:', response.statusText, errorText)
        return null
      }

      const responseData = await response.json()
      console.log('API: Upsert response data:', responseData)
      return responseData.profile
    } catch (error) {
      console.error('Error in upsertUserProfile:', error)
      return null
    }
  }

  /**
   * Get user profile by wallet address
   */
  static async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      console.log('API: Getting user profile for:', walletAddress)
      const response = await fetch(
        `/api/user-profile?wallet_address=${encodeURIComponent(walletAddress.toLowerCase())}`,
        {
          method: 'GET',
        }
      )

      console.log('API: Get profile response status:', response.status)
      if (!response.ok) {
        if (response.status === 404) {
          // User not found is not an error
          console.log('API: Profile not found (404)')
          return null
        }
        const errorText = await response.text()
        console.error('Failed to get user profile:', response.statusText, errorText)
        return null
      }

      const responseData = await response.json()
      console.log('API: Get profile response data:', responseData)
      return responseData.profile
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
    profileData: Partial<UserProfile>
  ): Promise<boolean> {
    try {
      console.log('API: Updating user profile for:', walletAddress, profileData)
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress.toLowerCase(),
          ...profileData,
        }),
      })

      console.log('API: Update profile response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update user profile:', response.statusText, errorText)
        return false
      }

      const responseData = await response.json()
      console.log('API: Update profile response data:', responseData)
      return responseData.success || false
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
      return false
    }
  }

  /**
   * Update profile completion status
   */
  static async updateProfileCompletion(
    walletAddress: string,
    isComplete: boolean
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress.toLowerCase(),
          profile_complete: isComplete,
        }),
      })

      if (!response.ok) {
        console.error('Failed to update profile completion:', response.statusText)
        return false
      }

      const { success } = await response.json()
      return success
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
      const response = await fetch('/api/user-profile/incomplete', {
        method: 'GET',
      })

      if (!response.ok) {
        console.error('Failed to get incomplete profiles:', response.statusText)
        return []
      }

      const { profiles } = await response.json()
      return profiles || []
    } catch (error) {
      console.error('Error in getUsersWithIncompleteProfiles:', error)
      return []
    }
  }

  /**
   * Validate if username is available
   */
  static async validateUsername(username: string, walletAddress?: string): Promise<{ available: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({
        field: 'username',
        value: username.toLowerCase(),
      })
      
      if (walletAddress) {
        params.append('wallet_address', walletAddress.toLowerCase())
      }

      const response = await fetch(`/api/user-profile/validate?${params}`)

      if (!response.ok) {
        return { available: false, error: 'Failed to validate username' }
      }

      const data = await response.json()
      return { available: data.available }
    } catch (error) {
      console.error('Error validating username:', error)
      return { available: false, error: 'Validation failed' }
    }
  }

  /**
   * Validate if email is available
   */
  static async validateEmail(email: string, walletAddress?: string): Promise<{ available: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({
        field: 'email',
        value: email.toLowerCase(),
      })
      
      if (walletAddress) {
        params.append('wallet_address', walletAddress.toLowerCase())
      }

      const response = await fetch(`/api/user-profile/validate?${params}`)

      if (!response.ok) {
        return { available: false, error: 'Failed to validate email' }
      }

      const data = await response.json()
      return { available: data.available }
    } catch (error) {
      console.error('Error validating email:', error)
      return { available: false, error: 'Validation failed' }
    }
  }

  /**
   * Delete user profile (for cleanup purposes)
   */
  static async deleteUserProfile(walletAddress: string): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/user-profile?wallet_address=${encodeURIComponent(walletAddress.toLowerCase())}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        console.error('Failed to delete user profile:', response.statusText)
        return false
      }

      const { success } = await response.json()
      return success
    } catch (error) {
      console.error('Error in deleteUserProfile:', error)
      return false
    }
  }
}