# Claimable NFT Setup Guide

This guide will help you deploy the ClaimableNFT contracts needed for the real NFT claiming functionality.

## Prerequisites

1. Node.js and npm installed
2. A funded wallet on Base Sepolia (testnet) and/or Base (mainnet)
3. Your admin private key with sufficient ETH for gas fees

## Step 1: Install Dependencies

If not already installed:
```bash
npm install
```

## Step 2: Deploy ClaimableNFT Contract

### For Base Sepolia (Testnet)

Deploy to testnet first for testing:
```bash
npx tsx scripts/deploy-claimable-nft.ts testnet
```

### For Base Mainnet (Production)

After testing, deploy to mainnet:
```bash
npx tsx scripts/deploy-claimable-nft.ts mainnet
```

## Step 3: Update Environment Variables

After deployment, add the contract address to your `.env` file:

For Base Sepolia:
```
NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_84532=<deployed_contract_address>
```

For Base Mainnet:
```
NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_8453=<deployed_contract_address>
```

## Step 4: Restart Development Server

```bash
npm run dev
```

## Step 5: Test the Claimable NFT Flow

1. Go to `/admin/nfts/create` as an admin
2. Create a new claimable NFT with status "published"
3. Use the claim code to mint the NFT at `/mint`

## Contract Features

The ClaimableNFT contract includes:

- **mintWithClaimCode**: Mints NFT with claim code tracking
- **isClaimCodeUsed**: Checks if a claim code has been used
- **getTokenIdByClaimCode**: Gets token ID for a claim code
- **totalSupply**: Gets total number of minted tokens

## Environment Variables Reference

```bash
# Required for real contract deployment
ADMIN_PRIVATE_KEY=your_private_key_here

# Contract addresses (set after deployment)
NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_84532=  # Base Sepolia
NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_8453=   # Base Mainnet

# Admin wallet (for authorization)
NEXT_PUBLIC_ADMIN_WALLET=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f

# Network mode
NEXT_PUBLIC_IS_TESTING_MODE=true  # true for testnet, false for mainnet
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Key Security**: Replace the demo `ADMIN_PRIVATE_KEY` with a secure, production private key
2. **Admin Wallet**: Ensure only authorized admins have access to the admin wallet
3. **Environment Variables**: Keep `.env` file secure and never commit private keys to version control
4. **Testing**: Always test on testnet before deploying to mainnet

## Troubleshooting

### Contract Not Deployed Error
If you see "ClaimableNFT contract not configured", follow steps 2-4 above.

### Insufficient Balance Error
Ensure your admin wallet has enough ETH for gas fees:
- Base Sepolia: Get free testnet ETH from faucets
- Base Mainnet: Fund with real ETH

### Transaction Rejected
Check that:
1. Your wallet is connected to the correct network
2. You have enough ETH for gas
3. The contract address is correct in the environment variables

## Testing Claims

Once deployed, you can test the full flow:

1. **Admin creates NFT**: Create claimable NFT with claim code
2. **User claims NFT**: Use claim code at `/mint` page
3. **Verify on-chain**: Check the NFT was minted to user's wallet

The system now supports real blockchain transactions instead of simulation.