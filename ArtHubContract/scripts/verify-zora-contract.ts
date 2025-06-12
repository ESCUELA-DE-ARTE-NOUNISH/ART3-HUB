import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Verifying Zora Sepolia Factory Contract...");
  
  const contractAddress = "0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F";
  const rpcUrl = "https://sepolia.rpc.zora.energy";
  
  // Create provider for Zora Sepolia
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  try {
    // Check if contract exists by getting code
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🌐 Network: Zora Sepolia (Chain ID: 999999999)`);
    
    const code = await provider.getCode(contractAddress);
    
    if (code === "0x") {
      console.log("❌ Contract does not exist at this address");
      return;
    }
    
    console.log("✅ Contract exists!");
    console.log(`📏 Bytecode length: ${code.length} characters`);
    
    // Try to interact with the contract using our ABI
    const Art3HubFactory = await ethers.getContractFactory("Art3HubFactory");
    const factory = Art3HubFactory.attach(contractAddress).connect(provider);
    
    // Test specific functions
    console.log("\n🔧 Testing contract functions:");
    
    try {
      const deploymentFee = await factory.deploymentFee();
      console.log(`✅ deploymentFee(): ${ethers.formatEther(deploymentFee)} ETH`);
    } catch (error) {
      console.log(`❌ deploymentFee() failed:`, error);
    }
    
    try {
      const platformFee = await factory.platformFeePercentage();
      console.log(`✅ platformFeePercentage(): ${platformFee} basis points`);
    } catch (error) {
      console.log(`❌ platformFeePercentage() failed:`, error);
    }
    
    try {
      const feeRecipient = await factory.feeRecipient();
      console.log(`✅ feeRecipient(): ${feeRecipient}`);
    } catch (error) {
      console.log(`❌ feeRecipient() failed:`, error);
    }
    
    try {
      const implementation = await factory.implementation();
      console.log(`✅ implementation(): ${implementation}`);
    } catch (error) {
      console.log(`❌ implementation() failed:`, error);
    }
    
    try {
      const totalCollections = await factory.getTotalCollections();
      console.log(`✅ getTotalCollections(): ${totalCollections}`);
    } catch (error) {
      console.log(`❌ getTotalCollections() failed:`, error);
    }
    
    try {
      const owner = await factory.owner();
      console.log(`✅ owner(): ${owner}`);
    } catch (error) {
      console.log(`❌ owner() failed:`, error);
    }
    
  } catch (error) {
    console.error("❌ Error verifying contract:", error);
  }
  
  console.log(`\n🔗 Block Explorer: https://sepolia.explorer.zora.energy/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });