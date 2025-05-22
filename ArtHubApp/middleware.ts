import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './config/i18n'

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  // The default locale
  defaultLocale,
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  localePrefix: 'as-needed'
})

export const config = {
  // Match all pathnames except for
  // - ... (non-internationalized paths)
  // - Next.js fixed paths /_next/ and /api/
  // - All paths that contain a dot (e.g. favicon.ico)
  matcher: ['/((?!api|_next|.*\\..*).*)']
} 