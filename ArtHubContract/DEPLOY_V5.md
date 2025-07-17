# Art3Hub V5 Deployment Guide

## Overview

Art3Hub V5 represents a major architectural shift towards **Base-only deployment** with enhanced **on-chain data storage** and **database minimization**. This version eliminates dependencies on traditional databases by storing all critical data directly on the blockchain.

## 🎯 V5 Key Features

### 🔵 Base-Only Architecture
- **Single Network Focus**: Deployed exclusively on Base (mainnet) and Base Sepolia (testnet)
- **Optimized Performance**: Reduced complexity and improved reliability
- **Cost Efficiency**: Leverage Base's low gas costs for enhanced features

### 📊 Enhanced On-Chain Data Storage
- **Creator Profiles**: Complete user profiles stored on-chain (name, username, email, social links, verification status)
- **NFT Extended Metadata**: Categories, tags, IPFS hashes, royalties, visibility settings
- **Social Features**: Likes, ratings, views, and engagement metrics stored on-chain
- **Search & Discovery**: Advanced filtering by category, tags, creator, and social metrics

### 🔍 Database Minimization
- **Contract-Based Data Reading**: Frontend reads directly from smart contracts
- **Reduced API Dependencies**: Eliminates need for traditional database queries
- **Real-Time Data**: Always current data directly from blockchain
- **Improved Reliability**: No database downtime or synchronization issues

## 🏗️ V5 Smart Contract Architecture

### 1. Art3HubSubscriptionV4 (Reused)
- **Purpose**: Manages subscription plans and user quotas
- **Plans**: FREE (1 NFT/month), MASTER (10 NFTs/month), ELITE (25 NFTs/month)
- **Features**: Gasless upgrades, auto-enrollment, USDC payments

### 2. Art3HubCollectionV5 (New)
- **Purpose**: Enhanced NFT collection with comprehensive on-chain data
- **Features**:
  - Creator profile management
  - NFT extended metadata (categories, tags, IPFS hashes)
  - Social interaction tracking (likes, ratings, views)
  - Advanced search and filtering capabilities
  - Featured NFT management

### 3. Art3HubFactoryV5 (New)
- **Purpose**: Factory for creating V5 collections with enhanced voucher system
- **Features**:
  - Gasless collection creation and minting
  - Enhanced voucher structures with creator profile data
  - Platform-wide discovery and analytics
  - Category and tag management
  - Search functionality across all collections

## 📋 Prerequisites

### Required Tools
- Node.js (v18+)
- Hardhat
- Base network access
- USDC for subscription payments

### Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure `.env` file with required variables

### Required Environment Variables
```bash
# Private key for deployment (⚠️ Use a dedicated deployment wallet)
PRIVATE_KEY=your_deployment_private_key_here

# API keys for contract verification
BASESCAN_API_KEY=your_basescan_api_key

# Network configuration
NEXT_PUBLIC_IS_TESTING_MODE=true  # Set to false for mainnet

# Treasury configuration
TREASURY_WALLET=0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9
```

## 🚀 Deployment Process

### Step 1: Compile Contracts
```bash
cd /path/to/ArtHubContract
npm run compile
```

### Step 2: Deploy to Base Sepolia (Testnet)
```bash
npm run deploy:v5:baseSepolia
```

### Step 3: Deploy to Base Mainnet (Production)
```bash
npm run deploy:v5:base
```

### Expected Output
The deployment script will:
1. Deploy Art3HubSubscriptionV4
2. Deploy Art3HubCollectionV5 implementation
3. Deploy Art3HubFactoryV5
4. Verify contract integration
5. Generate deployment summary
6. Output environment variables

## 📝 Post-Deployment Configuration

### 1. Update Frontend Environment Variables
Add the deployed contract addresses to your frontend `.env` file:

```bash
# Art3Hub V5 Contract Addresses (Base Sepolia - Chain ID: 84532)
NEXT_PUBLIC_ART3HUB_FACTORY_V5_84532=0x...
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_84532=0x...
NEXT_PUBLIC_ART3HUB_COLLECTION_V5_IMPL_84532=0x...

# Art3Hub V5 Contract Addresses (Base Mainnet - Chain ID: 8453)
NEXT_PUBLIC_ART3HUB_FACTORY_V5_8453=0x...
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_8453=0x...
NEXT_PUBLIC_ART3HUB_COLLECTION_V5_IMPL_8453=0x...
```

### 2. Update Art3HubV5Service
The service will automatically detect the deployed addresses based on the environment variables.

### 3. Configure Frontend Components
Update frontend components to use the new V5 service for data reading instead of database APIs.

## 🔧 Contract Verification

### Automatic Verification
The deployment script includes automatic verification steps. If manual verification is needed:

```bash
# Verify Art3HubSubscriptionV4
npx hardhat verify --network baseSepolia <SUBSCRIPTION_ADDRESS> "<TREASURY_WALLET>" "<USDC_ADDRESS>" "<DEPLOYER_ADDRESS>"

# Verify Art3HubCollectionV5 Implementation
npx hardhat verify --network baseSepolia <COLLECTION_IMPL_ADDRESS>

# Verify Art3HubFactoryV5
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS> "<SUBSCRIPTION_ADDRESS>" "<GASLESS_RELAYER>" "<DEPLOYER_ADDRESS>"
```

## 🎨 V5 Enhanced Features

### Creator Profiles
```solidity
struct CreatorProfile {
    string name;
    string username; 
    string email;
    string profilePicture; // IPFS hash
    string bannerImage; // IPFS hash
    string socialLinks; // JSON string
    bool isVerified;
    uint256 profileCompleteness; // Percentage 0-100
    uint256 createdAt;
    uint256 updatedAt;
}
```

### NFT Extended Data
```solidity
struct NFTExtendedData {
    string category; // "Digital Art", "Photography", etc.
    string[] tags; // Multiple tags for discoverability
    string ipfsImageHash; // Direct IPFS hash for image
    string ipfsMetadataHash; // Direct IPFS hash for metadata
    uint256 createdTimestamp;
    uint256 royaltyBPS; // Basis points for this specific NFT
    bool isVisible; // Privacy control
    bool isFeatured; // Artist can feature specific NFTs
    string additionalMetadata; // JSON string for extensibility
}
```

### Social Features
```solidity
struct CollectionStats {
    uint256 totalViews;
    uint256 totalLikes;
    uint256 totalShares;
    uint256 averageRating; // Out of 5 stars * 100 (for decimals)
    uint256 ratingCount;
    uint256 lastUpdated;
}
```

## 🔍 V5 Search & Discovery

### Advanced Filtering
- **By Category**: Filter NFTs and collections by art categories
- **By Tags**: Discover content through multiple tag associations
- **By Creator**: Find all content from specific creators
- **By Social Metrics**: Sort by popularity, ratings, and engagement
- **By Visibility**: Public vs featured content

### Platform Analytics
- Total collections and NFTs
- Category distribution
- Creator statistics
- Network-specific metrics

## 🔄 Migration from V4

### Frontend Migration
1. **Service Layer**: Replace V4 service calls with V5 service calls
2. **Data Reading**: Update components to read from contracts instead of database
3. **Profile Management**: Implement on-chain profile creation and updates
4. **Search Features**: Leverage new contract-based search capabilities

### Backward Compatibility
- V4 contracts remain functional
- Gradual migration path available
- Existing V4 collections continue to work

## 🎯 V5 Benefits

### For Users
- **Real-Time Data**: Always current information from blockchain
- **Enhanced Profiles**: Comprehensive on-chain creator profiles
- **Better Discovery**: Advanced search and filtering capabilities
- **Social Features**: Engage with NFTs through likes, ratings, and views

### For Developers
- **Simplified Architecture**: Reduced database dependencies
- **Improved Reliability**: No database synchronization issues
- **Enhanced APIs**: Rich contract-based data reading
- **Base Optimization**: Leverage Base's speed and low costs

### For the Platform
- **Cost Reduction**: Minimized database and server requirements
- **Scalability**: Blockchain-native data storage
- **Decentralization**: Reduced reliance on centralized infrastructure
- **Data Integrity**: Immutable, verifiable data on-chain

## 🔒 Security Considerations

### Smart Contract Security
- OpenZeppelin contracts for proven security patterns
- Comprehensive access controls
- Reentrancy protection
- Input validation

### Data Privacy
- Optional email storage with user consent
- Profile visibility controls
- NFT privacy settings

### Deployment Security
- Use dedicated deployment wallet
- Verify all contract addresses
- Test thoroughly on testnet first
- Monitor contracts post-deployment

## 📊 Gas Optimization

### V5 Optimizations
- Efficient data structures
- Batch operations for bulk actions
- Optimized search algorithms
- Minimal redundant storage

### Cost Estimates (Base Network)
- Collection Creation: ~0.005 ETH
- NFT Minting: ~0.002 ETH
- Profile Updates: ~0.001 ETH
- Social Interactions: ~0.0005 ETH

## 🚨 Deployment Checklist

### Pre-Deployment
- [ ] Smart contracts compiled successfully
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Deployment wallet funded
- [ ] Network configuration verified

### During Deployment
- [ ] Monitor gas prices
- [ ] Verify each contract deployment
- [ ] Check contract integration
- [ ] Validate configuration

### Post-Deployment
- [ ] Update environment variables
- [ ] Verify contracts on block explorer
- [ ] Test basic functionality
- [ ] Update documentation
- [ ] Monitor contract performance

## 📞 Support & Resources

### Documentation
- [V5 Architecture Overview](./README.md)
- [Smart Contract Reference](./contracts/)
- [Frontend Integration Guide](../ArtHubApp/docs/)

### Network Resources
- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Base Mainnet Explorer**: https://basescan.org/
- **Base Documentation**: https://docs.base.org/

### Community
- Report issues via GitHub
- Join Discord for support
- Follow updates on Twitter

---

**⚠️ Important**: Always deploy to testnet first and thoroughly test all functionality before deploying to mainnet. Keep your private keys secure and never commit them to version control.