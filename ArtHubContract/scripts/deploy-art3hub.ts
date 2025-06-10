import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🎨 Deploying Art3 Hub Collection...");

  // Get deployment parameters from environment or use defaults
  const MAX_SUPPLY = process.env.MAX_SUPPLY || "10000"; // 10k NFTs max supply
  const MINT_PRICE = process.env.MINT_PRICE || ethers.parseEther("0.001"); // 0.001 ETH mint price
  
  // Collection metadata URIs
  const CONTRACT_URI = process.env.CONTRACT_URI || "https://art3hub.com/api/collection/metadata";
  const BASE_URI = process.env.BASE_URI || "https://art3hub.com/api/nfts/";

  console.log("📋 Deployment Parameters:");
  console.log(`   Max Supply: ${MAX_SUPPLY}`);
  console.log(`   Mint Price: ${ethers.formatEther(MINT_PRICE.toString())} ETH`);
  console.log(`   Contract URI: ${CONTRACT_URI}`);
  console.log(`   Base URI: ${BASE_URI}`);

  // Get network information
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`\n🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`💰 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💳 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. Make sure you have enough ETH for deployment.");
  }

  // Deploy the contract
  console.log("\n🚀 Deploying Art3Hub contract...");
  
  const Art3Hub = await ethers.getContractFactory("Art3Hub");
  const art3Hub = await Art3Hub.deploy(
    MAX_SUPPLY,
    MINT_PRICE,
    CONTRACT_URI,
    BASE_URI
  );

  await art3Hub.waitForDeployment();
  const contractAddress = await art3Hub.getAddress();

  console.log("✅ Art3Hub deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  try {
    const collectionName = await art3Hub.name();
    const collectionSymbol = await art3Hub.symbol();
    const maxSupply = await art3Hub.maxSupply();
    const mintPrice = await art3Hub.mintPrice();
    const owner = await art3Hub.owner();
    const totalSupply = await art3Hub.totalSupply();

    console.log(`   Collection Name: ${collectionName}`);
    console.log(`   Symbol: ${collectionSymbol}`);
    console.log(`   Max Supply: ${maxSupply.toString()}`);
    console.log(`   Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Total Supply: ${totalSupply.toString()}`);
    
    console.log("\n✨ Deployment completed successfully!");
    
  } catch (error) {
    console.error("❌ Error verifying deployment:", error);
  }

  // Network-specific post-deployment info
  if (network.chainId === 84532n) {
    console.log("\n🔗 Base Sepolia Testnet Links:");
    console.log(`   Explorer: https://sepolia.basescan.org/address/${contractAddress}`);
    console.log(`   OpenSea Testnet: https://testnets.opensea.io/assets/base-sepolia/${contractAddress}`);
  } else if (network.chainId === 8453n) {
    console.log("\n🔗 Base Mainnet Links:");
    console.log(`   Explorer: https://basescan.org/address/${contractAddress}`);
    console.log(`   OpenSea: https://opensea.io/assets/base/${contractAddress}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    parameters: {
      maxSupply: MAX_SUPPLY,
      mintPrice: ethers.formatEther(MINT_PRICE.toString()),
      contractURI: CONTRACT_URI,
      baseURI: BASE_URI
    }
  };

  console.log("\n📝 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions for contract verification
  console.log("\n🔐 To verify the contract on Basescan, run:");
  console.log(`npx hardhat verify --network ${network.name === 'base-sepolia' ? 'baseSepolia' : 'base'} ${contractAddress} "${MAX_SUPPLY}" "${MINT_PRICE}" "${CONTRACT_URI}" "${BASE_URI}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });