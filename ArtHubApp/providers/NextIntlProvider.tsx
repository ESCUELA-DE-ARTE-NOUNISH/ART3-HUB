'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { locales, defaultLocale } from '@/config/i18n'

interface NextIntlProviderProps {
  children: ReactNode
  locale?: string
  messages?: Record<string, any>
}

export function NextIntlProvider({ children, locale, messages }: NextIntlProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentLocale, setCurrentLocale] = useState(locale || defaultLocale)
  const [currentMessages, setCurrentMessages] = useState<Record<string, any> | null>(messages || null)

  useEffect(() => {
    // Load messages if they weren't provided
    if (!currentMessages) {
      import(`@/messages/${currentLocale}/index.json`)
        .then((module) => {
          setCurrentMessages(module.default)
        })
        .catch((error) => {
          console.error(`Failed to load messages for locale ${currentLocale}:`, error)
          // Fallback to default locale
          if (currentLocale !== defaultLocale) {
            setCurrentLocale(defaultLocale)
          }
        })
    }
  }, [currentLocale, currentMessages])

  // Handle locale change
  useEffect(() => {
    if (locale && locale !== currentLocale) {
      setCurrentLocale(locale)
      setCurrentMessages(null) // Reset messages to trigger reload
    }
  }, [locale, currentLocale])

  // If we don't have messages yet, show nothing (or a loader)
  if (!currentMessages) {
    return null
  }

  return (
    <NextIntlClientProvider locale={currentLocale} messages={currentMessages}>
      {children}
    </NextIntlClientProvider>
  )
} 