
# Art3Hub V6 FRESH Deployment Summary

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployment Date**: 2025-07-20T05:19:04.281Z
- **Deployer**: <GASLESS_RELAYER_ADDRESS>
- **Final Owner**: <GASLESS_RELAYER_ADDRESS>

## Contract Addresses

### Art3HubSubscriptionV4 (V6 Instance)
- **Address**: `0x0DbF4956d9Dd87761a005486a592eBe194697088`
- **Constructor Args**: `["0x036CbD53842c5426634e7929541eC2318f3dCF7e","0x946b7dc627D245877BDf9c59bce626db333Fc01c","<GASLESS_RELAYER_ADDRESS>","<GASLESS_RELAYER_ADDRESS>","<GASLESS_RELAYER_ADDRESS>"]`
- **Gas Used**: 2531178
- **Verification**: ✅ Verified

### Art3HubCollectionV5 Implementation (V6 Instance)
- **Address**: `0xF0360774C5E019aEd60a9A87D9FbedAeb07E32ac`
- **Constructor Args**: `[]`
- **Gas Used**: 5317519
- **Verification**: ✅ Verified

### Art3HubFactoryV5 (V6 Instance)
- **Address**: `0x7BcC67e69938ad61B37e9865a8760B56B9af057F`
- **Constructor Args**: `["0x0DbF4956d9Dd87761a005486a592eBe194697088","<GASLESS_RELAYER_ADDRESS>","<GASLESS_RELAYER_ADDRESS>"]`
- **Gas Used**: 8639807
- **Verification**: ✅ Verified

## Gas Usage Summary
- **Subscription**: 2531178
- **Collection Implementation**: 5317519
- **Factory**: 8639807
- **Total**: 16488504

## Environment Variables

Add these to your .env file:

```bash
# Art3Hub V6 Contract Addresses (FRESH DEPLOYMENT - baseSepolia - Chain ID: 84532)
NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532=0x7BcC67e69938ad61B37e9865a8760B56B9af057F
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532=0x0DbF4956d9Dd87761a005486a592eBe194697088
NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_84532=0xF0360774C5E019aEd60a9A87D9FbedAeb07E32ac
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
