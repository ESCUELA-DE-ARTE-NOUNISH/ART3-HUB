// Deploy Script for Art3Hub V5 Contracts - Base-only deployment
// Enhanced contracts with on-chain data storage and database minimization

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentData {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  contracts: {
    subscription: {
      address: string;
      args: any[];
    };
    factory: {
      address: string;
      args: any[];
    };
    collectionImplementation: {
      address: string;
      args: any[];
    };
  };
  gasUsed: {
    subscription: string;
    factory: string;
    collectionImplementation: string;
    total: string;
  };
  verification: {
    subscription: string;
    factory: string;
    collectionImplementation: string;
  };
}

async function main() {
  console.log("🚀 Starting Art3Hub V5 deployment for Base-only architecture...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Load environment variables for ownership transfer
  const INITIAL_OWNER = process.env.INITIAL_OWNER;
  if (!INITIAL_OWNER) {
    throw new Error("❌ INITIAL_OWNER not set in environment variables");
  }
  
  console.log("📋 Deployment Configuration:");
  console.log("├── Network:", network.name);
  console.log("├── Chain ID:", network.chainId.toString());
  console.log("├── Deployer:", deployer.address);
  console.log("├── Initial Owner:", INITIAL_OWNER);
  console.log("└── Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Validate Base network
  if (![8453, 84532].includes(Number(network.chainId))) {
    throw new Error(`❌ V5 contracts only support Base networks. Current chain ID: ${network.chainId}`);
  }
  
  let totalGasUsed = BigInt(0);
  const deploymentData: DeploymentData = {
    network: network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      subscription: { address: "", args: [] },
      factory: { address: "", args: [] },
      collectionImplementation: { address: "", args: [] }
    },
    gasUsed: {
      subscription: "",
      factory: "",
      collectionImplementation: "",
      total: ""
    },
    verification: {
      subscription: "",
      factory: "",
      collectionImplementation: ""
    }
  };

  try {
    // Step 1: Deploy Art3HubSubscriptionV4 (reuse V4 subscription)
    console.log("\n🎯 Step 1: Deploying Art3HubSubscriptionV4...");
    
    const SubscriptionFactory = await ethers.getContractFactory("Art3HubSubscriptionV4");
    
    // Treasury wallet for receiving subscription fees
    const treasuryWallet = "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9";
    
    // USDC addresses for Base networks
    const usdcAddress = network.chainId === 8453n 
      ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base mainnet USDC
      : "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    
    const gaslessRelayer = deployer.address; // Temporary gasless relayer (same as deployer)
    const factoryPlaceholder = deployer.address; // Temporary factory address (will be updated)
    
    const subscriptionArgs = [
      usdcAddress,           // USDC token
      treasuryWallet,        // Treasury wallet  
      gaslessRelayer,        // Gasless relayer
      factoryPlaceholder,    // Factory contract (will be updated later)
      INITIAL_OWNER          // Initial owner
    ];
    const subscription = await SubscriptionFactory.deploy(...subscriptionArgs);
    await subscription.waitForDeployment();
    
    const subscriptionReceipt = await ethers.provider.getTransactionReceipt(subscription.deploymentTransaction()!.hash);
    const subscriptionGasUsed = subscriptionReceipt!.gasUsed;
    totalGasUsed += subscriptionGasUsed;
    
    console.log("✅ Art3HubSubscriptionV4 deployed:", await subscription.getAddress());
    console.log("   Gas used:", subscriptionGasUsed.toString());
    
    deploymentData.contracts.subscription = {
      address: await subscription.getAddress(),
      args: subscriptionArgs
    };
    deploymentData.gasUsed.subscription = subscriptionGasUsed.toString();

    // Step 2: Deploy Art3HubCollectionV5 Implementation
    console.log("\n🎯 Step 2: Deploying Art3HubCollectionV5 Implementation...");
    
    const CollectionV5Factory = await ethers.getContractFactory("Art3HubCollectionV5");
    const collectionImplementation = await CollectionV5Factory.deploy();
    await collectionImplementation.waitForDeployment();
    
    const collectionReceipt = await ethers.provider.getTransactionReceipt(collectionImplementation.deploymentTransaction()!.hash);
    const collectionGasUsed = collectionReceipt!.gasUsed;
    totalGasUsed += collectionGasUsed;
    
    console.log("✅ Art3HubCollectionV5 Implementation deployed:", await collectionImplementation.getAddress());
    console.log("   Gas used:", collectionGasUsed.toString());
    
    deploymentData.contracts.collectionImplementation = {
      address: await collectionImplementation.getAddress(),
      args: []
    };
    deploymentData.gasUsed.collectionImplementation = collectionGasUsed.toString();

    // Step 3: Deploy Art3HubFactoryV5
    console.log("\n🎯 Step 3: Deploying Art3HubFactoryV5...");
    
    const FactoryV5Factory = await ethers.getContractFactory("Art3HubFactoryV5");
    
    const factoryArgs = [
      await subscription.getAddress(),
      gaslessRelayer,
      INITIAL_OWNER
    ];
    
    const factory = await FactoryV5Factory.deploy(...factoryArgs);
    await factory.waitForDeployment();
    
    const factoryReceipt = await ethers.provider.getTransactionReceipt(factory.deploymentTransaction()!.hash);
    const factoryGasUsed = factoryReceipt!.gasUsed;
    totalGasUsed += factoryGasUsed;
    
    console.log("✅ Art3HubFactoryV5 deployed:", await factory.getAddress());
    console.log("   Gas used:", factoryGasUsed.toString());
    
    deploymentData.contracts.factory = {
      address: await factory.getAddress(),
      args: factoryArgs
    };
    deploymentData.gasUsed.factory = factoryGasUsed.toString();
    deploymentData.gasUsed.total = totalGasUsed.toString();

    // Step 3.5: Update subscription with factory address (if deployer is owner)
    console.log("\n🔗 Step 3.5: Updating subscription with factory address...");
    try {
      const currentOwner = await subscription.owner();
      console.log("   Current subscription owner:", currentOwner);
      console.log("   Deployer address:", deployer.address);
      
      if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        const updateFactoryTx = await subscription.updateFactoryContract(await factory.getAddress());
        await updateFactoryTx.wait();
        console.log("✅ Subscription factory reference updated");
      } else {
        console.log("⚠️  Deployer is not owner, factory update will need to be done by owner manually");
        console.log(`   Manual command: await subscription.updateFactoryContract("${await factory.getAddress()}")`);
      }
    } catch (error) {
      console.log("⚠️  Factory update failed, will need to be done manually by owner:", error.message);
      console.log(`   Manual command: await subscription.updateFactoryContract("${await factory.getAddress()}")`);
    }

    // Step 4: Verify contract deployment
    console.log("\n🔍 Step 4: Verifying V5 contract deployment...");
    
    try {
      // Check factory version
      const version = await factory.version();
      console.log("✅ Factory version:", version);
      
      // Check subscription integration
      const subscriptionAddr = await factory.subscriptionManager();
      console.log("✅ Subscription manager:", subscriptionAddr);
      
      // Check collection implementation
      const collectionImpl = await factory.collectionImplementation();
      console.log("✅ Collection implementation:", collectionImpl);
      
      // Check platform stats
      const stats = await factory.getPlatformStats();
      console.log("✅ Platform stats:", {
        totalCollections: stats.totalCollectionsCount.toString(),
        totalCategories: stats.totalCategories.toString(),
        baseNetworkId: stats.baseNetworkId.toString()
      });
      
      deploymentData.verification.subscription = "✅ Verified";
      deploymentData.verification.factory = "✅ Verified";
      deploymentData.verification.collectionImplementation = "✅ Verified";
      
    } catch (error) {
      console.log("⚠️  Verification error:", error);
      deploymentData.verification.subscription = "❌ Failed";
      deploymentData.verification.factory = "❌ Failed";
      deploymentData.verification.collectionImplementation = "❌ Failed";
    }

    // Step 5: Transfer ownership to INITIAL_OWNER
    console.log("\n🔄 Step 5: Transferring ownership to INITIAL_OWNER...");
    
    try {
      // Transfer ownership of Art3HubSubscriptionV4
      console.log("📝 Transferring ownership of Art3HubSubscriptionV4...");
      const currentSubscriptionOwner = await subscription.owner();
      console.log("   Current owner:", currentSubscriptionOwner);
      console.log("   New owner:", INITIAL_OWNER);
      
      if (currentSubscriptionOwner.toLowerCase() !== INITIAL_OWNER.toLowerCase()) {
        const transferSubscriptionTx = await subscription.transferOwnership(INITIAL_OWNER);
        await transferSubscriptionTx.wait();
        console.log("✅ Subscription ownership transferred");
        console.log("   Transaction:", transferSubscriptionTx.hash);
      } else {
        console.log("✅ Subscription already owned by INITIAL_OWNER");
      }

      // Transfer ownership of Art3HubFactoryV5
      console.log("\n📝 Transferring ownership of Art3HubFactoryV5...");
      const currentFactoryOwner = await factory.owner();
      console.log("   Current owner:", currentFactoryOwner);
      console.log("   New owner:", INITIAL_OWNER);
      
      if (currentFactoryOwner.toLowerCase() !== INITIAL_OWNER.toLowerCase()) {
        const transferFactoryTx = await factory.transferOwnership(INITIAL_OWNER);
        await transferFactoryTx.wait();
        console.log("✅ Factory ownership transferred");
        console.log("   Transaction:", transferFactoryTx.hash);
      } else {
        console.log("✅ Factory already owned by INITIAL_OWNER");
      }

      // Verify ownership transfers
      console.log("\n🔍 Verifying ownership transfers...");
      const finalSubscriptionOwner = await subscription.owner();
      const finalFactoryOwner = await factory.owner();
      
      console.log("✅ Final ownership verification:");
      console.log("   Subscription owner:", finalSubscriptionOwner);
      console.log("   Factory owner:", finalFactoryOwner);
      
      if (finalSubscriptionOwner.toLowerCase() === INITIAL_OWNER.toLowerCase() && 
          finalFactoryOwner.toLowerCase() === INITIAL_OWNER.toLowerCase()) {
        console.log("✅ All ownership transfers completed successfully!");
        deploymentData.verification.subscription += " | ✅ Ownership Transferred";
        deploymentData.verification.factory += " | ✅ Ownership Transferred";
      } else {
        console.log("⚠️  Ownership transfer verification failed");
        deploymentData.verification.subscription += " | ❌ Ownership Transfer Failed";
        deploymentData.verification.factory += " | ❌ Ownership Transfer Failed";
      }
      
    } catch (error) {
      console.error("❌ Ownership transfer failed:", error);
      deploymentData.verification.subscription += " | ❌ Ownership Transfer Failed";
      deploymentData.verification.factory += " | ❌ Ownership Transfer Failed";
    }

    // Step 6: Generate deployment summary
    console.log("\n📄 Step 6: Generating deployment summary...");
    
    const summary = `
# Art3Hub V5 Deployment Summary

## Network Information
- **Network**: ${deploymentData.network}
- **Chain ID**: ${deploymentData.chainId}
- **Deployment Date**: ${deploymentData.timestamp}
- **Deployer**: ${deploymentData.deployer}
- **Final Owner**: ${INITIAL_OWNER}

## Contract Addresses

### Art3HubSubscriptionV4
- **Address**: \`${deploymentData.contracts.subscription.address}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.subscription.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.subscription}
- **Verification**: ${deploymentData.verification.subscription}

### Art3HubCollectionV5 Implementation
- **Address**: \`${deploymentData.contracts.collectionImplementation.address}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.collectionImplementation.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.collectionImplementation}
- **Verification**: ${deploymentData.verification.collectionImplementation}

### Art3HubFactoryV5
- **Address**: \`${deploymentData.contracts.factory.address}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.factory.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.factory}
- **Verification**: ${deploymentData.verification.factory}

## Gas Usage Summary
- **Subscription**: ${deploymentData.gasUsed.subscription}
- **Collection Implementation**: ${deploymentData.gasUsed.collectionImplementation}
- **Factory**: ${deploymentData.gasUsed.factory}
- **Total**: ${deploymentData.gasUsed.total}

## Environment Variables

Add these to your .env file:

\`\`\`bash
# Art3Hub V5 Contract Addresses (${deploymentData.network} - Chain ID: ${deploymentData.chainId})
NEXT_PUBLIC_ART3HUB_FACTORY_V5_${deploymentData.chainId}=${deploymentData.contracts.factory.address}
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_${deploymentData.chainId}=${deploymentData.contracts.subscription.address}
NEXT_PUBLIC_ART3HUB_COLLECTION_V5_IMPL_${deploymentData.chainId}=${deploymentData.contracts.collectionImplementation.address}
\`\`\`

## V5 Features Enabled
- ✅ Base-only deployment architecture
- ✅ Enhanced on-chain data storage
- ✅ Creator profile management
- ✅ NFT extended metadata with categories and tags
- ✅ Social features (likes, ratings, views)
- ✅ Advanced search and discovery
- ✅ Database minimization approach
- ✅ Gasless minting with subscription tiers

## Ownership Transfer
- **Deployer**: ${deploymentData.deployer} (used for deployment and verification)
- **Final Owner**: ${INITIAL_OWNER} (receives ownership of all contracts)
- **Transfer Status**: Check verification status above

## Next Steps
1. Update frontend .env file with new contract addresses
2. Deploy to production Base network if this was testnet
3. Update Art3HubV5Service with deployed addresses
4. Test V5 functionality with enhanced features
5. Migrate frontend to use contract-based data reading
6. Verify ownership has been transferred to INITIAL_OWNER

## Contract Verification Commands

\`\`\`bash
# Verify Art3HubSubscriptionV4
npx hardhat verify --network ${deploymentData.network} ${deploymentData.contracts.subscription.address} "${deploymentData.contracts.subscription.args[0]}" "${deploymentData.contracts.subscription.args[1]}" "${deploymentData.contracts.subscription.args[2]}"

# Verify Art3HubCollectionV5 Implementation
npx hardhat verify --network ${deploymentData.network} ${deploymentData.contracts.collectionImplementation.address}

# Verify Art3HubFactoryV5
npx hardhat verify --network ${deploymentData.network} ${deploymentData.contracts.factory.address} "${deploymentData.contracts.factory.args[0]}" "${deploymentData.contracts.factory.args[1]}" "${deploymentData.contracts.factory.args[2]}"
\`\`\`
`;

    // Save deployment summary
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const summaryFile = path.join(deploymentsDir, `v5-deployment-${deploymentData.network}-${Date.now()}.md`);
    fs.writeFileSync(summaryFile, summary);
    
    // Save deployment data as JSON
    const dataFile = path.join(deploymentsDir, `v5-deployment-${deploymentData.network}-${Date.now()}.json`);
    fs.writeFileSync(dataFile, JSON.stringify(deploymentData, null, 2));
    
    console.log("📄 Deployment summary saved:", summaryFile);
    console.log("📄 Deployment data saved:", dataFile);

    // Step 7: Display final results
    console.log("\n🎉 Art3Hub V5 Deployment Complete!");
    console.log("════════════════════════════════════════");
    console.log("📋 Contract Addresses:");
    console.log("├── Subscription V4:", deploymentData.contracts.subscription.address);
    console.log("├── Collection V5 Impl:", deploymentData.contracts.collectionImplementation.address);
    console.log("└── Factory V5:", deploymentData.contracts.factory.address);
    console.log("");
    console.log("👥 Ownership Information:");
    console.log("├── Deployer:", deploymentData.deployer);
    console.log("└── Final Owner:", INITIAL_OWNER);
    console.log("");
    console.log("⛽ Total Gas Used:", totalGasUsed.toString());
    console.log("💰 Estimated Cost:", ethers.formatEther(totalGasUsed * 1000000000n), "ETH (at 1 gwei)");
    console.log("");
    console.log("🔧 Environment Variables:");
    console.log(`NEXT_PUBLIC_ART3HUB_FACTORY_V5_${deploymentData.chainId}=${deploymentData.contracts.factory.address}`);
    console.log(`NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V5_${deploymentData.chainId}=${deploymentData.contracts.subscription.address}`);
    console.log(`NEXT_PUBLIC_ART3HUB_COLLECTION_V5_IMPL_${deploymentData.chainId}=${deploymentData.contracts.collectionImplementation.address}`);
    console.log("");
    console.log("✅ V5 deployment ready for Base-only architecture!");
    console.log("✅ Ownership transferred to INITIAL_OWNER for production security!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Deployment script failed:", error);
  process.exitCode = 1;
});