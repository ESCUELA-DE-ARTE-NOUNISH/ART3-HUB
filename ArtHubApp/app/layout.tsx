import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || URL || 'https://app.art3hub.xyz';
  const logoUrl = `${siteUrl}/logoSEO.png`;
  const farcasterLogoUrl = `${siteUrl}/icon.png`;
  
  return {
    title: "Art3 Hub Agent - AI-Powered Web3 Art Guide",
    description: "Meet your personal AI assistant for Web3 art creation. Get personalized guidance, learn about NFTs, and discover your perfect path in the decentralized creative economy.",
    keywords: ["Web3", "NFT", "AI Assistant", "Digital Art", "Blockchain", "Art Creation", "Crypto Art", "DeFi"],
    authors: [{ name: "Art3 Hub", url: siteUrl }],
    creator: "Art3 Hub",
    publisher: "Art3 Hub",
    metadataBase: siteUrl ? (() => { try { return new URL(siteUrl) } catch { return undefined } })() : undefined,
    openGraph: {
      title: "Art3 Hub Agent - AI-Powered Web3 Art Guide",
      description: "Meet your personal AI assistant for Web3 art creation. Get personalized guidance, learn about NFTs, and discover your perfect path in the decentralized creative economy.",
      url: siteUrl,
      siteName: "Art3 Hub Agent",
      images: [logoUrl],
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
    },
    category: "art-creativity",
    applicationName: "Art3 Hub Agent",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
