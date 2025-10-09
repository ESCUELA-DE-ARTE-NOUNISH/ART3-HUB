// Firebase Gallery Sales Service
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, type QueryConstraint } from 'firebase/firestore'
import { db, COLLECTIONS, type GallerySale } from '@/lib/firebase'

/**
 * Service for managing gallery sales transactions
 */
export class FirebaseSalesService {
  /**
   * Record a new gallery sale
   */
  static async recordSale(saleData: Omit<GallerySale, 'id' | 'created_at'>): Promise<GallerySale> {
    try {
      const salesRef = collection(db, COLLECTIONS.GALLERY_SALES)

      const newSale: Omit<GallerySale, 'id'> = {
        ...saleData,
        created_at: new Date().toISOString()
      }

      const docRef = await addDoc(salesRef, newSale)

      console.log('✅ Gallery sale recorded:', docRef.id)

      return {
        id: docRef.id,
        ...newSale
      }
    } catch (error) {
      console.error('❌ Error recording sale:', error)
      throw error
    }
  }

  /**
   * Get all sales with optional filters
   */
  static async getSales(filters?: {
    artistWallet?: string
    collectorWallet?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<GallerySale[]> {
    try {
      const salesRef = collection(db, COLLECTIONS.GALLERY_SALES)
      const constraints: QueryConstraint[] = []

      // Filter by artist wallet
      if (filters?.artistWallet) {
        constraints.push(where('artist_wallet', '==', filters.artistWallet.toLowerCase()))
      }

      // Filter by collector wallet
      if (filters?.collectorWallet) {
        constraints.push(where('collector_wallet', '==', filters.collectorWallet.toLowerCase()))
      }

      // Filter by date range (created_at)
      if (filters?.startDate) {
        constraints.push(where('created_at', '>=', filters.startDate.toISOString()))
      }

      if (filters?.endDate) {
        constraints.push(where('created_at', '<=', filters.endDate.toISOString()))
      }

      // Order by most recent first
      constraints.push(orderBy('created_at', 'desc'))

      const q = query(salesRef, ...constraints)
      const querySnapshot = await getDocs(q)

      const sales = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GallerySale))

      console.log(`📊 Retrieved ${sales.length} sales records`)

      // Apply limit if specified (client-side since Firestore limit is tricky with multiple filters)
      if (filters?.limit) {
        return sales.slice(0, filters.limit)
      }

      return sales
    } catch (error) {
      console.error('❌ Error fetching sales:', error)
      throw error
    }
  }

  /**
   * Get sales statistics
   */
  static async getSalesStats(filters?: {
    artistWallet?: string
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalSales: number
    totalRevenue: number
    totalArtistEarnings: number
    totalTreasuryFees: number
    averageSalePrice: number
    uniqueCollectors: number
  }> {
    try {
      const sales = await this.getSales(filters)

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount_usdc, 0)
      const totalArtistEarnings = sales.reduce((sum, sale) => sum + sale.artist_amount, 0)
      const totalTreasuryFees = sales.reduce((sum, sale) => sum + sale.treasury_amount, 0)
      const uniqueCollectors = new Set(sales.map(sale => sale.collector_wallet)).size

      return {
        totalSales: sales.length,
        totalRevenue,
        totalArtistEarnings,
        totalTreasuryFees,
        averageSalePrice: sales.length > 0 ? totalRevenue / sales.length : 0,
        uniqueCollectors
      }
    } catch (error) {
      console.error('❌ Error calculating sales stats:', error)
      throw error
    }
  }

  /**
   * Export sales to CSV format
   */
  static async exportSalesToCSV(filters?: {
    artistWallet?: string
    collectorWallet?: string
    startDate?: Date
    endDate?: Date
  }): Promise<string> {
    try {
      const sales = await this.getSales(filters)

      // CSV headers
      const headers = [
        'Sale ID',
        'Date',
        'NFT Name',
        'Artist Wallet',
        'Artist Name',
        'Collector Wallet',
        'Amount (USDC)',
        'Artist Earnings (USDC)',
        'Treasury Fee (USDC)',
        'Collection Address',
        'Token ID',
        'Network',
        'Mint Tx Hash',
        'Artist Payment Tx',
        'Treasury Payment Tx'
      ].join(',')

      // CSV rows
      const rows = sales.map(sale => [
        sale.id,
        new Date(sale.created_at).toLocaleString(),
        `"${sale.nft_name}"`, // Quote to handle commas in name
        sale.artist_wallet,
        `"${sale.artist_name || 'Unknown'}"`,
        sale.collector_wallet,
        sale.amount_usdc.toFixed(2),
        sale.artist_amount.toFixed(2),
        sale.treasury_amount.toFixed(2),
        sale.collection_address,
        sale.token_id,
        sale.network,
        sale.mint_tx_hash,
        sale.artist_tx_hash,
        sale.treasury_tx_hash
      ].join(','))

      const csv = [headers, ...rows].join('\n')

      console.log(`📄 Exported ${sales.length} sales to CSV`)

      return csv
    } catch (error) {
      console.error('❌ Error exporting sales to CSV:', error)
      throw error
    }
  }

  /**
   * Get sales by artist wallet
   */
  static async getArtistSales(artistWallet: string): Promise<GallerySale[]> {
    return this.getSales({ artistWallet })
  }

  /**
   * Get sales by collector wallet
   */
  static async getCollectorSales(collectorWallet: string): Promise<GallerySale[]> {
    return this.getSales({ collectorWallet })
  }
}
