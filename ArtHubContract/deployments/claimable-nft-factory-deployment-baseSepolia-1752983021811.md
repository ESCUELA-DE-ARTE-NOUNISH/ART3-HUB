
# Art3Hub Claimable NFT Factory Deployment

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployer**: 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
- **Deployment Time**: 2025-07-20T03:43:41.812Z

## Deployed Contracts

### Art3HubClaimableNFTFactory
- **Address**: `0xFE9F1F168Ed1BBbc5277f2827D7e8186dEA125dc`
- **Deployment Tx**: `0x8316b1e61a894b8d063ca6259e22b4d7875d18ca49731644d86b0a1152b4de71`

### Test Claimable NFT
- **Address**: `0x1f54e43B870323268ff9fF6955278577852D666A`
- **Test Claim Code**: `TEST-CODE-123`

## Environment Variables
Add these to your `.env` file:

```bash
# Art3Hub Claimable NFT Factory (Base Sepolia)
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0xFE9F1F168Ed1BBbc5277f2827D7e8186dEA125dc
```

## Usage Example

```typescript
// Deploy new claimable NFT
const factory = new ethers.Contract(factoryAddress, factoryABI, signer);
const tx = await factory.deployClaimableNFT(
  "My Collection",
  "MYCOL",
  "https://ipfs.io/ipfs/metadata/",
  ownerAddress
);
```

## Next Steps
1. Update the app to use factory contract: `NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0xFE9F1F168Ed1BBbc5277f2827D7e8186dEA125dc`
2. Update admin API to deploy via factory
3. Update claiming API to work with individual contracts
4. Add gasless relayer support for claimable NFT operations
