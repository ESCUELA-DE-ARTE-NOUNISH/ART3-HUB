# Art3 Hub V4 Smart Contracts

> **Advanced Gasless NFT Platform with Elite Creator Plan and Enhanced Subscription Management**

Art3 Hub V4 is a next-generation decentralized NFT platform that provides a complete gasless experience with three subscription tiers including the new Elite Creator plan, built-in subscription management, auto-enrollment, and multi-chain support designed for seamless Web3 onboarding.

## 🚀 **Art3Hub V4 - Current Implementation**

### Key Features

- **🆓 True Gasless Experience**: All operations including collection creation are gasless for users
- **🔄 Auto-Enrollment**: New users automatically enrolled in Free plan on first interaction
- **💳 USDC Payments**: Seamless subscription payments via USDC across all chains
- **⚡ Built-in Meta-Transactions**: EIP-712 signatures for all operations
- **🌍 Multi-Chain Support**: Base, Zora, and Celo networks with unified experience
- **🎨 OpenSea Compatible**: Enhanced metadata and proxy registry integration
- **📊 Smart Quota Management**: Automated tracking and enforcement
- **🔒 Enterprise Security**: Advanced access controls and comprehensive audit trail
- **🔧 Environment-Based Security**: All configuration via environment variables
- **👑 Elite Creator Plan**: New $9.99/month plan for high-volume artists (25 NFTs/month)
- **📈 Plan Management**: Upgrade/downgrade functionality between subscription tiers

## 🏗️ **V4 Architecture**

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Art3 Hub V4 Platform                       │
│                   (Multi-Chain Ecosystem)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   Base Network  │ │  Zora Network   │ │  Celo Network   │
        │   (84532/8453)  │ │(999999999/7777777)│ │ (44787/42220)  │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                │                    │                    │
                ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Art3HubSubscriptionV4                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Auto-enrollment system for new users                   │  │
│  │ • Plan Free: 1 NFT/month (free, gasless)                │  │
│  │ • Plan Master: 10 NFTs/month ($4.99 USDC)               │  │
│  │ • Plan Elite Creator: 25 NFTs/month ($9.99 USDC)        │  │
│  │ • Cross-chain USDC payment processing                    │  │
│  │ • Real-time quota tracking and enforcement               │  │
│  │ • Built-in gasless functionality                         │  │
│  │ • Plan upgrade/downgrade management                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Art3HubFactoryV4                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Gasless collection creation via EIP-712                │  │
│  │ • Integrated subscription validation                     │  │
│  │ • Auto-enrollment trigger for new users                  │  │
│  │ • Multi-chain deployment coordination                    │  │
│  │ • Built-in gasless relayer functionality                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Art3HubCollectionV4                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Enhanced ERC-721 + ERC-2981 + EIP-712                 │  │
│  │ • Gasless minting via built-in meta-transactions         │  │
│  │ • Advanced OpenSea compatibility                         │  │
│  │ • Contract-level metadata (contractURI)                  │  │
│  │ • Subscription quota integration                         │  │
│  │ • 90% gas savings via minimal proxy pattern              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │   Artist A      │ │   Artist B      │ │   Artist C      │
        │   Collection    │ │   Collection    │ │   Collection    │
        │   (Proxy)       │ │   (Proxy)       │ │   (Proxy)       │
        │  ✅ Gasless     │ │  ✅ Gasless     │ │  ✅ Gasless     │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Contract Interaction Flow

```
New User          SubscriptionV3       FactoryV3           CollectionV3       USDC Contract
    │                    │                │                   │                   │
    │ 1. Create Collection│                │                   │                   │
    │ (EIP-712 Signature) │                │                   │                   │
    ├─────────────────────────────────────▶│                   │                   │
    │                    │                │                   │                   │
    │                    │ 2. Check User  │                   │                   │
    │                    │    Subscription │                   │                   │
    │                    │◀───────────────│                   │                   │
    │                    │                │                   │                   │
    │                    │ 3. Auto-Enroll │                   │                   │
    │                    │    Free Plan   │                   │                   │
    │                    │ (if new user)  │                   │                   │
    │                    ├───────────────▶│                   │                   │
    │                    │                │                   │                   │
    │                    │                │ 4. Deploy         │                   │
    │                    │                │    Collection     │                   │
    │                    │                │    (Gasless)      │                   │
    │                    │                ├───────────────────▶│                   │
    │                    │                │                   │                   │
    │ 5. Collection Ready │                │                   │                   │
    │◀─────────────────────────────────────│                   │                   │
    │                    │                │                   │                   │
    │ 6. Mint NFT         │                │                   │                   │
    │ (EIP-712 Signature) │                │                   │                   │
    ├─────────────────────────────────────────────────────────▶│                   │
    │                    │                │                   │                   │
    │                    │ 7. Validate    │                   │                   │
    │                    │    Quota       │                   │                   │
    │                    │◀───────────────────────────────────│                   │
    │                    │                │                   │                   │
    │                    │ 8. Update      │                   │                   │
    │                    │    Usage       │                   │                   │
    │                    ├───────────────────────────────────▶│                   │
    │                    │                │                   │                   │
    │ 9. NFT Minted       │                │                   │                   │
    │    (Gasless)        │                │                   │                   │
    │◀─────────────────────────────────────────────────────────│                   │
    │                    │                │                   │                   │
    │ 10. Upgrade to      │                │                   │                   │
    │     Master Plan     │                │                   │                   │
    ├────────────────────▶│                │                   │                   │
    │                    │                │                   │                   │
    │                    │ 11. Process    │                   │                   │
    │                    │     USDC       │                   │                   │
    │                    │     Payment    │                   │                   │
    │                    ├───────────────────────────────────────────────────────▶│
    │                    │                │                   │                   │
    │ 12. Master Plan     │                │                   │                   │
    │     Active          │                │                   │                   │
    │◀────────────────────│                │                   │                   │
```

### V3 Gasless Transaction Flow

```
Frontend App      User Wallet        V3 Contracts       Gasless Relayer      Blockchain
     │                │                   │                   │                │
     │ 1. User Action  │                   │                   │                │
     │   (Create NFT)  │                   │                   │                │
     ├────────────────▶│                   │                   │                │
     │                │                   │                   │                │
     │                │ 2. Sign EIP-712   │                   │                │
     │                │    Message        │                   │                │
     │                │ (No Gas Required) │                   │                │
     │                ├──────────────────▶│                   │                │
     │                │                   │                   │                │
     │ 3. Signed       │                   │                   │                │
     │    Message      │                   │                   │                │
     │◀────────────────│                   │                   │                │
     │                │                   │                   │                │
     │ 4. Send to      │                   │                   │                │
     │    Gasless API  │                   │                   │                │
     ├───────────────────────────────────────────────────────▶│                │
     │                │                   │                   │                │
     │                │                   │ 5. Validate       │                │
     │                │                   │    Signature      │                │
     │                │                   │◀───────────────────│                │
     │                │                   │                   │                │
     │                │                   │ 6. Execute        │                │
     │                │                   │    Transaction    │                │
     │                │                   │    (Relayer Pays  │                │
     │                │                   │     Gas)          │                │
     │                │                   ├───────────────────┼────────────────▶│
     │                │                   │                   │                │
     │                │                   │ 7. Transaction    │                │
     │                │                   │    Confirmed      │                │
     │                │                   │◀───────────────────┼────────────────│
     │                │                   │                   │                │
     │ 8. Success      │                   │                   │                │
     │    Response     │                   │                   │                │
     │◀───────────────────────────────────────────────────────│                │
     │                │                   │                   │                │
     │ 9. UI Update    │                   │                   │                │
     │ (NFT Created)   │                   │                   │                │
     ├────────────────▶│                   │                   │                │
```

## 📋 **V4 Subscription Plans**

### Plan Free - Auto-Enrollment
- **Price**: Free (automatically enrolled)
- **Duration**: 30 days (1 month) - **UPDATED IN V4**
- **NFT Limit**: 1 gasless mint per month - **UPDATED IN V4**
- **Collection Creation**: ✅ Unlimited collections included
- **Auto-Enrollment**: ✅ Automatic on first platform interaction
- **Features**: Basic onboarding, educational content, OpenSea compatibility
- **Gasless**: ✅ All operations gasless

### Plan Master (Premium) - USDC Subscription
- **Price**: $4.99/month (USDC)
- **Duration**: 30 days
- **NFT Limit**: 10 gasless mints per month
- **Collection Creation**: ✅ Unlimited collections included
- **Auto-Renewal**: ✅ USDC-based automatic renewal
- **Features**: Priority support, enhanced analytics, advanced marketplace features
- **Gasless**: ✅ All operations gasless

### Plan Elite Creator (Professional) - USDC Subscription - **NEW IN V4**
- **Price**: $9.99/month (USDC)
- **Duration**: 30 days
- **NFT Limit**: 25 gasless mints per month
- **Collection Creation**: ✅ Unlimited collections included
- **Auto-Renewal**: ✅ USDC-based automatic renewal
- **Features**: Premium support, advanced analytics, priority marketplace features, bulk operations
- **Gasless**: ✅ All operations gasless
- **Target**: High-volume artists, studios, professional creators

## 🌐 **V4 Deployed Contracts (June 21, 2025)**

### Base Sepolia (Testnet) - Chain ID: 84532
- **Deployment Date**: June 21, 2025
- **Status**: ✅ **All V4 contracts verified and tested**
- **SubscriptionV4**: `0x2650E7234D4f3796eA627013a94E3602D5720FD4`
- **FactoryV4**: `0x63EB148099F90b90A25f7382E22d68C516CD4f03`
- **CollectionV4 Implementation**: `0xA66713166A91C946d85e4b45cA14B190F4e33977`
- **USDC Token**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Treasury Wallet**: `0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9`
- **Gasless Relayer**: `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1`
- **BaseScan Links** (Verified):
  - [FactoryV4](https://sepolia.basescan.org/address/0x63EB148099F90b90A25f7382E22d68C516CD4f03#code)
  - [CollectionV4 Implementation](https://sepolia.basescan.org/address/0xA66713166A91C946d85e4b45cA14B190F4e33977#code)

### Zora Sepolia (Testnet) - Chain ID: 999999999
- **Deployment Date**: June 21, 2025
- **Status**: ✅ **All V4 contracts deployed and verified**
- **SubscriptionV4**: `0xF205A20e23440C58822cA16a00b67F58CD672e16`
- **FactoryV4**: `0x5516B7b1Ba0cd76294dD1c17685F845bD929C574`
- **CollectionV4 Implementation**: `0x00B6E63eaAfD7836Dc6310dd03F38BcD2c19d99a`
- **USDC Token**: `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4`
- **Gasless Relayer**: `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1`
- **Zora Explorer Links** (Verified):
  - [SubscriptionV4](https://sepolia.explorer.zora.energy/address/0xF205A20e23440C58822cA16a00b67F58CD672e16#code)
  - [FactoryV4](https://sepolia.explorer.zora.energy/address/0x5516B7b1Ba0cd76294dD1c17685F845bD929C574#code)
  - [CollectionV4 Implementation](https://sepolia.explorer.zora.energy/address/0x00B6E63eaAfD7836Dc6310dd03F38BcD2c19d99a#code)

### Celo Alfajores (Testnet) - Chain ID: 44787
- **Deployment Date**: June 21, 2025
- **Status**: ✅ **All V4 contracts verified and tested**
- **SubscriptionV4**: `0xBb256639931Be1D92D5b3940dE81ed68EfDC3c27`
- **FactoryV4**: `0x6CB2D09DBb71723a0E9ee134B19b0FAca9963e31`
- **CollectionV4 Implementation**: `0x03ddf3C35508fF7B25A908962492273dc71523fe`
- **USDC Token**: `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`
- **Gasless Relayer**: `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1`
- **Celo Explorer Links** (Verified):
  - [FactoryV4](https://alfajores.celoscan.io/address/0x6CB2D09DBb71723a0E9ee134B19b0FAca9963e31#code)
  - [CollectionV4 Implementation](https://alfajores.celoscan.io/address/0x03ddf3C35508fF7B25A908962492273dc71523fe#code)

## 🔧 **Environment Setup**

### Prerequisites

1. **Node.js**: Version 16 or higher
2. **npm**: Installed with Node.js
3. **Environment Variables**: Properly configured `.env` file

### Environment Configuration

Copy `.env.example` to `.env` and configure all required variables:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```bash
# 🔐 Private Keys (REQUIRED)
PRIVATE_KEY=your_deployer_private_key_here
GASLESS_RELAYER_PRIVATE_KEY=your_relayer_private_key_here

# 🔑 API Keys (REQUIRED)
BASESCAN_API_KEY=your_basescan_api_key
CELOSCAN_API_KEY=your_celoscan_api_key

# 👛 Wallet Addresses (REQUIRED)
TREASURY_WALLET=0x0000000000000000000000000000000000000000
GASLESS_RELAYER=0x0000000000000000000000000000000000000000
INITIAL_OWNER=0x0000000000000000000000000000000000000000

# 💰 USDC Addresses by Network
USDC_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
USDC_ADDRESS_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
# ... (see .env.example for complete list)
```

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests (optional)
npm run test
```

## 🚀 **V4 Deployment**

### Deploy V4 Contracts (Recommended)

Deploy V4 contracts with Elite Creator plan support:

```bash
# Testnet Deployments
npm run deploy:v4:baseSepolia    # Base Sepolia
npm run deploy:v4:zoraSepolia    # Zora Sepolia  
npm run deploy:v4:celoSepolia    # Celo Alfajores

# Mainnet deployments (when ready)
npm run deploy:v4:base           # Base Mainnet
npm run deploy:v4:zora           # Zora Mainnet
npm run deploy:v4:celo           # Celo Mainnet
```

### Deploy V3 Contracts (Legacy)

```bash
# V3 Legacy deployments still available
npm run deploy:baseSepolia
npm run deploy:zoraSepolia
npm run deploy:celoSepolia
```

### Contract Verification

```bash
# Base Sepolia Verification
npm run verify:baseSepolia

# Zora Sepolia Verification (Manual Blockscout)
npm run verify:zoraSepolia

# Celo Alfajores Verification
npm run verify:celoSepolia

# Generate flattened files for manual verification
npm run flatten      # V3 contracts
npm run flatten:v4   # V4 contracts
```

### Testing Commands

```bash
# Test V4 contracts on different networks
npm run test:v4:base   # Base Sepolia V4
npm run test:v4:zora   # Zora Sepolia V4
npm run test:v4:celo   # Celo Alfajores V4

# Run V4 test suite
npm run test:v4

# Legacy V3 testing
npm run test:nft:base   # Base Sepolia V3
npm run test:nft:zora   # Zora Sepolia V3
npm run test:nft:celo   # Celo Alfajores V3

# Check gasless relayer balances
npm run check:balances -- --network [network]

# Fund gasless relayers
npm run fund:relayer -- --network [network]
```

## 💻 **V4 Usage Examples**

### For Artists (Gasless Collection Creation)

```typescript
import { ethers } from 'ethers';

// 1. Connect to factory contract
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

// 2. Create EIP-712 domain
const domain = {
  name: 'Art3HubFactoryV4',
  version: '1',
  chainId: await provider.getNetwork().then(n => n.chainId),
  verifyingContract: FACTORY_ADDRESS
};

// 3. Collection voucher structure
const voucher = {
  name: "My Art Collection",
  symbol: "MYART",
  description: "A beautiful collection of digital art",
  image: "ipfs://QmHash.../collection-image.jpg",
  externalUrl: "https://mywebsite.com",
  artist: artistAddress,
  royaltyRecipient: artistAddress,
  royaltyFeeNumerator: 1000, // 10% royalties
  nonce: await factory.userNonces(artistAddress),
  deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

// 4. Sign with EIP-712 (gasless for user)
const signature = await signer._signTypedData(domain, {
  CollectionVoucher: [
    { name: 'name', type: 'string' },
    { name: 'symbol', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'image', type: 'string' },
    { name: 'externalUrl', type: 'string' },
    { name: 'artist', type: 'address' },
    { name: 'royaltyRecipient', type: 'address' },
    { name: 'royaltyFeeNumerator', type: 'uint96' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
}, voucher);

// 5. Submit to gasless API (relayer pays gas)
const response = await fetch('/api/gasless-relay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'createCollection',
    voucher,
    signature,
    chainId: await provider.getNetwork().then(n => n.chainId)
  })
});

const result = await response.json();
console.log('Collection created:', result.contractAddress);
```

### For Users (Gasless NFT Minting)

```typescript
// 1. Create mint voucher
const mintVoucher = {
  collection: collectionAddress,
  to: userAddress,
  tokenURI: "ipfs://QmHash.../token-metadata.json",
  nonce: await factory.userNonces(userAddress),
  deadline: Math.floor(Date.now() / 1000) + 3600
};

// 2. Sign mint voucher (gasless)
const mintSignature = await signer._signTypedData(domain, {
  MintVoucher: [
    { name: 'collection', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'tokenURI', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
}, mintVoucher);

// 3. Submit to gasless API
const mintResponse = await fetch('/api/gasless-relay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'mint',
    voucher: mintVoucher,
    signature: mintSignature,
    chainId: await provider.getNetwork().then(n => n.chainId)
  })
});

const mintResult = await mintResponse.json();
console.log('NFT minted:', mintResult.transactionHash);
```

### For Subscription Management (V4 with Elite Plan)

```typescript
// Check user subscription status
const subscription = await subscriptionContract.getSubscription(userAddress);
console.log('User plan:', subscription.plan); // 0 = FREE, 1 = MASTER, 2 = ELITE
console.log('Is active:', subscription.isActive);
console.log('NFTs minted:', subscription.nftsMinted.toString());

// Get plan name for UI display (NEW in V4)
const planName = await subscriptionContract.getPlanName(subscription.plan);
console.log('Plan name:', planName); // "Free", "Master", or "Elite Creator"

// Auto-enrollment (happens automatically in V4)
const canMint = await subscriptionContract.canUserMint(userAddress, 1);
console.log('Can user mint:', canMint);

// Get enhanced subscription info via factory (NEW in V4)
const [planName, nftsMinted, nftLimit, isActive] = 
  await factoryContract.getUserSubscriptionInfo(userAddress);
console.log(`User has ${planName} plan: ${nftsMinted}/${nftLimit} NFTs used`);

// Upgrade to Master plan (USDC payment)
const upgradeMasterResponse = await fetch('/api/gasless-relay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'upgradeToMaster',
    userAddress,
    autoRenew: true,
    chainId: await provider.getNetwork().then(n => n.chainId)
  })
});

// Upgrade to Elite Creator plan (NEW in V4)
const upgradeEliteResponse = await fetch('/api/gasless-relay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'upgradeToElite',
    userAddress,
    autoRenew: true,
    chainId: await provider.getNetwork().then(n => n.chainId)
  })
});

// Downgrade subscription (NEW in V4)
const downgradeResponse = await fetch('/api/gasless-relay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'downgradeSubscription',
    userAddress,
    newPlan: 1, // 0 = FREE, 1 = MASTER, 2 = ELITE
    chainId: await provider.getNetwork().then(n => n.chainId)
  })
});
```

## 🔐 **Security Features**

### Environment-Based Configuration
- All sensitive data managed via environment variables
- No hardcoded private keys or API keys in source code
- Comprehensive `.env.example` for secure setup

### EIP-712 Meta-Transactions
- Industry-standard structured data signing
- Nonce management for replay attack prevention
- Deadline enforcement for time-limited validity
- Domain separation for network-specific security

### Access Control
- Multi-level authorization (factory, subscription, collection)
- Emergency functions for owner-controlled updates
- Comprehensive event logging for audit trails
- Rate limiting protection against abuse

## 📚 **Documentation**

- **[DEPLOY_V4.md](./DEPLOY_V4.md)**: Detailed V4 deployment guide with Elite Creator plan
- **[V4_DEPLOYMENT_SUMMARY.md](./V4_DEPLOYMENT_SUMMARY.md)**: Complete V4 testnet deployment results
- **[DEPLOY_V3.md](./DEPLOY_V3.md)**: V3 deployment guide (legacy)
- **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)**: Complete contract verification guide
- **[LEGACY-IMPLEMENTATION.md](./LEGACY-IMPLEMENTATION.md)**: V1 and V2 documentation
- **[CHANGELOG.md](./CHANGELOG.md)**: Version history and updates

## 🎯 **V4 Success Metrics**

### Technical Achievements
- ✅ **100% Gasless Experience**: All operations truly gasless for users
- ✅ **Multi-Chain Deployment**: Successfully deployed on Base, Zora, and Celo testnets
- ✅ **Elite Creator Plan**: New $9.99/month plan with 25 NFTs/month successfully implemented
- ✅ **Free Plan Fixed**: Changed from 1 NFT/year to 1 NFT/month (30-day duration)
- ✅ **Auto-Enrollment Working**: New users automatically enrolled in Free plan
- ✅ **USDC Integration**: Cross-chain USDC payment system operational
- ✅ **Plan Management**: Upgrade/downgrade functionality implemented
- ✅ **Enhanced Factory**: getUserSubscriptionInfo() function for better UI integration
- ✅ **OpenSea Compatible**: Enhanced marketplace integration verified
- ✅ **Security Hardened**: Environment-based configuration and comprehensive auditing

### V4 Performance Summary
| Network | Collection Gas | NFT Gas | Total Gas | Status |
|---------|---------------|---------|-----------|---------|
| Base Sepolia | ~557K | ~196K | ~753K | ✅ Optimal |
| Zora Sepolia | ~557K | ~196K | ~754K | ✅ Optimal |
| Celo Alfajores | ~580K | ~196K | ~776K | ✅ Efficient |

### V4 Plan Adoption (June 21, 2025)
| Plan | Monthly Price | NFT Limit | Duration | Target Users |
|------|---------------|-----------|----------|--------------|
| Free | $0.00 | 1 NFT | 30 days | New users, hobbyists |
| Master | $4.99 | 10 NFTs | 30 days | Regular creators |
| Elite Creator | $9.99 | 25 NFTs | 30 days | Professional artists, studios |

## 🏛️ **Legacy Support**

For information about previous implementations:
- **V1 & V2 Documentation**: See [LEGACY-IMPLEMENTATION.md](./LEGACY-IMPLEMENTATION.md)
- **Migration Guide**: Included in legacy documentation
- **Support**: All versions remain fully functional

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Ensure CI passes

## 📞 **Support**

- **Documentation**: Check README and CHANGELOG
- **Issues**: Create issue in project repository
- **Discord**: Join Art3 Hub Discord community
- **Email**: Contact developers

---

**Built with ❤️ by the Art3 Hub team | Powered by V4 Architecture with Elite Creator Plan**