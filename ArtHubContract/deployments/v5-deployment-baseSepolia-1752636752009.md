
# Art3Hub V5 Deployment Summary

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployment Date**: 2025-07-16T03:32:18.923Z
- **Deployer**: 0x499D377eF114cC1BF7798cECBB38412701400daF
- **Final Owner**: <ADMIN_WALLET_ADDRESS>

## Contract Addresses

### Art3HubSubscriptionV4
- **Address**: `0x78d2B5377c77A38E4A3Eb193aa417F865be62FC4`
- **Constructor Args**: `["0x036CbD53842c5426634e7929541eC2318f3dCF7e","0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9","0x499D377eF114cC1BF7798cECBB38412701400daF","0x499D377eF114cC1BF7798cECBB38412701400daF","<ADMIN_WALLET_ADDRESS>"]`
- **Gas Used**: 2531178
- **Verification**: ✅ Verified | ✅ Ownership Transferred

### Art3HubCollectionV5 Implementation
- **Address**: `0x024baF02baB39f783D2b86A6fEF9A6492bBC0250`
- **Constructor Args**: `[]`
- **Gas Used**: 5317519
- **Verification**: ✅ Verified

### Art3HubFactoryV5
- **Address**: `0x183d5bA9dB1D381F82C79703E2d6D394bfAA643c`
- **Constructor Args**: `["0x78d2B5377c77A38E4A3Eb193aa417F865be62FC4","0x499D377eF114cC1BF7798cECBB38412701400daF","<ADMIN_WALLET_ADDRESS>"]`
- **Gas Used**: 8639819
- **Verification**: ✅ Verified | ✅ Ownership Transferred

## Gas Usage Summary
- **Subscription**: 2531178
- **Collection Implementation**: 5317519
- **Factory**: 8639819
- **Total**: 16488516

## Environment Variables

Add these to your .env file:

```bash
# Art3Hub V5 Contract Addresses (baseSepolia - Chain ID: 84532)
NEXT_PUBLIC_ART3HUB_FACTORY_V5_84532=0x183d5bA9dB1D381F82C79703E2d6D394bfAA643c
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_84532=0x78d2B5377c77A38E4A3Eb193aa417F865be62FC4
NEXT_PUBLIC_ART3HUB_COLLECTION_V5_IMPL_84532=0x024baF02baB39f783D2b86A6fEF9A6492bBC0250
```

## V5 Features Enabled
- ✅ Base-only deployment architecture
- ✅ Enhanced on-chain data storage
- ✅ Creator profile management
- ✅ NFT extended metadata with categories and tags
- ✅ Social features (likes, ratings, views)
- ✅ Advanced search and discovery
- ✅ Database minimization approach
- ✅ Gasless minting with subscription tiers

## Ownership Transfer
- **Deployer**: 0x499D377eF114cC1BF7798cECBB38412701400daF (used for deployment and verification)
- **Final Owner**: <ADMIN_WALLET_ADDRESS> (receives ownership of all contracts)
- **Transfer Status**: Check verification status above

## Next Steps
1. Update frontend .env file with new contract addresses
2. Deploy to production Base network if this was testnet
3. Update Art3HubV5Service with deployed addresses
4. Test V5 functionality with enhanced features
5. Migrate frontend to use contract-based data reading
6. Verify ownership has been transferred to INITIAL_OWNER

## Contract Verification Commands

```bash
# Verify Art3HubSubscriptionV4
npx hardhat verify --network baseSepolia 0x78d2B5377c77A38E4A3Eb193aa417F865be62FC4 "0x036CbD53842c5426634e7929541eC2318f3dCF7e" "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9" "0x499D377eF114cC1BF7798cECBB38412701400daF"

# Verify Art3HubCollectionV5 Implementation
npx hardhat verify --network baseSepolia 0x024baF02baB39f783D2b86A6fEF9A6492bBC0250

# Verify Art3HubFactoryV5
npx hardhat verify --network baseSepolia 0x183d5bA9dB1D381F82C79703E2d6D394bfAA643c "0x78d2B5377c77A38E4A3Eb193aa417F865be62FC4" "0x499D377eF114cC1BF7798cECBB38412701400daF" "<ADMIN_WALLET_ADDRESS>"
```
