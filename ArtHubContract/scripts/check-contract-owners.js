const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking V6 Contract Owners on Base Sepolia\n");
  
  // Contract addresses from CLAUDE.md
  const contracts = {
    "Factory V6 Proxy": "0x87DfC71B55a41825fe8EAA8a8724D8982b92DeBe",
    "Subscription V6 Proxy": "0x3B2D7fD4972077Fa1dbE60335c6CDF84b02fE555", 
    "Collection V6 Implementation": "0xA7a5C3c097f291411501129cB69029eCe0F7C45E",
    "ClaimableNFT Factory V6 Proxy": "0x51dD5FE61CF5B537853877A6dE50E7F74c24310A"
  };

  // Standard owner ABI
  const ownerABI = [
    "function owner() view returns (address)"
  ];

  try {
    for (const [contractName, address] of Object.entries(contracts)) {
      try {
        console.log(`📋 ${contractName}`);
        console.log(`   Address: ${address}`);
        
        const contract = new ethers.Contract(address, ownerABI, ethers.provider);
        const owner = await contract.owner();
        
        console.log(`   Owner: ${owner}`);
        console.log(`   Explorer: https://sepolia.basescan.org/address/${address}#read`);
        console.log("");
        
      } catch (error) {
        console.log(`   ❌ Error reading owner: ${error.message}`);
        console.log(`   (Contract might not have owner() function or might not be deployed)`);
        console.log("");
      }
    }
    
    // Additional info
    console.log("📝 Expected Configuration:");
    console.log("   Admin Wallet (Owner): Should be your admin wallet address");
    console.log("   Gasless Relayer: Should have operational permissions");
    console.log("");
    console.log("💡 If you need to check gasless relayer permissions:");
    console.log("   Look for functions like hasRole() or check specific relayer permissions");
    
  } catch (error) {
    console.error("❌ Script error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });