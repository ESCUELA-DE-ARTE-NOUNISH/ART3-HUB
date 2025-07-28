/**
 * Admin Service - Manages admin wallet access and CRUD operations
 * Updated to use Firebase instead of localStorage for cross-device admin access
 */

import { FirebaseAdminService } from './firebase-admin-service'
import type { AdminWallet } from '@/lib/firebase'
import { isFarcasterEnvironment } from '@/lib/utils/environment'

const DEFAULT_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f'

class AdminService {
  private adminWallets: AdminWallet[] = []
  private isLoaded = false

  constructor() {
    this.loadAdminWallets()
  }

  /**
   * Load admin wallets from Firebase
   */
  private async loadAdminWallets(): Promise<void> {
    if (typeof window === 'undefined') return

    // Skip Firebase operations in Farcaster environment
    if (isFarcasterEnvironment()) {
      console.log('🔄 Skipping admin wallet loading in Farcaster environment')
      this.isLoaded = true
      return
    }

    try {
      // Ensure default admin exists first
      await FirebaseAdminService.initializeDefaultAdmin()
      
      this.adminWallets = await FirebaseAdminService.getAllAdmins()
      this.isLoaded = true
      
      // Auto-migrate from localStorage if Firebase is empty and localStorage has data
      if (this.adminWallets.length === 0) {
        await this.migrateFromLocalStorageIfNeeded()
      }
    } catch (error) {
      console.error('Failed to load admin wallets from Firebase:', error)
      // Fallback to localStorage temporarily
      this.loadFromLocalStorageFallback()
    }
  }

  /**
   * Migrate from localStorage to Firebase if needed
   */
  private async migrateFromLocalStorageIfNeeded(): Promise<void> {
    const ADMIN_WALLETS_KEY = 'art3hub_admin_wallets'
    
    try {
      const stored = localStorage.getItem(ADMIN_WALLETS_KEY)
      if (stored) {
        const result = await FirebaseAdminService.migrateFromLocalStorage('migration-system')
        console.log('Migration result:', result.message)
        
        // Reload admin wallets after migration
        this.adminWallets = await FirebaseAdminService.getAllAdmins()
      }
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error)
    }
  }

  /**
   * Fallback to localStorage if Firebase is unavailable
   */
  private loadFromLocalStorageFallback(): void {
    const ADMIN_WALLETS_KEY = 'art3hub_admin_wallets'
    
    try {
      const stored = localStorage.getItem(ADMIN_WALLETS_KEY)
      if (stored) {
        this.adminWallets = JSON.parse(stored)
      } else {
        // Initialize with default admin
        this.adminWallets = [{
          id: crypto.randomUUID(),
          address: DEFAULT_ADMIN_WALLET,
          addedBy: 'system',
          addedAt: new Date().toISOString(),
          isActive: true,
          label: 'Default Admin'
        }]
      }
      this.isLoaded = true
    } catch (error) {
      console.error('Failed to load from localStorage fallback:', error)
    }
  }

  /**
   * Check if a wallet address is an admin
   */
  async isAdmin(address: string | undefined): Promise<boolean> {
    if (!address) return false
    
    try {
      return await FirebaseAdminService.isAdmin(address)
    } catch (error) {
      console.error('Error checking admin status:', error)
      // Fallback to local cache
      return this.adminWallets.some(
        admin => admin.isActive && admin.address.toLowerCase() === address.toLowerCase()
      )
    }
  }

  /**
   * Synchronous admin check using cached data (for components that need immediate response)
   */
  isAdminSync(address: string | undefined): boolean {
    if (!address) return false
    
    return this.adminWallets.some(
      admin => admin.isActive && admin.address.toLowerCase() === address.toLowerCase()
    )
  }

  /**
   * Get all admin wallets
   */
  async getAllAdmins(): Promise<AdminWallet[]> {
    try {
      this.adminWallets = await FirebaseAdminService.getAllAdmins()
      return [...this.adminWallets]
    } catch (error) {
      console.error('Error getting all admins:', error)
      return [...this.adminWallets] // Return cached data
    }
  }

  /**
   * Get all admin wallets (synchronous from cache)
   */
  getAllAdminsSync(): AdminWallet[] {
    return [...this.adminWallets]
  }

  /**
   * Get active admin wallets only
   */
  async getActiveAdmins(): Promise<AdminWallet[]> {
    try {
      return await FirebaseAdminService.getActiveAdmins()
    } catch (error) {
      console.error('Error getting active admins:', error)
      return this.adminWallets.filter(admin => admin.isActive)
    }
  }

  /**
   * Add a new admin wallet
   */
  async addAdmin(address: string, addedBy: string, label?: string): Promise<{ success: boolean; message: string; admin?: AdminWallet }> {
    try {
      const result = await FirebaseAdminService.addAdmin(address, addedBy, label)
      
      // Update local cache
      if (result.success) {
        this.adminWallets = await FirebaseAdminService.getAllAdmins()
      }
      
      return result
    } catch (error) {
      console.error('Failed to add admin:', error)
      return { success: false, message: 'Failed to add admin wallet' }
    }
  }

  /**
   * Update an admin wallet
   */
  async updateAdmin(id: string, updates: Partial<Pick<AdminWallet, 'label' | 'isActive'>>, updatedBy: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await FirebaseAdminService.updateAdmin(id, updates, updatedBy)
      
      // Update local cache
      if (result.success) {
        this.adminWallets = await FirebaseAdminService.getAllAdmins()
      }
      
      return result
    } catch (error) {
      console.error('Failed to update admin:', error)
      return { success: false, message: 'Failed to update admin wallet' }
    }
  }

  /**
   * Remove an admin wallet (soft delete by deactivating)
   */
  async removeAdmin(id: string, removedBy: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await FirebaseAdminService.removeAdmin(id, removedBy)
      
      // Update local cache
      if (result.success) {
        this.adminWallets = await FirebaseAdminService.getAllAdmins()
      }
      
      return result
    } catch (error) {
      console.error('Failed to remove admin:', error)
      return { success: false, message: 'Failed to remove admin wallet' }
    }
  }

  /**
   * Hard delete an admin wallet (for testing purposes only)
   */
  async deleteAdmin(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await FirebaseAdminService.deleteAdmin(id)
      
      // Update local cache
      if (result.success) {
        this.adminWallets = await FirebaseAdminService.getAllAdmins()
      }
      
      return result
    } catch (error) {
      console.error('Failed to delete admin:', error)
      return { success: false, message: 'Failed to delete admin wallet' }
    }
  }

  /**
   * Get admin count
   */
  async getAdminCount(): Promise<{ total: number; active: number }> {
    try {
      return await FirebaseAdminService.getAdminCount()
    } catch (error) {
      console.error('Failed to get admin count:', error)
      return {
        total: this.adminWallets.length,
        active: this.adminWallets.filter(admin => admin.isActive).length
      }
    }
  }

  /**
   * Export admin wallets (for backup)
   */
  async exportAdmins(): Promise<string> {
    try {
      return await FirebaseAdminService.exportAdmins()
    } catch (error) {
      console.error('Failed to export admins:', error)
      return JSON.stringify(this.adminWallets, null, 2)
    }
  }

  /**
   * Import admin wallets (for restore)
   */
  async importAdmins(data: string, importedBy: string): Promise<{ success: boolean; message: string; imported?: number }> {
    try {
      const result = await FirebaseAdminService.importAdmins(data, importedBy)
      
      // Update local cache
      if (result.success) {
        this.adminWallets = await FirebaseAdminService.getAllAdmins()
      }
      
      return result
    } catch (error) {
      console.error('Failed to import admins:', error)
      return { success: false, message: 'Failed to import admin wallets' }
    }
  }

  /**
   * Force refresh admin wallets from Firebase
   */
  async refreshAdmins(): Promise<void> {
    try {
      this.adminWallets = await FirebaseAdminService.getAllAdmins()
    } catch (error) {
      console.error('Failed to refresh admins:', error)
    }
  }
}

// Create singleton instance
export const adminService = new AdminService()

// Hook for React components
export function useAdminService() {
  return adminService
}