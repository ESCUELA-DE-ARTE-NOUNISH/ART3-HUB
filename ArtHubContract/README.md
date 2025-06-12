# Art3 Hub Smart Contracts

## Overview

Art3 Hub is a decentralized NFT platform that empowers artists to create and manage their own NFT collections with minimal technical overhead. The platform uses a factory-based architecture that deploys gas-efficient, fully-featured NFT collections for individual artists while maintaining platform-wide standards and revenue sharing.

### Key Features

- **🏭 Factory Pattern**: Gas-efficient collection deployment using OpenZeppelin's Clones library
- **👑 Artist Ownership**: Each artist owns and controls their individual collection contract
- **💰 Revenue Sharing**: Platform takes 2.5% fee on mints, artists keep the rest
- **🎨 Full ERC-721 Compliance**: Standard NFT functionality with metadata support
- **💎 ERC-2981 Royalties**: Automatic royalty enforcement on secondary sales
- **🌊 OpenSea Integration**: Gasless listings, automatic royalty enforcement, and full marketplace compatibility
- **🔒 Security First**: ReentrancyGuard protection and comprehensive access controls
- **⚡ Multi-Network**: Supports Base, Celo, and Zora networks (mainnet and testnets)

## Architecture

### System Architecture Diagram

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

### Contract Interaction Flow

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

### Gas Optimization

The factory pattern using minimal proxies (EIP-1167) provides significant gas savings:

- **Traditional Deployment**: ~3,000,000 gas per collection
- **Minimal Proxy Deployment**: ~300,000 gas per collection
- **Gas Savings**: ~90% reduction in deployment costs

## Smart Contracts

### 1. Art3HubFactory.sol

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

### 2. Art3HubCollection.sol

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

## OpenSea Compatibility

### ✅ **Fully Compatible Features**

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

### ⚠️ **Secondary Sales Fee Limitation**

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

## Network Configuration

### Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Explorer**: https://basescan.org
- **Blockscout**: https://base.blockscout.com
- **OpenSea Proxy Registry**: `0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC`

### Base Sepolia (Testnet)
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Blockscout**: https://base-sepolia.blockscout.com
- **OpenSea Proxy Registry**: Not available (testnet limitation)

**Deployed Contracts:**
- **Factory Address**: `0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2`
- **Implementation Address**: `0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2`
- **Explorer Links**: 
  - [Factory Contract](https://sepolia.basescan.org/address/0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2#code)
  - [Implementation Contract](https://sepolia.basescan.org/address/0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2#code)
- **Blockscout Links**:
  - [Factory Contract](https://base-sepolia.blockscout.com/address/0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2)
  - [Implementation Contract](https://base-sepolia.blockscout.com/address/0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2)

### Celo Mainnet
- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Explorer**: https://celoscan.io
- **Blockscout**: https://celo.blockscout.com
- **OpenSea Proxy Registry**: Not available

### Celo Sepolia (Testnet)
- **Chain ID**: 44787
- **RPC URL**: https://alfajores-forno.celo-testnet.org
- **Explorer**: https://alfajores.celoscan.io
- **Blockscout**: https://celo-alfajores.blockscout.com
- **OpenSea Proxy Registry**: Not available

**Deployed Contracts:**
- **Factory Address**: `0x40eB8B66C9540Bde934e0502df1319E5F5BCC782`
- **Implementation Address**: `0xD81d6F1C9fdcD1d89f2Ff1a85504F5743C12E117`
- **Blockscout Links**:
  - [Factory Contract](https://celo-alfajores.blockscout.com/address/0x40eB8B66C9540Bde934e0502df1319E5F5BCC782)
  - [Implementation Contract](https://celo-alfajores.blockscout.com/address/0xD81d6F1C9fdcD1d89f2Ff1a85504F5743C12E117)

### Zora Mainnet
- **Chain ID**: 7777777
- **RPC URL**: https://rpc.zora.energy
- **Explorer**: https://explorer.zora.energy
- **Blockscout**: https://zora.blockscout.com
- **OpenSea Proxy Registry**: Not available

### Zora Sepolia (Testnet)
- **Chain ID**: 999999999
- **RPC URL**: https://sepolia.rpc.zora.energy
- **Explorer**: https://sepolia.explorer.zora.energy
- **Blockscout**: https://zora-sepolia.blockscout.com
- **OpenSea Proxy Registry**: Not available

**Deployed Contracts:**
- **Factory Address**: `0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F`
- **Implementation Address**: `0xD66D2D5F1114d6F6ee30cEbE2562806aFC23F3E6`
- **Blockscout Links**:
  - [Factory Contract](https://zora-sepolia.blockscout.com/address/0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F)
  - [Implementation Contract](https://zora-sepolia.blockscout.com/address/0xD66D2D5F1114d6F6ee30cEbE2562806aFC23F3E6)

## Deployment Guide

### Prerequisites

1. **Node.js**: Version 16 or higher
2. **npm**: Installed with Node.js
3. **Private Key**: Ethereum private key with deployment funds
4. **Basescan API Key**: For contract verification (optional but recommended)

### Environment Setup

Create a `.env` file in the project root:

```bash
# Required: Private key for deployment
PRIVATE_KEY=your_private_key_here

# Optional: For contract verification on Basescan
BASESCAN_API_KEY=your_basescan_api_key

# Optional: Custom deployment settings
DEPLOYMENT_FEE=0.001  # ETH amount to create collections
PLATFORM_FEE_PERCENTAGE=250  # Basis points (250 = 2.5%)
FACTORY_OWNER=0x...  # Address to own the factory (defaults to deployer)
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

### Deployment Commands

#### Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:baseSepolia
```

#### Deploy to Base Mainnet (Production)

```bash
npm run deploy:base
```

#### Deploy to Celo Sepolia (Testnet)

```bash
npm run deploy:celoSepolia
```

#### Deploy to Celo Mainnet (Production)

```bash
npm run deploy:celo
```

#### Deploy to Zora Sepolia (Testnet)

```bash
npm run deploy:zoraSepolia
```

#### Deploy to Zora Mainnet (Production)

```bash
npm run deploy:zora
```

Each deployment command will:
1. Deploy Art3HubCollection implementation contract
2. Deploy Art3HubFactory with the implementation address
3. Configure factory with default settings
4. Test collection creation (testnet only)
5. Provide contract verification commands

**⚠️ Production Deployment Checklist:**
- [ ] Verify sufficient ETH balance for deployment (~0.02 ETH recommended)
- [ ] Double-check all environment variables
- [ ] Test deployment on Base Sepolia first
- [ ] Have Basescan API key ready for verification

### Post-Deployment

#### Contract Verification

The deployment script will output verification commands. Run them to verify your contracts:

```bash
# Verify implementation contract
npx hardhat verify --network baseSepolia [IMPLEMENTATION_ADDRESS]

# Verify factory contract
npx hardhat verify --network baseSepolia [FACTORY_ADDRESS] "[IMPLEMENTATION_ADDRESS]" "[DEPLOYMENT_FEE]" "[PLATFORM_FEE_PERCENTAGE]" "[FEE_RECIPIENT]" "[PROXY_REGISTRY]"

# Example for current Base Sepolia deployment:
npx hardhat verify --network baseSepolia 0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2
npx hardhat verify --network baseSepolia 0x926598248D6Eaf72B7907dC40ccf37F5Bc6047E2 "0xa1A89BE5A1488d8C1C210770A2fA9EA0AfaB8Ab2" "1000000000000000" "250" "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f" "0x0000000000000000000000000000000000000000"
```

#### Factory Configuration

After deployment, you can update factory settings:

```bash
# Update platform fee (owner only)
npx hardhat run scripts/update-factory-settings.ts --network [NETWORK]
```

## Usage Examples

### For Artists (Creating Collections and NFTs)

```javascript
// 1. Connect to factory contract
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

// 2. Collection parameters
const collectionParams = {
  name: "My Art Collection",
  symbol: "MYART",
  maxSupply: 1000,
  mintPrice: ethers.parseEther("0.01"), // 0.01 ETH per NFT (for public minting)
  contractURI: "https://api.mysite.com/collection/metadata",
  baseURI: "https://api.mysite.com/tokens/",
  royaltyBps: 1000, // Default 10% royalties
  royaltyRecipient: artistAddress
};

// 3. Create collection (requires deployment fee)
const tx = await factory.createCollection(collectionParams, {
  value: ethers.parseEther("0.001") // Deployment fee
});

const receipt = await tx.wait();
// Extract collection address from events

// 4. Connect to the new collection
const collection = new ethers.Contract(COLLECTION_ADDRESS, COLLECTION_ABI, artistSigner);

// 5. Artist creates NFT with custom metadata and royalty
const mintTx = await collection.artistMint(
  "My Artwork Title",                    // title
  "A beautiful piece of digital art",    // description
  "https://ipfs.io/ipfs/QmHash...",      // tokenURI
  1500                                   // 15% royalty for this specific NFT
);

await mintTx.wait();
// NFT is now owned by the artist and ready to be listed for sale
```

### For Users (Minting NFTs)

```javascript
// Connect to specific artist collection
const collection = new ethers.Contract(COLLECTION_ADDRESS, COLLECTION_ABI, signer);

// Mint NFT (public minting)
const mintTx = await collection.mint(userAddress, tokenURI, {
  value: mintPrice // Collection's mint price
});

await mintTx.wait();
```

### For Marketplaces (Secondary Sales)

```javascript
// Connect to collection contract
const collection = new ethers.Contract(COLLECTION_ADDRESS, COLLECTION_ABI, signer);

// Process secondary sale with platform fee
const saleTx = await collection.processSecondarySale(
  tokenId,           // Token being sold
  sellerAddress,     // Current owner
  buyerAddress,      // New owner
  salePrice,         // Sale price in wei
  { value: salePrice }
);

await saleTx.wait();
// 1% platform fee automatically sent to factory
// Artist royalty handled by ERC-2981 standard
```

### OpenSea Compatibility Note

**✅ Full OpenSea Integration:**
- Gasless listings via OpenSea proxy registry
- Automatic royalty enforcement (ERC-2981)
- Collection-level metadata support
- Standard ERC-721 compatibility

**⚠️ Secondary Sales Fee Limitation:**
The 1% platform fee on secondary sales requires the `processSecondarySale()` function and will **NOT** be automatically collected on OpenSea or other standard marketplaces that use direct ERC-721 transfers.

**Fee Collection Options:**
1. **OpenSea/Standard Marketplaces**: Only artist royalties are enforced
2. **Custom Art3 Hub Marketplace**: Full fee collection (1% platform + artist royalty)
3. **Hybrid Strategy**: Artist royalties everywhere + platform fees on custom marketplace

## Platform Economics

### Fee Structure

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

### Revenue Flow Example

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

## Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run tests with gas reporting
REPORT_GAS=true npm run test

# Run specific test file
npx hardhat test test/Art3NFT.test.ts
```

### Test Coverage

The test suite covers:
- Factory deployment and configuration
- Collection creation and initialization
- Minting functionality (public and owner)
- Fee collection and distribution
- Access control and security
- Metadata management
- Royalty enforcement

## Security Considerations

### Access Control

- **Factory Owner**: Can update fees and withdraw platform revenue
- **Collection Owner**: Can mint for free, update metadata, withdraw revenue
- **Platform Security**: ReentrancyGuard on all financial functions

### Best Practices

1. **Private Key Security**: Never commit private keys to version control
2. **Deployment Testing**: Always test on testnet before mainnet
3. **Contract Verification**: Verify all contracts for transparency
4. **Fee Monitoring**: Monitor platform fees for unexpected changes
5. **Metadata Backup**: Keep backups of all collection metadata

## Troubleshooting

### Common Issues

#### Deployment Failures

**Issue**: "Insufficient funds for gas"
- **Solution**: Ensure deployer has enough ETH (0.02+ recommended)

**Issue**: "Private key not found"
- **Solution**: Check `.env` file and `PRIVATE_KEY` variable

**Issue**: "Network connection failed"
- **Solution**: Verify RPC URL and network connectivity

#### Collection Creation Failures

**Issue**: "Deployment fee too low"
- **Solution**: Check current deployment fee with `factory.deploymentFee()`

**Issue**: "Invalid collection parameters"
- **Solution**: Verify all required parameters are provided and valid

#### Verification Failures

**Issue**: "Contract source code already verified"
- **Solution**: Contract is already verified, no action needed

**Issue**: "Invalid constructor arguments"
- **Solution**: Double-check constructor arguments match deployment

### Getting Help

- **Documentation**: Check this README and CHANGELOG.md
- **Issues**: Create issue in project repository
- **Discord**: Join Art3 Hub Discord community
- **Email**: Contact developers at [email]

## Development

### Project Structure

```
ArtHubContract/
├── contracts/           # Solidity smart contracts
│   ├── Art3HubFactory.sol      # Main factory contract
│   └── Art3HubCollection.sol   # Collection implementation
├── scripts/            # Deployment and utility scripts
│   ├── deploy-factory.ts       # Main deployment script
│   └── deploy-art3hub.ts       # Individual collection deployment
├── test/              # Test files
│   └── Art3NFT.test.ts         # Contract tests
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

### Adding New Features

1. **Modify Contracts**: Update Solidity contracts
2. **Add Tests**: Write comprehensive tests
3. **Update Scripts**: Modify deployment scripts if needed
4. **Test Deployment**: Deploy to testnet
5. **Documentation**: Update README and CHANGELOG

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Ensure CI passes

## Roadmap

### Version 1.1 (Planned)

- [ ] Multi-chain deployment support
- [ ] Advanced royalty splitting
- [ ] Collection collaboration features
- [ ] Enhanced metadata standards
- [ ] Batch operations optimization

### Version 1.2 (Future)

- [ ] DAO governance integration
- [ ] Advanced marketplace features
- [ ] Cross-chain NFT bridging
- [ ] Enhanced analytics dashboard
- [ ] Mobile SDK support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Website**: https://art3hub.com
- **Discord**: [Art3 Hub Discord](https://discord.gg/art3hub)
- **Twitter**: [@Art3Hub](https://twitter.com/art3hub)
- **Email**: developers@art3hub.com

---

**Built with ❤️ by the Art3 Hub team**