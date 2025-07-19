# ART3-HUB Test Suite

This directory contains test scripts for validating the ART3-HUB claimable NFT factory system.

## Test Files

### `check-deployments.js`
- **Purpose**: Verifies factory contract deployment and lists all deployed claimable NFT contracts
- **Usage**: `node check-deployments.js`
- **Description**: Connects to the deployed Art3HubClaimableNFTFactory and displays all contracts that have been deployed through the factory pattern

### `test-smart-contracts.js`
- **Purpose**: Direct smart contract testing without the API layer
- **Usage**: `node test-smart-contracts.js`
- **Description**: Tests the factory and claimable NFT contracts directly on Base Sepolia using ethers.js. Includes deployment, claim code addition, and NFT claiming.

### `test-gasless-simple.js` & `test-gasless-port-3000.js`
- **Purpose**: Tests the gasless relayer API for claimable NFT operations
- **Usage**: `node test-gasless-simple.js` (requires server on port 3001) or `node test-gasless-port-3000.js` (requires server on port 3000)
- **Description**: Tests the `/api/gasless-relay` endpoint for deploying claimable NFTs, adding claim codes, and claiming NFTs without users paying gas fees

### `test-claimable-nft.js`
- **Purpose**: End-to-end integration testing of the complete claimable NFT flow
- **Usage**: `node test-claimable-nft.js`
- **Description**: Tests the complete user journey from admin NFT creation through the factory pattern to user claiming via the API endpoints

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured with:
   - `NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532` - Factory contract address on Base Sepolia
   - `GASLESS_RELAYER_PRIVATE_KEY` - Private key for gasless transactions
   - `NEXT_PUBLIC_IS_TESTING_MODE=true` - Enable testnet mode

2. **Dependencies**: Run `npm install` in the ArtHubApp directory to install required dependencies

3. **Development Server**: For API tests, start the Next.js development server:
   ```bash
   cd ArtHubApp && npm run dev
   ```

## Factory Pattern Architecture

The claimable NFT system uses a factory pattern where:
- Each claimable NFT type gets its own independent ERC721 contract
- Users are differentiated by which contract they have access to
- Each contract has independent access controls and claim codes
- Easy identification by unique contract addresses

## Network Configuration

- **Testnet**: Base Sepolia (Chain ID: 84532)
- **Factory Contract**: `0xeB91E58A59E7Bcf8ADC8cae4f12187826965503A`
- **RPC URL**: `https://sepolia.base.org`

## Test Results Format

All tests output structured information including:
- Contract addresses for deployed NFTs
- Transaction hashes for verification
- Gas usage estimates
- Success/failure status with detailed error messages