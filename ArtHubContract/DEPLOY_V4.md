# Art3Hub V4 Multi-Chain Deployment Guide

## 🌟 What's New in V4

Art3Hub V4 introduces the Elite Creator plan and fixes the Free plan duration:

### **New Plan Structure:**
- **FREE Plan**: 1 NFT per **month** (fixed from yearly)
- **MASTER Plan**: $4.99 USDC/month, 10 NFTs/month (unchanged)
- **ELITE Creator Plan**: $9.99 USDC/month, 25 NFTs/month (NEW!)

### **Key Improvements:**
- ✨ **Elite Creator Plan** for high-volume artists
- 🔧 **Fixed Free Plan** now correctly provides 1 NFT per month
- 📈 **Plan Upgrade/Downgrade** functionality
- 🎯 **Enhanced Factory** with better subscription info
- 🔍 **Improved Events** for better tracking

## 🌐 Supported Networks

Art3Hub V4 works on all major networks:

### **Mainnets:**
- **Base** (Chain ID: 8453)
- **Zora** (Chain ID: 7777777) 
- **Celo** (Chain ID: 42220)

### **Testnets:**
- **Base Sepolia** (Chain ID: 84532)
- **Zora Sepolia** (Chain ID: 999999999)
- **Celo Alfajores** (Chain ID: 44787)

## 🚀 V4 Deployment Commands

### Base Sepolia (Recommended for testing)
```bash
npm run deploy:v4:baseSepolia
```

### Base Mainnet
```bash
npm run deploy:v4:base
```

### Zora Sepolia
```bash
npm run deploy:v4:zoraSepolia
```

### Zora Mainnet
```bash
npm run deploy:v4:zora
```

### Celo Alfajores
```bash
npm run deploy:v4:celoSepolia
```

### Celo Mainnet
```bash
npm run deploy:v4:celo
```

## 💰 USDC Addresses (Auto-configured)

The V4 deployment script automatically uses the correct USDC address for each network:

| Network | USDC Address |
|---------|--------------|
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Zora Sepolia | `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4` |
| Zora Mainnet | `0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4` |
| Celo Alfajores | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |
| Celo Mainnet | `0xef4229c8c3250C675F21BCefa42f58EfbfF6002a` |

## 🔧 V4 Configuration

### Required Environment Variables
```bash
# Add your deployer private key
PRIVATE_KEY=your_private_key_here

# These addresses are configured in the deployment script:
TREASURY_WALLET=0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9
GASLESS_RELAYER_WALLET=0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1
```

### After V4 Deployment
The script will output environment variables to add to your `.env`:

```bash
# Base Sepolia example
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_84532=0x...
NEXT_PUBLIC_ART3HUB_FACTORY_V4_84532=0x...
NEXT_PUBLIC_ART3HUB_COLLECTION_V4_IMPL_84532=0x...
```

## 🧪 Testing V4 Contracts

### Run Comprehensive Tests
```bash
npm run test:v4
```

### Test on Live Networks
```bash
# Base Sepolia
npm run test:v4:base

# Zora Sepolia  
npm run test:v4:zora

# Celo Alfajores
npm run test:v4:celo
```

## 🎯 V4 Features Across All Networks

### ✅ **Three Subscription Plans**
- **Free Plan**: 1 NFT/month, gasless minting
- **Master Plan**: $4.99 USDC/month, 10 NFTs/month, gasless minting
- **Elite Creator Plan**: $9.99 USDC/month, 25 NFTs/month, gasless minting

### ✅ **Enhanced Functionality**
- Plan upgrade/downgrade system
- Better subscription tracking
- Improved factory view functions
- Enhanced event emissions

### ✅ **Gasless Transactions**
- Users sign EIP-712 messages (pays $0)
- Relayer submits transactions (relayer pays gas)
- Works on all supported networks
- Available for all subscription plans

### ✅ **Auto-Enrollment**
- New users automatically get Free Plan
- No manual subscription required
- 1 NFT per month included

### ✅ **OpenSea Compatibility**
- Full ERC721 compliance
- Built-in royalty support (EIP-2981)
- Proxy registry integration
- Contract-level metadata

### ✅ **Payment Collection**
- Master Plan payments automatically go to treasury wallet
- Elite Plan payments automatically go to treasury wallet
- USDC payments on each network
- Auto-renewal support

## 🔍 V4 Contract Verification

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

## 🆚 V3 vs V4 Comparison

| Feature | V3 | V4 |
|---------|----|----|
| FREE Plan | 1 NFT/year ❌ | 1 NFT/month ✅ |
| MASTER Plan | $4.99/month, 10 NFTs | $4.99/month, 10 NFTs |
| ELITE Plan | ❌ Not available | ✅ $9.99/month, 25 NFTs |
| Plan Changes | ❌ Limited | ✅ Upgrade/Downgrade |
| Factory Info | ❌ Basic | ✅ Enhanced subscription info |
| Events | ❌ Basic | ✅ Improved tracking |

## 📱 Frontend Integration Changes

### V4 Contract Addresses
Update your frontend to use V4 contract addresses:
```typescript
// Replace V3 addresses with V4
const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_{CHAIN_ID}
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_{CHAIN_ID}
```

### New Subscription Functions
```typescript
// V4 adds Elite plan support
await subscriptionContract.subscribeToElitePlan(autoRenew);
await subscriptionContract.subscribeToElitePlanGasless(user, autoRenew);

// V4 adds plan management
await subscriptionContract.downgradeSubscription(newPlan);

// V4 adds enhanced info
const planName = await subscriptionContract.getPlanName(planType);
const [planName, minted, limit, active] = await factoryContract.getUserSubscriptionInfo(user);
```

## 💡 Best Practices for V4

### 1. **Migration Strategy**
- Deploy V4 alongside V3 (don't replace immediately)
- Test V4 thoroughly on testnets
- Gradually migrate users from V3 to V4
- Maintain V3 for existing users during transition

### 2. **Elite Plan Positioning**
- Market Elite plan to high-volume creators
- Offer migration incentives from Master to Elite
- Highlight 25 NFTs/month capacity
- Target professional artists and studios

### 3. **Free Plan Communication**
- Clearly communicate the improvement (monthly vs yearly)
- Highlight increased value proposition
- Use for user acquisition and onboarding
- Position as stepping stone to paid plans

### 4. **Plan Management**
- Implement plan comparison UI
- Provide clear upgrade/downgrade flows
- Show usage analytics to encourage upgrades
- Offer plan recommendations based on usage

## 🚨 V4 Security Considerations

### 1. **Contract Upgrades**
- V4 contracts are separate from V3 (not upgrades)
- No migration of existing data
- Users must re-subscribe to V4 plans
- Treasury and relayer addresses remain the same

### 2. **Plan Validation**
- Enhanced plan validation in V4
- Better quota enforcement
- Improved subscription tracking
- Stronger access controls

### 3. **Network Consistency**
- Same security model across all networks
- Consistent plan pricing in USDC
- Uniform gasless functionality
- Cross-chain treasury management

## 📈 V4 Monitoring & Analytics

### Track Across All Networks:
- Elite plan adoption rates
- Free to paid conversion improvements
- Monthly active users per plan
- Revenue per plan type
- Cross-network user behavior
- Plan upgrade/downgrade patterns

### New V4 Metrics:
- Elite plan utilization (NFTs minted vs limit)
- Free plan engagement (monthly vs previous yearly)
- Plan change frequency
- Revenue impact of new pricing

## 🎉 V4 Success Metrics

After deployment, you should see:
- ✅ Increased Free plan engagement (monthly vs yearly)
- ✅ Higher revenue from Elite Creator plans
- ✅ Better plan utilization tracking
- ✅ Improved user experience with plan management
- ✅ Enhanced analytics and monitoring capabilities

## 📝 V4 Next Steps

1. **Deploy V4 to testnets first**
2. **Run comprehensive testing with npm run test:v4**
3. **Update frontend to support V4 contracts**
4. **Implement plan comparison and upgrade flows**
5. **Deploy to mainnets**
6. **Monitor adoption and performance**
7. **Plan user migration strategy from V3**

## 🔗 V4 Resources

- **Contracts**: `contracts/Art3Hub*V4.sol`
- **Deployment**: `scripts/deploy-art3hub-v4.ts`
- **Testing**: `scripts/test-art3hub-v4.ts`
- **Tests**: `test/Art3HubV4.test.ts`

---

**Art3Hub V4 is ready for production deployment with Elite Creator plans and improved Free plan experience!** 🚀