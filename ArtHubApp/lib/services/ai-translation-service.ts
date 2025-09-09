import OpenAI from 'openai'
import { locales } from '@/config/i18n'
import { FirebaseTranslationCacheService } from './firebase-translation-cache-service'

// Translation types
export interface TranslatedContent {
  title: string
  description: string
  organization?: string // Only for opportunities
}

export interface TranslationCache {
  id: string
  content_type: 'opportunity' | 'community'
  content_id: string
  source_locale: string
  target_locale: string
  original_hash: string // Hash of original content to detect changes
  translations: TranslatedContent
  created_at: string
  updated_at: string
  expires_at: string // TTL for cache invalidation
}

export class AITranslationService {
  private static openai: OpenAI | null = null

  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error('OpenRouter API key not configured')
      }
      this.openai = new OpenAI({ 
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1'
      })
    }
    return this.openai
  }

  /**
   * Generate a hash of content to detect changes
   */
  private static generateContentHash(content: any): string {
    const contentString = JSON.stringify(content)
    // Simple hash function - could use crypto.createHash for production
    let hash = 0
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Get language-specific prompts for better translations
   */
  private static getTranslationPrompt(
    targetLocale: string,
    contentType: 'opportunity' | 'community'
  ): string {
    const languageNames = {
      'es': 'Spanish',
      'pt': 'Portuguese', 
      'fr': 'French',
      'en': 'English'
    }

    const contextualPrompts = {
      opportunity: `You are translating art and Web3 opportunities for artists. Maintain professional tone and preserve technical terms like "NFT", "blockchain", "Web3", "smart contracts". Focus on clarity for artists seeking funding or collaboration opportunities.`,
      community: `You are translating Web3 community descriptions for artists. Keep the welcoming, inclusive tone while preserving technical Web3 terminology. Focus on community building and artistic collaboration aspects.`
    }

    return `${contextualPrompts[contentType]}

Translate the following content to ${languageNames[targetLocale as keyof typeof languageNames]} while:
1. Preserving Web3/crypto terminology (NFT, blockchain, DeFi, etc.)
2. Maintaining the original tone and meaning
3. Using natural, fluent language for the target audience
4. Keeping currency symbols and amounts unchanged
5. Preserving any URLs or contact information

Return only the translated JSON with the same structure as the input.`
  }

  /**
   * Translate content using OpenAI
   */
  static async translateContent(
    content: {
      title: string
      description: string
      organization?: string
    },
    targetLocale: string,
    contentType: 'opportunity' | 'community'
  ): Promise<TranslatedContent> {
    if (targetLocale === 'en') {
      // No translation needed for English
      return content as TranslatedContent
    }

    if (!locales.includes(targetLocale as any)) {
      throw new Error(`Unsupported locale: ${targetLocale}`)
    }

    try {
      const openai = this.getOpenAI()
      const prompt = this.getTranslationPrompt(targetLocale, contentType)

      console.log(`🔄 Starting OpenRouter translation for ${contentType} to ${targetLocale}`)
      console.log('📝 Content to translate:', {
        title: content.title.substring(0, 100),
        description: content.description.substring(0, 100) + '...'
      })

      const requestPayload = {
        model: 'openai/gpt-4o-mini', // Cost-effective model for translations via OpenRouter
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: JSON.stringify(content, null, 2)
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      }

      console.log('📤 OpenRouter request payload:', JSON.stringify(requestPayload, null, 2))

      const response = await openai.chat.completions.create(requestPayload)

      console.log('📥 OpenRouter response status:', response)
      console.log('📥 Response choices:', response.choices?.length)

      const translatedContent = response.choices[0]?.message?.content
      if (!translatedContent) {
        console.error('❌ No translation content in response')
        throw new Error('No translation received from OpenRouter')
      }

      console.log('📝 Raw translation response:', translatedContent)

      const parsed = JSON.parse(translatedContent) as TranslatedContent
      
      // Validate required fields
      if (!parsed.title || !parsed.description) {
        console.error('❌ Invalid parsed translation:', parsed)
        throw new Error('Invalid translation response: missing required fields')
      }

      console.log(`✅ Successful translation for ${contentType} to ${targetLocale}:`, {
        originalTitle: content.title.substring(0, 50),
        translatedTitle: parsed.title.substring(0, 50),
        titleChanged: content.title !== parsed.title,
        descChanged: content.description !== parsed.description
      })

      return parsed
    } catch (error) {
      console.error(`❌ Translation failed for ${contentType} to ${targetLocale}:`, error)
      
      // Fallback: return original content
      console.log(`⚠️ Falling back to original content for ${targetLocale}`)
      return content as TranslatedContent
    }
  }

  /**
   * Get cached translation or create new one
   */
  static async getOrCreateTranslation(
    contentId: string,
    content: {
      title: string
      description: string
      organization?: string
    },
    targetLocale: string,
    contentType: 'opportunity' | 'community'
  ): Promise<TranslatedContent> {
    if (targetLocale === 'en') {
      return content as TranslatedContent
    }

    try {
      // Check cache first
      const cachedTranslation = await this.getCachedTranslation(
        contentId,
        targetLocale,
        contentType,
        content
      )

      if (cachedTranslation) {
        console.log(`📦 Using cached translation for ${contentId} (${targetLocale})`)
        return cachedTranslation.translations
      }

      // Create new translation
      console.log(`🔄 Creating new translation for ${contentId} (${targetLocale})`)
      const translation = await this.translateContent(content, targetLocale, contentType)

      // Cache the translation
      await this.cacheTranslation(contentId, content, targetLocale, contentType, translation)

      return translation
    } catch (error) {
      console.error(`❌ Error in getOrCreateTranslation:`, error)
      return content as TranslatedContent // Fallback to original
    }
  }

  /**
   * Get cached translation if valid
   */
  private static async getCachedTranslation(
    contentId: string,
    targetLocale: string,
    contentType: 'opportunity' | 'community',
    currentContent: any
  ): Promise<TranslationCache | null> {
    const contentHash = this.generateContentHash(currentContent)
    return await FirebaseTranslationCacheService.getCachedTranslation(
      contentId,
      targetLocale,
      contentType,
      contentHash
    )
  }

  /**
   * Cache translation result
   */
  private static async cacheTranslation(
    contentId: string,
    originalContent: any,
    targetLocale: string,
    contentType: 'opportunity' | 'community',
    translation: TranslatedContent
  ): Promise<void> {
    try {
      const contentHash = this.generateContentHash(originalContent)
      
      await FirebaseTranslationCacheService.cacheTranslation(
        contentId,
        targetLocale,
        contentType,
        contentHash,
        translation,
        30 // TTL in days
      )
    } catch (error) {
      console.error('❌ Error caching translation:', error)
      // Non-critical error, don't throw
    }
  }

  /**
   * Batch translate multiple items for background processing
   */
  static async batchTranslate(
    items: Array<{
      id: string
      content: {
        title: string
        description: string
        organization?: string
      }
      type: 'opportunity' | 'community'
    }>,
    targetLocales: string[] = ['es', 'pt', 'fr']
  ): Promise<void> {
    console.log(`🔄 Starting batch translation for ${items.length} items`)

    for (const item of items) {
      for (const locale of targetLocales) {
        try {
          await this.getOrCreateTranslation(
            item.id,
            item.content,
            locale,
            item.type
          )
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`❌ Batch translation failed for ${item.id} (${locale}):`, error)
          // Continue with other translations
        }
      }
    }

    console.log(`✅ Batch translation completed`)
  }

  /**
   * Validate translation quality (basic checks)
   */
  static validateTranslation(
    original: TranslatedContent,
    translated: TranslatedContent
  ): boolean {
    // Basic validation checks
    if (!translated.title || !translated.description) {
      return false
    }

    // Check if translation is suspiciously similar (might indicate failed translation)
    if (translated.title === original.title && translated.description === original.description) {
      return false
    }

    // Check reasonable length ratios (translations shouldn't be drastically different in length)
    const titleRatio = translated.title.length / original.title.length
    const descRatio = translated.description.length / original.description.length

    if (titleRatio < 0.3 || titleRatio > 3 || descRatio < 0.3 || descRatio > 3) {
      console.warn('⚠️ Translation length ratio seems unusual')
    }

    return true
  }

  /**
   * Get supported locales for translation
   */
  static getSupportedLocales(): string[] {
    return locales.filter(locale => locale !== 'en')
  }
}