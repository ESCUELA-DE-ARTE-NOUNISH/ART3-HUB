
# Art3Hub Claimable NFT Factory Deployment

## Network Information
- **Network**: baseSepolia
- **Chain ID**: 84532
- **Deployer**: 0x499D377eF114cC1BF7798cECBB38412701400daF
- **Deployment Time**: 2025-07-19T12:28:03.263Z

## Deployed Contracts

### Art3HubClaimableNFTFactory
- **Address**: `0xeB91E58A59E7Bcf8ADC8cae4f12187826965503A`
- **Deployment Tx**: `0x4ddfa9cde1329f8ad59f6bfec97b0e92820b108c35fa6e9e9e16c3ba23c67389`

### Test Claimable NFT
- **Address**: `0xC6a95FE13bAb05f9a6f8203554b4F97cE3641B2F`
- **Test Claim Code**: `TEST-CODE-123`

## Environment Variables
Add these to your `.env` file:

```bash
# Art3Hub Claimable NFT Factory (Base Sepolia)
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0xeB91E58A59E7Bcf8ADC8cae4f12187826965503A
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
1. Update the app to use factory contract: `NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=0xeB91E58A59E7Bcf8ADC8cae4f12187826965503A`
2. Update admin API to deploy via factory
3. Update claiming API to work with individual contracts
4. Add gasless relayer support for claimable NFT operations
