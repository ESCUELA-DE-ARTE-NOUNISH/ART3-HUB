'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

function PrivacyPolicyContent() {
  const t = useTranslations('privacyPolicy')

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

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.informationCollected.title')}</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.informationCollected.personalInfo.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              {t.raw('sections.informationCollected.personalInfo.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.informationCollected.digitalArt.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              {t.raw('sections.informationCollected.digitalArt.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sections.informationCollected.usageInfo.title')}</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.informationCollected.usageInfo.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.howWeUse.title')}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.howWeUse.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Blockchain and Web3 Considerations */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.blockchain.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.blockchain.content')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.blockchain.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.sharing.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{t('sections.sharing.content')}</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.sharing.items').map((item: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.thirdParty.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{t('sections.thirdParty.content')}</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.thirdParty.items').map((item: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              {t('sections.thirdParty.note')}
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.security.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('sections.security.content')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.security.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              {t('sections.security.disclaimer')}
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.rights.title')}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {t.raw('sections.rights.items').map((item: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.children.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.children.content')}
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.international.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.international.content')}
            </p>
          </section>

          {/* Changes to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.changes.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.changes.content')}
            </p>
          </section>

          {/* Contact Us */}
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
            <p className="text-gray-700 leading-relaxed mt-4">
              {t('sections.contact.termsReference')}{' '}
              <Link href="/terms-of-service" className="text-pink-500 hover:text-pink-600 underline">
                {t('sections.contact.termsLink')}
              </Link>.
            </p>
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