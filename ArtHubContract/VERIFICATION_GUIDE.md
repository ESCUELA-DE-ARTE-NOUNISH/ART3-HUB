# Contract Verification Guide

## Automated Verification Commands

### Base Sepolia
```bash
npx hardhat run scripts/verify-contracts.ts --network baseSepolia
```

### Celo Alfajores
```bash
npx hardhat run scripts/verify-contracts.ts --network celoSepolia
```

### Zora Sepolia
```bash
npx hardhat run scripts/verify-contracts.ts --network zoraSepolia
```

## Manual Blockscout Verification (Zora)

For Zora Sepolia (Blockscout), if automated verification fails, follow these steps:

### 1. Go to Zora Sepolia Explorer
Visit: https://sepolia.explorer.zora.energy

### 2. Navigate to Contract Address
Enter the contract address in the search bar.

### 3. Click "Verify & Publish"
Look for the "Verify & Publish" button on the contract page.

### 4. Fill Out Verification Form

#### For Art3HubSubscriptionV3 (0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D)
- **Contract Name**: `Art3HubSubscriptionV3`
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Optimization**: `Enabled`
- **Optimization Runs**: `200`
- **Via IR**: `Enabled`
- **Constructor Arguments (ABI-encoded)**:
  ```
  0x000000000000000000000000ccccccc7021b32ebb4e8c08314bd62f7c653ec40000000000000000000000008ea4b5e25c45d34596758da2d3f27a8096eefeb9000000000000000000000000209d896f4fd6c9c02dea6f7a70629236c1f027c1000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f
  ```

#### For Art3HubFactoryV3 (0x47105E80363960Ef9C3f641dA4056281E963d3CB)
- **Contract Name**: `Art3HubFactoryV3`
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Optimization**: `Enabled`
- **Optimization Runs**: `200`
- **Via IR**: `Enabled`
- **Constructor Arguments (ABI-encoded)**:
  ```
  0x00000000000000000000000020d07582c3cb6a0b32aa8be59456c6bbbadd993d000000000000000000000000209d896f4fd6c9c02dea6f7a70629236c1f027c1000000000000000000000000c2564e41b7f5cb66d2d99466450cfebce9e8228f
  ```

#### For Art3HubCollectionV3 (0x4Cf261D4F37F4d5870e6172108b1eEfE1592daCd)
- **Contract Name**: `Art3HubCollectionV3`
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Optimization**: `Enabled`
- **Optimization Runs**: `200`
- **Via IR**: `Enabled`
- **Constructor Arguments**: `(empty - no constructor arguments)`

### 5. Upload Contract Source Code

You'll need to upload the flattened source code. Generate it using:

```bash
# For SubscriptionV3
npx hardhat flatten contracts/Art3HubSubscriptionV3.sol > flattened/Art3HubSubscriptionV3_flat.sol

# For FactoryV3
npx hardhat flatten contracts/Art3HubFactoryV3.sol > flattened/Art3HubFactoryV3_flat.sol

# For CollectionV3
npx hardhat flatten contracts/Art3HubCollectionV3.sol > flattened/Art3HubCollectionV3_flat.sol
```

## Alternative: Sourcify Verification

For networks that support Sourcify, you can also try:

```bash
npx hardhat sourcify --network [network_name]
```

## Constructor Arguments Generation

To generate ABI-encoded constructor arguments, use this script:

```javascript
const { ethers } = require("ethers");

// For Art3HubSubscriptionV3
const subscriptionArgs = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "address", "address", "address"],
  [
    "0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4", // USDC
    "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9", // Treasury
    "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
    "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
  ]
);

// For Art3HubFactoryV3
const factoryArgs = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "address", "address"],
  [
    "0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D", // Subscription Manager
    "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
    "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
  ]
);

console.log("SubscriptionV3 args:", subscriptionArgs);
console.log("FactoryV3 args:", factoryArgs);
```

## Verification Status Check

After verification, check the status at:

### Base Sepolia
- SubscriptionV3: https://sepolia.basescan.org/address/0x4189c14EfcfB71CAAb5Bb6cd162504a37DF2b4Dc#code
- FactoryV3: https://sepolia.basescan.org/address/0x2634b3389c0CBc733bE05ba459A0C2e844594161#code
- CollectionV3: https://sepolia.basescan.org/address/0xC02C22986839b9F70E8c1a1aBDB7721f3739d034#code

### Zora Sepolia
- SubscriptionV3: https://sepolia.explorer.zora.energy/address/0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D
- FactoryV3: https://sepolia.explorer.zora.energy/address/0x47105E80363960Ef9C3f641dA4056281E963d3CB
- CollectionV3: https://sepolia.explorer.zora.energy/address/0x4Cf261D4F37F4d5870e6172108b1eEfE1592daCd

### Celo Alfajores
- SubscriptionV3: https://alfajores.celoscan.io/address/0xFf85176d8BDA8Ead51d9A67a4e1c0dDDDF695C30#code
- FactoryV3: https://alfajores.celoscan.io/address/0x996Cc8EE4a9E43B27bFfdB8274B24d61B30B188E#code
- CollectionV3: https://alfajores.celoscan.io/address/0xB482D3298f34423E98A67A54DE5d33612f200918#code

## Troubleshooting

### Common Issues:
1. **Wrong compiler version**: Make sure to use `v0.8.20+commit.a1b79de6`
2. **Missing optimization settings**: Enable optimization with 200 runs and Via IR
3. **Incorrect constructor args**: Use the exact ABI-encoded values provided above
4. **License issues**: Make sure all contracts have consistent SPDX licenses

### API Key Requirements:
- **Base**: BASESCAN_API_KEY required
- **Celo**: CELOSCAN_API_KEY recommended but optional
- **Zora**: Uses Blockscout, no API key needed for manual verification