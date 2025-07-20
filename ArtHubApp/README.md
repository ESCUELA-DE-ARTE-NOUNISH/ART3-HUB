# Art3 Hub Frontend Application

> **🚀 V6 Update (January 2025): Firebase Integration & Fresh Smart Contracts**

A modern, multi-platform Web3 NFT creation and marketplace platform built with Next.js, integrating with **Art3Hub V6 smart contracts** for decentralized NFT collection creation with **Firebase backend**.

## 🚀 Features

### Core Functionality
- **🎨 NFT Collection Creation**: Deploy your own ERC-721 collections via **Art3Hub V6 Factory**
- **💎 Subscription-Based Minting**: Gasless NFT creation with tiered subscription plans
- **🔍 NFT Discovery & Marketplace**: Explore, search, and discover NFTs with advanced filtering
- **🎬 Branded Splash Screen**: Animated GIF intro with logo transition for premium app experience
- **🌐 Base Network Optimized**: Focused deployment on Base network for optimal performance
- **📱 Multi-Platform**: Browser, mobile, and Farcaster frame compatibility
- **🌍 Internationalization**: Support for English, Spanish, French, and Portuguese
- **💎 IPFS Storage**: Decentralized file storage via Pinata integration
- **🤖 AI Assistant**: Educational Web3 learning companion
- **🔥 Firebase Backend**: Modern, scalable database solution - **NEW in V6**
- **🛡️ Admin System**: Secure admin management with environment-based configuration - **NEW in V6**

### Smart Contract Integration
- **Art3Hub Factory V6**: Fresh deployment with enhanced gasless functionality - **UPDATED**
- **Art3Hub Subscription V6**: Enhanced USDC-based subscription plans with auto-enrollment - **UPDATED**
- **ERC-2981 Royalties**: Automatic royalty enforcement on secondary sales
- **OpenSea Compatible**: Full marketplace integration with enhanced metadata support
- **EIP-712 Meta-Transactions**: Built-in gasless operations for all subscribers
- **Base Network Focused**: Optimized for Base network performance
- **Auto-Enrollment**: Seamless onboarding with automatic Free plan enrollment
- **Real-time Fees**: Dynamic deployment fee fetching from contracts
- **Fresh Contract Addresses**: New V6 deployment for clean start - **NEW**

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
- **Database**: **Firebase Firestore** - **UPDATED from Supabase**
- **Storage**: Pinata IPFS + Firebase Storage
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
   # Firebase Configuration - NEW in V6
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

   # IPFS Storage
   NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_key
   NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud

   # Web3 Configuration
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

   # Art3Hub V6 Contract Addresses - FRESH DEPLOYMENT
   NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532=0x6A2a69a88b92B8566354ECE538aF46fC783b9DFd
   NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532=0xd0611f925994fddD433a464886Ae3eF58Efb9EC9
   NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_84532=0xAecDa231ed8d8b9f5E9e39B3624FE2D073D86fB0

   # Admin Configuration - NEW in V6
   NEXT_PUBLIC_ADMIN_WALLET=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f

   # Network Mode (true for testnet, false for mainnet)
   NEXT_PUBLIC_IS_TESTING_MODE=true
   ```

5. **Database Setup**
   Firebase configuration is handled automatically. Set up your Firebase project:
   ```bash
   # 1. Create a Firebase project at https://console.firebase.google.com
   # 2. Enable Firestore Database
   # 3. Enable Storage
   # 4. Configure authentication rules
   # 5. Add your configuration to .env as shown above
   
   # Firebase setup is handled by the application automatically
   # No SQL migrations needed - Firebase uses NoSQL document storage
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

#### Base Sepolia (Testnet) - V6 Fresh Deployment
- **Factory V6 Contract**: [`0x6A2a69a88b92B8566354ECE538aF46fC783b9DFd`](https://sepolia.basescan.org/address/0x6A2a69a88b92B8566354ECE538aF46fC783b9DFd#code)
- **Subscription V6 Contract**: [`0xd0611f925994fddD433a464886Ae3eF58Efb9EC9`](https://sepolia.basescan.org/address/0xd0611f925994fddD433a464886Ae3eF58Efb9EC9#code)
- **Collection V6 Implementation**: [`0xAecDa231ed8d8b9f5E9e39B3624FE2D073D86fB0`](https://sepolia.basescan.org/address/0xAecDa231ed8d8b9f5E9e39B3624FE2D073D86fB0#code)
- **USDC Token (Base Sepolia)**: [`0x036CbD53842c5426634e7929541eC2318f3dCF7e`](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e#code)
- **Admin Wallet**: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
- **Chain ID**: 84532
- **Explorer**: [Base Sepolia Scan](https://sepolia.basescan.org)
- **Deployment Date**: January 17, 2025
- **Status**: ✅ All V6 contracts verified and operational

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

# NFT Claim System

ART3-HUB now includes a complete NFT claim system that allows users to claim NFTs using special codes. The system includes:

- Admin interface for creating and managing claimable NFTs
- User-facing claim form for redeeming NFTs
- Firebase Storage for image storage
- Pinata integration for IPFS metadata storage
- Case-insensitive claim codes

## Setting Up Pinata

For storing NFT images and metadata on IPFS, we use Pinata. See [PINATA_SETUP.md](./PINATA_SETUP.md) for detailed instructions on how to set up Pinata.

## NFT Claim Features

- **Create Claimable NFTs**: Admins can create NFTs with unique claim codes
- **Image Upload**: Upload and preview NFT images
- **Claim Codes**: Generate and manage unique claim codes (case-insensitive)
- **Claim Limits**: Set maximum number of claims per NFT
- **Claim Period**: Set start and end dates for claiming
- **Network Selection**: Choose which blockchain network to use
- **IPFS Storage**: Store NFT metadata on IPFS via Pinata
- **Firebase Storage**: Store NFT images in Firebase Storage

## User Claim Flow

1. User receives a claim code
2. User enters the code on the claim page
3. System validates the code (case-insensitive)
4. User confirms the claim
5. NFT is minted to the user's wallet