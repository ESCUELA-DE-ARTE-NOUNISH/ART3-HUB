# Art3Hub V2 Setup Guide

This guide will help you set up Art3Hub V2 with the subscription-based model and gasless transactions.

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **Supabase Project** (for database)
3. **Wallet** (MetaMask or compatible) with Base Sepolia testnet
4. **IPFS/Pinata Account** (for metadata storage)

## Quick Start

### 1. Environment Setup

Copy the environment variables from `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

```bash
# Required: Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required: IPFS/Pinata configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud

# Required: Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Privy (if using)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# V2 contracts are pre-configured for Base Sepolia and Zora Sepolia testnets
```

### 2. Database Setup

Reset the database to V2 schema:

```bash
npm run db:reset
```

This will:
- Drop existing tables
- Create V2 tables with subscription fields
- Add sample test users
- Set up indexes and triggers

### 3. Install Dependencies and Start

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing V2 Features

### 1. Connect Wallet
- Connect your wallet (MetaMask recommended)
- Switch to **Base Sepolia** testnet (Chain ID: 84532)
- Get testnet ETH from [Base faucet](https://bridge.base.org/deposit)

### 2. Activate Subscription
1. Go to **Create NFT** page
2. Click **"Activate Free Plan"** button
3. Confirm the transaction (gasless activation)
4. You'll get 1 NFT quota for the free plan

### 3. Create Gasless NFT
1. Upload an image
2. Add title and description
3. Set royalty percentage
4. Click **"Create Gasless NFT"**
5. Confirm the transaction (no deployment fees!)

### 4. Monitor Subscription
- View your subscription status on the Create page
- See remaining NFT quota
- Track usage in the progress bar

## V2 Key Features

### ✅ What's New in V2
- **No Deployment Fees**: Collection creation included in subscription
- **Gasless Transactions**: Meta-transaction support for seamless UX
- **Subscription Plans**:
  - Free Plan: 1 NFT per year
  - Master Plan: 10 NFTs per month ($4.99/month)
- **Quota Management**: Automatic NFT limit tracking
- **Enhanced UI**: Subscription status and progress indicators

### 🔄 Migration from V1
V2 is completely independent from V1:
- V1 contracts still work (with deployment fees)
- V2 contracts use subscription model (no deployment fees)
- Both can coexist for different use cases

## Network Configuration

### Base Sepolia (Testing)
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://bridge.base.org/deposit

### Deployed V2 Contracts (Base Sepolia)
- **SubscriptionManager**: `0xe08976B44ca20c55ba0c8fb2b709A5741c1408A4`
- **Art3HubFactoryV2**: `0x75Ed9ACB51D2BEaCfD6c76099D63d3a0009F4a40`
- **Art3HubCollectionV2 Impl**: `0x41BE244598b4B8329ff68bD242C2fa58a9084e26`
- **GaslessRelayer**: `0x5116F90f3a26c7d825bE6Aa74544187b43c52a56`

### Zora Sepolia (Testing)
- **Chain ID**: 999999999
- **RPC**: https://sepolia.rpc.zora.energy
- **Explorer**: https://sepolia.explorer.zora.energy

### Deployed V2 Contracts (Zora Sepolia)
- **SubscriptionManager**: `0xf1D63b42fb8c4887d6deB34c5fba81B18Bd2e3Ea`
- **Art3HubFactoryV2**: `0x270B8770F59c767ff55595e893c7E16A88347FE9`
- **Art3HubCollectionV2 Impl**: `0x2f302E1604E3657035C1EADa450582fA4417f598`
- **GaslessRelayer**: `0xA68f7C09EdBF3aD3705ECc652E132BAeD2a29F85`

## Troubleshooting

### Common Issues

**1. "Database connection failed"**
- Check your Supabase credentials in `.env`
- Ensure your Supabase project is active
- Run `npm run db:reset` to reset the database

**2. "Contract not found"**
- Make sure you're on Base Sepolia (Chain ID: 84532)
- Check that `NEXT_PUBLIC_IS_TESTING_MODE=true` in `.env`
- Verify contract addresses in `.env`

**3. "Subscription required"**
- Click "Activate Free Plan" button
- Confirm the transaction in your wallet
- Wait for transaction confirmation

**4. "Wrong network"**
- Switch to Base Sepolia in your wallet
- Refresh the page after switching

**5. "NFT limit reached"**
- You've used your free plan quota (1 NFT)
- Wait for the next billing period or upgrade to Master plan

### Reset Everything

To start completely fresh:

```bash
# Reset database
npm run db:reset

# Clear browser data
# - Clear localhost:3000 data in DevTools > Application > Storage
# - Disconnect and reconnect wallet

# Restart development server
npm run dev
```

## Support

For issues or questions:
1. Check this setup guide
2. Review browser console for errors
3. Verify all environment variables are set
4. Ensure you're on the correct network (Base Sepolia)

## Next Steps

After successful setup:
1. Test the full flow: subscription → collection creation → NFT minting
2. Explore the subscription quota system
3. Try creating multiple NFTs (will hit the free plan limit)
4. Consider implementing Master plan subscription flow for production