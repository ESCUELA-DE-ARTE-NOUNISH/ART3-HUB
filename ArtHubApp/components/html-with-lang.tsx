'use client'

import { useParams } from 'next/navigation'
import { ReactNode } from 'react'
import { defaultLocale } from '@/config/i18n'

type HtmlWithLangProps = {
  children: ReactNode
}

export default function HtmlWithLang({ children }: HtmlWithLangProps) {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  
  return (
    <html lang={locale} suppressHydrationWarning>
      {children}
    </html>
  )
} 