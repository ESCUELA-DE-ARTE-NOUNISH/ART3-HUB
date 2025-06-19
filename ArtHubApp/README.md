# Art3 Hub Frontend Application

A modern, multi-platform Web3 NFT creation and marketplace platform built with Next.js, integrating with Art3Hub smart contracts for decentralized NFT collection creation.

## 🚀 Features

### Core Functionality
- **🎨 NFT Collection Creation**: Deploy your own ERC-721 collections via Art3Hub Factory
- **💎 Subscription-Based Minting**: Gasless NFT creation with tiered subscription plans
- **🔍 NFT Discovery & Marketplace**: Explore, search, and discover NFTs with advanced filtering
- **🎬 Branded Splash Screen**: Animated GIF intro with logo transition for premium app experience
- **🌐 Multi-Network Support**: Base, Zora, and Celo networks (mainnet + testnet)
- **📱 Multi-Platform**: Browser, mobile, and Farcaster frame compatibility
- **🌍 Internationalization**: Support for English, Spanish, French, and Portuguese
- **💎 IPFS Storage**: Decentralized file storage via Pinata integration
- **🤖 AI Assistant**: Educational Web3 learning companion

### Smart Contract Integration
- **Art3Hub Factory V3**: Latest gas-efficient NFT collection deployment with built-in gasless functionality
- **Art3Hub Subscription V3**: Enhanced USDC-based subscription plans with auto-enrollment
- **ERC-2981 Royalties**: Automatic royalty enforcement on secondary sales
- **OpenSea Compatible**: Full marketplace integration with enhanced metadata support
- **EIP-712 Meta-Transactions**: Built-in gasless operations for all subscribers
- **Multi-Chain Support**: Base, Zora, and Celo networks with unified experience
- **Auto-Enrollment**: Seamless onboarding with automatic Free plan enrollment
- **Real-time Fees**: Dynamic deployment fee fetching from contracts

### Subscription Plans
- **Plan Gratuito (Free)**: 1 NFT per year, auto-enrollment, gasless creation
- **Plan Master**: $4.99/month, 10 NFTs per month, gasless minting with meta-transactions
- **Auto-Enrollment**: New users automatically enrolled in Free plan on first interaction
- **USDC Payments**: Stable cross-chain subscription payments

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: Privy authentication + Wagmi + Viem
- **Database**: Supabase (PostgreSQL)
- **Storage**: Pinata IPFS
- **AI**: OpenRouter integration

### Project Structure
```
ArtHubApp/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── create/        # NFT creation page
│   │   ├── explore/       # NFT discovery & marketplace
│   │   ├── my-nfts/       # User gallery
│   │   ├── ai-agent/      # AI assistant
│   │   └── ...
│   └── api/               # Backend API routes
├── components/            # Reusable UI components
│   ├── splash-screen.tsx  # Animated GIF splash screen
│   ├── app-wrapper.tsx    # Client-side app wrapper
│   └── ui/                # shadcn/ui components
├── lib/                   # Core services and utilities
│   ├── services/          # Web3 and API services
│   └── utils/             # Helper functions
├── providers/             # React context providers
├── hooks/                 # Custom React hooks
├── messages/              # i18n translation files
├── public/                # Static assets
│   └── assets/            # Media files (GIF, images)
└── database/              # SQL schemas and migrations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Web3 wallet (MetaMask, Coinbase Wallet, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ArtHubApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. **Configure Environment Variables**
   ```bash
   # Database
   DATABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # IPFS Storage
   NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_key
   NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud

   # Web3 Configuration
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

   # Smart Contract Addresses (V2)
   NEXT_PUBLIC_ART3HUB_FACTORY_V2_BASE_SEPOLIA=0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2
   NEXT_PUBLIC_ART3HUB_IMPLEMENTATION_V2_BASE_SEPOLIA=0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2
   NEXT_PUBLIC_SUBSCRIPTION_MANAGER_BASE_SEPOLIA=0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4
   NEXT_PUBLIC_USDC_84532=0x036CbD53842c5426634e7929541eC2318f3dCF7e

   # Network Mode (true for testnet, false for mainnet)
   NEXT_PUBLIC_IS_TESTING_MODE=true
   ```

5. **Database Setup**
   Run the SQL migrations in your Supabase project:
   ```sql
   -- Initial schema setup
   \i database/schema.sql
   
   -- Add NFT tables
   \i database/nfts-table.sql
   
   -- Add explore page functionality (required for v2.0.0+)
   \i database/migration-add-artist-category.sql
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 🔗 Smart Contract Integration

### Deployed Contracts

#### Base Sepolia (Testnet)
- **Factory V2 Contract**: [`0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2`](https://sepolia.basescan.org/address/0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2#code)
- **Collection V2 Implementation**: [`0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2`](https://sepolia.basescan.org/address/0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2#code)
- **Subscription Manager**: [`0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4`](https://sepolia.basescan.org/address/0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4#code)
- **USDC Token (Base Sepolia)**: [`0x036CbD53842c5426634e7929541eC2318f3dCF7e`](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e#code)
- **Chain ID**: 84532
- **Explorer**: [Base Sepolia Scan](https://sepolia.basescan.org)

### Contract Integration Flow

1. **Subscription Management**
   ```typescript
   const subscriptionService = new SubscriptionService(publicClient, walletClient, chainId)
   
   // Check user's subscription status
   const subscription = await subscriptionService.getUserSubscription(userAddress)
   console.log(`Plan: ${subscription.planName}, NFTs: ${subscription.nftsMinted}/${subscription.nftLimit}`)
   
   // Subscribe to Free Plan (1 NFT/year)
   const freeHash = await subscriptionService.subscribeToFreePlan()
   
   // Upgrade to Master Plan ($4.99/month, 10 NFTs/month, gasless)
   const masterHash = await subscriptionService.subscribeToMasterPlan()
   ```

2. **Collection Creation**
   ```typescript
   const art3HubService = createArt3HubService(publicClient, walletClient, 'base', true)
   
   const result = await art3HubService.createCollection({
     name: "My Art Collection",
     symbol: "MYART",
     description: "A collection of my digital artwork",
     imageURI: "ipfs://QmHash...",
     maxSupply: 10000,
     mintPrice: "0.001", // ETH
     contractAdmin: artistAddress,
     fundsRecipient: artistAddress,
     royaltyBPS: 1000, // 10%
   })
   ```

3. **NFT Minting (V2 with Subscription)**
   ```typescript
   // For Master Plan subscribers - gasless minting with meta-transactions
   const mintResult = await art3HubService.mintTokenV2({
     collectionContract: result.contractAddress,
     recipient: userAddress,
     tokenURI: "ipfs://QmTokenHash...",
     title: "Artwork Title",
     description: "Artwork description",
     royaltyBPS: 1500, // 15% for this specific NFT
     useMetaTransaction: true // Gasless for premium subscribers
   })
   ```

## 🌐 Multi-Platform Support

### Browser Integration
- **Wallet Connection**: Privy embedded wallets + external wallet support
- **Network Switching**: Automatic network detection and switching
- **Transaction Monitoring**: Real-time transaction status updates

### Mobile & Frame Support
- **Coinbase OnchainKit**: Native mobile wallet integration
- **Farcaster Frames**: Social platform compatibility
- **Responsive Design**: Mobile-first UI/UX

### Wallet Compatibility
- MetaMask
- Coinbase Wallet
- WalletConnect
- Privy Embedded Wallets
- And many more...

## 🎨 User Features

### NFT Collection Creation
1. **Upload Artwork**: Drag & drop image files (PNG, JPG, GIF - max 10MB)
2. **Add Metadata**: Title, description, artist name, category, and royalty percentage
3. **Deploy Collection**: Automatic factory contract interaction
4. **Share & Mint**: Collection becomes immediately available for minting

### NFT Discovery & Exploration
- **Advanced Search**: Search by NFT name, artist, or description
- **Category Filtering**: Browse by art category (Digital Art, Photography, 3D Art, etc.)
- **Trending System**: Discover popular NFTs based on views and engagement
- **Artist Discovery**: Find and explore works by specific artists
- **Real-time Statistics**: View counts, likes, and popularity metrics

### Gallery & Management
- **Personal Gallery**: View all created NFTs and collections
- **Transaction History**: Complete record of all blockchain interactions
- **Collection Analytics**: Track mints, revenue, and engagement

### Branded App Experience
- **Animated Splash Screen**: 10-second branded GIF animation on app startup
- **Seamless Transitions**: GIF → Logo → Main interface with smooth animations
- **Mobile Optimized**: Vertical (9:16) aspect ratio for TikTok-style display
- **Session Memory**: Shows once per browser session for optimal UX
- **Skip Functionality**: Tap anywhere to skip to main interface

### AI Learning Assistant
- **Web3 Education**: Learn about NFTs, blockchain, and crypto
- **Rate Limited**: Prevents spam with Redis-based rate limiting
- **Multi-Language**: Support for all platform languages

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```

### API Routes

#### NFT Management
- `POST /api/nfts` - Create NFT record with artist and category metadata
- `GET /api/nfts` - List and filter NFTs (supports search, category, artist, sorting)
- `PUT /api/nfts/[id]` - Update NFT data
- `DELETE /api/nfts/[id]` - Delete NFT record

#### File Upload
- `POST /api/upload-to-pinata` - Upload files to IPFS
- `POST /api/upload-metadata-to-pinata` - Upload JSON metadata

#### User Management
- `GET /api/user-profile` - Get user profile
- `POST /api/user-profile` - Create/update profile
- `GET /api/user-profile/validate` - Validate profile completion

#### AI Assistant
- `POST /api/chat` - Chat with AI assistant (rate limited)

### Environment Configuration

#### Network Modes
```bash
# Testing Mode (Testnet)
NEXT_PUBLIC_IS_TESTING_MODE=true
# Uses Base Sepolia, Zora Sepolia

# Production Mode (Mainnet)  
NEXT_PUBLIC_IS_TESTING_MODE=false
# Uses Base, Zora mainnet
```

#### Contract Addresses
```bash
# Base Sepolia (Testnet) - Currently Deployed
NEXT_PUBLIC_ART3HUB_FACTORY_BASE_SEPOLIA=0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2
NEXT_PUBLIC_ART3HUB_IMPLEMENTATION_BASE_SEPOLIA=0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2

# Base Mainnet - To be deployed
NEXT_PUBLIC_ART3HUB_FACTORY_BASE=
NEXT_PUBLIC_ART3HUB_IMPLEMENTATION_BASE=

# Zora Networks - To be deployed
NEXT_PUBLIC_ART3HUB_FACTORY_ZORA=
NEXT_PUBLIC_ART3HUB_FACTORY_ZORA_SEPOLIA=
```

## 🛡️ Security & Best Practices

### Smart Contract Security
- **Audited Contracts**: Factory and collection contracts follow OpenZeppelin standards
- **Minimal Proxy Pattern**: Gas-efficient deployments with battle-tested implementation
- **Access Control**: Proper owner/admin permissions and role management

### Frontend Security
- **Environment Variables**: Sensitive keys properly managed
- **Input Validation**: Comprehensive form validation and sanitization
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Proper cross-origin request handling

### Web3 Security
- **Transaction Validation**: Pre-flight checks for all contract interactions
- **Network Verification**: Automatic network mismatch detection
- **Fee Estimation**: Gas estimation and fee calculation before transactions

## 🌍 Internationalization

### Supported Languages
- **English** (en) - Default
- **Spanish** (es) - Español
- **French** (fr) - Français  
- **Portuguese** (pt) - Português

### Adding New Languages

1. **Create translation file**
   ```bash
   mkdir messages/[locale]
   cp messages/en/index.json messages/[locale]/index.json
   ```

2. **Update i18n configuration**
   ```typescript
   // config/i18n.ts
   export const locales = ['en', 'es', 'fr', 'pt', 'new-locale']
   ```

3. **Translate content**
   Update the JSON file with translated strings

## 🚀 Deployment

### Production Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (Recommended)
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   Set all required environment variables in your hosting platform

4. **Database Migration**
   Run SQL migrations in your production Supabase instance

### Environment-Specific Configuration

#### Staging
```bash
NEXT_PUBLIC_IS_TESTING_MODE=true
# Use testnet contracts and services
```

#### Production
```bash
NEXT_PUBLIC_IS_TESTING_MODE=false
# Use mainnet contracts and services
```

## 📊 Monitoring & Analytics

### Error Tracking
- **Frontend Errors**: Console logging and user feedback
- **Transaction Failures**: Detailed error messages and recovery guidance
- **API Monitoring**: Request/response logging and error rates

### Performance Monitoring
- **Core Web Vitals**: Lighthouse performance metrics
- **Database Performance**: Query optimization and indexing
- **IPFS Performance**: Upload success rates and timing

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes and test**
4. **Submit pull request**

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Commit Messages**: Conventional Commits format

### Testing
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run e2e           # End-to-end tests
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://art3hub.app](https://art3hub.app) (Coming Soon)
- **Smart Contracts**: [Art3HubContract](../ArtHubContract/README.md)
- **Documentation**: [Art3 Hub Docs](https://docs.art3hub.com) (Coming Soon)
- **Discord**: [Art3 Hub Community](https://discord.gg/art3hub) (Coming Soon)

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/art3hub/issues)
- **Discord**: Join our community for support and discussions
- **Email**: developers@art3hub.com

---

**Built with ❤️ by the Art3 Hub team**

*Empowering artists to create, own, and monetize their digital art on the blockchain.*