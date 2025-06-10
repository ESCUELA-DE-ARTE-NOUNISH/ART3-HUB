import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🏭 Deploying Art3 Hub Factory System...");

  // Get deployment parameters from environment or use defaults
  const DEPLOYMENT_FEE = process.env.DEPLOYMENT_FEE || ethers.parseEther("0.001"); // 0.001 ETH to create collection
  const PLATFORM_FEE_PERCENTAGE = process.env.PLATFORM_FEE_PERCENTAGE || "250"; // 2.5% platform fee
  const FACTORY_OWNER = process.env.FACTORY_OWNER || deployer.address; // Factory owner (can be changed)
  
  // OpenSea proxy registry addresses
  const OPENSEA_PROXY_REGISTRIES = {
    // Base Sepolia - OpenSea doesn't have a proxy registry on testnets, use zero address
    84532: "0x0000000000000000000000000000000000000000",
    // Base Mainnet - OpenSea proxy registry
    8453: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC" // Base mainnet proxy registry
  };
  
  // Get network information
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`\n🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`💰 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💳 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.02")) {
    console.warn("⚠️  Warning: Low balance. Make sure you have enough ETH for deployment.");
  }

  // Get OpenSea proxy registry for current network
  const proxyRegistryAddress = OPENSEA_PROXY_REGISTRIES[Number(network.chainId) as keyof typeof OPENSEA_PROXY_REGISTRIES] || "0x0000000000000000000000000000000000000000";

  console.log("📋 Factory Parameters:");
  console.log(`   Deployment Fee: ${ethers.formatEther(DEPLOYMENT_FEE.toString())} ETH`);
  console.log(`   Platform Fee: ${PLATFORM_FEE_PERCENTAGE} basis points (${Number(PLATFORM_FEE_PERCENTAGE) / 100}%)`);
  console.log(`   Factory Owner: ${FACTORY_OWNER}`);
  console.log(`   Fee Recipient: ${deployer.address}`);
  console.log(`   OpenSea Proxy Registry: ${proxyRegistryAddress}`);

  // Step 1: Deploy the implementation contract (Art3HubCollection)
  console.log("\n🎨 Deploying Art3HubCollection implementation contract...");
  
  const Art3HubCollection = await ethers.getContractFactory("Art3HubCollection");
  const implementation = await Art3HubCollection.deploy();
  await implementation.waitForDeployment();
  
  const implementationAddress = await implementation.getAddress();
  console.log(`✅ Implementation deployed: ${implementationAddress}`);

  // Step 2: Deploy the factory contract
  console.log("\n🏭 Deploying Art3HubFactory contract...");
  
  const Art3HubFactory = await ethers.getContractFactory("Art3HubFactory");
  const factory = await Art3HubFactory.deploy(
    implementationAddress,
    DEPLOYMENT_FEE,
    PLATFORM_FEE_PERCENTAGE,
    deployer.address, // fee recipient
    proxyRegistryAddress // OpenSea proxy registry
  );

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ Factory deployed successfully!");
  console.log(`📍 Factory Address: ${factoryAddress}`);
  console.log(`📍 Implementation Address: ${implementationAddress}`);

  // Transfer ownership if different from deployer
  if (FACTORY_OWNER.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log(`\n🔄 Transferring factory ownership to ${FACTORY_OWNER}...`);
    const transferTx = await factory.transferOwnership(FACTORY_OWNER);
    await transferTx.wait();
    console.log("✅ Ownership transferred successfully!");
  }
  
  // Step 3: Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  try {
    const deploymentFee = await factory.deploymentFee();
    const platformFeePercentage = await factory.platformFeePercentage();
    const feeRecipient = await factory.feeRecipient();
    const factoryImplementation = await factory.implementation();
    const totalCollections = await factory.getTotalCollections();

    console.log(`   Deployment Fee: ${ethers.formatEther(deploymentFee)} ETH`);
    console.log(`   Platform Fee: ${platformFeePercentage} basis points`);
    console.log(`   Fee Recipient: ${feeRecipient}`);
    console.log(`   Implementation: ${factoryImplementation}`);
    console.log(`   Total Collections: ${totalCollections}`);
    
    // Verify implementation is correctly set
    if (factoryImplementation.toLowerCase() === implementationAddress.toLowerCase()) {
      console.log("✅ Implementation correctly linked to factory");
    } else {
      console.error("❌ Implementation address mismatch!");
    }
    
  } catch (error) {
    console.error("❌ Error verifying deployment:", error);
  }

  // Step 4: Test collection creation (optional, for testnet only)
  if (network.chainId === 84532n) { // Base Sepolia
    console.log("\n🧪 Testing collection creation on testnet...");
    
    try {
      const testParams = {
        name: "Test Artist Collection",
        symbol: "TEST",
        maxSupply: 100,
        mintPrice: ethers.parseEther("0.001"),
        contractURI: "https://api.art3hub.com/collections/test/metadata",
        baseURI: "https://api.art3hub.com/collections/test/tokens/",
        royaltyBps: 1000, // 10%
        royaltyRecipient: deployer.address
      };

      console.log("   Creating test collection...");
      const tx = await factory.createCollection(testParams, {
        value: DEPLOYMENT_FEE
      });
      
      const receipt = await tx.wait();
      console.log("✅ Test collection created successfully!");
      
      // Find the CollectionCreated event
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === 'CollectionCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = factory.interface.parseLog(event);
        console.log(`   Test Collection Address: ${parsed?.args?.collection}`);
      }
      
    } catch (error) {
      console.log("⚠️  Test collection creation failed (this is optional):", error);
    }
  }

  // Network-specific information
  if (network.chainId === 84532n) {
    console.log("\n🔗 Base Sepolia Testnet Links:");
    console.log(`   Factory Explorer: https://sepolia.basescan.org/address/${factoryAddress}`);
    console.log(`   Implementation Explorer: https://sepolia.basescan.org/address/${implementationAddress}`);
  } else if (network.chainId === 8453n) {
    console.log("\n🔗 Base Mainnet Links:");
    console.log(`   Factory Explorer: https://basescan.org/address/${factoryAddress}`);
    console.log(`   Implementation Explorer: https://basescan.org/address/${implementationAddress}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    factoryAddress,
    implementationAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    parameters: {
      deploymentFee: ethers.formatEther(DEPLOYMENT_FEE.toString()),
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
      feeRecipient: deployer.address
    }
  };

  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions for contract verification
  const networkName = network.chainId === 84532n ? 'baseSepolia' : 'base';
  console.log("\n🔐 To verify contracts on Basescan:");
  console.log(`# Verify Implementation:`);
  console.log(`npx hardhat verify --network ${networkName} ${implementationAddress}`);
  console.log(`\n# Verify Factory:`);
  console.log(`npx hardhat verify --network ${networkName} ${factoryAddress} "${implementationAddress}" "${DEPLOYMENT_FEE}" "${PLATFORM_FEE_PERCENTAGE}" "${deployer.address}" "${proxyRegistryAddress}"`);

  console.log("\n🎉 Factory deployment completed successfully!");
  console.log("\n📖 Usage Instructions:");
  console.log("1. Artists can call factory.createCollection() with their collection parameters");
  console.log("2. Each collection is deployed as a minimal proxy to save gas");
  console.log("3. Artists own their individual collections and can manage them independently");
  console.log("4. Platform collects fees on collection creation and mints");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Factory deployment failed:", error);
    process.exit(1);
  });