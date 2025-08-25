
# Art3Hub V6 UPGRADEABLE Deployment Summary

## Network Information
- **Network**: base
- **Chain ID**: 8453
- **Deployment Date**: 2025-08-25T02:39:37.730Z
- **Deployer**: 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
- **Owner (Admin)**: 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
- **Gasless Relayer**: 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd

## Upgradeable Contract Addresses

### Art3HubSubscriptionV6Upgradeable
- **Proxy**: `0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8`
- **Implementation**: `0x1cFe8bb79A4f174BE4650f5100AF6B9878D39661`
- **Constructor Args**: `["0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd","0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","0x946b7dc627D245877BDf9c59bce626db333Fc01c","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd"]`
- **Gas Used**: 524096
- **Verification**: ✅ Verified

### Art3HubFactoryV6Upgradeable
- **Proxy**: `0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D`
- **Implementation**: `0xFE9F1F168Ed1BBbc5277f2827D7e8186dEA125dc`
- **Constructor Args**: `["0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd","0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8","0x8aFf71f5dCb7Ad2C77f0Ec5a0A4D914394dB8c13"]`
- **Gas Used**: 321917
- **Verification**: ✅ Verified

### Art3HubCollectionV6 Implementation
- **Address**: `0x8aFf71f5dCb7Ad2C77f0Ec5a0A4D914394dB8c13`
- **Constructor Args**: `[]`
- **Gas Used**: 5352242
- **Verification**: ✅ Verified

### Art3HubClaimableNFTFactoryV6Upgradeable
- **Address**: `0xB253b65b330A51DD452f32617730565d6f6A6b33`
- **Constructor Args**: `["0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f","0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd"]`
- **Gas Used**: 203367
- **Verification**: ✅ Verified

## Gas Usage Summary
- **Subscription**: 524096
- **Factory**: 321917
- **Collection Implementation**: 5352242
- **Claimable NFT Factory**: 203367
- **Total**: 6401622

## Environment Variables

Add these to your .env files:

### ArtHubContract/.env
```bash
# Owner/Relayer Separation
NEW_CONTRACT_OWNER=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
GASLESS_RELAYER_PRIVATE_KEY=<your_gasless_relayer_private_key>
GASLESS_RELAYER_ADDRESS=0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
```

### ArtHubApp/.env
```bash
# Art3Hub V6 Upgradeable Contract Addresses (base - Chain ID: 8453)
NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453=0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453=0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8
NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_8453=0x8aFf71f5dCb7Ad2C77f0Ec5a0A4D914394dB8c13
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453=0xB253b65b330A51DD452f32617730565d6f6A6b33

# Security Configuration
GASLESS_RELAYER_PRIVATE_KEY=<your_gasless_relayer_private_key>
NEXT_PUBLIC_ADMIN_WALLET=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
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
1. Only the owner (0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f) can authorize upgrades
2. Use OpenZeppelin Upgrades plugin for safe upgrades
3. Always test upgrades on testnet first
4. Verify storage layout compatibility before upgrades

## Next Steps
1. Update frontend .env file with new V6 upgradeable contract addresses
2. Update CLAUDE.md with new addresses
3. Test all functionality with new upgradeable contracts
4. Verify owner/relayer separation works correctly
5. Plan future upgrade roadmap
