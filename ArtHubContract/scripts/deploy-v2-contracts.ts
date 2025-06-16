import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying Art3Hub V2 contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Network configuration
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // Contract parameters
  const PLATFORM_FEE_RECIPIENT = deployer.address; // Change to actual treasury
  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  
  // OpenSea Proxy Registry addresses (network-specific)
  const PROXY_REGISTRIES: Record<string, string> = {
    "1": "0xa5409ec958c83c3f309868babaca7c86dcb077c1", // Ethereum Mainnet
    "8453": "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // Base Mainnet
    "84532": "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // Base Sepolia
    "7777777": "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // Zora
    "999999999": "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // Zora Sepolia
    "42220": "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // Celo
    "44787": "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC", // Celo Alfajores
  };
  
  const proxyRegistry = PROXY_REGISTRIES[network.chainId.toString()] || ethers.ZeroAddress;
  
  // Accepted payment tokens (USDC addresses)
  const USDC_ADDRESSES: Record<string, string> = {
    "1": "0xA0b86a33E6441885C06002e6a92E6b0de6C34B6B", // Ethereum USDC
    "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
    "84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
    "7777777": "0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4", // Zora USDC (placeholder)
    "999999999": "0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4", // Zora Sepolia USDC (placeholder)
    "42220": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // Celo USDC
    "44787": "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B", // Celo Alfajores USDC
  };
  
  const usdcAddress = USDC_ADDRESSES[network.chainId.toString()] || ethers.ZeroAddress;
  
  try {
    // 1. Deploy Subscription Manager
    console.log("\n📋 Deploying SubscriptionManager...");
    const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
    const subscriptionManager = await SubscriptionManager.deploy(PLATFORM_FEE_RECIPIENT);
    await subscriptionManager.waitForDeployment();
    const subscriptionManagerAddress = await subscriptionManager.getAddress();
    console.log("✅ SubscriptionManager deployed to:", subscriptionManagerAddress);
    
    // 2. Deploy Collection Implementation V2
    console.log("\n🎨 Deploying Art3HubCollectionV2 implementation...");
    const Art3HubCollectionV2 = await ethers.getContractFactory("Art3HubCollectionV2");
    const collectionImplementation = await Art3HubCollectionV2.deploy(proxyRegistry);
    await collectionImplementation.waitForDeployment();
    const implementationAddress = await collectionImplementation.getAddress();
    console.log("✅ Art3HubCollectionV2 implementation deployed to:", implementationAddress);
    
    // 3. Deploy Factory V2
    console.log("\n🏭 Deploying Art3HubFactoryV2...");
    const Art3HubFactoryV2 = await ethers.getContractFactory("Art3HubFactoryV2");
    const factory = await Art3HubFactoryV2.deploy(
      implementationAddress,
      subscriptionManagerAddress,
      proxyRegistry,
      PLATFORM_FEE_RECIPIENT,
      PLATFORM_FEE_PERCENTAGE
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ Art3HubFactoryV2 deployed to:", factoryAddress);
    
    // 4. Deploy Gasless Relayer
    console.log("\n⚡ Deploying GaslessRelayer...");
    const GaslessRelayer = await ethers.getContractFactory("GaslessRelayer");
    const gaslessRelayer = await GaslessRelayer.deploy();
    await gaslessRelayer.waitForDeployment();
    const gaslessRelayerAddress = await gaslessRelayer.getAddress();
    console.log("✅ GaslessRelayer deployed to:", gaslessRelayerAddress);
    
    // 5. Configure contracts
    console.log("\n⚙️ Configuring contracts...");
    
    // Set factory as authorized caller in subscription manager
    await subscriptionManager.setAuthorizedCaller(factoryAddress, true);
    console.log("✅ Factory authorized in SubscriptionManager");
    
    // Add USDC as accepted payment token (if available)
    if (usdcAddress !== ethers.ZeroAddress) {
      await subscriptionManager.setAcceptedToken(usdcAddress, true);
      console.log("✅ USDC added as accepted payment token");
    }
    
    // Configure gasless relayer
    await gaslessRelayer.setAuthorizedTarget(factoryAddress, true);
    console.log("✅ Factory authorized in GaslessRelayer");
    
    // 6. Display deployment summary
    console.log("\n🎉 Deployment Summary");
    console.log("=====================");
    console.log("Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
    console.log("Deployer:", deployer.address);
    console.log("SubscriptionManager:", subscriptionManagerAddress);
    console.log("Art3HubCollectionV2 Implementation:", implementationAddress);
    console.log("Art3HubFactoryV2:", factoryAddress);
    console.log("GaslessRelayer:", gaslessRelayerAddress);
    console.log("Proxy Registry:", proxyRegistry);
    console.log("USDC Address:", usdcAddress);
    console.log("Platform Fee Recipient:", PLATFORM_FEE_RECIPIENT);
    console.log("Platform Fee Percentage:", PLATFORM_FEE_PERCENTAGE / 100 + "%");
    
    // 7. Generate environment variables
    const envVars = `
# Art3Hub V2 Contract Addresses - ${network.name}
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_${network.chainId}=${subscriptionManagerAddress}
NEXT_PUBLIC_ART3HUB_COLLECTION_V2_IMPL_${network.chainId}=${implementationAddress}
NEXT_PUBLIC_ART3HUB_FACTORY_V2_${network.chainId}=${factoryAddress}
NEXT_PUBLIC_GASLESS_RELAYER_${network.chainId}=${gaslessRelayerAddress}
NEXT_PUBLIC_PROXY_REGISTRY_${network.chainId}=${proxyRegistry}
NEXT_PUBLIC_USDC_${network.chainId}=${usdcAddress}
`;
    
    console.log("\n📝 Environment Variables:");
    console.log(envVars);
    
    // 8. Verification commands
    console.log("\n🔍 Verification Commands:");
    console.log("=========================");
    console.log(`npx hardhat verify --network ${network.name} ${subscriptionManagerAddress} "${PLATFORM_FEE_RECIPIENT}"`);
    console.log(`npx hardhat verify --network ${network.name} ${implementationAddress} "${proxyRegistry}"`);
    console.log(`npx hardhat verify --network ${network.name} ${factoryAddress} "${implementationAddress}" "${subscriptionManagerAddress}" "${proxyRegistry}" "${PLATFORM_FEE_RECIPIENT}" "${PLATFORM_FEE_PERCENTAGE}"`);
    console.log(`npx hardhat verify --network ${network.name} ${gaslessRelayerAddress}`);
    
    console.log("\n✨ Deployment completed successfully!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });