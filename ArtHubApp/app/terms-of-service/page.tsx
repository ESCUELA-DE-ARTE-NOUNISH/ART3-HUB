'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

function TermsOfServiceContent() {
  const t = useTranslations('termsOfService')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-pink-500 hover:text-pink-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backButton')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('lastUpdated')}: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.introduction.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.introduction.content1')}
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              {t('sections.introduction.content2')}
            </p>
          </section>

          {/* Platform Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.services.title')}</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.services.art3HubServices.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              {t.raw('sections.services.art3HubServices.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.services.thirdParty.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.services.thirdParty.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* User Accounts and Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.accounts.title')}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.accounts.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Intellectual Property and Content */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.intellectualProperty.title')}</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.intellectualProperty.yourContent.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              {t.raw('sections.intellectualProperty.yourContent.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.intellectualProperty.platformContent.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.intellectualProperty.platformContent.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* NFTs and Blockchain Interactions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.nfts.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.nfts.content')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.nfts.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Prohibited Uses */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.prohibited.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{t('sections.prohibited.content')}</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.prohibited.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Platform Availability and Modifications */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.availability.title')}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.availability.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Privacy and Data Protection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.privacy.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.privacy.content')}{' '}
              <Link href="/privacy-policy" className="text-pink-500 hover:text-pink-600 underline">
                {t('sections.privacy.privacyLink')}
              </Link>
              {t('sections.privacy.content2')}
            </p>
          </section>

          {/* Disclaimers and Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.disclaimers.title')}</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.disclaimers.serviceDisclaimers.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              {t.raw('sections.disclaimers.serviceDisclaimers.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.disclaimers.limitation.title')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.disclaimers.limitation.content')}
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.indemnification.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.indemnification.content')}
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.termination.title')}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.termination.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Governing Law and Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.governingLaw.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.governingLaw.content1')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.governingLaw.content2')}
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.contact.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.contact.content')}
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>{t('sections.contact.companyName')}</strong></p>
              <p className="text-gray-700">{t('sections.contact.organizationName')}</p>
              <p className="text-gray-700">{t('sections.contact.email')}</p>
              <p className="text-gray-700">{t('sections.contact.tagline')}</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              {t('footer', { date: new Date().toLocaleDateString() })}
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