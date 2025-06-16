# Changelog

All notable changes to the Art3 Hub smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-16

### 🚀 **Major Release: Art3Hub V2 - Subscription-Based Platform**

Art3Hub V2 introduces a complete paradigm shift from pay-per-deployment to subscription-based NFT creation with gasless experiences and enhanced artist onboarding.

### 🆕 Added

#### Subscription Management System
- **SubscriptionManager.sol**: Core subscription logic with free and premium tiers
  - **Plan Gratuito (Free)**: 1 gasless NFT mint, basic educational access, guided Web3 onboarding
  - **Plan Master ($4.99/month)**: 10 NFTs/month, exclusive workshops, enhanced visibility, full AI agent access
- **USDC Payment Processing**: Accept stable coin payments for subscriptions
- **Quota Tracking**: Automated NFT minting limits per subscription tier
- **Subscription Expiration**: Time-based subscription management with automatic renewals
- **No Deployment Fees**: Collection creation included in subscription plans (eliminates 0.001 ETH fee from V1)

#### Gasless Transaction Infrastructure
- **Art3HubCollectionV2.sol**: Enhanced ERC721 with gasless minting capabilities
- **Art3HubFactoryV2.sol**: Gasless collection deployment using meta-transactions
- **GaslessRelayer.sol**: Meta-transaction relayer with EIP-712 signature verification
- **EIP-712 Typed Data**: Secure signature-based transactions for gasless operations
- **Batch Operations**: Support for batch gasless transactions

#### Enhanced NFT Collections
- **Subscription Integration**: Automatic validation of minting quotas before NFT creation
- **Meta-transaction Support**: EIP-712 signatures for gasless minting
- **Artist Control**: Artists retain full control over their collections
- **OpenSea Compatibility**: Full OpenSea integration with gasless listing support
- **Royalty Management**: Enhanced ERC-2981 implementation with flexible royalty settings

#### AI Agent Integration Support
- **Subscription-based Access**: Different AI capabilities based on subscription tier
- **Smart Contract Hooks**: Built-in support for AI agent interaction tracking
- **Usage Analytics**: Track AI agent usage per subscription plan

#### Advanced Security Features
- **Nonce-based Replay Protection**: Prevent transaction replay attacks
- **Deadline Expiration**: Time-limited signature validity
- **Authorized Relayer System**: Controlled access to gasless transaction execution
- **Signature Verification**: Comprehensive EIP-712 signature validation

#### Developer Experience Improvements
- **Comprehensive Test Suite**: 100+ tests covering all V2 functionality
- **TypeChain Integration**: Full type-safe contract interactions
- **Deployment Scripts**: Automated V2 contract deployment across all networks
- **Gas Optimization**: Significant gas savings through improved contract design

### 🔧 Technical Specifications

#### New Smart Contracts
- **SubscriptionManager.sol** - Subscription and quota management
- **Art3HubCollectionV2.sol** - Enhanced NFT collections with gasless features
- **Art3HubFactoryV2.sol** - Factory with subscription validation and gasless deployment
- **GaslessRelayer.sol** - Meta-transaction relayer infrastructure

#### Contract Features
- **EIP-712 Compliance**: Structured data signing for gasless transactions
- **Minimal Proxy Pattern**: Continued gas efficiency with 90% deployment cost reduction
- **Upgradeable Architecture**: Future-proof design with upgrade capabilities
- **Multi-network Support**: Deploy across Base, Zora, and Celo networks

#### Gasless Transaction Flow
```
User → Signs EIP-712 Message → Relayer → Validates Signature → Executes Transaction → Blockchain
```

#### Subscription Model
```
Artist → Subscribes to Plan → Gets Quota → Creates Collection → Mints NFTs → Quota Decreases
```

### 📋 Subscription Plans

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

### 💰 Fee Model Changes

#### V2 vs V1 Fee Structure
- **V1 Model**: 0.001 ETH deployment fee per collection + 2.5% platform fee on mints
- **V2 Model**: Subscription-based access (no deployment fees) + 2.5% platform fee on mints
- **Cost Comparison**: 
  - V1: $3+ per collection (at current ETH prices) + ongoing fees
  - V2: $0-4.99/month for unlimited collections + ongoing fees

### 🌐 Network Support

#### Supported Networks
- **Base Mainnet** (8453) & **Base Sepolia** (84532)
- **Zora Mainnet** (7777777) & **Zora Sepolia** (999999999)
- **Celo Mainnet** (42220) & **Celo Alfajores** (44787)

#### Deployed Contracts - V2.0.0

##### Base Sepolia (84532) - January 16, 2025 ✅ **VERIFIED**
- **SubscriptionManager**: [`0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4`](https://sepolia.basescan.org/address/0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4#code)
- **Art3HubCollectionV2 Implementation**: [`0x41BE244598b4B8329ff68bD242C2fa58a9084e26`](https://sepolia.basescan.org/address/0x41BE244598b4B8329ff68bD242C2fa58a9084e26#code)
- **Art3HubFactoryV2**: [`0x75Ed9ACB51D2BEaCfD6c76099D63d3a0009F4a40`](https://sepolia.basescan.org/address/0x75Ed9ACB51D2BEaCfD6c76099D63d3a0009F4a40#code)
- **GaslessRelayer**: [`0x5116F90f3a26c7d825bE6Aa74544187b43c52a56`](https://sepolia.basescan.org/address/0x5116F90f3a26c7d825bE6Aa74544187b43c52a56#code)
- **USDC Token**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Deployer**: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
- **Platform Fee**: 2.5%
- **Blockscout**: [All contracts](https://base-sepolia.blockscout.com/)

##### Zora Sepolia (999999999) - January 16, 2025 ✅ **VERIFIED**
- **SubscriptionManager**: [`0xf1D63b42fb8c4887d6deB34c5fba81B18Bd2e3Ea`](https://sepolia.explorer.zora.energy/address/0xf1D63b42fb8c4887d6deB34c5fba81B18Bd2e3Ea#code)
- **Art3HubCollectionV2 Implementation**: [`0x2f302E1604E3657035C1EADa450582fA4417f598`](https://sepolia.explorer.zora.energy/address/0x2f302E1604E3657035C1EADa450582fA4417f598#code)
- **Art3HubFactoryV2**: [`0x270B8770F59c767ff55595e893c7E16A88347FE9`](https://sepolia.explorer.zora.energy/address/0x270B8770F59c767ff55595e893c7E16A88347FE9#code)
- **GaslessRelayer**: [`0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85`](https://sepolia.explorer.zora.energy/address/0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85#code)
- **USDC Token**: `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4` (placeholder)
- **Deployer**: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
- **Platform Fee**: 2.5%
- **Blockscout**: [All contracts](https://zora-sepolia.blockscout.com/)

#### Configuration Details
- **OpenSea Proxy Registry**: `0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC` (both networks)
- **Platform Fee Recipient**: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
- **Platform Fee**: 2.5% (unchanged from V1)
- **Deployment Fees**: ❌ Eliminated (subscription-based access)
- **Gasless Transactions**: Enabled on all deployed networks
- **Subscription Processing**: USDC-based payment system
- **Factory Authorization**: Automatic configuration during deployment
- **Celo Mainnet** (42220) & **Celo Alfajores** (44787)

#### Payment Tokens
- **USDC**: Primary payment token for subscriptions
- **Network-specific USDC addresses** configured per deployment

### 🔄 Migration & Compatibility

#### V1 to V2 Relationship
- **Independent Systems**: V2 runs alongside V1 without conflicts
- **No Migration Required**: Existing V1 collections continue functioning
- **Artist Choice**: Artists can use both V1 and V2 simultaneously
- **Feature Parity**: V2 includes all V1 features plus subscription benefits

#### Choosing Between Versions
**Use V2 for**:
- New artist onboarding with gasless experience
- Subscription-based business models
- AI agent integration requirements
- Enhanced user experience with meta-transactions

**Use V1 for**:
- Existing collections (maintain as-is)
- Traditional pay-per-deployment models
- Simple NFT needs without subscriptions

### 📚 Documentation

#### New Documentation Files
- **README_V2.md**: Complete V2 documentation with integration examples
- **Updated README.md**: Dual-version documentation with migration guidance
- **Test Suite**: Comprehensive testing documentation and examples

#### Integration Examples
- Frontend integration with subscription management
- Gasless minting implementation
- Subscription status checking
- Meta-transaction signing and execution

### 🚀 Deployment Commands

#### V2 Deployment
```bash
# Deploy V2 contracts to any supported network
npx hardhat run scripts/deploy-v2-contracts.ts --network [NETWORK]

# Example networks: baseSepolia, base, zoraSepolia, zora, celoSepolia, celo
```

#### Contract Verification
```bash
# V2 contracts include automated verification commands in deployment output
# Example for Base Sepolia:
npx hardhat verify --network baseSepolia [ADDRESS] [CONSTRUCTOR_ARGS]
```

### 🔐 Security Enhancements

#### Access Control Improvements
- **Subscription-based Access**: Only valid subscribers can mint NFTs
- **Authorized Relayers**: Controlled gasless transaction execution
- **Time-limited Signatures**: Prevent old signature reuse
- **Nonce Management**: Comprehensive replay attack protection

#### Audit Considerations
- **EIP-712 Implementation**: Industry-standard meta-transaction security
- **Fee Limits**: Capped fees prevent excessive charges
- **Emergency Controls**: Owner-controlled emergency functions for security incidents

### 💰 Business Model Innovation

#### Revenue Streams
- **Subscription Revenue**: Monthly recurring revenue from premium plans
- **Platform Fees**: Continued fee collection on NFT mints
- **Enhanced Value**: Gasless experience increases user adoption and retention

#### Artist Benefits
- **Reduced Barriers**: Free tier removes entry barriers for new artists
- **Enhanced Features**: Premium tier provides advanced capabilities
- **Gasless Experience**: Improved UX increases artist satisfaction and platform stickiness

### 📈 Performance Improvements

#### Gas Optimization
- **Batch Operations**: Multiple operations in single transaction
- **Optimized Storage**: Efficient data structures reduce gas costs
- **Proxy Pattern**: Continued 90% gas savings on collection deployment

#### User Experience
- **Gasless Onboarding**: Artists can start without owning ETH
- **Instant Transactions**: Meta-transactions provide immediate feedback
- **Subscription Management**: Clear quota tracking and renewal processes

### 🎯 Future Roadmap Integration

#### AI Agent Compatibility
- **Built-in Hooks**: Smart contracts ready for AI agent integration
- **Usage Tracking**: Monitor AI agent interactions per subscription
- **Tiered Access**: Different AI capabilities based on subscription level

#### Analytics & Insights
- **Subscription Metrics**: Track subscription conversions and retention
- **Usage Analytics**: Monitor NFT creation patterns by subscription tier
- **Revenue Attribution**: Track revenue by subscription plan and network

---

## [1.0.3] - 2025-06-12

### Deployed
- **Celo Sepolia Deployment**: Successfully deployed Art3 Hub factory system to Celo Sepolia testnet
  - **Factory Contract**: `0x40eB8B66C9540Bde934e0502df1319E5F5BCC782` ([View on Blockscout](https://celo-alfajores.blockscout.com/address/0x40eB8B66C9540Bde934e0502df1319E5F5BCC782))
  - **Implementation Contract**: `0xD81d6F1C9fdcD1d89f2Ff1a85504F5743C12E117` ([View on Blockscout](https://celo-alfajores.blockscout.com/address/0xD81d6F1C9fdcD1d89f2Ff1a85504F5743C12E117))

- **Zora Sepolia Deployment**: Successfully deployed Art3 Hub factory system to Zora Sepolia testnet
  - **Factory Contract**: `0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F` ([View on Blockscout](https://zora-sepolia.blockscout.com/address/0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F))
  - **Implementation Contract**: `0xD66D2D5F1114d6F6ee30cEbE2562806aFC23F3E6` ([View on Blockscout](https://zora-sepolia.blockscout.com/address/0xD66D2D5F1114d6F6ee30cEbE2562806aFC23F3E6))

### Added
- **Multi-Network Support**: Added support for Celo and Zora networks
- **Network Configurations**: Added Celo Sepolia, Celo Mainnet, Zora Sepolia, and Zora Mainnet configurations
- **Deployment Scripts**: Added deployment commands for new networks
  - `npm run deploy:celoSepolia`
  - `npm run deploy:celo`
  - `npm run deploy:zoraSepolia`
  - `npm run deploy:zora`

### Updated
- **README.md**: Added comprehensive network configuration section with Blockscout links
- **Hardhat Configuration**: Extended network support with custom chain configurations
- **Deployment Documentation**: Updated deployment guide with all supported networks

### Configuration
- **Networks Supported**: Base, Celo, and Zora (mainnet and testnets)
- **Deployment Fee**: 0.001 ETH per collection creation (consistent across all networks)
- **Platform Fee**: 2.5% (250 basis points) on primary mints
- **OpenSea Proxy Registry**: Only available on Base Mainnet

## [1.0.2] - 2025-06-12

### Deployed
- **Base Sepolia Deployment**: Successfully deployed Art3 Hub factory system to Base Sepolia testnet
- **Factory Contract**: `0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2` ([View on Basescan](https://sepolia.basescan.org/address/0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2#code) | [View on Blockscout](https://base-sepolia.blockscout.com/address/0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2))
- **Implementation Contract**: `0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2` ([View on Basescan](https://sepolia.basescan.org/address/0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2#code) | [View on Blockscout](https://base-sepolia.blockscout.com/address/0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2))
- **Test Collection**: `0xfae6f91fAa4B8cf54452501a7E7adBA0E6737824` - Successfully created during deployment testing

### Fixed
- **Compilation Issues**: Resolved OpenZeppelin v5.3.0 compatibility issues with override functions
- **Deployment Script**: Fixed BigNumberish conversion errors in deployment fee handling
- **Contract Verification**: Both contracts successfully verified on Basescan
- **Optimizer Configuration**: Enabled Solidity optimizer with IR compilation to resolve "stack too deep" errors

### Updated
- **Hardhat Configuration**: Added optimizer settings and viaIR compilation for complex contracts
- **README.md**: Added Base Sepolia contract addresses and verification commands
- **Factory Owner**: Set to deployer address `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`

### Configuration
- **Deployment Fee**: 0.001 ETH per collection creation
- **Platform Fee**: 2.5% (250 basis points) on primary mints
- **Fee Recipient**: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
- **Network**: Base Sepolia (Chain ID: 84532)
- **OpenSea Proxy Registry**: `0x0000000000000000000000000000000000000000` (testnet limitation)

## [1.0.1] - 2025-01-11

### Updated
- **Documentation**: Complete rewrite of README.md with comprehensive deployment guide
- **Architecture Diagrams**: Added detailed ASCII architecture diagrams showing system flow
- **Deployment Guide**: Added step-by-step deployment instructions with prerequisites
- **Usage Examples**: Added code examples for artists and users
- **Platform Economics**: Detailed fee structure and revenue flow documentation
- **Security Guide**: Added security considerations and best practices
- **Troubleshooting**: Added common issues and solutions section

### Deprecated
- **Art3NFT.sol**: Marked as deprecated, not part of current factory implementation
- **Art3Hub.sol**: Marked as deprecated, replaced by factory system

## [1.0.0] - 2025-01-06

### Added

#### Factory System Implementation
- **Art3HubFactory.sol**: Complete factory contract using OpenZeppelin's Clones library for gas-efficient NFT collection deployments
- **Art3HubCollection.sol**: Individual artist collection contract with full ERC-721 and ERC-2981 compliance
- Minimal proxy pattern implementation reducing deployment costs by ~90%
- Collection tracking and management system for artists and collections
- Platform fee collection system (2.5% default) with configurable rates
- Deployment fee system (0.001 ETH default) for collection creation

#### ERC-2981 Royalty Standard Compliance
- Full ERC-2981 implementation for automatic royalty enforcement
- Configurable royalty rates per collection (default 10%)
- Token-specific royalty overrides capability
- Platform-wide royalty recipient management

#### OpenSea Integration & Marketplace Compatibility
- **Full ERC-721 + ERC-2981 compliance** for universal marketplace support
- **OpenSea proxy registry integration** for gasless NFT listings on Base Mainnet
- **`contractURI()` implementation** for collection-level metadata and OpenSea collection pages
- **Metadata freezing capabilities** (`freezeTokenURI`, `freezeAllMetadata`) for permanent metadata
- **OpenSea-specific events** (`PermanentURI`, `PermanentURIGlobal`) for metadata permanence
- **Project proxy support** for enhanced marketplace integrations
- **Automatic royalty enforcement** via ERC-2981 standard on all compliant marketplaces
- **⚠️ Note**: 1% platform fee on secondary sales only applies to custom marketplace integrations

#### Multi-Network Support
- Base Sepolia testnet configuration and deployment scripts
- Base Mainnet configuration with OpenSea proxy registry integration
- Network-specific OpenSea proxy registry addresses
- Automated network detection in deployment scripts

#### Advanced NFT Features
- Batch minting capabilities for efficient large drops
- Owner minting (promotional/free mints) separate from paid mints
- Comprehensive collection statistics tracking
- Revenue tracking and withdrawal systems
- Minter analytics and engagement metrics

#### Security & Access Control
- ReentrancyGuard protection on all mint functions
- Owner-only administrative functions with proper access control
- Factory-level collection validation and tracking
- Platform fee recipient management with ownership controls

#### Developer Experience
- Comprehensive deployment scripts with network detection
- Automatic contract verification commands
- Gas optimization through upgradeable contract patterns
- Detailed logging and deployment status reporting
- Test collection creation for testnet validation

### Technical Specifications

#### Smart Contracts
- **Language**: Solidity 0.8.28
- **Framework**: Hardhat with TypeScript
- **Libraries**: OpenZeppelin Contracts v5.1.0 (standard + upgradeable)
- **Pattern**: Factory + Minimal Proxy (EIP-1167)
- **Standards**: ERC-721, ERC-2981, EIP-165

#### Network Deployments
- **Base Sepolia**: Testnet deployment for development and testing
- **Base Mainnet**: Production deployment with full OpenSea integration

#### Gas Optimization
- Minimal proxy deployments reduce gas costs from ~3M to ~300K gas per collection
- Batch operations for multiple NFT mints
- Efficient storage patterns and data structures

#### Marketplace Integration
- **OpenSea**: Full compatibility with gasless listings and royalty enforcement
- **Zora**: Protocol-compliant implementation
- **Universal**: ERC-2981 standard ensures compatibility with all compliant marketplaces

### Configuration

#### Default Settings
- **Deployment Fee**: 0.001 ETH per collection creation
- **Platform Fee**: 2.5% (250 basis points) of mint revenue
- **Default Royalty**: 10% (1000 basis points) for secondary sales
- **Max Supply**: Configurable per collection (default: 10,000 tokens)
- **Mint Price**: Configurable per collection (default: 0.001 ETH)

#### OpenSea Integration
- **Base Mainnet Proxy Registry**: `0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC`
- **Base Sepolia**: No proxy registry (testnet limitation)
- **Gasless Listings**: Enabled for all collections on supported networks

### Usage Instructions

#### For Artists (Collection Creation)
1. Call `factory.createCollection()` with collection parameters
2. Pay deployment fee (0.001 ETH)
3. Receive personal NFT collection contract address
4. Manage collection independently with full ownership

#### For Developers (Integration)
1. Deploy factory system using `npm run deploy:baseSepolia` or `npm run deploy:base`
2. Integrate factory address in frontend application
3. Use collection creation interface in `/create` page
4. Collections automatically appear on OpenSea and other marketplaces

### Files Added/Modified

#### New Contracts
- `contracts/Art3HubFactory.sol` - Factory contract for collection deployment
- `contracts/Art3HubCollection.sol` - Individual collection implementation
- `contracts/Art3Hub.sol` - Original standalone contract (deprecated)

#### Scripts
- `scripts/deploy-factory.ts` - Complete factory deployment script
- `scripts/deploy-art3hub.ts` - Individual collection deployment script

#### Configuration
- Updated `hardhat.config.ts` with Base Mainnet and Sepolia networks
- Updated `package.json` with OpenZeppelin dependencies and scripts
- Added deployment commands and contract compilation

### Breaking Changes
- Replaced standalone Art3NFT.sol with factory-based system
- Changed deployment model from individual contracts to factory pattern
- Updated initialization parameters to include factory and proxy registry addresses

### Migration Guide
- Existing Art3NFT deployments remain functional but are deprecated
- New deployments should use the factory system exclusively
- Frontend integration requires factory contract address instead of individual collections
- Collection addresses are now generated dynamically through factory calls

---

**Deployment Commands:**
```bash
# Install dependencies
npm install

# Deploy to Base Sepolia (testnet)
npm run deploy:baseSepolia

# Deploy to Base Mainnet (production)
npm run deploy:base

# Compile contracts
npm run compile

# Run tests
npm run test
```

**Contract Verification:**
```bash
# Verify implementation contract
npx hardhat verify --network [NETWORK] [IMPLEMENTATION_ADDRESS]

# Verify factory contract
npx hardhat verify --network [NETWORK] [FACTORY_ADDRESS] [CONSTRUCTOR_ARGS...]
```