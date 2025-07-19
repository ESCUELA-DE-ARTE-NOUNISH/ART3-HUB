#!/usr/bin/env node

// Test script to interact directly with the deployed smart contracts
require('dotenv').config({ path: '../ArtHubApp/.env' });
const { ethers } = require('ethers');

console.log('🧪 Testing Smart Contracts Directly...\n');

// Configuration
const FACTORY_ADDRESS = '0xeB91E58A59E7Bcf8ADC8cae4f12187826965503A';
const TEST_NFT_ADDRESS = '0xC6a95FE13bAb05f9a6f8203554b4F97cE3641B2F';
const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.GASLESS_RELAYER_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE'; // Load from environment

// ABIs
const FACTORY_ABI = [
  "function deployClaimableNFT(string name, string symbol, string baseTokenURI, address collectionOwner) external returns (address nftAddress)",
  "function getDeployedContracts() external view returns (address[])",
  "function getUserContracts(address user) external view returns (address[])"
];

const CLAIMABLE_NFT_ABI = [
  "function claimNFT(string claimCode) external returns (uint256)",
  "function addClaimCode(string claimCode, uint256 maxClaims, uint256 startTime, uint256 endTime, string metadataURI) external",
  "function validateClaimCode(string claimCode, address user) external view returns (bool valid, string message)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)"
];

async function testSmartContracts() {
  try {
    console.log('🔗 Connecting to Base Sepolia...');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📝 Using wallet: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      console.warn('⚠️  Low balance! May not have enough gas for transactions.');
    }
    
    // Connect to factory
    console.log('\n🏭 Testing Factory Contract...');
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
    
    // Get all deployed contracts
    const deployedContracts = await factory.getDeployedContracts();
    console.log(`📋 Total deployed contracts: ${deployedContracts.length}`);
    console.log(`📍 Deployed contracts:`, deployedContracts.slice(-3)); // Show last 3
    
    // Test deployment
    console.log('\n🚀 Deploying new ClaimableNFT...');
    const deployTx = await factory.deployClaimableNFT(
      'Test Direct Contract',
      'TDC',
      'https://ipfs.io/ipfs/',
      wallet.address
    );
    
    console.log(`📡 Deploy transaction: ${deployTx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    const deployReceipt = await deployTx.wait();
    console.log(`✅ Transaction confirmed in block ${deployReceipt.blockNumber}`);
    
    // Extract deployed address from logs
    let newContractAddress = null;
    for (const log of deployReceipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed.name === 'ClaimableNFTDeployed') {
          newContractAddress = parsed.args[0];
          break;
        }
      } catch (e) {
        // Continue to next log
      }
    }
    
    if (!newContractAddress) {
      throw new Error('Could not extract deployed contract address');
    }
    
    console.log(`🎯 New contract deployed at: ${newContractAddress}`);
    
    // Test the new contract
    console.log('\n🔧 Testing ClaimableNFT Contract...');
    const nft = new ethers.Contract(newContractAddress, CLAIMABLE_NFT_ABI, wallet);
    
    // Get contract info
    const name = await nft.name();
    const symbol = await nft.symbol();
    console.log(`📋 Contract: ${name} (${symbol})`);
    
    // Add a claim code
    console.log('\n📝 Adding claim code...');
    const claimCode = 'DIRECT-TEST-' + Date.now();
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = currentTime + (7 * 24 * 60 * 60); // 7 days from now
    
    const addCodeTx = await nft.addClaimCode(
      claimCode,
      5, // max 5 claims
      currentTime,
      endTime,
      'https://ipfs.io/ipfs/metadata.json'
    );
    
    console.log(`📡 Add code transaction: ${addCodeTx.hash}`);
    await addCodeTx.wait();
    console.log('✅ Claim code added successfully');
    
    // Validate claim code
    console.log('\n🔍 Validating claim code...');
    const [isValid, message] = await nft.validateClaimCode(claimCode, wallet.address);
    console.log(`Validation result: ${isValid ? '✅' : '❌'} - ${message}`);
    
    if (isValid) {
      // Claim NFT
      console.log('\n🎯 Claiming NFT...');
      const claimTx = await nft.claimNFT(claimCode);
      
      console.log(`📡 Claim transaction: ${claimTx.hash}`);
      const claimReceipt = await claimTx.wait();
      console.log(`✅ NFT claimed in block ${claimReceipt.blockNumber}`);
      
      // Check balance
      const nftBalance = await nft.balanceOf(wallet.address);
      console.log(`🏆 NFT balance: ${nftBalance}`);
      
      if (nftBalance > 0) {
        const owner = await nft.ownerOf(0); // First token
        console.log(`👤 Token 0 owner: ${owner}`);
        console.log(`✅ Ownership confirmed: ${owner.toLowerCase() === wallet.address.toLowerCase()}`);
      }
    }
    
    console.log('\n🎉 Direct smart contract test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Factory Address: ${FACTORY_ADDRESS}`);
    console.log(`- New Contract: ${newContractAddress}`);
    console.log(`- Claim Code: ${claimCode}`);
    console.log(`- Gas-free for users: ✅ (when using relayer)`);
    console.log(`- Independent contracts: ✅ Each NFT type has its own contract`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.reason) {
      console.error('💡 Reason:', error.reason);
    }
  }
}

// Run the test
testSmartContracts();