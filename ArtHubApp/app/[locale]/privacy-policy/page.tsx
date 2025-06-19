'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { defaultLocale } from '@/config/i18n'

function PrivacyPolicyContent() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href={`/${locale}`}>
            <Button variant="ghost" className="mb-4 text-pink-500 hover:text-pink-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Art3 Hub
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Art3 Hub, a digital art platform designed to onboard visual artists into the world of digital creativity and NFTs. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Art3 Hub is operated by Escuela de Arte Nounish, a decentralized art school focused on teaching art and digital creativity 
              to students and artists worldwide, with a special focus on the LATAM community.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Personal Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Email addresses when you create an account</li>
              <li>Social media account information (Google, Instagram, Twitter) when you choose to connect them</li>
              <li>Profile information you provide (name, bio, profile picture)</li>
              <li>Wallet addresses when you connect your digital wallet</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Digital Art and NFT Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Artwork files you upload to create NFTs</li>
              <li>NFT metadata and collection information</li>
              <li>Transaction history related to NFT creation and minting</li>
              <li>Blockchain transaction data (publicly available on Base, Celo, and Zora networks)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Usage Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Platform usage analytics and interaction data</li>
              <li>Chat conversations with our educational assistant</li>
              <li>Learning progress and achievement data</li>
              <li>Device information and browser type</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>To provide and maintain the Art3 Hub platform and services</li>
              <li>To enable NFT creation, minting, and management functionality</li>
              <li>To provide educational content and personalized learning experiences</li>
              <li>To facilitate communication through our educational assistant</li>
              <li>To connect you with opportunities in the digital art space</li>
              <li>To improve our platform and develop new features</li>
              <li>To ensure platform security and prevent fraud</li>
              <li>To comply with legal obligations and blockchain requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Blockchain and Web3 Considerations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Art3 Hub operates on blockchain networks including Base, Celo, and Zora. Important considerations:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Blockchain transactions are public and immutable by design</li>
              <li>Your wallet address and NFT ownership are publicly visible on the blockchain</li>
              <li>We cannot delete or modify information stored on the blockchain</li>
              <li>Smart contract interactions may be visible to others</li>
              <li>Gas fees and transaction costs are handled by the respective blockchain networks</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Public Blockchain Data:</strong> NFT and transaction data is publicly available on blockchain networks</li>
              <li><strong>Service Providers:</strong> With trusted third-party services including Privy (authentication), Pinata (IPFS storage), and blockchain infrastructure providers</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>Educational Partners:</strong> Anonymized data with educational institutions and the Nounish Art School network</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Art3 Hub integrates with several third-party services:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Privy:</strong> For secure authentication and wallet connection</li>
              <li><strong>Pinata:</strong> For IPFS storage of NFT metadata and artwork</li>
              <li><strong>Blockchain Networks:</strong> Base, Celo, and Zora for NFT minting and transactions</li>
              <li><strong>Social Media Platforms:</strong> Google, Instagram, Twitter for social login</li>
              <li><strong>Analytics Services:</strong> For platform improvement and usage insights</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Each third-party service has its own privacy policy. We encourage you to review their policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication through Privy</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information</li>
              <li>Secure cloud infrastructure</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights and Choices</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data (note: blockchain data cannot be deleted)</li>
              <li><strong>Portability:</strong> Request export of your data</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for certain data processing activities</li>
              <li><strong>Account Control:</strong> Disconnect social media accounts and wallets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Art3 Hub is designed for users 17 years and older. We do not knowingly collect personal information 
              from children under 17. If we learn that we have collected information from a child under 17, 
              we will take steps to delete such information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Art3 Hub serves users globally, with a focus on the LATAM community. Your information may be 
              transferred to and processed in countries other than your own. We ensure appropriate safeguards 
              are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date. 
              You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Art3 Hub</strong></p>
              <p className="text-gray-700">Escuela de Arte Nounish</p>
              <p className="text-gray-700">Email: privacy@art3hub.com</p>
              <p className="text-gray-700">Built with ❤️ from LATAM</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              This Privacy Policy is effective as of {new Date().toLocaleDateString()} and applies to all users of the Art3 Hub platform.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading Privacy Policy...</p>
        </div>
      </div>
    }>
      <PrivacyPolicyContent />
    </Suspense>
  )
}