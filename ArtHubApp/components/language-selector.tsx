"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { locales, defaultLocale } from "@/config/i18n"

type Language = {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "/flags/en.png",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "/flags/es.png",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "/flags/pt.png",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "/flags/fr.png",
  },
]

export default function LanguageSelector() {
  const [isClient, setIsClient] = useState(false)
  const [currentLocale, setCurrentLocale] = useState(defaultLocale)
  const params = useParams()
  const pathname = usePathname()
  
  // Set isClient and current locale on mount
  useEffect(() => {
    setIsClient(true)
    // Get locale from params or localStorage or default
    const localeFromParams = params?.locale as string
    const localeFromStorage = typeof window !== 'undefined' ? localStorage.getItem('locale') : null
    const activeLocale = localeFromParams || localeFromStorage || defaultLocale
    
    setCurrentLocale(activeLocale)
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', activeLocale)
    }
  }, [params])

  // Find the current language object
  const selectedLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const handleLanguageChange = (language: Language) => {
    if (typeof window !== 'undefined') {
      // Save to localStorage
      localStorage.setItem('locale', language.code)
      setCurrentLocale(language.code)
      
      // Get path without locale
      let pathWithoutLocale = pathname || '/'
      
      // Remove the current locale prefix if it exists
      locales.forEach(locale => {
        if (pathname === `/${locale}` || pathname?.startsWith(`/${locale}/`)) {
          pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '')
          if (!pathWithoutLocale) pathWithoutLocale = '/'
          return
        }
      })
      
      // Create new path with the selected language - always include locale in URL for consistency
      const newPath = `/${language.code}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
        
      // Use window.location instead of router.push to trigger a full page load
      // This prevents the hydration error with nested HTML elements
      window.location.href = newPath
    }
  }

  // Don't render on server to avoid hydration issues
  if (!isClient) return null

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1 h-8 px-2 rounded-full min-w-[80px]">
            <Globe className="h-4 w-4 text-[#FF69B4]" />
            <div className="flex items-center gap-1">
              <Image
                src={selectedLanguage.flag || "/placeholder.svg"}
                alt={`${selectedLanguage.name} flag`}
                width={14}
                height={10}
                className="rounded-sm w-[14px] h-[10px]"
              />
              <span className="text-xs font-medium hidden sm:inline">{selectedLanguage.nativeName}</span>
              <span className="text-xs font-medium sm:hidden">{selectedLanguage.code.toUpperCase()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`flex items-center gap-2 ${currentLocale === language.code ? "bg-gray-100" : ""}`}
            >
              <Image
                src={language.flag || "/placeholder.svg"}
                alt={`${language.name} flag`}
                width={20}
                height={15}
                className="rounded-sm w-[20px] h-[15px]"
              />
              <div className="flex justify-between items-center w-full">
                <span>{language.nativeName}</span>
                <span className="text-xs text-gray-500">{language.code.toUpperCase()}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
