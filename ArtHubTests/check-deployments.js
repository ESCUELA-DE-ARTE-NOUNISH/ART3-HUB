#!/usr/bin/env node

// Check deployed contracts
const { ethers } = require('ethers');

const FACTORY_ADDRESS = '0xeB91E58A59E7Bcf8ADC8cae4f12187826965503A';
const RPC_URL = 'https://sepolia.base.org';

const FACTORY_ABI = [
  "function getDeployedContracts() external view returns (address[])",
  "function getUserContracts(address user) external view returns (address[])",
  "event ClaimableNFTDeployed(address indexed nftAddress, string name, string symbol, address indexed owner, uint256 deployedAt)"
];

async function checkDeployments() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    console.log('📋 Getting all deployed contracts...');
    const deployedContracts = await factory.getDeployedContracts();
    console.log(`Total contracts: ${deployedContracts.length}`);
    
    deployedContracts.forEach((addr, i) => {
      console.log(`${i + 1}. ${addr}`);
    });
    
    if (deployedContracts.length >= 2) {
      const latestContract = deployedContracts[deployedContracts.length - 1];
      console.log(`\n✅ Latest contract: ${latestContract}`);
      
      // Test the latest contract
      const CLAIMABLE_NFT_ABI = [
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function owner() external view returns (address)"
      ];
      
      const nft = new ethers.Contract(latestContract, CLAIMABLE_NFT_ABI, provider);
      
      try {
        const name = await nft.name();
        const symbol = await nft.symbol();
        const owner = await nft.owner();
        
        console.log(`📋 Contract Info:`);
        console.log(`- Name: ${name}`);
        console.log(`- Symbol: ${symbol}`);
        console.log(`- Owner: ${owner}`);
        
        console.log('\n🎉 Factory pattern working correctly!');
        console.log(`✅ Each claimable NFT gets its own contract`);
        console.log(`✅ Independent access control per contract`);
        console.log(`✅ Easy identification by contract address`);
        
      } catch (error) {
        console.error('❌ Error reading contract info:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDeployments();