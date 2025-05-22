import { createTranslator } from 'next-intl'

// Helper to get translations in server components
export async function getTranslations(locale: string, namespace?: string) {
  let messages
  
  try {
    messages = (await import(`@/messages/${locale}/index.json`)).default
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    messages = (await import('@/messages/en/index.json')).default
  }
  
  return createTranslator({ locale, messages, namespace })
} 