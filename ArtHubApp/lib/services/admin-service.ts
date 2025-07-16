/**
 * Admin Service - Manages admin wallet access and CRUD operations
 */

export interface AdminWallet {
  id: string
  address: string
  addedBy: string
  addedAt: string
  isActive: boolean
  label?: string
}

const ADMIN_WALLETS_KEY = 'art3hub_admin_wallets'
const DEFAULT_ADMIN_WALLET = '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f'

class AdminService {
  private adminWallets: AdminWallet[] = []

  constructor() {
    this.loadAdminWallets()
  }

  /**
   * Load admin wallets from localStorage with default admin
   */
  private loadAdminWallets(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(ADMIN_WALLETS_KEY)
      if (stored) {
        this.adminWallets = JSON.parse(stored)
      }

      // Ensure default admin wallet exists
      if (!this.adminWallets.find(admin => admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase())) {
        const defaultAdmin: AdminWallet = {
          id: crypto.randomUUID(),
          address: DEFAULT_ADMIN_WALLET,
          addedBy: 'system',
          addedAt: new Date().toISOString(),
          isActive: true,
          label: 'Default Admin'
        }
        this.adminWallets.push(defaultAdmin)
        this.saveAdminWallets()
      }
    } catch (error) {
      console.error('Failed to load admin wallets:', error)
      // Initialize with default admin if loading fails
      this.initializeDefaultAdmin()
    }
  }

  /**
   * Initialize with default admin wallet
   */
  private initializeDefaultAdmin(): void {
    this.adminWallets = [{
      id: crypto.randomUUID(),
      address: DEFAULT_ADMIN_WALLET,
      addedBy: 'system',
      addedAt: new Date().toISOString(),
      isActive: true,
      label: 'Default Admin'
    }]
    this.saveAdminWallets()
  }

  /**
   * Save admin wallets to localStorage
   */
  private saveAdminWallets(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(ADMIN_WALLETS_KEY, JSON.stringify(this.adminWallets))
    } catch (error) {
      console.error('Failed to save admin wallets:', error)
    }
  }

  /**
   * Check if a wallet address is an admin
   */
  isAdmin(address: string | undefined): boolean {
    if (!address) return false
    
    return this.adminWallets.some(
      admin => admin.isActive && admin.address.toLowerCase() === address.toLowerCase()
    )
  }

  /**
   * Get all admin wallets
   */
  getAllAdmins(): AdminWallet[] {
    return [...this.adminWallets]
  }

  /**
   * Get active admin wallets only
   */
  getActiveAdmins(): AdminWallet[] {
    return this.adminWallets.filter(admin => admin.isActive)
  }

  /**
   * Add a new admin wallet
   */
  addAdmin(address: string, addedBy: string, label?: string): { success: boolean; message: string; admin?: AdminWallet } {
    try {
      // Validate address format (basic validation)
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return { success: false, message: 'Invalid wallet address format' }
      }

      // Check if admin already exists
      const existingAdmin = this.adminWallets.find(
        admin => admin.address.toLowerCase() === address.toLowerCase()
      )

      if (existingAdmin) {
        if (existingAdmin.isActive) {
          return { success: false, message: 'This wallet is already an admin' }
        } else {
          // Reactivate existing admin
          existingAdmin.isActive = true
          existingAdmin.addedBy = addedBy
          existingAdmin.addedAt = new Date().toISOString()
          if (label) existingAdmin.label = label
          
          this.saveAdminWallets()
          return { success: true, message: 'Admin wallet reactivated successfully', admin: existingAdmin }
        }
      }

      // Add new admin
      const newAdmin: AdminWallet = {
        id: crypto.randomUUID(),
        address: address,
        addedBy: addedBy,
        addedAt: new Date().toISOString(),
        isActive: true,
        label: label
      }

      this.adminWallets.push(newAdmin)
      this.saveAdminWallets()

      return { success: true, message: 'Admin wallet added successfully', admin: newAdmin }
    } catch (error) {
      console.error('Failed to add admin:', error)
      return { success: false, message: 'Failed to add admin wallet' }
    }
  }

  /**
   * Update an admin wallet
   */
  updateAdmin(id: string, updates: Partial<Pick<AdminWallet, 'label' | 'isActive'>>, updatedBy: string): { success: boolean; message: string } {
    try {
      const adminIndex = this.adminWallets.findIndex(admin => admin.id === id)
      
      if (adminIndex === -1) {
        return { success: false, message: 'Admin wallet not found' }
      }

      const admin = this.adminWallets[adminIndex]

      // Prevent deactivating the default admin
      if (admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase() && updates.isActive === false) {
        return { success: false, message: 'Cannot deactivate the default admin wallet' }
      }

      // Update admin
      this.adminWallets[adminIndex] = {
        ...admin,
        ...updates,
        addedBy: updatedBy, // Track who made the update
        addedAt: new Date().toISOString()
      }

      this.saveAdminWallets()
      return { success: true, message: 'Admin wallet updated successfully' }
    } catch (error) {
      console.error('Failed to update admin:', error)
      return { success: false, message: 'Failed to update admin wallet' }
    }
  }

  /**
   * Remove an admin wallet (soft delete by deactivating)
   */
  removeAdmin(id: string, removedBy: string): { success: boolean; message: string } {
    try {
      const admin = this.adminWallets.find(admin => admin.id === id)
      
      if (!admin) {
        return { success: false, message: 'Admin wallet not found' }
      }

      // Prevent removing the default admin
      if (admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase()) {
        return { success: false, message: 'Cannot remove the default admin wallet' }
      }

      return this.updateAdmin(id, { isActive: false }, removedBy)
    } catch (error) {
      console.error('Failed to remove admin:', error)
      return { success: false, message: 'Failed to remove admin wallet' }
    }
  }

  /**
   * Hard delete an admin wallet (for testing purposes only)
   */
  deleteAdmin(id: string): { success: boolean; message: string } {
    try {
      const admin = this.adminWallets.find(admin => admin.id === id)
      
      if (!admin) {
        return { success: false, message: 'Admin wallet not found' }
      }

      // Prevent deleting the default admin
      if (admin.address.toLowerCase() === DEFAULT_ADMIN_WALLET.toLowerCase()) {
        return { success: false, message: 'Cannot delete the default admin wallet' }
      }

      this.adminWallets = this.adminWallets.filter(admin => admin.id !== id)
      this.saveAdminWallets()

      return { success: true, message: 'Admin wallet deleted successfully' }
    } catch (error) {
      console.error('Failed to delete admin:', error)
      return { success: false, message: 'Failed to delete admin wallet' }
    }
  }

  /**
   * Get admin count
   */
  getAdminCount(): { total: number; active: number } {
    return {
      total: this.adminWallets.length,
      active: this.adminWallets.filter(admin => admin.isActive).length
    }
  }

  /**
   * Export admin wallets (for backup)
   */
  exportAdmins(): string {
    return JSON.stringify(this.adminWallets, null, 2)
  }

  /**
   * Import admin wallets (for restore)
   */
  importAdmins(data: string, importedBy: string): { success: boolean; message: string; imported?: number } {
    try {
      const importedAdmins: AdminWallet[] = JSON.parse(data)
      
      if (!Array.isArray(importedAdmins)) {
        return { success: false, message: 'Invalid import data format' }
      }

      let importedCount = 0
      
      for (const admin of importedAdmins) {
        if (admin.address && admin.address.match(/^0x[a-fA-F0-9]{40}$/)) {
          const result = this.addAdmin(admin.address, importedBy, admin.label)
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
}

// Create singleton instance
export const adminService = new AdminService()

// Hook for React components
export function useAdminService() {
  return adminService
}