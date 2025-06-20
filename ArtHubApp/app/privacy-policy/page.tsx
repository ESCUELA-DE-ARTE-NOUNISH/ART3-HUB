'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function PrivacyPolicyContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-pink-500 hover:text-pink-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Art3 Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform for creating, minting, and managing NFTs.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By using Art3 Hub, you agree to the terms of this Privacy Policy. If you do not agree with this policy, please do not access or use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Wallet addresses and blockchain transaction data</li>
              <li>Email addresses (if provided for notifications)</li>
              <li>Profile information (usernames, display names, bios)</li>
              <li>Contact information when you reach out to us</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Digital Art and NFT Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Artwork uploads and metadata</li>
              <li>NFT creation and minting history</li>
              <li>Collection and marketplace activity</li>
              <li>Trading and transaction records</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Device information and browser data</li>
              <li>IP addresses and geolocation data</li>
              <li>Platform usage patterns and analytics</li>
              <li>Performance and error logs</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide and maintain our NFT creation and marketplace services</li>
              <li>Process transactions and manage your digital assets</li>
              <li>Improve platform functionality and user experience</li>
              <li>Send important service updates and notifications</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations and regulatory requirements</li>
            </ul>
          </section>

          {/* Blockchain and Web3 Considerations */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Blockchain and Web3 Considerations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Art3 Hub operates on blockchain networks, which have unique privacy implications. Please understand:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Blockchain transactions are public and immutable</li>
              <li>Your wallet address and transaction history are visible on the blockchain</li>
              <li>NFT metadata may be stored on decentralized networks (IPFS)</li>
              <li>Smart contract interactions are recorded permanently</li>
              <li>We cannot modify or delete blockchain-recorded information</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Public Display:</strong> NFTs and artwork you create are displayed publicly on our platform</li>
              <li><strong>Service Providers:</strong> Third-party services that help operate our platform (cloud storage, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Art3 Hub integrates with various third-party services:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Wallet Providers:</strong> MetaMask, WalletConnect, and other wallet services</li>
              <li><strong>Blockchain Networks:</strong> Base, Ethereum, and other supported chains</li>
              <li><strong>Storage Services:</strong> IPFS, Arweave, and cloud storage providers</li>
              <li><strong>Analytics:</strong> Usage analytics and performance monitoring tools</li>
              <li><strong>Payment Processors:</strong> Cryptocurrency payment and fiat conversion services</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              These services have their own privacy policies, which we encourage you to review.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure development practices and code reviews</li>
              <li>Incident response and breach notification procedures</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request copies of your personal information</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account data (blockchain data cannot be deleted)</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restriction:</strong> Limit how we process your information</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Art3 Hub is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information during international transfers.
            </p>
          </section>

          {/* Changes to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the platform after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Art3 Hub</strong></p>
              <p className="text-gray-700">Escuela de Arte Nounish</p>
              <p className="text-gray-700">Email: privacy@art3hub.com</p>
              <p className="text-gray-700">Built with ❤️ from LATAM</p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              For more information about our platform terms, please see our{' '}
              <Link href="/terms-of-service" className="text-pink-500 hover:text-pink-600 underline">
                Terms of Service
              </Link>.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              This Privacy Policy was last updated on {new Date().toLocaleDateString()}
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