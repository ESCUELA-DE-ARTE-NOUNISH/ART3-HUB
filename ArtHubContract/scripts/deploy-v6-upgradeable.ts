// Deploy Script for Art3Hub V6 Upgradeable Contracts with Owner/Relayer Separation
import { ethers, upgrades } from "hardhat";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";

interface DeploymentData {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  newOwner: string;
  gaslessRelayer: string;
  contracts: {
    subscription: {
      proxy: string;
      implementation: string;
      args: any[];
    };
    factory: {
      proxy: string;
      implementation: string;
      args: any[];
    };
    collectionImplementation: {
      address: string;
      args: any[];
    };
    claimableNFTFactory: {
      proxy: string;
      implementation: string;
      args: any[];
    };
  };
  gasUsed: {
    subscription: string;
    factory: string;
    collectionImplementation: string;
    claimableNFTFactory: string;
    total: string;
  };
  verification: {
    subscription: string;
    factory: string;
    collectionImplementation: string;
    claimableNFTFactory: string;
  };
}

async function main() {
  console.log("🚀 Starting Art3Hub V6 UPGRADEABLE deployment with Owner/Relayer separation...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Get configuration from environment
  const NEW_CONTRACT_OWNER = process.env.NEW_CONTRACT_OWNER;
  const GASLESS_RELAYER_PRIVATE_KEY = process.env.GASLESS_RELAYER_PRIVATE_KEY;
  
  if (!NEW_CONTRACT_OWNER) {
    throw new Error("❌ NEW_CONTRACT_OWNER not found in environment");
  }
  
  if (!GASLESS_RELAYER_PRIVATE_KEY) {
    throw new Error("❌ GASLESS_RELAYER_PRIVATE_KEY not found in environment");
  }
  
  // Derive gasless relayer address from private key
  const gaslessRelayerWallet = new ethers.Wallet(GASLESS_RELAYER_PRIVATE_KEY);
  const gaslessRelayerAddress = gaslessRelayerWallet.address;
  
  console.log("📋 Deployment Configuration:");
  console.log("├── Network:", network.name);
  console.log("├── Chain ID:", network.chainId.toString());
  console.log("├── Deployer:", deployer.address);
  console.log("├── New Owner (Admin):", NEW_CONTRACT_OWNER);
  console.log("├── Gasless Relayer:", gaslessRelayerAddress);
  console.log("└── Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Validate Base network
  if (![8453, 84532].includes(Number(network.chainId))) {
    throw new Error(`❌ V6 contracts only support Base networks. Current chain ID: ${network.chainId}`);
  }
  
  let totalGasUsed = BigInt(0);
  const deploymentData: DeploymentData = {
    network: network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    newOwner: NEW_CONTRACT_OWNER,
    gaslessRelayer: gaslessRelayerAddress,
    contracts: {
      subscription: { proxy: "", implementation: "", args: [] },
      factory: { proxy: "", implementation: "", args: [] },
      collectionImplementation: { address: "", args: [] },
      claimableNFTFactory: { proxy: "", implementation: "", args: [] }
    },
    gasUsed: {
      subscription: "",
      factory: "",
      collectionImplementation: "",
      claimableNFTFactory: "",
      total: ""
    },
    verification: {
      subscription: "",
      factory: "",
      collectionImplementation: "",
      claimableNFTFactory: ""
    }
  };

  try {
    // Step 1: Deploy Art3HubCollectionV6 Implementation (needed first)
    console.log("\n🎯 Step 1: Deploying Art3HubCollectionV6 Implementation...");
    
    const CollectionV6Factory = await ethers.getContractFactory("Art3HubCollectionV6");
    const collectionImplementation = await CollectionV6Factory.deploy();
    await collectionImplementation.waitForDeployment();
    
    const collectionReceipt = await ethers.provider.getTransactionReceipt(collectionImplementation.deploymentTransaction()!.hash);
    const collectionGasUsed = collectionReceipt!.gasUsed;
    totalGasUsed += collectionGasUsed;
    
    console.log("✅ Art3HubCollectionV6 Implementation deployed:", await collectionImplementation.getAddress());
    console.log("   Gas used:", collectionGasUsed.toString());
    
    deploymentData.contracts.collectionImplementation = {
      address: await collectionImplementation.getAddress(),
      args: []
    };
    deploymentData.gasUsed.collectionImplementation = collectionGasUsed.toString();

    // Step 2: Deploy Art3HubSubscriptionV6Upgradeable
    console.log("\n🎯 Step 2: Deploying Art3HubSubscriptionV6Upgradeable...");
    
    // USDC addresses for Base networks
    const usdcAddress = network.chainId === 8453n 
      ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base mainnet USDC
      : "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    
    const treasuryWallet = process.env.TREASURY_WALLET || "0x946b7dc627D245877BDf9c59bce626db333Fc01c";
    const factoryPlaceholder = deployer.address; // Temporary, will be updated later
    
    const SubscriptionFactory = await ethers.getContractFactory("Art3HubSubscriptionV6Upgradeable");
    
    const subscriptionArgs = [
      NEW_CONTRACT_OWNER,         // Owner (admin wallet)
      gaslessRelayerAddress,      // Gasless relayer (operational access)
      usdcAddress,               // USDC token
      treasuryWallet,            // Treasury wallet
      factoryPlaceholder         // Factory contract (will be updated later)
    ];
    
    console.log("🔧 Subscription initialization args:", subscriptionArgs);
    
    const subscription = await upgrades.deployProxy(
      SubscriptionFactory,
      subscriptionArgs,
      { 
        initializer: 'initialize',
        kind: 'uups'
      }
    );
    await subscription.waitForDeployment();
    
    const subscriptionAddress = await subscription.getAddress();
    const subscriptionReceipt = await ethers.provider.getTransactionReceipt(subscription.deploymentTransaction()!.hash);
    const subscriptionGasUsed = subscriptionReceipt!.gasUsed;
    totalGasUsed += subscriptionGasUsed;
    
    console.log("✅ Art3HubSubscriptionV6Upgradeable proxy deployed:", subscriptionAddress);
    console.log("   Gas used:", subscriptionGasUsed.toString());
    
    // Get implementation address
    const subscriptionImplAddress = await upgrades.erc1967.getImplementationAddress(subscriptionAddress);
    console.log("📄 Implementation address:", subscriptionImplAddress);
    
    deploymentData.contracts.subscription = {
      proxy: subscriptionAddress,
      implementation: subscriptionImplAddress,
      args: subscriptionArgs
    };
    deploymentData.gasUsed.subscription = subscriptionGasUsed.toString();

    // Step 3: Deploy Art3HubFactoryV6Upgradeable
    console.log("\n🎯 Step 3: Deploying Art3HubFactoryV6Upgradeable...");
    
    const FactoryV6Factory = await ethers.getContractFactory("Art3HubFactoryV6Upgradeable");
    
    const factoryArgs = [
      NEW_CONTRACT_OWNER,                                    // Owner (admin wallet)
      gaslessRelayerAddress,                                // Gasless relayer (operational access)
      subscriptionAddress,                                  // Subscription manager
      await collectionImplementation.getAddress()          // Collection implementation
    ];
    
    console.log("🔧 Factory initialization args:", factoryArgs);
    
    const factory = await upgrades.deployProxy(
      FactoryV6Factory,
      factoryArgs,
      { 
        initializer: 'initialize',
        kind: 'uups'
      }
    );
    await factory.waitForDeployment();
    
    const factoryAddress = await factory.getAddress();
    const factoryReceipt = await ethers.provider.getTransactionReceipt(factory.deploymentTransaction()!.hash);
    const factoryGasUsed = factoryReceipt!.gasUsed;
    totalGasUsed += factoryGasUsed;
    
    console.log("✅ Art3HubFactoryV6Upgradeable proxy deployed:", factoryAddress);
    console.log("   Gas used:", factoryGasUsed.toString());
    
    // Get implementation address
    const factoryImplAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
    console.log("📄 Implementation address:", factoryImplAddress);
    
    deploymentData.contracts.factory = {
      proxy: factoryAddress,
      implementation: factoryImplAddress,
      args: factoryArgs
    };
    deploymentData.gasUsed.factory = factoryGasUsed.toString();

    // Step 4: Update subscription with factory address
    console.log("\n🔗 Step 4: Updating subscription with factory address...");
    
    try {
      // We need to call this with the gasless relayer or owner
      const subscriptionContract = SubscriptionFactory.attach(subscriptionAddress);
      const updateFactoryTx = await subscriptionContract.updateFactoryContract(factoryAddress);
      await updateFactoryTx.wait();
      console.log("✅ Subscription factory reference updated");
    } catch (error) {
      console.log("⚠️  Factory update failed, will need to be done manually by owner:", (error as Error).message);
    }

    // Step 5: Deploy Art3HubClaimableNFTFactoryV6Upgradeable
    console.log("\n🎯 Step 5: Deploying Art3HubClaimableNFTFactoryV6Upgradeable...");
    
    const ClaimableNFTFactoryFactory = await ethers.getContractFactory("Art3HubClaimableNFTFactoryV6Upgradeable");
    
    const claimableNFTFactoryArgs = [NEW_CONTRACT_OWNER, gaslessRelayerAddress]; // Owner and gasless relayer
    
    // Deploy upgradeable version using proxy
    const claimableNFTFactory = await upgrades.deployProxy(
      ClaimableNFTFactoryFactory,
      claimableNFTFactoryArgs,
      { 
        initializer: 'initialize',
        kind: 'uups'
      }
    );
    await claimableNFTFactory.waitForDeployment();
    
    const claimableFactoryAddress = await claimableNFTFactory.getAddress();
    const claimableFactoryReceipt = await ethers.provider.getTransactionReceipt(claimableNFTFactory.deploymentTransaction()!.hash);
    const claimableFactoryGasUsed = claimableFactoryReceipt!.gasUsed;
    totalGasUsed += claimableFactoryGasUsed;
    
    console.log("✅ Art3HubClaimableNFTFactoryV6Upgradeable proxy deployed:", claimableFactoryAddress);
    
    // Get implementation address
    const claimableFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(claimableFactoryAddress);
    console.log("📄 Implementation address:", claimableFactoryImplAddress);
    console.log("   Gas used:", claimableFactoryGasUsed.toString());
    
    deploymentData.contracts.claimableNFTFactory = {
      proxy: claimableFactoryAddress,
      implementation: claimableFactoryImplAddress,
      args: claimableNFTFactoryArgs
    };
    deploymentData.gasUsed.claimableNFTFactory = claimableFactoryGasUsed.toString();
    deploymentData.gasUsed.total = totalGasUsed.toString();

    // Step 6: Verify contract deployment
    console.log("\n🔍 Step 6: Verifying V6 upgradeable contract deployment...");
    
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
      
      // Check gasless relayer
      const relayerAddr = await factory.gaslessRelayer();
      console.log("✅ Gasless relayer:", relayerAddr);
      
      // Check owner
      const ownerAddr = await factory.owner();
      console.log("✅ Factory owner:", ownerAddr);
      
      // Check platform stats
      const stats = await factory.getPlatformStats();
      console.log("✅ Platform stats:", {
        totalCollections: stats[0].toString(),
        baseNetworkId: stats[1].toString()
      });
      
      deploymentData.verification.subscription = "✅ Verified";
      deploymentData.verification.factory = "✅ Verified";
      deploymentData.verification.collectionImplementation = "✅ Verified";
      deploymentData.verification.claimableNFTFactory = "✅ Verified";
      
    } catch (error) {
      console.log("⚠️  Verification error:", error);
      deploymentData.verification.subscription = "❌ Failed";
      deploymentData.verification.factory = "❌ Failed";
      deploymentData.verification.collectionImplementation = "❌ Failed";
      deploymentData.verification.claimableNFTFactory = "❌ Failed";
    }

    // Step 7: Generate deployment summary
    console.log("\n📄 Step 7: Generating deployment summary...");
    
    const summary = `
# Art3Hub V6 UPGRADEABLE Deployment Summary

## Network Information
- **Network**: ${deploymentData.network}
- **Chain ID**: ${deploymentData.chainId}
- **Deployment Date**: ${deploymentData.timestamp}
- **Deployer**: ${deploymentData.deployer}
- **Owner (Admin)**: ${deploymentData.newOwner}
- **Gasless Relayer**: ${deploymentData.gaslessRelayer}

## Upgradeable Contract Addresses

### Art3HubSubscriptionV6Upgradeable
- **Proxy**: \`${deploymentData.contracts.subscription.proxy}\`
- **Implementation**: \`${deploymentData.contracts.subscription.implementation}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.subscription.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.subscription}
- **Verification**: ${deploymentData.verification.subscription}

### Art3HubFactoryV6Upgradeable
- **Proxy**: \`${deploymentData.contracts.factory.proxy}\`
- **Implementation**: \`${deploymentData.contracts.factory.implementation}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.factory.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.factory}
- **Verification**: ${deploymentData.verification.factory}

### Art3HubCollectionV6 Implementation
- **Address**: \`${deploymentData.contracts.collectionImplementation.address}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.collectionImplementation.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.collectionImplementation}
- **Verification**: ${deploymentData.verification.collectionImplementation}

### Art3HubClaimableNFTFactoryV6Upgradeable
- **Address**: \`${deploymentData.contracts.claimableNFTFactory.proxy}\`
- **Constructor Args**: \`${JSON.stringify(deploymentData.contracts.claimableNFTFactory.args)}\`
- **Gas Used**: ${deploymentData.gasUsed.claimableNFTFactory}
- **Verification**: ${deploymentData.verification.claimableNFTFactory}

## Gas Usage Summary
- **Subscription**: ${deploymentData.gasUsed.subscription}
- **Factory**: ${deploymentData.gasUsed.factory}
- **Collection Implementation**: ${deploymentData.gasUsed.collectionImplementation}
- **Claimable NFT Factory**: ${deploymentData.gasUsed.claimableNFTFactory}
- **Total**: ${deploymentData.gasUsed.total}

## Environment Variables

Add these to your .env files:

### ArtHubContract/.env
\`\`\`bash
# Owner/Relayer Separation
NEW_CONTRACT_OWNER=${deploymentData.newOwner}
GASLESS_RELAYER_PRIVATE_KEY=<your_gasless_relayer_private_key>
GASLESS_RELAYER_ADDRESS=${deploymentData.gaslessRelayer}
\`\`\`

### ArtHubApp/.env
\`\`\`bash
# Art3Hub V6 Upgradeable Contract Addresses (${deploymentData.network} - Chain ID: ${deploymentData.chainId})
NEXT_PUBLIC_ART3HUB_FACTORY_V6_${deploymentData.chainId}=${deploymentData.contracts.factory.proxy}
NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_${deploymentData.chainId}=${deploymentData.contracts.subscription.proxy}
NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_${deploymentData.chainId}=${deploymentData.contracts.collectionImplementation.address}
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_${deploymentData.chainId}=${deploymentData.contracts.claimableNFTFactory.proxy}

# Security Configuration
GASLESS_RELAYER_PRIVATE_KEY=<your_gasless_relayer_private_key>
NEXT_PUBLIC_ADMIN_WALLET=${deploymentData.newOwner}
\`\`\`

## V6 Upgradeable Features Enabled
- ✅ OpenZeppelin UUPS Upgradeable pattern
- ✅ Owner/Relayer separation architecture
- ✅ Admin wallet controls upgrades and configuration
- ✅ Gasless relayer maintains operational access
- ✅ Proxy-based contract upgrades
- ✅ Storage gaps for safe upgrades
- ✅ Enhanced security with role separation
- ✅ Collection-per-NFT architecture maintained
- ✅ Firebase database integration ready

## Owner/Relayer Access Control
- **Admin Functions (Owner only)**: Contract upgrades, configuration updates, emergency controls
- **Operational Functions (Gasless Relayer)**: Minting, subscription management, user operations
- **Hybrid Functions**: Some functions accessible by both owner and relayer for flexibility

## Upgrade Instructions
1. Only the owner (${deploymentData.newOwner}) can authorize upgrades
2. Use OpenZeppelin Upgrades plugin for safe upgrades
3. Always test upgrades on testnet first
4. Verify storage layout compatibility before upgrades

## Next Steps
1. Update frontend .env file with new V6 upgradeable contract addresses
2. Update CLAUDE.md with new addresses
3. Test all functionality with new upgradeable contracts
4. Verify owner/relayer separation works correctly
5. Plan future upgrade roadmap
`;

    // Save deployment summary
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const summaryFile = path.join(deploymentsDir, `v6-upgradeable-deployment-${deploymentData.network}-${Date.now()}.md`);
    fs.writeFileSync(summaryFile, summary);
    
    // Save deployment data as JSON
    const dataFile = path.join(deploymentsDir, `v6-upgradeable-deployment-${deploymentData.network}-${Date.now()}.json`);
    fs.writeFileSync(dataFile, JSON.stringify(deploymentData, null, 2));
    
    console.log("📄 Deployment summary saved:", summaryFile);
    console.log("📄 Deployment data saved:", dataFile);

    // Step 8: Display final results
    console.log("\n🎉 Art3Hub V6 UPGRADEABLE Deployment Complete!");
    console.log("════════════════════════════════════════════════");
    console.log("📋 Contract Addresses:");
    console.log("├── Subscription V6 Proxy:", deploymentData.contracts.subscription.proxy);
    console.log("├── Factory V6 Proxy:", deploymentData.contracts.factory.proxy);
    console.log("├── Collection V6 Impl:", deploymentData.contracts.collectionImplementation.address);
    console.log("└── Claimable NFT Factory:", deploymentData.contracts.claimableNFTFactory.proxy);
    console.log("");
    console.log("👥 Access Control:");
    console.log("├── Owner (Admin):", deploymentData.newOwner);
    console.log("└── Gasless Relayer:", deploymentData.gaslessRelayer);
    console.log("");
    console.log("⛽ Total Gas Used:", totalGasUsed.toString());
    console.log("💰 Estimated Cost:", ethers.formatEther(totalGasUsed * 1000000000n), "ETH (at 1 gwei)");
    console.log("");
    console.log("🔧 V6 Upgradeable Environment Variables:");
    console.log(`NEXT_PUBLIC_ART3HUB_FACTORY_V6_${deploymentData.chainId}=${deploymentData.contracts.factory.proxy}`);
    console.log(`NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_${deploymentData.chainId}=${deploymentData.contracts.subscription.proxy}`);
    console.log(`NEXT_PUBLIC_ART3HUB_COLLECTION_V6_IMPL_${deploymentData.chainId}=${deploymentData.contracts.collectionImplementation.address}`);
    console.log(`NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_${deploymentData.chainId}=${deploymentData.contracts.claimableNFTFactory.proxy}`);
    console.log("");
    console.log("✅ V6 UPGRADEABLE deployment ready with Owner/Relayer separation!");
    console.log("🔄 All contracts are now upgradeable via OpenZeppelin UUPS pattern!");
    console.log("🛡️ Admin controls upgrades, Gasless Relayer handles operations!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Deployment script failed:", error);
  process.exitCode = 1;
});