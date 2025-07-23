
# Art3Hub V6 FRESH Deployment Summary

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployment Date**: 2025-07-23T01:53:48.586Z
- **Deployer**: 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
- **Final Owner**: 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd

## Contract Addresses

### Art3HubSubscriptionV4 (V6 Instance)
- **Address**: `0x21FC4b7D9dc40323Abbd0Efa4AD93872720D0Ac0`
- **Constructor Args**: `["0x036CbD53842c5426634e7929541eC2318f3dCF7e","0x946b7dc627D245877BDf9c59bce626db333Fc01c","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd"]`
- **Gas Used**: 2531178
- **Verification**: ✅ Verified

### Art3HubCollectionV5 Implementation (V6 Instance)
- **Address**: `0x22196fE4D4a93377C6F5a74090EfF869e439Df7d`
- **Constructor Args**: `[]`
- **Gas Used**: 5317519
- **Verification**: ✅ Verified

### Art3HubFactoryV5 (V6 Instance)
- **Address**: `0xA23EcC9944055A0Ffd135939B69E6425a44abE08`
- **Constructor Args**: `["0x21FC4b7D9dc40323Abbd0Efa4AD93872720D0Ac0","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd"]`
- **Gas Used**: 8639819
- **Verification**: ✅ Verified

## Gas Usage Summary
- **Subscription**: 2531178
- **Collection Implementation**: 5317519
- **Factory**: 8639819
- **Total**: 16488516

## Environment Variables

Add these to your .env file:

```bash
# Art3Hub V6 Contract Addresses (FRESH DEPLOYMENT - baseSepolia - Chain ID: 84532)
NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532=0xA23EcC9944055A0Ffd135939B69E6425a44abE08
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532=0x21FC4b7D9dc40323Abbd0Efa4AD93872720D0Ac0
NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_84532=0x22196fE4D4a93377C6F5a74090EfF869e439Df7d
```

## V6 Features Enabled
- ✅ Base-only deployment architecture
- ✅ Enhanced on-chain data storage
- ✅ Firebase database integration
- ✅ Fresh contract addresses (clean start)
- ✅ Creator profile management
- ✅ NFT extended metadata with categories and tags
- ✅ Social features (likes, ratings, views)
- ✅ Advanced search and discovery
- ✅ Gasless minting with subscription tiers

## Fresh Start Benefits
- 🆕 New contract addresses (no legacy data)
- 🔥 Firebase database (replacing Supabase)
- 🧹 Clean deployment (no migration issues)
- 🚀 Optimized for Base network
- 💾 On-chain data priority

## Next Steps
1. Update frontend .env file with new V6 contract addresses
2. Remove all old V3/V4/V5 contract references
3. Update Art3HubV5Service to use V6 addresses
4. Test V6 functionality with Firebase
5. Verify all features work with fresh contracts
