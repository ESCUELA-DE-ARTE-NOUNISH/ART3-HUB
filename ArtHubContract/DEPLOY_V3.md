# Art3Hub V3 Multi-Chain Deployment Guide

## 🌐 Supported Networks

Art3Hub V3 contracts work on all major networks:

### **Mainnets:**
- **Base** (Chain ID: 8453)
- **Zora** (Chain ID: 7777777) 
- **Celo** (Chain ID: 42220)

### **Testnets:**
- **Base Sepolia** (Chain ID: 84532)
- **Zora Sepolia** (Chain ID: 999999999)
- **Celo Alfajores** (Chain ID: 44787)

## 🚀 Deployment Commands

### Base Sepolia (Recommended for testing)
```bash
npx hardhat run scripts/deploy-art3hub-v3.ts --network baseSepolia
```

### Base Mainnet
```bash
npx hardhat run scripts/deploy-art3hub-v3.ts --network base
```

### Zora Sepolia
```bash
npx hardhat run scripts/deploy-art3hub-v3.ts --network zoraSepolia
```

### Zora Mainnet
```bash
npx hardhat run scripts/deploy-art3hub-v3.ts --network zora
```

### Celo Alfajores
```bash
npx hardhat run scripts/deploy-art3hub-v3.ts --network celoSepolia
```

### Celo Mainnet
```bash
npx hardhat run scripts/deploy-art3hub-v3.ts --network celo
```

## 💰 USDC Addresses (Auto-configured)

The deployment script automatically uses the correct USDC address for each network:

| Network | USDC Address |
|---------|--------------|
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Zora Sepolia | `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4` |
| Zora Mainnet | `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4` |
| Celo Alfajores | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |
| Celo Mainnet | `0xef4229c8c3250C675F21BCefa42f58EfbfF6002a` |

## 🔧 Configuration

### Required Environment Variables
```bash
# Add your deployer private key
PRIVATE_KEY=your_private_key_here

# Update these addresses in the deployment script:
TREASURY_WALLET=0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9
GASLESS_RELAYER_WALLET=0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1
```

### After Deployment
The script will output environment variables to add to your `.env`:

```bash
# Base Sepolia example
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532=0x...
NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532=0x...
NEXT_PUBLIC_ART3HUB_COLLECTION_V3_IMPL_84532=0x...
```

## 🎯 Features Across All Networks

### ✅ **Gasless Transactions**
- Users sign EIP-712 messages (pays $0)
- Relayer submits transactions (relayer pays gas)
- Works on all supported networks

### ✅ **Auto-Enrollment**
- New users automatically get Free Plan
- No manual subscription required
- 1 NFT per year included

### ✅ **Subscription Plans**
- **Free Plan**: 1 NFT/year, gasless
- **Master Plan**: $4.99 USDC/month, 10 NFTs/month, gasless

### ✅ **OpenSea Compatibility**
- Full ERC721 compliance
- Built-in royalty support (EIP-2981)
- Proxy registry integration
- Contract-level metadata

### ✅ **Payment Collection**
- Master Plan payments automatically go to treasury wallet
- USDC payments on each network
- Auto-renewal support

## 🔍 Contract Verification

After deployment, verify contracts on block explorers:

### Base
```bash
npx hardhat verify --network base SUBSCRIPTION_ADDRESS "USDC_ADDRESS" "TREASURY_ADDRESS" "RELAYER_ADDRESS" "OWNER_ADDRESS"
npx hardhat verify --network base FACTORY_ADDRESS "SUBSCRIPTION_ADDRESS" "RELAYER_ADDRESS" "OWNER_ADDRESS"
```

### Zora
```bash
npx hardhat verify --network zora SUBSCRIPTION_ADDRESS "USDC_ADDRESS" "TREASURY_ADDRESS" "RELAYER_ADDRESS" "OWNER_ADDRESS"
npx hardhat verify --network zora FACTORY_ADDRESS "SUBSCRIPTION_ADDRESS" "RELAYER_ADDRESS" "OWNER_ADDRESS"
```

### Celo
```bash
npx hardhat verify --network celo SUBSCRIPTION_ADDRESS "USDC_ADDRESS" "TREASURY_ADDRESS" "RELAYER_ADDRESS" "OWNER_ADDRESS"
npx hardhat verify --network celo FACTORY_ADDRESS "SUBSCRIPTION_ADDRESS" "RELAYER_ADDRESS" "OWNER_ADDRESS"
```

## 💡 Best Practices

### 1. **Start with Testnets**
- Deploy to Base Sepolia first
- Test complete functionality
- Then deploy to mainnets

### 2. **Fund Relayer Wallets**
- Each network needs funded relayer wallet
- Minimum 0.1 ETH recommended per network
- Monitor balances regularly

### 3. **Treasury Management**
- Use multi-sig for treasury wallet on mainnets
- Monitor USDC payments across networks
- Set up proper accounting

### 4. **Gas Optimization**
- Contracts are optimized for minimal gas usage
- Gasless transactions reduce user friction
- Batch operations when possible

## 🚨 Security Considerations

### 1. **Private Key Management**
- Use hardware wallets for mainnet deployments
- Keep relayer private keys secure
- Rotate keys periodically

### 2. **Contract Ownership**
- Transfer ownership to multi-sig after deployment
- Implement timelocks for critical functions
- Regular security audits

### 3. **Network-Specific Risks**
- Monitor each network for issues
- Have emergency pause mechanisms
- Plan for cross-chain consistency

## 📈 Monitoring & Analytics

### Track Across All Networks:
- Subscription conversions (Free → Master)
- Gasless transaction success rates
- Revenue per network
- User engagement by chain
- NFT creation patterns

### Recommended Tools:
- Dune Analytics for on-chain data
- OpenSea API for marketplace data
- Custom dashboards for business metrics

## 🎉 Success Metrics

After deployment, you should see:
- ✅ 0% failed gasless transactions
- ✅ Automatic Free Plan enrollment
- ✅ OpenSea collection visibility
- ✅ USDC payments flowing to treasury
- ✅ Cross-chain user adoption