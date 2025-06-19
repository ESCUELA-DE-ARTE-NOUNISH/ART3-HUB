# Art3 Hub V3 Smart Contracts

> **Advanced Gasless NFT Platform with Built-in Subscription Management**

Art3 Hub V3 is a next-generation decentralized NFT platform that provides a complete gasless experience with built-in subscription management, auto-enrollment, and multi-chain support designed for seamless Web3 onboarding.

## 🚀 **Art3Hub V3 - Current Implementation**

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

## 🏗️ **V3 Architecture**

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Art3 Hub V3 Platform                       │
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
│                    Art3HubSubscriptionV3                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Auto-enrollment system for new users                   │  │
│  │ • Plan Gratuito: 1 NFT/year (free, gasless)             │  │
│  │ • Plan Master: 10 NFTs/month ($4.99 USDC)               │  │
│  │ • Cross-chain USDC payment processing                    │  │
│  │ • Real-time quota tracking and enforcement               │  │
│  │ • Built-in gasless functionality                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Art3HubFactoryV3                            │
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
│                  Art3HubCollectionV3                            │
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

## 📋 **V3 Subscription Plans**

### Plan Gratuito (Free) - Auto-Enrollment
- **Price**: Free (automatically enrolled)
- **Duration**: 365 days (1 year)
- **NFT Limit**: 1 gasless mint per year
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

## 🌐 **V3 Deployed Contracts (June 19, 2025)**

### Base Sepolia (Testnet) - Chain ID: 84532
- **Deployment Date**: June 17, 2025
- **Status**: ✅ **All contracts verified and tested**
- **SubscriptionManager**: `0x536db8f14632D7BF811D1991cf2A4215eB6f7314`
- **Factory**: `0x208332e81401031D71b7c24eeae2A48c2331bCe8`
- **Collection Implementation**: `0xCa88CC1e7161E7eaDc456196981a4C7Af0356991`
- **USDC Token**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Treasury Wallet**: `0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9`
- **Gasless Relayer**: `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1`
- **BaseScan Links** (Verified):
  - [SubscriptionManager](https://sepolia.basescan.org/address/0x536db8f14632D7BF811D1991cf2A4215eB6f7314#code)
  - [Factory](https://sepolia.basescan.org/address/0x208332e81401031D71b7c24eeae2A48c2331bCe8#code)
  - [Collection Implementation](https://sepolia.basescan.org/address/0xCa88CC1e7161E7eaDc456196981a4C7Af0356991#code)

### Zora Sepolia (Testnet) - Chain ID: 999999999
- **Deployment Date**: June 19, 2025
- **Status**: ✅ **All contracts deployed and tested**
- **SubscriptionManager**: `0xb31e157f357e59c4D08a3e43CCC7d10859da829F`
- **Factory**: `0x3A1Db96cD08077c73247EaafD7a9Cf961de5e87c`
- **Collection Implementation**: `0x3AF35D9a24A77acd8549A1Be712C676FE978eE24`
- **USDC Token**: `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4`
- **Gasless Relayer**: `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1`
- **Zora Explorer Links**:
  - [SubscriptionManager](https://sepolia.explorer.zora.energy/address/0xb31e157f357e59c4D08a3e43CCC7d10859da829F)
  - [Factory](https://sepolia.explorer.zora.energy/address/0x3A1Db96cD08077c73247EaafD7a9Cf961de5e87c)
  - [Collection Implementation](https://sepolia.explorer.zora.energy/address/0x3AF35D9a24A77acd8549A1Be712C676FE978eE24)

### Celo Alfajores (Testnet) - Chain ID: 44787
- **Deployment Date**: June 19, 2025
- **Status**: ✅ **All contracts verified and tested**
- **SubscriptionManager**: `0x48EEF5c0676cdf6322e668Fb9deAd8e93ff8bF36`
- **Factory**: `0x811634F4bB646D67a5a6A78ABC51BE3e414b326b`
- **Collection Implementation**: `0xae0549C75BBb60Fc7BB17Ed23bD93d5137718300`
- **USDC Token**: `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`
- **Gasless Relayer**: `0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1`
- **Celo Explorer Links** (Verified):
  - [SubscriptionManager](https://alfajores.celoscan.io/address/0x48EEF5c0676cdf6322e668Fb9deAd8e93ff8bF36#code)
  - [Factory](https://alfajores.celoscan.io/address/0x811634F4bB646D67a5a6A78ABC51BE3e414b326b#code)
  - [Collection Implementation](https://alfajores.celoscan.io/address/0xae0549C75BBb60Fc7BB17Ed23bD93d5137718300#code)

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

## 🚀 **V3 Deployment**

### Deploy V3 Contracts

Deploy V3 contracts to any supported network:

```bash
# Base Sepolia
npm run deploy:baseSepolia

# Zora Sepolia  
npm run deploy:zoraSepolia

# Celo Alfajores
npm run deploy:celoSepolia

# Mainnet deployments (when ready)
npm run deploy:base
npm run deploy:zora
npm run deploy:celo
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
npm run flatten
```

### Testing Commands

```bash
# Test NFT creation on different networks
npm run test:nft:base   # Base Sepolia
npm run test:nft:zora   # Zora Sepolia
npm run test:nft:celo   # Celo Alfajores

# Check gasless relayer balances
npm run check:balances -- --network [network]

# Fund gasless relayers
npm run fund:relayer -- --network [network]
```

## 💻 **V3 Usage Examples**

### For Artists (Gasless Collection Creation)

```typescript
import { ethers } from 'ethers';

// 1. Connect to factory contract
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

// 2. Create EIP-712 domain
const domain = {
  name: 'Art3HubFactoryV3',
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

### For Subscription Management

```typescript
// Check user subscription status
const subscription = await subscriptionContract.getSubscription(userAddress);
console.log('User plan:', subscription.plan); // 0 = FREE, 1 = MASTER
console.log('Is active:', subscription.isActive);
console.log('NFTs minted:', subscription.nftsMinted.toString());

// Auto-enrollment (happens automatically in V3)
const canMint = await subscriptionContract.canUserMint(userAddress, 1);
console.log('Can user mint:', canMint);

// Upgrade to Master plan (USDC payment)
const upgradeResponse = await fetch('/api/gasless-relay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'upgradeSubscription',
    userAddress,
    autoRenew: true,
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

- **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)**: Complete contract verification guide
- **[LEGACY-IMPLEMENTATION.md](./LEGACY-IMPLEMENTATION.md)**: V1 and V2 documentation
- **[CHANGELOG.md](./CHANGELOG.md)**: Version history and updates
- **[DEPLOY_V3.md](./DEPLOY_V3.md)**: Detailed V3 deployment guide

## 🎯 **V3 Success Metrics**

### Technical Achievements
- ✅ **100% Gasless Experience**: All operations truly gasless for users
- ✅ **Multi-Chain Deployment**: Successfully deployed on Base, Zora, and Celo testnets
- ✅ **Auto-Enrollment Working**: New users automatically enrolled in Free plan
- ✅ **USDC Integration**: Cross-chain USDC payment system operational
- ✅ **OpenSea Compatible**: Enhanced marketplace integration verified
- ✅ **Security Hardened**: Environment-based configuration and comprehensive auditing

### Performance Summary
| Network | Collection Gas | NFT Gas | Total Gas | Status |
|---------|---------------|---------|-----------|---------|
| Base Sepolia | ~557K | ~196K | ~753K | ✅ Optimal |
| Zora Sepolia | ~557K | ~196K | ~754K | ✅ Optimal |
| Celo Alfajores | ~580K | ~196K | ~776K | ✅ Efficient |

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

**Built with ❤️ by the Art3 Hub team | Powered by V3 Architecture**