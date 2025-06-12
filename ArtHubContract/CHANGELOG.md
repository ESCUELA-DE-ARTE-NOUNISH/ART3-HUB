# Changelog

All notable changes to the Art3 Hub smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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