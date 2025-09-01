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
import StructuredData from "@/components/structured-data"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || URL || 'https://app.art3hub.xyz';
  const logoUrl = `${siteUrl}/logoSEO.png`;
  const farcasterLogoUrl = `${siteUrl}/logo.png`;
  
  return {
    title: "Art3 Hub Agent - AI-Powered Web3 Art Guide",
    description: "Meet your personal AI assistant for Web3 art creation. Get personalized guidance, learn about NFTs, and discover your perfect path in the decentralized creative economy.",
    keywords: ["Web3", "NFT", "AI Assistant", "Digital Art", "Blockchain", "Art Creation", "Crypto Art", "DeFi"],
    authors: [{ name: "Art3 Hub" }],
    creator: "Art3 Hub",
    publisher: "Art3 Hub",
    metadataBase: siteUrl ? (() => { try { return new URL(siteUrl) } catch { return undefined } })() : undefined,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: "Art3 Hub Agent - AI-Powered Web3 Art Guide",
      description: "Meet your personal AI assistant for Web3 art creation. Get personalized guidance, learn about NFTs, and discover your perfect path in the decentralized creative economy.",
      url: siteUrl,
      siteName: "Art3 Hub Agent",
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: "Art3 Hub Agent - AI-Powered Web3 Art Guide",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Art3 Hub Agent - AI-Powered Web3 Art Guide", 
      description: "Meet your personal AI assistant for Web3 art creation. Get personalized guidance, learn about NFTs, and discover your perfect path in the decentralized creative economy.",
      images: [logoUrl],
      creator: "@art3hub",
      site: "@art3hub",
      creatorId: "@art3hub",
      siteId: "@art3hub",
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    category: "technology",
    applicationName: "Art3 Hub Agent",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: "/manifest.json",
    itunes: {
      appId: "Art3HubAgent",
      appArgument: siteUrl,
    },
    appleWebApp: {
      title: "Art3 Hub Agent",
      statusBarStyle: "black-translucent",
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: farcasterLogoUrl,
        button: {
          title: "Launch Art3 Hub Agent",
          action: {
            type: "launch_frame",
            name: "Art3 Hub Agent",
            url: siteUrl,
            splashImageUrl: farcasterLogoUrl,
            splashBackgroundColor: "#ec4899",
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
}: {
  children: React.ReactNode
  params: { locale?: string }
}) {
  return (
    <HtmlWithLang>
      <body className={inter.className} suppressHydrationWarning={true}>
        <StructuredData />
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