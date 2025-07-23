# Claude AI Assistant Context - ART3-HUB Project

## 🎯 Project Overview

**ART3-HUB** is a comprehensive Web3 NFT platform designed for artists (especially in LATAM) to enter the Web3 space with AI-guided onboarding, gasless NFT creation, and subscription-based services.

### Current Version: V6.1 (Active July 2025) - Collection-per-NFT Architecture
- **Database**: Migrated from Supabase to Firebase Firestore
- **Smart Contracts**: Fresh V6 deployment with gasless relayer as owner
- **Architecture**: Collection-per-NFT system for enhanced marketplace compatibility
- **Gasless System**: Simplified direct relayer integration replacing voucher system
- **Security**: Complete private key audit and environment-only storage, key rotation completed (July 2025)
- **Quota Tracking**: Smart user-created NFT distinction for accurate subscription limits

## 🏗️ Project Structure

### Core Components

#### 1. **ArtHubApp/** - Frontend Application
- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Firebase Firestore
- **Web3**: Privy + Wagmi + Viem
- **AI**: OpenAI GPT-4 + LangChain

#### 2. **ArtHubContract/** - Smart Contracts
- **Language**: Solidity 0.8.28
- **Framework**: Hardhat
- **Standards**: OpenZeppelin v5.1.0
- **Network**: Base Sepolia (testnet), Base Mainnet (future)

#### 3. **ArtHubAgent/** - AI Agent System
- **Purpose**: ElizaOS-based AI agent for Web3 education
- **Features**: Conversational guidance, memory persistence

## 🔗 V6 UPGRADEABLE Contract Addresses (Base Sepolia) - Collection-per-NFT Architecture

| Contract | Address | Purpose |
|----------|---------|---------|
| **Factory V6 Proxy** | `0x87DfC71B55a41825fe8EAA8a8724D8982b92DeBe` | Collection-per-NFT creation (upgradeable) |
| **Subscription V6 Proxy** | `0x3B2D7fD4972077Fa1dbE60335c6CDF84b02fE555` | Subscription management (upgradeable) |
| **Collection V6 Implementation** | `0xA7a5C3c097f291411501129cB69029eCe0F7C45E` | NFT implementation (clone base) |
| **ClaimableNFT Factory V6 Proxy** | `0x51dD5FE61CF5B537853877A6dE50E7F74c24310A` | Claimable NFT factory (upgradeable) |
| **Admin Wallet (Owner)** | `<ADMIN_WALLET_ADDRESS>` | Platform admin & upgrade authority |
| **Gasless Relayer** | `<GASLESS_RELAYER_ADDRESS>` | Operational transactions |

## 🌟 Key Features

### For Users
- **Collection-per-NFT Creation**: Each NFT gets its own collection contract for marketplace flexibility
- **AI-Guided Onboarding**: Step-by-step Web3 education
- **Gasless Operations**: All transactions are gasless for users via simplified relayer system
- **Smart Quota Tracking**: Only user-created NFTs count toward subscription limits (claimable NFTs are free)
- **Multi-language**: English, Spanish, French, Portuguese
- **Subscription Plans**: Free (1 user-created NFT/month), Master ($4.99/month, 10 NFTs), Elite ($9.99/month, 25 NFTs)

### For Admins
- **Claimable NFT System**: Factory pattern for independent claimable NFT contracts
- **User Differentiation**: Each claimable NFT type has independent access controls
- **User Management**: Complete user analytics and management
- **Admin CRUD**: Environment-based admin wallet management
- **Platform Analytics**: Comprehensive usage metrics

### Technical Features
- **Collection-per-NFT Architecture**: Individual collection contracts for each NFT enabling marketplace functionality
- **Simplified Gasless System**: Direct relayer integration using secure configuration
- **Firebase Integration**: Real-time data, scalable NoSQL storage
- **Base Network**: Optimized for Base blockchain
- **Security Audited**: All sensitive configuration secured in environment variables only
- **IPFS Storage**: Pinata integration for decentralized storage

## 📁 Key Directory Structure

```
ArtHubApp/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── ai-agent/      # AI assistant interface
│   │   ├── create/        # NFT creation
│   │   ├── explore/       # NFT discovery
│   │   ├── nft-claim/     # NFT claiming system
│   │   └── profile/       # User profiles
│   └── api/               # Backend API routes
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── ui/               # shadcn/ui components
│   └── [various].tsx     # Core app components
├── lib/                  # Core utilities
│   └── services/         # Business logic services
├── providers/            # React context providers
├── hooks/                # Custom React hooks
└── messages/             # i18n translation files

ArtHubTests/               # Test suite for claimable NFT factory
├── README.md             # Test documentation
├── check-deployments.js  # Factory deployment verification
├── test-smart-contracts.js # Direct contract testing
├── test-gasless-*.js     # Gasless relayer tests
└── test-claimable-nft.js # End-to-end integration tests
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🛡️ Admin System

### Environment-Based Configuration
- **Default Admin**: `<ADMIN_WALLET_ADDRESS>`
- **Access Control**: localStorage-based admin management
- **CRUD Operations**: Full admin wallet management
- **Route Protection**: Admin-only access to sensitive areas

### Admin Features
- **Claimable NFT Management**: Create, edit, delete claimable NFTs via factory pattern
- **Independent Contract Deployment**: Each claimable NFT gets its own contract
- **User Access Control**: Differentiate users by contract-specific permissions
- **User Analytics**: View user statistics and behavior
- **Platform Metrics**: Monitor platform performance
- **Content Moderation**: Manage platform content

## 🤖 AI Agent System

### Intelligent Chat Features
- **Memory Persistence**: Firebase-based conversation history
- **Context Awareness**: Understands user progress and needs
- **Web3 Education**: Comprehensive blockchain and NFT guidance
- **Multi-language**: Supports all platform languages

### Implementation
- **Service**: `firebase-chat-memory-service.ts`
- **API**: `/api/chat/intelligent/route.ts`
- **Frontend**: `app/[locale]/ai-agent/intelligent/page.tsx`

## 📊 Database Architecture (Firebase)

### Core Collections
- **users**: User profiles and authentication data
- **nfts**: NFT metadata and ownership information
- **chat_memory**: AI conversation history
- **claimable_nfts**: Secret code-based claimable NFTs
- **user_sessions**: User activity tracking

### Data Services
- **firebase-user-service.ts**: User management
- **firebase-nft-service.ts**: NFT operations
- **firebase-chat-memory-service.ts**: AI conversation storage
- **nft-claim-service.ts**: Claimable NFT management

## 🔐 Security & Privacy

### Environment Variables
- Firebase configuration (API keys, project ID)
- Smart contract addresses
- OpenAI API key
- Pinata IPFS credentials
- Admin wallet address

### Data Protection
- Firebase security rules
- Wallet-based authentication
- Environment-based sensitive configuration
- Input validation and sanitization

## 🚀 Recent Major Changes (V6.1 - Collection-per-NFT Architecture)

1. **Collection-per-NFT System**: Revolutionary architecture where each NFT gets its own collection contract
2. **Simplified Gasless Relayer**: Eliminated complex voucher system for direct contract interaction
3. **Smart Quota Tracking**: Only user-created NFTs count toward subscription limits (claimable NFTs excluded)
4. **Security Configuration Audit**: Complete audit ensuring all sensitive data is environment-only
5. **Contract Redeployment**: Fresh V6 contracts with gasless relayer as owner
6. **Admin System Improvements**: Fixed redirect issues and enhanced authentication
7. **Firebase Migration**: Complete transition from Supabase to Firebase
8. **Enhanced Marketplace Compatibility**: Individual collections enable future marketplace features

## 🎯 Development Guidelines

### Critical System Architecture Rules
1. **Dual Workflow System**: Maintain complete separation between workflows
   - **Original Workflow** (`/create` page): V6 contracts for membership-based NFT creation (Free/Master/Elite plans)
   - **Claimable NFT Process**: Parallel factory pattern system for admin-controlled claimable NFTs
   - These systems are independent and must never interfere with each other

2. **Security Requirements**
   - **NEVER** copy sensitive configuration in any code, comments, or documentation
   - Sensitive data must ONLY exist in `.env` files and be referenced via environment variables
   - Use environment variable references like `process.env.VARIABLE_NAME` in code
   - All sensitive credentials stay in environment configuration only

### When Adding Features
1. Update relevant service files in `lib/services/`
2. Add API routes in `app/api/`
3. Create/update React components
4. Add internationalization strings
5. Update type definitions
6. Test with Firebase backend
7. Ensure proper workflow separation (original vs claimable NFT)

### Code Style
- TypeScript strict mode
- ESLint + Prettier configuration
- shadcn/ui for consistent UI components
- Tailwind CSS for styling
- React 19 patterns and hooks

### Testing
- Use `/ArtHubTests` directory for all test scripts
- Run factory pattern tests: `node ArtHubTests/check-deployments.js`
- Test gasless operations: `node ArtHubTests/test-gasless-port-3000.js`
- Local development with Firebase emulator
- Test all language variants
- Verify admin functionality
- Check mobile responsiveness

## 📞 Support Resources

### Documentation
- [Frontend README](./ArtHubApp/README.md)
- [Smart Contract README](./ArtHubContract/README.md)
- [V6 Deployment Summary](./ArtHubContract/V6_DEPLOYMENT_SUMMARY.md)
- [Test Suite Documentation](./ArtHubTests/README.md)
- [AI System Documentation](./ArtHubApp/docs/INTELLIGENT_CHAT_SYSTEM.md)

### External Resources
- Firebase Console: Project management
- Base Sepolia Explorer: Contract verification
- Pinata Dashboard: IPFS storage management
- OpenAI Dashboard: AI usage monitoring

---

**Last Updated**: July 19, 2025 (V6.1 Collection-per-NFT Release - Security Update)
**Branch**: process-update-request-nfts (current)
**Status**: V6.1 Collection-per-NFT architecture operational, private key security rotation completed, documentation current