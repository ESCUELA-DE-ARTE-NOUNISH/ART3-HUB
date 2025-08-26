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
  type AdminWallet, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

import { isFarcasterEnvironment } from '@/lib/utils/environment'

// Extend window interface for Firebase error flags
declare global {
  interface Window {
    __firebaseAdminErrorLogged?: boolean
    __firebaseAdminReadErrorLogged?: boolean
    __firebaseAdminQueryErrorLogged?: boolean
  }
}

const DEFAULT_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f'

export class FirebaseAdminService {
  private static isInitializing = false;
  private static hasInitialized = false;

  /**
   * Initialize default admin wallet in Firebase if it doesn't exist
   */
  static async initializeDefaultAdmin(): Promise<void> {
    // Skip initialization in Farcaster Mini App environment
    if (isFarcasterEnvironment()) {
      console.log('🔄 Skipping admin initialization in Farcaster environment')
      return
    }

    // Prevent multiple concurrent initializations
    if (this.isInitializing || this.hasInitialized) {
      console.log('🔄 Admin initialization already in progress or completed, skipping...')
      return
    }

    this.isInitializing = true;
    console.log('🚀 Initializing default admin wallet for:', DEFAULT_ADMIN_WALLET)
    
    if (!isFirebaseConfigured()) {
      console.warn('❌ Firebase not configured, skipping admin initialization')
      this.isInitializing = false;
      return
    }

    try {
      // First, check for and clean up any duplicates
      await this.cleanupDuplicateDefaultAdmins()
      
      // Check if default admin already exists
      const existingAdmin = await this.getAdminByAddress(DEFAULT_ADMIN_WALLET)
      
      if (!existingAdmin) {
        console.log('➕ Creating default admin wallet...')
        const defaultAdmin: AdminWallet = {
          id: generateId(),
          address: DEFAULT_ADMIN_WALLET.toLowerCase(),
          addedBy: 'system',
          addedAt: getCurrentTimestamp(),
          isActive: true,
          label: 'Default Admin'
        }
        
        await this.createAdmin(defaultAdmin)
        console.log('✅ Default admin wallet initialized in Firebase')
      } else {
        console.log('✅ Default admin wallet already exists in Firebase')
      }
      
      this.hasInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing default admin:', error)
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Clean up duplicate default admin wallets
   */
  private static async cleanupDuplicateDefaultAdmins(): Promise<void> {
    if (!isFirebaseConfigured()) {
      return
    }

    try {
      const normalizedDefaultAddress = DEFAULT_ADMIN_WALLET.toLowerCase()
      console.log('🧹 Cleaning up duplicate default admins for:', normalizedDefaultAddress)
      
      const adminsQuery = query(
        collection(db, COLLECTIONS.ADMIN_WALLETS),
        where('address', '==', normalizedDefaultAddress)
      )
      
      const querySnapshot = await getDocs(adminsQuery)
      console.log('📊 Found', querySnapshot.size, 'admin(s) with default address')
      
      if (querySnapshot.size > 1) {
        console.log('🗑️ Removing', querySnapshot.size - 1, 'duplicate admin(s)')
        
        // Keep the first one, remove the rest
        const docsToDelete = querySnapshot.docs.slice(1)
        
        for (const docToDelete of docsToDelete) {
          await deleteDoc(docToDelete.ref)
          console.log('🗑️ Deleted duplicate admin with ID:', docToDelete.id)
        }
        
        console.log('✅ Duplicate cleanup completed')
      } else {
        console.log('✅ No duplicates found')
      }
    } catch (error) {
      console.error('❌ Error cleaning up duplicates:', error)
    }
  }

  /**
   * Create a new admin wallet
   */
  static async createAdmin(adminData: AdminWallet): Promise<AdminWallet | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping admin creation')
      return null
    }

    try {
      const adminRef = doc(db, COLLECTIONS.ADMIN_WALLETS, adminData.id)
      await setDoc(adminRef, adminData)
      return adminData
    } catch (error: any) {
      // Handle Firebase errors gracefully in development
      if (process.env.NODE_ENV === 'development') {
        // Suppress noisy Firebase development warnings
        if (error?.code === 'permission-denied' || 
            error?.message?.includes('insufficient permissions') ||
            error?.message?.includes('PERMISSION_DENIED') ||
            error?.status === 400) {
          // Only log once per session to avoid spam
          if (!window.__firebaseAdminErrorLogged) {
            console.warn('📝 Firebase admin creation blocked by security rules (expected in development)')
            window.__firebaseAdminErrorLogged = true
          }
        } else {
          console.error('Error creating admin:', error)
        }
      } else {
        console.error('Error creating admin:', error)
      }
      return null
    }
  }

  /**
   * Get admin wallet by address
   */
  static async getAdminByAddress(address: string): Promise<AdminWallet | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping admin lookup')
      return null
    }

    try {
      const normalizedAddress = address.toLowerCase()
      
      const adminsQuery = query(
        collection(db, COLLECTIONS.ADMIN_WALLETS),
        where('address', '==', normalizedAddress)
      )
      
      const querySnapshot = await getDocs(adminsQuery)
      
      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0]
        return adminDoc.data() as AdminWallet
      }
      
      return null
    } catch (error: any) {
      // Handle Firebase errors gracefully in development
      if (process.env.NODE_ENV === 'development') {
        // Suppress noisy Firebase development warnings
        if (error?.code === 'permission-denied' || 
            error?.message?.includes('insufficient permissions') ||
            error?.message?.includes('PERMISSION_DENIED') ||
            error?.status === 400) {
          // Only log once per session to avoid spam
          if (!window.__firebaseAdminReadErrorLogged) {
            console.warn('📝 Firebase admin read blocked by security rules (expected in development)')
            window.__firebaseAdminReadErrorLogged = true
          }
        } else {
          console.error('Error getting admin by address:', error)
        }
      } else {
        console.error('Error getting admin by address:', error)
      }
      return null
    }
  }

  /**
   * Get all admin wallets
   */
  static async getAllAdmins(): Promise<AdminWallet[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping admin fetch')
      return []
    }

    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.ADMIN_WALLETS))
      
      const admins: AdminWallet[] = []
      querySnapshot.forEach((doc) => {
        admins.push(doc.data() as AdminWallet)
      })
      
      return admins
    } catch (error: any) {
      // Handle Firebase errors gracefully in development
      if (process.env.NODE_ENV === 'development') {
        // Suppress noisy Firebase development warnings
        if (error?.code === 'permission-denied' || 
            error?.message?.includes('insufficient permissions') ||
            error?.message?.includes('PERMISSION_DENIED') ||
            error?.status === 400) {
          // Only log once per session to avoid spam
          if (!window.__firebaseAdminQueryErrorLogged) {
            console.warn('📝 Firebase admin query blocked by security rules (expected in development)')
            window.__firebaseAdminQueryErrorLogged = true
          }
        } else {
          console.error('Error getting all admins:', error)
        }
      } else {
        console.error('Error getting all admins:', error)
      }
      return []
    }
  }

  /**
   * Get active admin wallets only
   */
  static async getActiveAdmins(): Promise<AdminWallet[]> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping admin fetch')
      return []
    }

    try {
      const adminsQuery = query(
        collection(db, COLLECTIONS.ADMIN_WALLETS),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(adminsQuery)
      
      const admins: AdminWallet[] = []
      querySnapshot.forEach((doc) => {
        admins.push(doc.data() as AdminWallet)
      })
      
      return admins
    } catch (error) {
      console.error('Error getting active admins:', error)
      return []
    }
  }

  /**
   * Check if a wallet address is an admin
   */
  static async isAdmin(address: string | undefined): Promise<boolean> {
    // Skip Firebase calls in Farcaster environment
    if (isFarcasterEnvironment()) {
      return false
    }

    if (!address) {
      return false
    }
    
    try {
      const admin = await this.getAdminByAddress(address)
      return admin ? admin.isActive : false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Add a new admin wallet
   */
  static async addAdmin(
    address: string, 
    addedBy: string, 
    label?: string
  ): Promise<{ success: boolean; message: string; admin?: AdminWallet }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase not configured' }
    }

    try {
      // Validate address format
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        const actualLength = address ? address.length : 0
        const expectedLength = 42 // 0x + 40 hex characters
        return { 
          success: false, 
          message: `Invalid wallet address format. Expected 42 characters (0x + 40 hex), got ${actualLength} characters. Please check the address: ${address}` 
        }
      }

      // Check if admin already exists
      const existingAdmin = await this.getAdminByAddress(address)

      if (existingAdmin) {
        if (existingAdmin.isActive) {
          return { success: false, message: 'This wallet is already an admin' }
        } else {
          // Reactivate existing admin
          await this.updateAdmin(existingAdmin.id, { isActive: true }, addedBy)
          const updatedAdmin = await this.getAdminByAddress(address)
          return { 
            success: true, 
            message: 'Admin wallet reactivated successfully', 
            admin: updatedAdmin || undefined 
          }
        }
      }

      // Add new admin
      const newAdmin: AdminWallet = {
        id: generateId(),
        address: address.toLowerCase(),
        addedBy: addedBy,
        addedAt: getCurrentTimestamp(),
        isActive: true,
        label: label
      }

      const createdAdmin = await this.createAdmin(newAdmin)
      
      if (createdAdmin) {
        return { success: true, message: 'Admin wallet added successfully', admin: createdAdmin }
      } else {
        return { success: false, message: 'Failed to create admin wallet' }
      }
    } catch (error) {
      console.error('Failed to add admin:', error)
      return { success: false, message: 'Failed to add admin wallet' }
    }
  }

  /**
   * Update an admin wallet
   */
  static async updateAdmin(
    id: string, 
    updates: Partial<Pick<AdminWallet, 'label' | 'isActive'>>, 
    updatedBy: string
  ): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase not configured' }
    }

    try {
      const adminRef = doc(db, COLLECTIONS.ADMIN_WALLETS, id)
      const adminDoc = await getDoc(adminRef)
      
      if (!adminDoc.exists()) {
        return { success: false, message: 'Admin wallet not found' }
      }

      const admin = adminDoc.data() as AdminWallet

      // Prevent deactivating the default admin
      if (admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase() && updates.isActive === false) {
        return { success: false, message: 'Cannot deactivate the default admin wallet' }
      }

      // Update admin
      const updateData = {
        ...updates,
        addedBy: updatedBy, // Track who made the update
        addedAt: getCurrentTimestamp()
      }

      await updateDoc(adminRef, updateData)
      return { success: true, message: 'Admin wallet updated successfully' }
    } catch (error) {
      console.error('Failed to update admin:', error)
      return { success: false, message: 'Failed to update admin wallet' }
    }
  }

  /**
   * Remove an admin wallet (soft delete by deactivating)
   */
  static async removeAdmin(id: string, removedBy: string): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase not configured' }
    }

    try {
      const adminRef = doc(db, COLLECTIONS.ADMIN_WALLETS, id)
      const adminDoc = await getDoc(adminRef)
      
      if (!adminDoc.exists()) {
        return { success: false, message: 'Admin wallet not found' }
      }

      const admin = adminDoc.data() as AdminWallet

      // Prevent removing the default admin
      if (admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase()) {
        return { success: false, message: 'Cannot remove the default admin wallet' }
      }

      return await this.updateAdmin(id, { isActive: false }, removedBy)
    } catch (error) {
      console.error('Failed to remove admin:', error)
      return { success: false, message: 'Failed to remove admin wallet' }
    }
  }

  /**
   * Hard delete an admin wallet (for testing purposes only)
   */
  static async deleteAdmin(id: string): Promise<{ success: boolean; message: string }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase not configured' }
    }

    try {
      const adminRef = doc(db, COLLECTIONS.ADMIN_WALLETS, id)
      const adminDoc = await getDoc(adminRef)
      
      if (!adminDoc.exists()) {
        return { success: false, message: 'Admin wallet not found' }
      }

      const admin = adminDoc.data() as AdminWallet

      // Prevent deleting the default admin
      if (admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase()) {
        return { success: false, message: 'Cannot delete the default admin wallet' }
      }

      await deleteDoc(adminRef)
      return { success: true, message: 'Admin wallet deleted successfully' }
    } catch (error) {
      console.error('Failed to delete admin:', error)
      return { success: false, message: 'Failed to delete admin wallet' }
    }
  }

  /**
   * Get admin count
   */
  static async getAdminCount(): Promise<{ total: number; active: number }> {
    try {
      const allAdmins = await this.getAllAdmins()
      const activeAdmins = allAdmins.filter(admin => admin.isActive)
      
      return {
        total: allAdmins.length,
        active: activeAdmins.length
      }
    } catch (error) {
      console.error('Failed to get admin count:', error)
      return { total: 0, active: 0 }
    }
  }

  /**
   * Export admin wallets (for backup)
   */
  static async exportAdmins(): Promise<string> {
    try {
      const admins = await this.getAllAdmins()
      return JSON.stringify(admins, null, 2)
    } catch (error) {
      console.error('Failed to export admins:', error)
      return '[]'
    }
  }

  /**
   * Import admin wallets (for restore)
   */
  static async importAdmins(
    data: string, 
    importedBy: string
  ): Promise<{ success: boolean; message: string; imported?: number }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase not configured' }
    }

    try {
      const importedAdmins: AdminWallet[] = JSON.parse(data)
      
      if (!Array.isArray(importedAdmins)) {
        return { success: false, message: 'Invalid import data format' }
      }

      let importedCount = 0
      
      for (const admin of importedAdmins) {
        if (admin.address && admin.address.match(/^0x[a-fA-F0-9]{40}$/)) {
          const result = await this.addAdmin(admin.address, importedBy, admin.label)
          if (result.success) {
            importedCount++
          }
        }
      }

      return { 
        success: true, 
        message: `Successfully imported ${importedCount} admin wallets`, 
        imported: importedCount 
      }
    } catch (error) {
      console.error('Failed to import admins:', error)
      return { success: false, message: 'Failed to import admin wallets' }
    }
  }

  /**
   * Migrate localStorage admin wallets to Firebase
   */
  static async migrateFromLocalStorage(migratedBy: string): Promise<{ success: boolean; message: string; migrated?: number }> {
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase not configured' }
    }

    if (typeof window === 'undefined') {
      return { success: false, message: 'localStorage not available' }
    }

    try {
      const ADMIN_WALLETS_KEY = 'art3hub_admin_wallets'
      const stored = localStorage.getItem(ADMIN_WALLETS_KEY)
      
      if (!stored) {
        return { success: true, message: 'No localStorage data to migrate', migrated: 0 }
      }

      const localAdmins: AdminWallet[] = JSON.parse(stored)
      let migratedCount = 0
      
      for (const admin of localAdmins) {
        if (admin.address && admin.address.match(/^0x[a-fA-F0-9]{40}$/)) {
          const result = await this.addAdmin(admin.address, migratedBy, admin.label)
          if (result.success) {
            migratedCount++
          }
        }
      }

      // Optionally clear localStorage after successful migration
      // localStorage.removeItem(ADMIN_WALLETS_KEY)

      return { 
        success: true, 
        message: `Successfully migrated ${migratedCount} admin wallets from localStorage to Firebase`, 
        migrated: migratedCount 
      }
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error)
      return { success: false, message: 'Failed to migrate admin wallets' }
    }
  }
}

// Note: Default admin initialization is now handled by AdminService.loadAdminWallets()
// to prevent multiple initialization calls