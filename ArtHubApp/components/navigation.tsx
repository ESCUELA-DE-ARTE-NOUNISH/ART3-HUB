"use client"

import Link from "next/link"
import { Home, Search, Grid3X3, User } from "lucide-react"
import { usePathname, useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

export default function Navigation() {
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  
  // Simple labels with no translation dependencies
  const labels = {
    home: locale === 'es' ? 'Inicio' : 
          locale === 'pt' ? 'Início' : 
          locale === 'fr' ? 'Accueil' : 'Home',
          
    explore: locale === 'es' ? 'Explorar' : 
             locale === 'pt' ? 'Explorar' : 
             locale === 'fr' ? 'Explorer' : 'Explore',
             
    profile: locale === 'es' ? 'Perfil' : 
             locale === 'pt' ? 'Perfil' : 
             locale === 'fr' ? 'Profil' : 'Profile',
             
    collection: locale === 'es' ? 'Colección' : 
                locale === 'pt' ? 'Coleção' : 
                locale === 'fr' ? 'Collection' : 'Collection'
  }

  // Function to check if a path is active, accounting for locale prefixes
  const isActive = (path: string) => {
    // Remove locale prefix if present
    let pathWithoutLocale = pathname || '/'
    if (pathname && pathname.startsWith(`/${locale}/`)) {
      pathWithoutLocale = pathname.substring(locale.length + 1)
    } else if (pathname === `/${locale}`) {
      pathWithoutLocale = '/'
    }
    
    return pathWithoutLocale === path
  }

  // Function to prepend the current locale to links
  const getLocalizedPath = (path: string) => {
    if (path === '/') {
      return `/${locale}`
    }
    return `/${locale}${path}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="flex justify-around py-2">
        <Link href={getLocalizedPath("/")} className="flex flex-col items-center px-2 py-1">
          <Home className={`h-5 w-5 ${isActive("/") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            {labels.home}
          </span>
        </Link>
        <Link href={getLocalizedPath("/explore")} className="flex flex-col items-center px-2 py-1">
          <Search className={`h-5 w-5 ${isActive("/explore") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/explore") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            {labels.explore}
          </span>
        </Link>
        <Link href={getLocalizedPath("/my-collection")} className="flex flex-col items-center px-2 py-1">
          <Grid3X3 className={`h-5 w-5 ${isActive("/my-collection") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span
            className={`text-xs mt-1 ${isActive("/my-collection") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}
          >
            {labels.collection}
          </span>
        </Link>
        <Link href={getLocalizedPath("/profile")} className="flex flex-col items-center px-2 py-1">
          <User className={`h-5 w-5 ${isActive("/profile") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/profile") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            {labels.profile}
          </span>
        </Link>
      </div>
    </div>
  )
}
