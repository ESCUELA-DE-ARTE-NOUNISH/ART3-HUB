import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navigation from "@/components/navigation"
import LanguageSelector from "@/components/language-selector"
import { locales } from "@/config/i18n"
import HtmlWithLang from "@/components/html-with-lang";

import { Wallet } from "@/components/wallet"
import AppWrapper from "@/components/app-wrapper"
import { Web3Providers } from "@/components/providers/web3-providers"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description:
      "AI-powered onboarding experience for visual artists entering Web3",
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
            splashBackgroundColor:
              process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
    },
  };
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export default function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale?: string }
}) {
  return (
    <HtmlWithLang>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Web3Providers>
            <AppWrapper>
              <div className="flex flex-col min-h-screen">
                  {/* Header with wallet and language selector */}
                  <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
                    <div className="flex justify-end items-center px-2 sm:px-3 py-2 gap-1 sm:gap-2">
                      <LanguageSelector />
                      <Wallet />
                    </div>
                  </div>
                  
                  {/* Main content with top padding to account for fixed header */}
                  <main className="flex-1 pt-12 sm:pt-14">
                    {children}
                  </main>
                  <Navigation />
                </div>
              </AppWrapper>
            </Web3Providers>
        </ThemeProvider>
      </body>
    </HtmlWithLang>
  )
} 