import { ethers } from "hardhat";
import { Art3HubSubscriptionV3, Art3HubFactoryV3 } from "../typechain-types";

async function main() {
  console.log("🚀 Deploying Art3Hub V3 contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Configuration based on network
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  console.log("🌐 Deploying to chain ID:", chainId.toString());

  // Get configuration from environment variables
  const treasuryWallet = process.env.TREASURY_WALLET;
  const gaslessRelayerWallet = process.env.GASLESS_RELAYER;
  
  if (!treasuryWallet) {
    throw new Error("TREASURY_WALLET not set in environment");
  }
  if (!gaslessRelayerWallet) {
    throw new Error("GASLESS_RELAYER not set in environment");
  }

  // Network-specific configuration
  let usdcAddress: string;
  let networkName: string;

  if (chainId === 84532n) { // Base Sepolia (Testnet)
    usdcAddress = process.env.USDC_ADDRESS_BASE_SEPOLIA || "";
    networkName = "Base Sepolia";
  } else if (chainId === 8453n) { // Base Mainnet
    usdcAddress = process.env.USDC_ADDRESS_BASE_MAINNET || "";
    networkName = "Base Mainnet";
  } else if (chainId === 999999999n) { // Zora Sepolia (Testnet)
    usdcAddress = process.env.USDC_ADDRESS_ZORA_SEPOLIA || "";
    networkName = "Zora Sepolia";
  } else if (chainId === 7777777n) { // Zora Mainnet
    usdcAddress = process.env.USDC_ADDRESS_ZORA_MAINNET || "";
    networkName = "Zora Mainnet";
  } else if (chainId === 44787n) { // Celo Alfajores (Testnet)
    usdcAddress = process.env.USDC_ADDRESS_CELO_ALFAJORES || "";
    networkName = "Celo Alfajores";
  } else if (chainId === 42220n) { // Celo Mainnet
    usdcAddress = process.env.USDC_ADDRESS_CELO_MAINNET || "";
    networkName = "Celo Mainnet";
  } else {
    throw new Error(`Unsupported network: ${chainId}. Supported: Base (8453, 84532), Zora (7777777, 999999999), Celo (42220, 44787)`);
  }
  
  if (!usdcAddress) {
    throw new Error(`USDC address not configured for network ${networkName}`);
  }

  console.log("📋 Configuration:");
  console.log("  - Network:", networkName);
  console.log("  - USDC Address:", usdcAddress);
  console.log("  - Treasury Wallet:", treasuryWallet);
  console.log("  - Gasless Relayer:", gaslessRelayerWallet);
  console.log("  - Initial Owner:", deployer.address);

  // 1. Deploy Subscription Manager (without factory address initially)
  console.log("\n1️⃣ Deploying Art3HubSubscriptionV3...");
  const SubscriptionFactory = await ethers.getContractFactory("Art3HubSubscriptionV3");
  const subscription = await SubscriptionFactory.deploy(
    usdcAddress,
    treasuryWallet,
    gaslessRelayerWallet,
    ethers.ZeroAddress, // Factory address will be set later
    deployer.address
  ) as Art3HubSubscriptionV3;
  
  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();
  console.log("✅ Art3HubSubscriptionV3 deployed to:", subscriptionAddress);

  // 2. Deploy Factory
  console.log("\n2️⃣ Deploying Art3HubFactoryV3...");
  const FactoryV3 = await ethers.getContractFactory("Art3HubFactoryV3");
  const factory = await FactoryV3.deploy(
    subscriptionAddress,
    gaslessRelayerWallet,
    deployer.address
  ) as Art3HubFactoryV3;
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Art3HubFactoryV3 deployed to:", factoryAddress);

  // 3. Update subscription contract with factory address
  console.log("\n3️⃣ Updating subscription contract with factory address...");
  const updateFactoryTx = await subscription.updateFactoryContract(factoryAddress);
  await updateFactoryTx.wait();
  console.log("✅ Factory address updated in subscription contract");

  // 4. Get Collection Implementation Address
  const collectionImplementation = await factory.collectionImplementation();
  console.log("✅ Art3HubCollectionV3 implementation:", collectionImplementation);

  // 5. Verify initial configuration
  console.log("\n🔍 Verifying configuration...");
  
  const planConfig = await subscription.getPlanConfig(0); // FREE plan
  console.log("Free Plan Config:", {
    price: planConfig[0].toString(),
    limit: planConfig[1].toString(),
    gasless: planConfig[2]
  });

  const masterPlanConfig = await subscription.getPlanConfig(1); // MASTER plan
  console.log("Master Plan Config:", {
    price: ethers.formatUnits(masterPlanConfig[0], 6), // USDC has 6 decimals
    limit: masterPlanConfig[1].toString(),
    gasless: masterPlanConfig[2]
  });

  // 6. Test auto-enrollment functionality
  console.log("\n🧪 Testing auto-enrollment...");
  try {
    const testUser = process.env.TEST_USER_ADDRESS || "0x1234567890123456789012345678901234567890";
    const canMint = await subscription.canUserMint(testUser, 1);
    console.log("Can new user mint?", canMint);
  } catch (error) {
    console.log("Auto-enrollment test skipped (expected on some networks)");
  }

  // 6. Summary
  console.log("\n🎉 Art3Hub V3 Deployment Complete!");
  console.log("=" .repeat(50));
  console.log("📋 Contract Addresses:");
  console.log("  - SubscriptionManager:", subscriptionAddress);
  console.log("  - Factory:", factoryAddress);
  console.log("  - Collection Implementation:", collectionImplementation);
  console.log("");
  console.log("🔧 Environment Variables to Add:");
  console.log(`NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_${chainId}=${subscriptionAddress}`);
  console.log(`NEXT_PUBLIC_ART3HUB_FACTORY_V3_${chainId}=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_ART3HUB_COLLECTION_V3_IMPL_${chainId}=${collectionImplementation}`);
  console.log("");
  console.log("💰 Treasury Configuration:");
  console.log(`  - Treasury Wallet: ${treasuryWallet}`);
  console.log(`  - Gasless Relayer: ${gaslessRelayerWallet}`);
  console.log(`  - Master Plan Price: $4.99 USDC/month`);
  console.log("");
  console.log("🚀 Features:");
  console.log("  ✅ Auto-enrollment in Free Plan (1 NFT/year)");
  console.log("  ✅ Master Plan subscription ($4.99/month, 10 NFTs)");
  console.log("  ✅ True gasless minting for all subscribers");
  console.log("  ✅ OpenSea compatible collections");
  console.log("  ✅ EIP-712 meta-transactions");
  console.log("  ✅ Built-in royalty support");
  console.log("  ✅ Multi-chain support (Base, Zora, Celo)");

  console.log("");
  console.log("🌐 Supported Networks:");
  console.log("  • Base (8453) + Base Sepolia (84532)");
  console.log("  • Zora (7777777) + Zora Sepolia (999999999)");
  console.log("  • Celo (42220) + Celo Alfajores (44787)");

  // 7. Verification instructions
  console.log("\n📝 Next Steps:");
  console.log("1. Update your .env file with the new contract addresses");
  console.log("2. Update your frontend to use Art3Hub V3 services");
  console.log("3. Fund the gasless relayer wallet with ETH");
  console.log("4. Test the complete gasless flow");
  console.log("5. Verify contracts on block explorer");

  // 8. Contract verification data
  console.log("\n🔍 Contract Verification:");
  console.log("Art3HubSubscriptionV3 constructor args:");
  console.log(`["${usdcAddress}", "${treasuryWallet}", "${gaslessRelayerWallet}", "${deployer.address}"]`);
  console.log("");
  console.log("Art3HubFactoryV3 constructor args:");
  console.log(`["${subscriptionAddress}", "${gaslessRelayerWallet}", "${deployer.address}"]`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });