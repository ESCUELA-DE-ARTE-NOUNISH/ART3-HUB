# Art3 Hub Legacy Implementation (V1 & V2)

This document contains the complete documentation for Art3 Hub V1 and V2 implementations. For the current V3 implementation, see [README.md](./README.md).

## V2 Implementation (Subscription-Based)

### Overview

Art3Hub V2 introduced a complete paradigm shift from pay-per-deployment to subscription-based NFT creation with gasless experiences and enhanced artist onboarding.

### V2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Art3 Hub V2 Platform                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│              SubscriptionManager.sol                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • USDC-based subscription plans                          │  │
│  │ • Free Plan: 1 NFT/year                                  │  │
│  │ • Master Plan: $4.99/month, 10 NFTs/month               │  │
│  │ • Quota tracking and enforcement                         │  │
│  │ • Subscription expiration management                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Art3HubFactoryV2.sol                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Subscription validation before minting                 │  │
│  │ • Gasless collection deployment                          │  │
│  │ • EIP-712 meta-transaction support                       │  │
│  │ • Integration with SubscriptionManager                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Art3HubCollectionV2.sol                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • ERC-721 + ERC-2981 + EIP-712                          │  │
│  │ • Gasless minting via meta-transactions                  │  │
│  │ • Subscription quota validation                          │  │
│  │ • Enhanced OpenSea compatibility                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GaslessRelayer.sol                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • EIP-712 signature verification                         │  │
│  │ • Meta-transaction execution                             │  │
│  │ • Nonce management and replay protection                 │  │
│  │ • Authorized relayer system                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### V2 Contract Interaction Flow

```
User/Artist            SubscriptionManager    Factory V2          Collection V2       GaslessRelayer
     │                        │                   │                    │                   │
     │ 1. Subscribe to plan    │                   │                    │                   │
     ├────────────────────────▶│                   │                    │                   │
     │                        │                   │                    │                   │
     │ 2. Sign meta-tx for     │                   │                    │                   │
     │    collection creation  │                   │                    │                   │
     ├─────────────────────────────────────────────────────────────────────────────────────▶│
     │                        │                   │                    │                   │
     │                        │ 3. Validate       │                    │                   │
     │                        │    subscription    │                    │                   │
     │                        │◀───────────────────│                    │                   │
     │                        │                   │                    │                   │
     │                        │                   │ 4. Deploy          │                   │
     │                        │                   │    collection      │                   │
     │                        │                   ├────────────────────▶│                   │
     │                        │                   │                    │                   │
     │ 5. Sign meta-tx for NFT│                   │                    │                   │
     │    minting              │                   │                    │                   │
     ├─────────────────────────────────────────────────────────────────────────────────────▶│
     │                        │                   │                    │                   │
     │                        │ 6. Check quota    │                    │                   │
     │                        │◀───────────────────────────────────────│                   │
     │                        │                   │                    │                   │
     │                        │ 7. Update quota   │                    │                   │
     │                        ├───────────────────────────────────────▶│                   │
     │                        │                   │                    │                   │
     │ 8. NFT minted (gasless) │                   │                    │                   │
     │◀─────────────────────────────────────────────────────────────────────────────────────│
```

### V2 Subscription Plans

#### Plan Gratuito (Free Tier)
- **Price**: Free
- **Duration**: 365 days
- **NFT Limit**: 1 gasless mint
- **Collection Creation**: ✅ Included (no deployment fee)
- **Features**: Basic education, guided onboarding, limited AI access
- **Gasless**: ✅ Yes

#### Plan Master (Premium Tier)
- **Price**: $4.99/month (in USDC)
- **Duration**: 30 days
- **NFT Limit**: 10 gasless mints per month
- **Collection Creation**: ✅ Unlimited collections included (no deployment fees)
- **Features**: Workshops, enhanced visibility, reputation system, full AI access
- **Gasless**: ✅ Yes

### V2 Deployed Contracts

#### Base Sepolia (84532) - V2 Legacy
- **Status**: 🟡 **Legacy - Use V3 for new deployments**
- **SubscriptionManager**: [`0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4`](https://sepolia.basescan.org/address/0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4#code)
- **Art3HubCollectionV2 Implementation**: [`0x41BE244598b4B8329ff68bD242C2fa58a9084e26`](https://sepolia.basescan.org/address/0x41BE244598b4B8329ff68bD242C2fa58a9084e26#code)
- **Art3HubFactoryV2**: [`0x75Ed9ACB51D2BEaCfD6c76099D63d3a0009F4a40`](https://sepolia.basescan.org/address/0x75Ed9ACB51D2BEaCfD6c76099D63d3a0009F4a40#code)
- **GaslessRelayer**: [`0x5116F90f3a26c7d825bE6Aa74544187b43c52a56`](https://sepolia.basescan.org/address/0x5116F90f3a26c7d825bE6Aa74544187b43c52a56#code)
- **USDC Token**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

## V1 Implementation (Factory-Based)

### Overview

The original Art3 Hub platform uses a factory-based architecture that deploys gas-efficient, fully-featured NFT collections for individual artists while maintaining platform-wide standards and revenue sharing.

### V1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Art3 Hub Platform                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Art3HubFactory.sol                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Deploys minimal proxy collections                      │  │
│  │ • Manages platform fees (2.5%)                          │  │
│  │ • Tracks all collections and artists                    │  │
│  │ • Handles deployment fees (0.001 ETH)                   │  │
│  │ • OpenSea proxy registry integration                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Art3HubCollection.sol (Implementation)          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • ERC-721 + ERC-2981 compliant                          │  │
│  │ • Individual artist collection template                 │  │
│  │ • Mint functions with platform fee integration          │  │
│  │ • Metadata management and freezing                      │  │
│  │ • Royalty management (10% default)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Artist A      │ │   Artist B      │ │   Artist C      │
│   Collection    │ │   Collection    │ │   Collection    │
│   (Proxy)       │ │   (Proxy)       │ │   (Proxy)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### V1 Contract Interaction Flow

```
User/Artist                Factory                 Collection (Proxy)
     │                        │                           │
     │ 1. createCollection()   │                           │
     │ + deployment fee        │                           │
     ├────────────────────────▶│                           │
     │                        │ 2. deploy minimal proxy   │
     │                        │────────────────────────────▶│
     │                        │                           │
     │                        │ 3. initialize collection   │
     │                        │────────────────────────────▶│
     │                        │                           │
     │ 4. collection address   │                           │
     │◀────────────────────────│                           │
     │                        │                           │
     │ 5. mint NFT             │                           │
     │ + mint price            │                           │
     ├─────────────────────────────────────────────────────▶│
     │                        │                           │
     │                        │ 6. platform fee (2.5%)    │
     │                        │◀───────────────────────────│
     │                        │                           │
     │ 7. NFT minted           │                           │
     │◀─────────────────────────────────────────────────────│
```

### V1 Key Features

- **🏭 Factory Pattern**: Gas-efficient collection deployment using OpenZeppelin's Clones library
- **👑 Artist Ownership**: Each artist owns and controls their individual collection contract
- **💰 Revenue Sharing**: Platform takes 2.5% fee on mints, artists keep the rest
- **🎨 Full ERC-721 Compliance**: Standard NFT functionality with metadata support
- **💎 ERC-2981 Royalties**: Automatic royalty enforcement on secondary sales
- **🌊 OpenSea Integration**: Gasless listings, automatic royalty enforcement, and full marketplace compatibility
- **🔒 Security First**: ReentrancyGuard protection and comprehensive access controls
- **⚡ Multi-Network**: Supports Base, Celo, and Zora networks (mainnet and testnets)

### Gas Optimization

The factory pattern using minimal proxies (EIP-1167) provides significant gas savings:

- **Traditional Deployment**: ~3,000,000 gas per collection
- **Minimal Proxy Deployment**: ~300,000 gas per collection
- **Gas Savings**: ~90% reduction in deployment costs

### V1 Smart Contracts

#### 1. Art3HubFactory.sol

The main factory contract responsible for:

- **Collection Deployment**: Creates minimal proxy collections for artists
- **Fee Management**: Collects deployment fees and platform fees
- **Artist Registry**: Tracks all artists and their collections
- **Platform Configuration**: Manages global platform settings

**Key Functions:**
- `createCollection()` - Deploy new artist collection
- `updatePlatformFee()` - Modify platform fee percentage
- `updateDeploymentFee()` - Modify deployment fee amount
- `withdrawFees()` - Withdraw collected platform fees

#### 2. Art3HubCollection.sol

The collection implementation contract used as template for all artist collections:

- **ERC-721 Standard**: Full NFT functionality
- **ERC-2981 Royalties**: Secondary sale royalty enforcement
- **Mint Functions**: Public and owner minting capabilities
- **Metadata Management**: URI handling and freezing capabilities
- **Revenue Tracking**: Track mints and revenue per collection

**Key Functions:**
- `mint()` - Public minting function (users pay mint price)
- `artistMint()` - Artist creates NFT with title, description, and custom royalty
- `ownerMint()` - Free promotional minting for collection owner
- `batchMint()` - Efficient batch minting
- `processSecondarySale()` - Handle secondary sales with platform fee
- `getNFTMetadata()` - Get NFT title, description, and royalty info
- `freezeTokenURI()` - Permanently freeze token metadata
- `withdraw()` - Withdraw collection revenue

### V1 OpenSea Compatibility

#### ✅ **Fully Compatible Features**

**Standard NFT Functionality:**
- **ERC-721 Compliance**: All NFTs work seamlessly on OpenSea
- **ERC-2981 Royalties**: Artist royalties automatically enforced on all sales
- **ERC-165 Interface Detection**: Proper marketplace recognition

**OpenSea-Specific Features:**
- **Gasless Listings**: Users can list NFTs without paying gas fees (Base Mainnet only)
- **Collection Pages**: Automatic collection metadata via `contractURI()`
- **Metadata Freezing**: Permanent metadata with `freezeTokenURI()` and `freezeAllMetadata()`
- **Proxy Registry**: Base Mainnet proxy registry `0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC`

**Artist Benefits on OpenSea:**
- Collections appear automatically after first mint
- Custom royalty percentages enforced (set per NFT via `artistMint()`)
- Full ownership and control of individual collections
- Standard OpenSea creator tools and analytics

#### ⚠️ **Secondary Sales Fee Limitation**

**What Works on OpenSea:**
- ✅ Artist royalties (configurable per NFT)
- ✅ Standard buying/selling
- ✅ Gasless listings
- ✅ Collection management

**What Requires Custom Marketplace:**
- ❌ 1% platform fee on secondary sales
- ❌ `processSecondarySale()` function integration

**Recommended Strategy:**
1. **For Maximum Reach**: List on OpenSea (artist gets royalties only)
2. **For Full Revenue**: Build custom marketplace using `processSecondarySale()`
3. **Hybrid Approach**: Support both with different fee structures

### V1 Deployed Contracts

#### Base Sepolia (Testnet)
- **Chain ID**: 84532
- **Factory Address**: `0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2`
- **Implementation Address**: `0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2`
- **Explorer Links**: 
  - [Factory Contract](https://sepolia.basescan.org/address/0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2#code)
  - [Implementation Contract](https://sepolia.basescan.org/address/0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2#code)

#### Celo Alfajores (Testnet)
- **Chain ID**: 44787
- **Factory Address**: `0x40eB8B66C9540Bde934e0502df1319E5F5BCC782`
- **Implementation Address**: `0xD81d6F1C9fdcD1d89f2Ff1a85504F5743C12E117`

#### Zora Sepolia (Testnet)
- **Chain ID**: 999999999
- **Factory Address**: `0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F`
- **Implementation Address**: `0xD66D2D5F1114d6F6ee30cEbE2562806aFC23F3E6`

### Platform Economics

#### V1 Fee Structure

1. **Deployment Fee**: 0.001 ETH per collection creation
   - Goes to: Platform treasury
   - Purpose: Prevent spam and cover deployment costs

2. **Platform Fee**: 2.5% of primary mint revenue
   - Goes to: Platform treasury
   - Purpose: Platform maintenance and development

3. **Artist Revenue**: 97.5% of primary mint revenue
   - Goes to: Collection owner (artist)
   - Purpose: Artist compensation

4. **Secondary Sales Platform Fee**: 1% of secondary sale price
   - Goes to: Platform treasury
   - Purpose: Platform maintenance and marketplace fees

5. **Artist Royalties**: Configurable per NFT (up to 50%)
   - Goes to: Artist (set during NFT creation)
   - Purpose: Ongoing artist compensation on secondary sales

#### Revenue Flow Example

```
Primary Sale - User mints NFT for 0.1 ETH:
├── Platform Fee (2.5%): 0.0025 ETH → Platform Treasury
├── Artist Revenue (97.5%): 0.0975 ETH → Artist
└── Gas Fees: Variable → Network Validators

Artist creates NFT with artistMint():
├── Artist becomes first owner (0 cost)
├── Artist sets title, description, and royalty %
└── Artist lists NFT for sale on marketplace

Secondary Sale - NFT sold for 1 ETH:
├── Platform Fee (1%): 0.01 ETH → Platform Treasury
├── Artist Royalty (configurable, e.g. 10%): 0.1 ETH → Artist
├── Seller Revenue: 0.89 ETH → Seller
└── Marketplace Fee: Variable → Marketplace
```

## Migration from Legacy to V3

### V1 to V3 Migration
- V3 contracts are completely independent from V1
- V1 collections continue to function normally
- Artists can use both V1 and V3 simultaneously
- V3 eliminates deployment fees in favor of subscription-based access

### V2 to V3 Migration
- V3 includes all V2 functionality plus enhancements
- Built-in gasless functionality (no separate relayer needed)
- Auto-enrollment system replaces manual subscription setup
- Enhanced OpenSea compatibility and contract metadata

### Choosing the Right Version

**Use V3 for** (Current Recommendation):
- New artist onboarding with auto-enrollment
- Built-in gasless experience from first interaction
- Enhanced multi-chain support
- Latest security and optimization features

**Use V1 for** (Legacy Support):
- Existing collections (continue as-is)
- Traditional pay-per-deployment models
- Simple NFT collection needs

**V2 Status**: Deprecated - migrate to V3 for new deployments

## Legacy Support

All legacy contracts remain fully functional and supported:
- V1 contracts continue operating with existing features
- V2 contracts remain operational but deprecated
- Frontend applications should migrate to V3 for new features
- Legacy collections maintain full OpenSea and marketplace compatibility

For technical support with legacy implementations, please refer to the specific version documentation or contact the development team.