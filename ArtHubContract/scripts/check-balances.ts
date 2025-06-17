import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const chainId = Number(await hre.network.provider.send("eth_chainId"));
  console.log(`🌐 Checking balances on chain ID: ${chainId}`);

  // Important addresses
  const DEPLOYER = "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f";
  const GASLESS_RELAYER = "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1";
  const TREASURY = "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9";

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
    console.log("SubscriptionManager: 0x4189c14EfcfB71CAAb5Bb6cd162504a37DF2b4Dc");
    console.log("Factory: 0x2634b3389c0CBc733bE05ba459A0C2e844594161");
    console.log("Collection Implementation: 0xC02C22986839b9F70E8c1a1aBDB7721f3739d034");
  } else if (chainId === 999999999) {
    console.log("SubscriptionManager: 0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D");
    console.log("Factory: 0x47105E80363960Ef9C3f641dA4056281E963d3CB");
    console.log("Collection Implementation: 0x4Cf261D4F37F4d5870e6172108b1eEfE1592daCd");
  } else if (chainId === 44787) {
    console.log("SubscriptionManager: 0xFf85176d8BDA8Ead51d9A67a4e1c0dDDDF695C30");
    console.log("Factory: 0x996Cc8EE4a9E43B27bFfdB8274B24d61B30B188E");
    console.log("Collection Implementation: 0xB482D3298f34423E98A67A54DE5d33612f200918");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });