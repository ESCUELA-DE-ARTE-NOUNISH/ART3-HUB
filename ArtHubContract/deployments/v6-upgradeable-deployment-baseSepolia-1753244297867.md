
# Art3Hub V6 UPGRADEABLE Deployment Summary

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployment Date**: 2025-07-23T04:17:52.062Z
- **Deployer**: <GASLESS_RELAYER_ADDRESS>
- **Owner (Admin)**: <ADMIN_WALLET_ADDRESS>
- **Gasless Relayer**: <GASLESS_RELAYER_ADDRESS>

## Upgradeable Contract Addresses

### Art3HubSubscriptionV6Upgradeable
- **Proxy**: `0x55F8a78EA33653BF0310Fb62F3f4D1Af7BB7aBcd`
- **Implementation**: `0x9afc3ebEBFA19e4E5235e369937a46376ebE6A71`
- **Constructor Args**: `["<ADMIN_WALLET_ADDRESS>","<GASLESS_RELAYER_ADDRESS>","0x036CbD53842c5426634e7929541eC2318f3dCF7e","0x946b7dc627D245877BDf9c59bce626db333Fc01c","<GASLESS_RELAYER_ADDRESS>"]`
- **Gas Used**: 524108
- **Verification**: ✅ Verified

### Art3HubFactoryV6Upgradeable
- **Proxy**: `0xEaD0db9772657B1422110147f601ed3E82565a47`
- **Implementation**: `0x3E4A7526D1F9f443154eFa948e79a235bE692929`
- **Constructor Args**: `["<ADMIN_WALLET_ADDRESS>","<GASLESS_RELAYER_ADDRESS>","0x55F8a78EA33653BF0310Fb62F3f4D1Af7BB7aBcd","0x56dFf2F7CcC1B14f208294C656341D0085CAE1A5"]`
- **Gas Used**: 321905
- **Verification**: ✅ Verified

### Art3HubCollectionV5 Implementation
- **Address**: `0x56dFf2F7CcC1B14f208294C656341D0085CAE1A5`
- **Constructor Args**: `[]`
- **Gas Used**: 5317519
- **Verification**: ✅ Verified

### Art3HubClaimableNFTFactory
- **Address**: `0xe316DfECCE06A35F6e88084AC5eC939a5E859596`
- **Constructor Args**: `["<ADMIN_WALLET_ADDRESS>"]`
- **Gas Used**: 3026249
- **Verification**: ✅ Verified

## Gas Usage Summary
- **Subscription**: 524108
- **Factory**: 321905
- **Collection Implementation**: 5317519
- **Claimable NFT Factory**: 3026249
- **Total**: 9189781

## Environment Variables

Add these to your .env files:

### ArtHubContract/.env
```bash
# Owner/Relayer Separation
NEW_CONTRACT_OWNER=<ADMIN_WALLET_ADDRESS>
GASLESS_RELAYER_PRIVATE_KEY=<your_gasless_relayer_private_key>
GASLESS_RELAYER_ADDRESS=<GASLESS_RELAYER_ADDRESS>
```

### ArtHubApp/.env
```bash
# Art3Hub V6 Upgradeable Contract Addresses (baseSepolia - Chain ID: 84532)
NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532=0xEaD0db9772657B1422110147f601ed3E82565a47
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532=0x55F8a78EA33653BF0310Fb62F3f4D1Af7BB7aBcd
NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_84532=0x56dFf2F7CcC1B14f208294C656341D0085CAE1A5
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0xe316DfECCE06A35F6e88084AC5eC939a5E859596

# Security Configuration
GASLESS_RELAYER_PRIVATE_KEY=<your_gasless_relayer_private_key>
NEXT_PUBLIC_ADMIN_WALLET=<ADMIN_WALLET_ADDRESS>
```

## V6 Upgradeable Features Enabled
- ✅ OpenZeppelin UUPS Upgradeable pattern
- ✅ Owner/Relayer separation architecture
- ✅ Admin wallet controls upgrades and configuration
- ✅ Gasless relayer maintains operational access
- ✅ Proxy-based contract upgrades
- ✅ Storage gaps for safe upgrades
- ✅ Enhanced security with role separation
- ✅ Collection-per-NFT architecture maintained
- ✅ Firebase database integration ready

## Owner/Relayer Access Control
- **Admin Functions (Owner only)**: Contract upgrades, configuration updates, emergency controls
- **Operational Functions (Gasless Relayer)**: Minting, subscription management, user operations
- **Hybrid Functions**: Some functions accessible by both owner and relayer for flexibility

## Upgrade Instructions
1. Only the owner (<ADMIN_WALLET_ADDRESS>) can authorize upgrades
2. Use OpenZeppelin Upgrades plugin for safe upgrades
3. Always test upgrades on testnet first
4. Verify storage layout compatibility before upgrades

## Next Steps
1. Update frontend .env file with new V6 upgradeable contract addresses
2. Update CLAUDE.md with new addresses
3. Test all functionality with new upgradeable contracts
4. Verify owner/relayer separation works correctly
5. Plan future upgrade roadmap
