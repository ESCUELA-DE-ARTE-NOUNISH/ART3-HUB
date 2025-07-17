import { ethers } from "hardhat";
import { network } from "hardhat";

// USDC addresses for different networks
const USDC_ADDRESSES: { [key: string]: string } = {
  // Testnets
  "baseSepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "celoSepolia": "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
  "zoraSepolia": "0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4",
  
  // Mainnets
  "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "celo": "0xef4229c8c3250C675F21BCefa42f58EfbfF6002a",
  "zora": "0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4",
};

// Configuration - Update these addresses
const TREASURY_WALLET = "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9";
const GASLESS_RELAYER_WALLET = "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1";

async function main() {
  console.log("🚀 Deploying Art3Hub V4 Smart Contracts...");
  console.log("Network:", network.name);
  
  const [deployer] = await ethers.getSigners();
  
  // Load environment variables for ownership transfer
  const INITIAL_OWNER = process.env.INITIAL_OWNER;
  if (!INITIAL_OWNER) {
    throw new Error("❌ INITIAL_OWNER not set in environment variables");
  }
  
  console.log("Deployer address:", deployer.address);
  console.log("Initial Owner:", INITIAL_OWNER);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Get USDC address for current network
  const usdcAddress = USDC_ADDRESSES[network.name];
  if (!usdcAddress) {
    throw new Error(`USDC address not configured for network: ${network.name}`);
  }
  console.log("USDC Token address:", usdcAddress);

  // 1. Deploy Art3HubSubscriptionV4
  console.log("\n📋 Deploying Art3HubSubscriptionV4...");
  const SubscriptionV4 = await ethers.getContractFactory("Art3HubSubscriptionV4");
  const subscription = await SubscriptionV4.deploy(
    usdcAddress,           // USDC token
    TREASURY_WALLET,       // Treasury wallet
    GASLESS_RELAYER_WALLET, // Gasless relayer
    deployer.address,      // Factory contract (will be updated later)
    INITIAL_OWNER          // Initial owner
  );
  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();
  console.log("✅ Art3HubSubscriptionV4 deployed to:", subscriptionAddress);

  // 2. Deploy Art3HubFactoryV4
  console.log("\n🏭 Deploying Art3HubFactoryV4...");
  const FactoryV4 = await ethers.getContractFactory("Art3HubFactoryV4");
  const factory = await FactoryV4.deploy(
    subscriptionAddress,   // Subscription manager
    GASLESS_RELAYER_WALLET, // Gasless relayer
    INITIAL_OWNER          // Initial owner
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Art3HubFactoryV4 deployed to:", factoryAddress);

  // 3. Update subscription manager to recognize factory
  console.log("\n🔗 Updating subscription manager factory reference...");
  await subscription.updateFactoryContract(factoryAddress);
  console.log("✅ Factory reference updated in subscription manager");

  // 4. Get collection implementation address
  const collectionImplementation = await factory.collectionImplementation();
  console.log("✅ Art3HubCollectionV4 implementation deployed to:", collectionImplementation);

  // 5. Verify plan configurations
  console.log("\n📊 Verifying plan configurations...");
  const [freePlan] = await subscription.getPlanConfig(0); // FREE
  const [masterPlan] = await subscription.getPlanConfig(1); // MASTER
  const [elitePlan] = await subscription.getPlanConfig(2); // ELITE

  console.log("Plan configurations:");
  console.log("- FREE Plan: $0, 1 NFT/month");
  console.log("- MASTER Plan: $" + (Number(masterPlan) / 1_000_000).toFixed(2) + ", 10 NFTs/month");
  console.log("- ELITE Plan: $" + (Number(elitePlan) / 1_000_000).toFixed(2) + ", 25 NFTs/month");

  // 6. Display deployment summary
  console.log("\n🎉 Art3Hub V4 Deployment Complete!");
  console.log("=" * 60);
  console.log("📋 Contract Addresses:");
  console.log("Art3HubSubscriptionV4:", subscriptionAddress);
  console.log("Art3HubFactoryV4:", factoryAddress);
  console.log("Art3HubCollectionV4 (impl):", collectionImplementation);
  console.log("");
  console.log("🔧 Configuration:");
  console.log("Network:", network.name);
  console.log("Chain ID:", (await deployer.provider.getNetwork()).chainId);
  console.log("USDC Token:", usdcAddress);
  console.log("Treasury Wallet:", TREASURY_WALLET);
  console.log("Gasless Relayer:", GASLESS_RELAYER_WALLET);
  console.log("Contract Owner:", INITIAL_OWNER);

  // 6. Transfer ownership to INITIAL_OWNER
  console.log("\n🔄 Transferring ownership to INITIAL_OWNER...");
  
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

    // Transfer ownership of Art3HubFactoryV4
    console.log("\n📝 Transferring ownership of Art3HubFactoryV4...");
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
    } else {
      console.log("⚠️  Ownership transfer verification failed");
    }
    
  } catch (error) {
    console.error("❌ Ownership transfer failed:", error);
  }

  // 7. Generate environment variables
  const chainId = (await deployer.provider.getNetwork()).chainId;
  console.log("\n📄 Environment Variables to add to .env:");
  console.log("=" * 60);
  console.log(`NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_${chainId}=${subscriptionAddress}`);
  console.log(`NEXT_PUBLIC_ART3HUB_FACTORY_V4_${chainId}=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_ART3HUB_COLLECTION_V4_IMPL_${chainId}=${collectionImplementation}`);

  // 8. Display verification commands
  console.log("\n🔍 Verification Commands:");
  console.log("=" * 60);
  console.log(`npx hardhat verify --network ${network.name} ${subscriptionAddress} "${usdcAddress}" "${TREASURY_WALLET}" "${GASLESS_RELAYER_WALLET}" "${deployer.address}" "${INITIAL_OWNER}"`);
  console.log(`npx hardhat verify --network ${network.name} ${factoryAddress} "${subscriptionAddress}" "${GASLESS_RELAYER_WALLET}" "${INITIAL_OWNER}"`);
  console.log(`npx hardhat verify --network ${network.name} ${collectionImplementation}`);

  // 9. Next steps
  console.log("\n📝 Next Steps:");
  console.log("1. Add environment variables to your .env file");
  console.log("2. Verify contracts on block explorer");
  console.log("3. Fund the gasless relayer wallet with ETH");
  console.log("4. Test contract functionality");
  console.log("5. Update frontend to use V4 contracts");
  console.log("6. Verify ownership has been transferred to INITIAL_OWNER");

  console.log("\n✨ V4 Features Available:");
  console.log("- FREE Plan: 1 NFT per month (updated from yearly)");
  console.log("- MASTER Plan: $4.99/month, 10 NFTs/month");
  console.log("- ELITE Creator Plan: $9.99/month, 25 NFTs/month");
  console.log("- Gasless transactions for all plans");
  console.log("- Plan upgrade/downgrade functionality");
  console.log("- Auto-enrollment in Free plan");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });