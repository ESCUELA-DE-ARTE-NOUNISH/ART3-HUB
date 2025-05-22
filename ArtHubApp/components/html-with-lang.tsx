'use client'

import { useParams } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { defaultLocale } from '@/config/i18n'

type HtmlWithLangProps = {
  children: ReactNode
}

export default function HtmlWithLang({ children }: HtmlWithLangProps) {
  const params = useParams()
  const [locale, setLocale] = useState(defaultLocale)
  
  useEffect(() => {
    // Update locale when params change
    setLocale((params?.locale as string) || defaultLocale)
  }, [params])
  
  return (
    <html lang={locale} suppressHydrationWarning>
      {children}
    </html>
  )
} 