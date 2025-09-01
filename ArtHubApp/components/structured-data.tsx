"use client"

import Script from 'next/script'

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Art3 Hub Agent",
    "alternateName": "Art3 Hub AI Assistant",
    "description": "AI-powered Web3 art guide that helps visual artists enter the decentralized creative economy with personalized guidance and NFT education.",
    "url": "https://app.art3hub.xyz",
    "logo": "https://app.art3hub.xyz/logoSEO.png",
    "image": "https://app.art3hub.xyz/logoSEO.png",
    "applicationCategory": "EducationalApplication",
    "applicationSubCategory": "AI Assistant",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "AI-powered art guidance",
      "Web3 education",
      "NFT creation assistance", 
      "Personalized recommendations",
      "Multi-language support"
    ],
    "screenshot": "https://app.art3hub.xyz/logoSEO.png",
    "author": {
      "@type": "Organization",
      "name": "Art3 Hub",
      "url": "https://app.art3hub.xyz",
      "email": "contact@art3hub.xyz",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "contact@art3hub.xyz",
        "contactType": "customer service"
      }
    },
    "publisher": {
      "@type": "Organization", 
      "name": "Art3 Hub",
      "url": "https://app.art3hub.xyz",
      "email": "contact@art3hub.xyz",
      "logo": {
        "@type": "ImageObject",
        "url": "https://app.art3hub.xyz/logoSEO.png"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "contact@art3hub.xyz",
        "contactType": "customer service"
      }
    },
    "keywords": [
      "Web3",
      "NFT", 
      "AI Assistant",
      "Digital Art",
      "Blockchain",
      "Art Creation",
      "Crypto Art",
      "DeFi",
      "Art Education",
      "Creative Economy"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Visual Artists, Digital Creators, Web3 Enthusiasts"
    }
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}