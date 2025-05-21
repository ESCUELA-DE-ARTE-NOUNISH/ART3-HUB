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
  webpack: (config, { isServer }) => {
    // Only apply this to client-side bundle
    if (!isServer) {
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

export default nextConfig
