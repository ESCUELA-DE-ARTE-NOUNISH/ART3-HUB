
# Art3Hub Claimable NFT Factory Deployment

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployer**: 0x499D377eF114cC1BF7798cECBB38412701400daF
- **Deployment Time**: 2025-07-19T18:23:29.961Z

## Deployed Contracts

### Art3HubClaimableNFTFactory
- **Address**: `0x55248aC366d3F26b6aa480ed5fD82130C8C6842d`
- **Deployment Tx**: `0x1080458b24f1a6ba46a2a0ac2881d065a712eaebe23fcfaa4c0a5f45f01f7e6a`

### Test Claimable NFT
- **Address**: `0xbbe438D73Cc521fe4f834a7D9f9105217DfAf78f`
- **Test Claim Code**: `TEST-CODE-123`

## Environment Variables
Add these to your `.env` file:

```bash
# Art3Hub Claimable NFT Factory (Base Sepolia)
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0x55248aC366d3F26b6aa480ed5fD82130C8C6842d
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
1. Update the app to use factory contract: `NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0x55248aC366d3F26b6aa480ed5fD82130C8C6842d`
2. Update admin API to deploy via factory
3. Update claiming API to work with individual contracts
4. Add gasless relayer support for claimable NFT operations
