
# Art3Hub V6 FRESH Deployment Summary

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployment Date**: 2025-07-19T23:27:57.946Z
- **Deployer**: 0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1
- **Final Owner**: 0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1

## Contract Addresses

### Art3HubSubscriptionV4 (V6 Instance)
- **Address**: `0xCfa74f044E0200a03687cB6424C9B6B5D7B7f4fd`
- **Constructor Args**: `["0x036CbD53842c5426634e7929541eC2318f3dCF7e","0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9","0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1","0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1","0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1"]`
- **Gas Used**: 2531178
- **Verification**: ✅ Verified

### Art3HubCollectionV5 Implementation (V6 Instance)
- **Address**: `0x931743f8b80B4EaB5f27AB1AAAF73118cCD74a29`
- **Constructor Args**: `[]`
- **Gas Used**: 5317519
- **Verification**: ✅ Verified

### Art3HubFactoryV5 (V6 Instance)
- **Address**: `0x5BAa7723492352668a5060d578E901D0dfdf28Af`
- **Constructor Args**: `["0xCfa74f044E0200a03687cB6424C9B6B5D7B7f4fd","0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1","0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1"]`
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
NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532=0x5BAa7723492352668a5060d578E901D0dfdf28Af
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532=0xCfa74f044E0200a03687cB6424C9B6B5D7B7f4fd
NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_84532=0x931743f8b80B4EaB5f27AB1AAAF73118cCD74a29
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
