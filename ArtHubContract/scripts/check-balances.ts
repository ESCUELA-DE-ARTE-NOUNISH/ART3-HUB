import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const chainId = Number(await hre.network.provider.send("eth_chainId"));
  console.log(`🌐 Checking balances on chain ID: ${chainId}`);

  // Important addresses from environment
  const DEPLOYER = process.env.INITIAL_OWNER;
  const GASLESS_RELAYER = process.env.GASLESS_RELAYER;
  const TREASURY = process.env.TREASURY_WALLET;
  
  if (!DEPLOYER || !GASLESS_RELAYER || !TREASURY) {
    throw new Error("Missing required environment variables: INITIAL_OWNER, GASLESS_RELAYER, TREASURY_WALLET");
  }

  // Get network name
  let networkName = "Unknown";
  if (chainId === 84532) networkName = "Base Sepolia";
  else if (chainId === 999999999) networkName = "Zora Sepolia";
  else if (chainId === 44787) networkName = "Celo Alfajores";

  console.log(`📋 Network: ${networkName}`);
  console.log("");

  // Check balances
  console.log("💰 Account Balances:");
  console.log("=" .repeat(50));

  const deployerBalance = await ethers.provider.getBalance(DEPLOYER);
  console.log(`👤 Deployer (${DEPLOYER}):`);
  console.log(`   Balance: ${ethers.formatEther(deployerBalance)} ETH`);
  console.log("");

  const relayerBalance = await ethers.provider.getBalance(GASLESS_RELAYER);
  console.log(`🚀 Gasless Relayer (${GASLESS_RELAYER}):`);
  console.log(`   Balance: ${ethers.formatEther(relayerBalance)} ETH`);
  console.log(`   Status: ${parseFloat(ethers.formatEther(relayerBalance)) > 0.01 ? '✅ Funded' : '❌ Needs funding'}`);
  console.log("");

  const treasuryBalance = await ethers.provider.getBalance(TREASURY);
  console.log(`🏦 Treasury (${TREASURY}):`);
  console.log(`   Balance: ${ethers.formatEther(treasuryBalance)} ETH`);
  console.log("");

  // Recommendations
  console.log("💡 Recommendations:");
  console.log("=" .repeat(50));
  
  if (parseFloat(ethers.formatEther(relayerBalance)) < 0.01) {
    console.log("❌ Gasless Relayer needs funding!");
    console.log("   - Minimum recommended: 0.01 ETH");
    console.log("   - For testing: 0.1 ETH recommended");
    console.log("");
    console.log("🔗 Funding Options:");
    if (chainId === 999999999) {
      console.log("   - Zora Sepolia Faucet: https://www.alchemy.com/faucets/zora-sepolia");
    } else if (chainId === 84532) {
      console.log("   - Base Sepolia Faucet: https://faucet.quicknode.com/base/sepolia");
    } else if (chainId === 44787) {
      console.log("   - Celo Alfajores Faucet: https://faucet.celo.org/alfajores");
    }
    console.log(`   - Send ETH to: ${GASLESS_RELAYER}`);
  } else {
    console.log("✅ Gasless Relayer is properly funded!");
    console.log("   - Ready for gasless transactions");
  }

  // Contract addresses for this network
  console.log("");
  console.log("🏭 V3 Contract Addresses:");
  console.log("=" .repeat(50));
  
  if (chainId === 84532) {
    console.log(`SubscriptionManager: ${process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532 || 'Not configured'}`);
    console.log(`Factory: ${process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532 || 'Not configured'}`);
    console.log(`Collection Implementation: ${process.env.NEXT_PUBLIC_ART3HUB_COLLECTION_V3_IMPL_84532 || 'Not configured'}`);
  } else if (chainId === 999999999) {
    console.log(`SubscriptionManager: ${process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_999999999 || 'Not configured'}`);
    console.log(`Factory: ${process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_999999999 || 'Not configured'}`);
    console.log(`Collection Implementation: ${process.env.NEXT_PUBLIC_ART3HUB_COLLECTION_V3_IMPL_999999999 || 'Not configured'}`);
  } else if (chainId === 44787) {
    console.log(`SubscriptionManager: ${process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_44787 || 'Not configured'}`);
    console.log(`Factory: ${process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_44787 || 'Not configured'}`);
    console.log(`Collection Implementation: ${process.env.NEXT_PUBLIC_ART3HUB_COLLECTION_V3_IMPL_44787 || 'Not configured'}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });