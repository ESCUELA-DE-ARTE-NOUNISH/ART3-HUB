import { getRequestConfig } from 'next-intl/server'
import { defaultLocale } from './config/i18n'

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is never undefined
  const safeLocale = locale || defaultLocale
  
  // Load messages for the locale
  const messages = (await import(`./messages/${safeLocale}/index.json`)).default

  return {
    locale: safeLocale,
    messages,
    timeZone: 'UTC'
  }
}) 