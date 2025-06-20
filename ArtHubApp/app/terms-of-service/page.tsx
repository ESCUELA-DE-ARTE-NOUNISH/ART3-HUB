'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function TermsOfServiceContent() {
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
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to Art3 Hub</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") govern your use of Art3 Hub, a platform for creating, minting, and managing NFTs. By accessing or using our services, you agree to be bound by these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If you do not agree to these Terms, please do not use our platform. We may update these Terms from time to time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By creating an account, connecting your wallet, or using any part of Art3 Hub, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              You must be at least 18 years old to use Art3 Hub. If you are under 18, you may only use the platform with the consent and supervision of a parent or legal guardian.
            </p>
          </section>

          {/* Platform Description */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Platform Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Art3 Hub provides the following services:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Digital art creation and upload tools</li>
              <li>NFT minting on blockchain networks (primarily Base)</li>
              <li>Marketplace for buying and selling NFTs</li>
              <li>Portfolio management for digital assets</li>
              <li>Community features and artist discovery</li>
              <li>Educational resources about Web3 and NFTs</li>
            </ul>
          </section>

          {/* User Accounts and Wallets */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts and Wallets</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Account Registration</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>You must connect a compatible cryptocurrency wallet to use Art3 Hub</li>
              <li>You are responsible for maintaining the security of your wallet and private keys</li>
              <li>You must provide accurate and complete information when setting up your profile</li>
              <li>You may not create multiple accounts or share your account with others</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Wallet Security</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Art3 Hub never has access to your private keys or wallet funds</li>
              <li>You are solely responsible for wallet security and transaction authorization</li>
              <li>Lost or stolen wallets cannot be recovered by Art3 Hub</li>
              <li>Always verify transaction details before confirming blockchain transactions</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property Rights</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Your Content</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>You retain ownership of the intellectual property rights in your original artwork</li>
              <li>You grant Art3 Hub a license to display, distribute, and promote your NFTs on our platform</li>
              <li>You represent that you have the right to mint and sell the content you upload</li>
              <li>You must not upload content that infringes on others' intellectual property rights</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Platform Content</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Art3 Hub owns the intellectual property rights in the platform software and design</li>
              <li>You may not copy, modify, or distribute our platform code or design elements</li>
              <li>Our trademarks and branding are protected and may not be used without permission</li>
            </ul>
          </section>

          {/* NFT Creation and Trading */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">NFT Creation and Trading</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Minting NFTs</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>NFT minting requires payment of blockchain gas fees</li>
              <li>Minted NFTs are recorded permanently on the blockchain</li>
              <li>Art3 Hub charges platform fees for minting services</li>
              <li>You are responsible for all costs associated with blockchain transactions</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Trading and Sales</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>All NFT sales are final and cannot be reversed</li>
              <li>Art3 Hub may charge transaction fees on sales</li>
              <li>You are responsible for any applicable taxes on NFT transactions</li>
              <li>Pricing and payment terms are set by individual users</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Activities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Upload content that is illegal, harmful, or violates others' rights</li>
              <li>Engage in fraud, money laundering, or other illegal financial activities</li>
              <li>Manipulate markets or engage in wash trading</li>
              <li>Spam, harass, or abuse other users</li>
              <li>Attempt to hack, break, or exploit the platform</li>
              <li>Create fake or misleading profiles or content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
            </ul>
          </section>

          {/* Fees and Payments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fees and Payments</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Platform Fees</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Art3 Hub charges fees for minting and trading services</li>
              <li>Current fee structures are displayed on the platform</li>
              <li>Fees may change with advance notice to users</li>
              <li>All fees are non-refundable unless required by law</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Blockchain Costs</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Users pay gas fees directly to blockchain networks</li>
              <li>Gas fees are not controlled by Art3 Hub and may fluctuate</li>
              <li>Failed transactions may still incur gas fees</li>
            </ul>
          </section>

          {/* Privacy and Data */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy and Data</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your privacy is important to us. Please review our{' '}
              <Link href="/privacy-policy" className="text-pink-500 hover:text-pink-600 underline">
                Privacy Policy
              </Link>{' '}
              to understand how we collect, use, and protect your information.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Blockchain transactions are public and permanent</li>
              <li>We may collect usage data to improve our services</li>
              <li>You can request deletion of your account data</li>
              <li>Some data cannot be deleted due to blockchain immutability</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
              <p className="text-yellow-700 text-sm">
                NFTs and cryptocurrency involve significant risks. Values can be volatile and may decrease to zero. Only invest what you can afford to lose.
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Art3 Hub is provided "as is" without warranties of any kind</li>
              <li>We do not guarantee platform availability or uptime</li>
              <li>Blockchain networks may experience delays or failures</li>
              <li>NFT values are speculative and may fluctuate significantly</li>
              <li>We are not responsible for the actions of other users</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, Art3 Hub and its team members shall not be liable for any indirect, incidental, special, or consequential damages, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages from platform outages or technical issues</li>
              <li>Losses from blockchain network problems</li>
              <li>Damages from user misconduct or third-party actions</li>
              <li>Losses from NFT value fluctuations</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Either you or Art3 Hub may terminate your access to the platform at any time:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You may stop using the platform and disconnect your wallet at any time</li>
              <li>We may suspend or terminate accounts for Terms violations</li>
              <li>Upon termination, these Terms continue to apply to past activities</li>
              <li>Your NFTs remain on the blockchain regardless of account status</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the jurisdiction where Art3 Hub operates. Any disputes arising from these Terms or your use of the platform will be resolved through binding arbitration.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time to reflect changes in our services or applicable law. We will notify users of significant changes and post the updated Terms on this page. Your continued use of Art3 Hub after changes become effective constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Art3 Hub</strong></p>
              <p className="text-gray-700">Escuela de Arte Nounish</p>
              <p className="text-gray-700">Email: legal@art3hub.com</p>
              <p className="text-gray-700">Built with ❤️ from LATAM</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              These Terms of Service were last updated on {new Date().toLocaleDateString()}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function TermsOfServicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading Terms of Service...</p>
        </div>
      </div>
    }>
      <TermsOfServiceContent />
    </Suspense>
  )
}