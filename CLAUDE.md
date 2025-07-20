# Claude AI Assistant Context - ART3-HUB Project

## 🎯 Project Overview

**ART3-HUB** is a comprehensive Web3 NFT platform designed for artists (especially in LATAM) to enter the Web3 space with AI-guided onboarding, gasless NFT creation, and subscription-based services.

### Current Version: V6 (January 2025)
- **Database**: Migrated from Supabase to Firebase Firestore
- **Smart Contracts**: Fresh V6 deployment on Base Sepolia
- **Architecture**: Base-only optimized deployment
- **AI System**: Advanced conversational AI agent with memory persistence

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

## 🔗 V6 Contract Addresses (Base Sepolia) 

| Contract | Address | Purpose |
|----------|---------|---------|
| **Factory V6** | `0x6A2a69a88b92B8566354ECE538aF46fC783b9DFd` | Collection creation |
| **Subscription V6** | `0xd0611f925994fddD433a464886Ae3eF58Efb9EC9` | Subscription management |
| **Collection V6** | `0xAecDa231ed8d8b9f5E9e39B3624FE2D073D86fB0` | NFT implementation |
| **ClaimableNFT Factory** | `0x55248aC366d3F26b6aa480ed5fD82130C8C6842d` | Claimable NFT factory pattern |
| **Admin Wallet** | `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f` | Platform admin |
| **Gasless Relayer** | `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1` | Gasless transaction relayer |

## 🌟 Key Features

### For Users
- **AI-Guided Onboarding**: Step-by-step Web3 education
- **Gasless Operations**: All transactions are gasless for users
- **Multi-language**: English, Spanish, French, Portuguese
- **Subscription Plans**: Free (1 NFT/month), Master ($4.99/month, 10 NFTs), Elite ($9.99/month, 25 NFTs)

### For Admins
- **Claimable NFT System**: Factory pattern for independent claimable NFT contracts
- **User Differentiation**: Each claimable NFT type has independent access controls
- **User Management**: Complete user analytics and management
- **Admin CRUD**: Environment-based admin wallet management
- **Platform Analytics**: Comprehensive usage metrics

### Technical Features
- **Firebase Integration**: Real-time data, scalable NoSQL storage
- **Base Network**: Optimized for Base blockchain
- **Meta-transactions**: EIP-712 gasless functionality
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
- **Default Admin**: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
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

## 🚀 Recent Major Changes (V6)

1. **Firebase Migration**: Complete transition from Supabase to Firebase
2. **Fresh Contracts**: New V6 smart contract deployment
3. **Claimable NFT Factory Pattern**: Independent contracts for user differentiation
4. **Gasless Operations**: Complete gasless experience for claimable NFT operations
5. **Admin System**: Environment-based admin management
6. **AI Enhancements**: Improved conversation system with memory
7. **Test Organization**: Structured test suite in `/ArtHubTests` directory

## 🎯 Development Guidelines

### Critical System Architecture Rules
1. **Dual Workflow System**: Maintain complete separation between workflows
   - **Original Workflow** (`/create` page): V6 contracts for membership-based NFT creation (Free/Master/Elite plans)
   - **Claimable NFT Process**: Parallel factory pattern system for admin-controlled claimable NFTs
   - These systems are independent and must never interfere with each other

2. **Security Requirements**
   - **NEVER** copy private keys in any code, comments, or documentation
   - Private keys must ONLY exist in `.env` files and be referenced via environment variables
   - Use environment variable references like `process.env.PRIVATE_KEY_NAME` in code
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

**Last Updated**: January 19, 2025 (V6 Release)
**Branch**: process-update-request-nfts (current)
**Status**: V6 deployment complete, Firebase migration successful