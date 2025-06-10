# Changelog

All notable changes to the Art3 Hub smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- OpenSea proxy registry integration for gasless NFT listings
- `contractURI()` implementation for collection-level metadata
- Metadata freezing capabilities (`freezeTokenURI`, `freezeAllMetadata`)
- OpenSea-specific events (`PermanentURI`, `PermanentURIGlobal`)
- Project proxy support for enhanced marketplace integrations
- Proper interface declarations for marketplace recognition

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