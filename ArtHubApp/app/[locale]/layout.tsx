import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navigation from "@/components/navigation"
import { Providers } from "@/providers/MiniKitProvider"
import LanguageSelector from "@/components/language-selector"
import { locales } from "@/config/i18n"
import HtmlWithLang from "@/components/html-with-lang"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="flex flex-col min-h-screen">
            <div className="flex mx-auto px-4">
              <LanguageSelector />
            </div>
            <main className="flex-1">
              <Providers>{children}</Providers>
            </main>
            <Navigation />
          </div>
        </ThemeProvider>
      </body>
    </HtmlWithLang>
  )
} 