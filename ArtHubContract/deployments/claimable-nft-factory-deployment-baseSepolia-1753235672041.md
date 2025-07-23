
# Art3Hub Claimable NFT Factory Deployment

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployer**: 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
- **Deployment Time**: 2025-07-23T01:54:32.042Z

## Deployed Contracts

### Art3HubClaimableNFTFactory
- **Address**: `0x12a6C91C0e2a6d1E8e6Ef537107b6F5a12Eeb51C`
- **Deployment Tx**: `0x70af934e3f580c55ab98c4172e67527b7b1693f56ca55b37302744c1d2760fd1`

### Test Claimable NFT
- **Address**: `0x54646606e56ba343e210a2424812AAE24598B476`
- **Test Claim Code**: `TEST-CODE-123`

## Environment Variables
Add these to your `.env` file:

```bash
# Art3Hub Claimable NFT Factory (Base Sepolia)
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0x12a6C91C0e2a6d1E8e6Ef537107b6F5a12Eeb51C
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
1. Update the app to use factory contract: `NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0x12a6C91C0e2a6d1E8e6Ef537107b6F5a12Eeb51C`
2. Update admin API to deploy via factory
3. Update claiming API to work with individual contracts
4. Add gasless relayer support for claimable NFT operations
