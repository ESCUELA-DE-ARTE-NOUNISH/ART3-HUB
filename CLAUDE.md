# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ART3-HUB** is a Web3 NFT platform enabling artists (especially in LATAM) to create NFTs with AI-guided onboarding, gasless transactions, and subscription-based services. The platform supports **3 runtime environments**: standard browser, Farcaster browser app, and Farcaster mobile app.

**Current Version**: V6.1 (Collection-per-NFT Architecture)
- Each NFT gets its own collection contract for marketplace flexibility
- Simplified gasless relayer system (direct contract interaction)
- Firebase backend (migrated from Supabase)
- Smart quota tracking (user-created NFTs only count toward subscription limits)

## Repository Structure

```
ART3-HUB/
├── ArtHubApp/          # Next.js 15 + React 19 frontend
├── ArtHubContract/     # Solidity 0.8.28 smart contracts
├── ArtHubAgent/        # ElizaOS-based AI agent
└── ArtHubTests/        # Test suite for contract integration
```

## Development Commands

### Frontend (ArtHubApp/)
```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build (verify SSR compatibility)
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Database operations
npm run db:migrate:chat  # Migrate chat memory to Firebase
npm run env:check        # Validate environment variables
```

### Smart Contracts (ArtHubContract/)
```bash
npm run compile          # Compile Solidity contracts
npm run test             # Run contract tests
npm run deploy:v4:baseSepolia  # Deploy V6 contracts to testnet
npm run verify:baseSepolia     # Verify contracts on BaseScan
```

### Testing
```bash
# Frontend tests (run from ArtHubTests/)
node check-deployments.js           # Verify factory deployments
node test-gasless-port-3000.js      # Test gasless operations
node test-claimable-nft.js          # End-to-end claimable NFT tests

# Multi-environment testing (critical)
npm run build                        # Must pass without SSR errors
# Test in: Browser, Farcaster browser app, Farcaster mobile app
```

## Core Architecture

### 1. Multi-Environment Provider System

**Key File**: `components/providers/web3-providers.tsx`

The application automatically detects and routes to the appropriate provider stack:

```typescript
// Detection priority (lib/utils/environment-detection.ts):
// 1. Farcaster SDK context (sdk.context.client.name === 'farcaster')
// 2. Window objects (window.farcaster, window.minikit)
// 3. User agent strings (Farcaster, Warpcast)
// 4. iframe + domain/referrer checks
// 5. Deployment domains (art3hub.xyz, localhost, ngrok.io)

Web3Providers
  ├── detectEnvironment() → AppEnvironment ('browser' | 'farcaster-web' | 'farcaster-mobile')
  │
  ├─→ Browser: BrowserProviders
  │    └── PrivyAppProvider (Privy auth + Wagmi)
  │         └── QueryClientProvider
  │              └── PrivyWagmiProvider
  │
  ├─→ Farcaster Web: FarcasterWebProviders
  │    └── WagmiProvider (farcasterMiniApp connector)
  │         └── QueryClientProvider
  │              └── MiniKitProvider (OnchainKit)
  │
  └─→ Farcaster Mobile: FarcasterMobileProviders
       └── WagmiProvider (farcasterMiniApp connector)
            └── QueryClientProvider
                 └── MiniKitProvider (OnchainKit)
```

**Critical Rules**:
- **All Web3 providers initialize client-side only** (prevents SSR errors)
- **Never mix provider stacks** - detection happens once at mount
- **Use safe hooks** for cross-environment code:
  - `useSafePrivy()` - returns fallback in Farcaster mode
  - `useSafeMiniKit()` - returns fallback in browser mode
  - `useSafeFarcaster()` - safe Farcaster SDK access

### 2. Dual Workflow System (CRITICAL)

**Two completely independent NFT creation systems**:

#### Original Workflow (`/create` page)
- **Purpose**: Membership-based NFT creation (Free/Master/Elite plans)
- **Contracts**: V6 Factory + Subscription contracts
- **Flow**: User auth → Check subscription → Create collection → Mint NFT
- **Quota Tracking**: Only user-created NFTs count toward limits

#### Claimable NFT Workflow (`/nft-claim` page)
- **Purpose**: Admin-controlled claimable NFTs with secret codes
- **Contracts**: ClaimableNFT Factory (separate deployment)
- **Flow**: Admin creates claimable NFT → User enters code → Claim NFT
- **Quota Tracking**: Claimable NFTs do NOT count toward user limits

#### Gallery Collect Workflow (`/gallery` page)
- **Purpose**: Support artists by collecting NFT copies with USDC payments
- **Contracts**: V6 Factory (creates new collection per collect)
- **Flow**: User selects amount → Pay USDC (95% artist, 5% treasury) → Mint NFT copy to collector
- **Payment Split**: 5% to `NEXT_PUBLIC_TREASURY_WALLET`, 95% to artist wallet
- **NFT Copy**: Creates new collection with same metadata (image, name, description) as original
- **Quota Tracking**: Collected NFTs do NOT count toward user subscription limits
- **Sales Registry**: All transactions logged in Firebase `gallery_sales` collection

**Never interfere between these workflows** - they are parallel systems with different contracts and business logic.

### 3. Collection-per-NFT Architecture

**V6 Revolutionary Change**: Each NFT gets its own collection contract

```typescript
// Before (V5): Multiple NFTs in shared collection
createNFT() → mint to shared collection → single collection address

// After (V6): Individual collection per NFT
createNFT() → deploy new collection → mint single NFT → unique collection address
```

**Benefits**: Marketplace compatibility, individual branding, better ownership model

**Implementation**: `lib/services/simple-nft-service.ts`
- Uses minimal proxy pattern (EIP-1167) for gas efficiency
- Gasless relayer deploys and owns collection initially
- Auto-transfers NFT to user after minting

### 4. Gasless Relayer System

**Simplified V6 Architecture** (removed complex voucher system):

```typescript
// Frontend: Sign EIP-712 message (no gas)
const signature = await signer._signTypedData(domain, types, values)

// Backend: Relayer executes transaction (pays gas)
POST /api/gasless-relay
  → Validate signature
  → Execute contract call using relayer wallet
  → Return transaction hash

// Smart Contract: Validates signature on-chain
verify(signature, data) → execute if valid
```

**Critical Files**:
- `app/api/gasless-relay/route.ts` - Backend relay endpoint
- Smart contracts have relayer as owner for gasless operations
- **Security**: All relayer keys in `.env` only, never in code

### 5. Firebase Integration

**Migration from Supabase (V6)**:

```typescript
// Core Collections
users              // User profiles + authentication
nfts               // NFT metadata + ownership
chat_memory        // AI conversation history
claimable_nfts     // Secret code-based claims
user_sessions      // Activity tracking
gallery_sales      // Gallery collect transaction logs

// Services (lib/services/)
firebase-user-service.ts              // User CRUD
firebase-nft-service.ts               // NFT operations
firebase-chat-memory-service.ts       // AI memory
nft-claim-service.ts                  // Claimable NFT management
firebase-sales-service.ts             // Gallery sales tracking & export
smart-contract-admin-service.ts       // Admin verification + RPC caching
admin-service.ts                      // Admin wallet CRUD
```

**RPC Caching System** (prevents 429 rate limit errors):
- **File**: `lib/services/smart-contract-admin-service.ts`
- **Pattern**: Singleton with module-level cache
- **TTL**: 5 minutes for contract read calls
- **Request Deduplication**: Prevents concurrent calls for same data

### 6. Internationalization (i18n)

**Next.js App Router i18n**:
```typescript
// Route structure
app/[locale]/            // en, es, fr, pt
  ├── create/
  ├── explore/
  └── profile/

// Translation files
messages/
  ├── en/index.json
  ├── es/index.json
  ├── fr/index.json
  └── pt/index.json

// Usage
import { useTranslations } from 'next-intl'
const t = useTranslations('namespace')
```

## Contract Addresses (V6)

### Base Mainnet (Production) - Chain ID: 8453
```typescript
FACTORY_V6_PROXY                = 0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
SUBSCRIPTION_V6_PROXY           = 0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8
COLLECTION_V6_IMPLEMENTATION    = 0x8aFf71f5dCb7Ad2C77f0Ec5a0A4D914394dB8c13
CLAIMABLE_NFT_FACTORY_V6_PROXY = 0xB253b65b330A51DD452f32617730565d6f6A6b33
USDC_ADDRESS                    = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Base Sepolia (Testnet) - Chain ID: 84532
```typescript
FACTORY_V6_PROXY                = 0x87DfC71B55a41825fe8EAA8a8724D8982b92DeBe
SUBSCRIPTION_V6_PROXY           = 0x3B2D7fD4972077Fa1dbE60335c6CDF84b02fE555
COLLECTION_V6_IMPLEMENTATION    = 0xA7a5C3c097f291411501129cB69029eCe0F7C45E
CLAIMABLE_NFT_FACTORY_V6_PROXY = 0x51dD5FE61CF5B537853877A6dE50E7F74c24310A
USDC_ADDRESS                    = 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

**Network Mode**: Set via `NEXT_PUBLIC_IS_TESTING_MODE=true` (testnet) or `false` (mainnet)

## Subscription Plans

| Plan | Price | NFTs/Month | Duration |
|------|-------|------------|----------|
| Free | $0 | 1 | 30 days |
| Master | $4.99 USDC | 10 | 30 days |
| Elite Creator | $9.99 USDC | 25 | 30 days |

**Smart Quota Tracking**: Only user-created NFTs count (claimable NFTs are excluded)

## Security Guidelines

### Environment Variables
- **All sensitive data MUST be in `.env` files only**
- **Never hardcode**: Private keys, API keys, wallet addresses
- **Reference via**: `process.env.VARIABLE_NAME`
- **Critical vars**:
  ```bash
  GASLESS_RELAYER_PRIVATE_KEY
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_PRIVY_APP_ID
  PINATA_SECRET_API_KEY
  ```

### Admin System
- **Environment-based admin configuration**: `NEXT_PUBLIC_ADMIN_WALLET`
- **Hybrid verification**: Firebase admin management + on-chain contract ownership
- **Access control**: localStorage-based admin state + contract verification

## Known Issues & Solutions

### Build & SSR
- **IndexedDB warnings during build**: Expected behavior, non-blocking
- **Web3 provider SSR errors**: Fixed via client-side only initialization
- **Hydration mismatches**: Environment detection uses `useEffect` hook

### Performance
- **RPC 429 errors**: Fixed with singleton caching in `smart-contract-admin-service.ts`
- **Admin page slow loads**: RPC caching reduces redundant contract calls by 80%+

## Adding New Features

1. **Update service layer**: `lib/services/[feature]-service.ts`
2. **Create API route**: `app/api/[feature]/route.ts`
3. **Build UI component**: `components/[feature].tsx`
4. **Add translations**: Update `messages/[locale]/index.json` for all languages
5. **Update types**: Add TypeScript interfaces
6. **Test multi-environment**: Browser, Farcaster web, Farcaster mobile
7. **Verify workflow separation**: Ensure original vs claimable NFT independence

## External Documentation

- [Frontend README](./ArtHubApp/README.md) - Detailed setup and features
- [Smart Contract README](./ArtHubContract/README.md) - Contract deployment guide
- [V6 Deployment Summary](./ArtHubContract/V6_DEPLOYMENT_SUMMARY.md) - Contract addresses
- [Test Suite Docs](./ArtHubTests/README.md) - Testing instructions
- [AI System Docs](./ArtHubApp/docs/INTELLIGENT_CHAT_SYSTEM.md) - AI assistant architecture

## Technology Stack

**Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
**Web3**: Privy, Wagmi, Viem, Farcaster SDK, OnchainKit
**Database**: Firebase Firestore + Storage
**Smart Contracts**: Solidity 0.8.28, Hardhat, OpenZeppelin v5.1.0
**AI**: OpenAI GPT-4, LangChain
**Storage**: Pinata IPFS
**Network**: Base (Mainnet + Sepolia)

---

## Recent Feature Additions (V6.1)

### Gallery Like Feature
- **File**: `app/[locale]/gallery/page.tsx`
- **Location**: Right control panel (top-right corner) + fullscreen modal
- **Functionality**:
  - Heart icon with pink fill when liked
  - Badge displays like count if > 0
  - Positioned above autoplay and fullscreen buttons
  - Requires wallet connection

### Gallery Collect NFT Feature
- **Files**:
  - `components/gallery/CollectNFTModal.tsx` - Payment selection UI
  - `app/api/gallery/collect-nft/route.ts` - USDC payment + minting backend
- **Payment Flow**:
  1. User selects amount ($5, $10, $25, $50, or custom)
  2. USDC transferred: 5% to treasury, 95% to artist
  3. New NFT collection created with same metadata as original
  4. NFT minted to collector's wallet (token ID #1)
  5. Sale logged in Firebase `gallery_sales` collection
- **USDC Contract**: ERC20 `transferFrom` with approval requirement
- **Architecture**: Collection-per-NFT (each collect creates new ERC721 collection)

### Sales Registry & Admin Dashboard
- **Files**:
  - `lib/services/firebase-sales-service.ts` - Sales data service
  - `components/admin/SalesManagement.tsx` - Admin UI component
  - `app/[locale]/admin/page.tsx` - Integration into admin dashboard
- **Features**:
  - Stats cards: Total Sales, Total Revenue, Unique Collectors
  - Sales table with sorting and filtering
  - Search by NFT name, artist name, or collector wallet
  - Filter by artist wallet address
  - Export to CSV with all transaction details (3 tx hashes per sale)
- **Data Tracked**:
  - NFT metadata (name, image, description)
  - Payment breakdown (total, artist amount, treasury fee)
  - All transaction hashes (treasury payment, artist payment, mint)
  - Blockchain network and timestamp

---

**Last Updated**: January 2025 (V6.1)
**Production**: https://art3-hub.vercel.app
