import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Temporarily disable static generation to fix Web3 SSR issues
  output: 'standalone',
  // Add this configuration to allow ngrok domains
  allowedDevOrigins: [
    'app.art3hub.xyz/',
    'art3-hub.vercel.app/',
    'codalabs.ngrok.io',
    '*.ngrok.io', // This will allow any ngrok subdomain
  ],
  webpack: (config, { isServer, webpack }) => {
    // Server-side: prevent browser API access
    if (isServer) {
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof window': '"undefined"',
          'typeof indexedDB': '"undefined"',
          'typeof localStorage': '"undefined"',
          'typeof sessionStorage': '"undefined"',
          'typeof navigator': '"undefined"',
        })
      )
    } else {
      // Only apply this to client-side bundle
      // Mark LangChain packages as external to avoid bundling them on the client side
      config.externals = [...(config.externals || []), 
        'langchain',
        '@langchain/openai',
        '@langchain/core',
        '@langchain/community'
      ]
    }
    return config
  },
}

export default withNextIntl(nextConfig)
