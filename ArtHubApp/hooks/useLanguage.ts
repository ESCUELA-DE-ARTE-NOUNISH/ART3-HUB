'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { locales, defaultLocale, Locale } from '@/config/i18n'

// Function to get language from path or localStorage
function getLanguage(): Locale {
  if (typeof window === 'undefined') return defaultLocale as Locale
  
  // Try to get from localStorage first
  try {
    const storedLocale = localStorage.getItem('locale')
    if (storedLocale && locales.includes(storedLocale as Locale)) {
      return storedLocale as Locale
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error)
  }

  // Try to get from pathname
  try {
    const pathname = window.location.pathname
    const pathnameLocale = locales.find(locale => 
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )
    
    if (pathnameLocale) return pathnameLocale as Locale
  } catch (error) {
    console.error('Error parsing pathname:', error)
  }
  
  // Fallback to default
  return defaultLocale as Locale
}

export function useLanguage() {
  // Only run on the client
  if (typeof window === 'undefined') {
    return {
      currentLanguage: defaultLocale, 
      changeLanguage: () => {},
      languages: locales
    }
  }

  const router = useRouter()
  const pathname = usePathname()
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(defaultLocale as Locale)

  // Initialize on first render
  useEffect(() => {
    setCurrentLanguage(getLanguage())
  }, [])

  // Function to change language
  const changeLanguage = useCallback((newLocale: Locale) => {
    if (!locales.includes(newLocale)) return
    
    try {
      // Save to localStorage
      localStorage.setItem('locale', newLocale)
      
      // Navigate to the same page but with the new locale
      const currentPath = pathname || '/'
      
      // Remove the current locale prefix if it exists
      let pathWithoutLocale = currentPath
      for (const locale of locales) {
        if (currentPath === `/${locale}` || currentPath.startsWith(`/${locale}/`)) {
          pathWithoutLocale = currentPath.replace(new RegExp(`^/${locale}`), '')
          break
        }
      }
      
      // If path is empty after removing locale, set it to root
      if (!pathWithoutLocale) pathWithoutLocale = '/'
      
      // Add the new locale prefix if it's not the default, or path doesn't start with slash
      const newPath = newLocale === defaultLocale
        ? pathWithoutLocale
        : `/${newLocale}${pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`}`
      
      // Navigate to the new path
      router.push(newPath)
      router.refresh()
      
      // Update current language state
      setCurrentLanguage(newLocale)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }, [pathname, router])

  // Return current language and change function
  return { 
    currentLanguage, 
    changeLanguage,
    languages: locales
  }
} 