# Art3Hub V2 Smart Contracts

## Overview

Art3Hub V2 introduces a comprehensive subscription-based NFT platform with gasless minting capabilities. The system enables artists to create and mint NFTs based on their subscription tier while providing a seamless user experience.

## Subscription Plans

### Plan Gratuito (Free Plan)
- ✅ 1 NFT gasless mint
- ✅ Access to basic educational content
- ✅ Guided Web3 onboarding
- ✅ Limited AI agent access

### Plan Master ($4.99/month)
- ✅ Up to 10 NFTs per month
- ✅ Exclusive virtual workshops
- ✅ Enhanced gallery visibility
- ✅ Reputation system and rewards
- ✅ Full AI agent access with personalized recommendations

## Contract Architecture

### 1. SubscriptionManager.sol
**Purpose**: Manages artist subscriptions and minting limits

**Key Features**:
- Free and paid subscription management
- NFT minting quota tracking
- USDC payment processing
- Gasless capability verification

**Main Functions**:
```solidity
function subscribeToFreePlan() external
function subscribeToMasterPlan(address paymentToken) external
function canMintNFT(address user) external view returns (bool, uint256)
function recordNFTMint(address user, uint256 amount) external
```

### 2. Art3HubCollectionV2.sol
**Purpose**: Enhanced ERC721 NFT collection with subscription integration

**Key Features**:
- Subscription-based minting validation
- Gasless minting with meta-transactions (EIP-712)
- ERC-2981 royalty standard
- OpenSea compatibility
- Artist-controlled collection management

**Main Functions**:
```solidity
function mint(address to, string memory tokenURI) external
function gaslessMint(MintVoucher calldata voucher, bytes calldata signature) external
function artistMint(address to, string memory tokenURI) external
function batchArtistMint(address[] calldata recipients, string[] calldata tokenURIs) external
```

### 3. Art3HubFactoryV2.sol
**Purpose**: Factory for deploying NFT collections with subscription checks

**Key Features**:
- Minimal proxy pattern for gas efficiency
- Subscription validation before deployment
- Gasless collection deployment
- Collection tracking and pagination

**Main Functions**:
```solidity
function createCollection(...) external returns (address)
function gaslessCreateCollection(CollectionVoucher calldata voucher, bytes calldata signature) external returns (address)
function getArtistCollections(address artist) external view returns (address[] memory)
```

### 4. GaslessRelayer.sol
**Purpose**: Meta-transaction relayer for gasless operations

**Key Features**:
- EIP-712 signature verification
- Authorized relayer system
- Batch transaction support
- Gas limit controls

**Main Functions**:
```solidity
function relay(RelayRequest calldata request, bytes calldata signature) external
function batchRelay(RelayRequest[] calldata requests, bytes[] calldata signatures) external
```

## Deployment Guide

### Prerequisites
1. Install dependencies: `npm install`
2. Set up environment variables:
   ```bash
   PRIVATE_KEY=your_private_key
   BASESCAN_API_KEY=your_basescan_api_key
   CELOSCAN_API_KEY=your_celoscan_api_key
   ZORA_API_KEY=your_zora_api_key
   ```

### Deploy V2 Contracts
```bash
# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deploy-v2-contracts.ts --network baseSepolia

# Deploy to Base Mainnet
npx hardhat run scripts/deploy-v2-contracts.ts --network base

# Deploy to Zora Sepolia
npx hardhat run scripts/deploy-v2-contracts.ts --network zoraSepolia

# Deploy to Zora Mainnet
npx hardhat run scripts/deploy-v2-contracts.ts --network zora
```

### Verify Contracts
The deployment script will output verification commands. Example:
```bash
npx hardhat verify --network baseSepolia 0x... "constructor_args"
```

## Testing

Run the comprehensive test suite:
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/Art3HubV2.test.ts

# Run tests with coverage
npx hardhat coverage
```

## Integration with Frontend

### Environment Variables
After deployment, add these to your `.env`:
```bash
# Subscription Manager
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_84532=0x...
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_8453=0x...

# Factory V2
NEXT_PUBLIC_ART3HUB_FACTORY_V2_84532=0x...
NEXT_PUBLIC_ART3HUB_FACTORY_V2_8453=0x...

# Collection Implementation
NEXT_PUBLIC_ART3HUB_COLLECTION_V2_IMPL_84532=0x...
NEXT_PUBLIC_ART3HUB_COLLECTION_V2_IMPL_8453=0x...

# Gasless Relayer
NEXT_PUBLIC_GASLESS_RELAYER_84532=0x...
NEXT_PUBLIC_GASLESS_RELAYER_8453=0x...

# USDC Addresses
NEXT_PUBLIC_USDC_84532=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_8453=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Frontend Integration Examples

#### Check Subscription Status
```typescript
import { SubscriptionManager__factory } from './typechain-types'

const subscriptionManager = SubscriptionManager__factory.connect(
  process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER!,
  provider
)

const [plan, expiresAt, nftsMinted, nftLimit, isActive] = 
  await subscriptionManager.getSubscription(userAddress)
```

#### Create Collection
```typescript
import { Art3HubFactoryV2__factory } from './typechain-types'

const factory = Art3HubFactoryV2__factory.connect(
  process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V2!,
  signer
)

const tx = await factory.createCollection(
  "My Collection",
  "MC",
  "Description",
  "https://image-url.com",
  "https://external-url.com",
  artistAddress,
  500 // 5% royalty
)
```

#### Mint NFT
```typescript
import { Art3HubCollectionV2__factory } from './typechain-types'

const collection = Art3HubCollectionV2__factory.connect(
  collectionAddress,
  signer
)

const tx = await collection.mint(userAddress, tokenURI)
```

#### Gasless Minting
```typescript
// Create signed voucher for gasless minting
const voucher = {
  to: userAddress,
  tokenURI: "https://metadata-url.com",
  nonce: await collection.nonces(userAddress),
  deadline: Math.floor(Date.now() / 1000) + 3600
}

// Sign with artist's private key
const signature = await artistSigner.signTypedData(domain, types, voucher)

// Execute gasless mint through relayer
const tx = await collection.gaslessMint(voucher, signature)
```

## Security Considerations

### Access Controls
- **SubscriptionManager**: Only authorized callers (factory) can record mints
- **Factory**: Only subscription holders can create collections
- **Collections**: Artists control their collections independently
- **Relayer**: Only authorized relayers can execute transactions

### Signature Verification
- EIP-712 typed data signatures for gasless operations
- Nonce-based replay protection
- Deadline-based expiration
- Domain separation for security

### Fee Limits
- Royalties capped at 50% (5000 basis points)
- Platform fees capped at 10% (1000 basis points)
- Gas limits on relayer transactions

## OpenSea Compatibility

### Collection Metadata
Collections automatically provide `contractURI()` with OpenSea-compatible metadata:
- Collection name, description, image
- Royalty information
- External links

### Gasless Listings
- Integrated with OpenSea proxy registry
- Users can list NFTs without gas fees
- Automatic approval for OpenSea proxy contracts

### Royalty Enforcement
- ERC-2981 standard implementation
- Both collection-level and token-specific royalties
- Marketplace compatibility for automatic royalty distribution

## Gas Optimization

### Minimal Proxy Pattern
- 90% gas savings on collection deployment
- Single implementation shared across all collections
- Immutable implementation prevents upgrade attacks

### Batch Operations
- Batch minting for artists
- Batch relaying for gasless operations
- Efficient storage patterns

### Storage Optimization
- Packed structs for related data
- Efficient mappings and arrays
- View functions for off-chain aggregation

## Migration from V1

The V2 contracts are completely independent from V1 and don't require migration. V1 contracts remain functional and can coexist with V2.

### Key Differences
- **V1**: Pay-per-deployment model
- **V2**: Subscription-based model with quotas
- **V1**: Gas required for all operations
- **V2**: Gasless minting and deployment options
- **V1**: Basic NFT functionality
- **V2**: Enhanced features and AI integration support

## Support and Maintenance

### Upgradeability
- Collections are not upgradeable once deployed (immutable)
- Factory and SubscriptionManager can be replaced if needed
- Clear migration paths for future versions

### Monitoring
- Comprehensive event logging for all operations
- Subscription tracking and analytics
- Error handling and recovery mechanisms

### Emergency Procedures
- Owner-controlled emergency functions
- Fund recovery mechanisms
- Circuit breakers for security incidents