import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore'
import { 
  db, 
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'
import { type TranslationCache } from './ai-translation-service'

export class FirebaseTranslationCacheService {
  
  /**
   * Get cached translation if valid and not expired
   */
  static async getCachedTranslation(
    contentId: string,
    targetLocale: string,
    contentType: 'opportunity' | 'community',
    currentContentHash: string
  ): Promise<TranslationCache | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping translation cache lookup')
      return null
    }

    try {
      const cacheId = this.generateCacheId(contentId, targetLocale, contentType)
      const cacheRef = doc(db, COLLECTIONS.TRANSLATION_CACHE, cacheId)
      const cacheDoc = await getDoc(cacheRef)

      if (!cacheDoc.exists()) {
        return null
      }

      const cachedData = cacheDoc.data() as TranslationCache

      // Check if cache is expired
      const now = new Date()
      const expiresAt = new Date(cachedData.expires_at)
      if (now > expiresAt) {
        console.log(`🗑️ Cache expired for ${cacheId}, deleting`)
        await deleteDoc(cacheRef)
        return null
      }

      // Check if content has changed (hash mismatch)
      if (cachedData.original_hash !== currentContentHash) {
        console.log(`🔄 Content hash changed for ${cacheId}, cache invalid`)
        await deleteDoc(cacheRef)
        return null
      }

      console.log(`📦 Found valid cache for ${cacheId}`)
      return cachedData
    } catch (error) {
      console.error('Error fetching cached translation:', error)
      return null
    }
  }

  /**
   * Store translation in cache
   */
  static async cacheTranslation(
    contentId: string,
    targetLocale: string,
    contentType: 'opportunity' | 'community',
    originalContentHash: string,
    translations: any,
    ttlDays: number = 30
  ): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping translation caching')
      return false
    }

    try {
      const cacheId = this.generateCacheId(contentId, targetLocale, contentType)
      const timestamp = getCurrentTimestamp()
      
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + ttlDays)

      const cacheEntry: TranslationCache = {
        id: cacheId,
        content_type: contentType,
        content_id: contentId,
        source_locale: 'en',
        target_locale: targetLocale,
        original_hash: originalContentHash,
        translations,
        created_at: timestamp,
        updated_at: timestamp,
        expires_at: expiresAt.toISOString()
      }

      const cacheRef = doc(db, COLLECTIONS.TRANSLATION_CACHE, cacheId)
      await setDoc(cacheRef, cacheEntry)

      console.log(`💾 Cached translation: ${cacheId} (expires: ${expiresAt.toLocaleDateString()})`)
      return true
    } catch (error) {
      console.error('Error caching translation:', error)
      return false
    }
  }

  /**
   * Generate consistent cache ID
   */
  private static generateCacheId(
    contentId: string,
    targetLocale: string,
    contentType: 'opportunity' | 'community'
  ): string {
    return `${contentType}_${contentId}_${targetLocale}`
  }

  /**
   * Clear expired cache entries (cleanup task)
   */
  static async clearExpiredCache(): Promise<number> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping cache cleanup')
      return 0
    }

    try {
      const now = new Date().toISOString()
      
      const q = query(
        collection(db, COLLECTIONS.TRANSLATION_CACHE),
        where('expires_at', '<', now),
        firestoreLimit(100) // Process in batches
      )
      
      const querySnapshot = await getDocs(q)
      const expiredEntries = querySnapshot.docs
      
      console.log(`🗑️ Found ${expiredEntries.length} expired cache entries`)
      
      const deletePromises = expiredEntries.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      console.log(`✅ Cleared ${expiredEntries.length} expired cache entries`)
      return expiredEntries.length
    } catch (error) {
      console.error('Error clearing expired cache:', error)
      return 0
    }
  }

  /**
   * Clear all cached translations for a specific content item
   */
  static async clearContentCache(
    contentId: string,
    contentType: 'opportunity' | 'community'
  ): Promise<number> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping content cache clear')
      return 0
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.TRANSLATION_CACHE),
        where('content_type', '==', contentType),
        where('content_id', '==', contentId)
      )
      
      const querySnapshot = await getDocs(q)
      const cacheEntries = querySnapshot.docs
      
      console.log(`🗑️ Clearing ${cacheEntries.length} cache entries for ${contentType} ${contentId}`)
      
      const deletePromises = cacheEntries.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      console.log(`✅ Cleared cache for ${contentType} ${contentId}`)
      return cacheEntries.length
    } catch (error) {
      console.error('Error clearing content cache:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStatistics(): Promise<{
    totalEntries: number
    entriesByType: Record<string, number>
    entriesByLocale: Record<string, number>
    expiredEntries: number
  }> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping cache statistics')
      return {
        totalEntries: 0,
        entriesByType: {},
        entriesByLocale: {},
        expiredEntries: 0
      }
    }

    try {
      const q = query(collection(db, COLLECTIONS.TRANSLATION_CACHE))
      const querySnapshot = await getDocs(q)
      const allEntries = querySnapshot.docs.map(doc => doc.data() as TranslationCache)
      
      const now = new Date()
      
      const stats = {
        totalEntries: allEntries.length,
        entriesByType: {} as Record<string, number>,
        entriesByLocale: {} as Record<string, number>,
        expiredEntries: 0
      }
      
      allEntries.forEach(entry => {
        // Count by type
        stats.entriesByType[entry.content_type] = (stats.entriesByType[entry.content_type] || 0) + 1
        
        // Count by locale
        stats.entriesByLocale[entry.target_locale] = (stats.entriesByLocale[entry.target_locale] || 0) + 1
        
        // Count expired
        if (new Date(entry.expires_at) < now) {
          stats.expiredEntries++
        }
      })
      
      return stats
    } catch (error) {
      console.error('Error getting cache statistics:', error)
      return {
        totalEntries: 0,
        entriesByType: {},
        entriesByLocale: {},
        expiredEntries: 0
      }
    }
  }

  /**
   * Pre-warm cache for specific content (background task)
   */
  static async preWarmCache(
    items: Array<{
      id: string
      content: any
      type: 'opportunity' | 'community'
    }>,
    targetLocales: string[] = ['es', 'pt', 'fr']
  ): Promise<void> {
    console.log(`🔥 Pre-warming cache for ${items.length} items across ${targetLocales.length} locales`)

    for (const item of items) {
      for (const locale of targetLocales) {
        try {
          const contentHash = this.generateContentHash(item.content)
          const cachedTranslation = await this.getCachedTranslation(
            item.id,
            locale,
            item.type,
            contentHash
          )

          if (!cachedTranslation) {
            console.log(`🔄 Pre-warming cache for ${item.type} ${item.id} (${locale})`)
            // This will be handled by the AITranslationService
          } else {
            console.log(`📦 Cache already warm for ${item.type} ${item.id} (${locale})`)
          }
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (error) {
          console.error(`❌ Pre-warm failed for ${item.id} (${locale}):`, error)
        }
      }
    }

    console.log(`✅ Pre-warming completed`)
  }

  /**
   * Generate content hash (should match AITranslationService method)
   */
  private static generateContentHash(content: any): string {
    const contentString = JSON.stringify(content)
    let hash = 0
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }
}