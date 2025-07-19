import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying Art3HubClaimableNFTFactory...");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (${network.chainId})`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("❌ Insufficient balance! Need at least 0.01 ETH for deployment");
  }

  try {
    // Deploy factory contract
    console.log("\n📦 Deploying Art3HubClaimableNFTFactory...");
    const ClaimableNFTFactory = await ethers.getContractFactory("Art3HubClaimableNFTFactory");
    
    const factory = await ClaimableNFTFactory.deploy(deployer.address);
    await factory.waitForDeployment();
    
    const factoryAddress = await factory.getAddress();
    console.log(`✅ Factory deployed at: ${factoryAddress}`);

    // Test deployment by creating a test claimable NFT
    console.log("\n🧪 Testing factory by deploying test claimable NFT...");
    const testTx = await factory.deployClaimableNFT(
      "Test Claimable NFT",
      "TCNFT", 
      "https://ipfs.io/ipfs/test-metadata/",
      deployer.address
    );
    
    const testReceipt = await testTx.wait();
    console.log(`🧪 Test deployment tx: ${testReceipt?.hash}`);

    // Extract the deployed NFT address from events
    const deploymentEvent = testReceipt?.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'ClaimableNFTDeployed';
      } catch {
        return false;
      }
    });

    let testNFTAddress = null;
    if (deploymentEvent) {
      const parsed = factory.interface.parseLog(deploymentEvent);
      testNFTAddress = parsed?.args[0];
      console.log(`✅ Test NFT deployed at: ${testNFTAddress}`);
    }

    // Test the deployed NFT contract
    if (testNFTAddress) {
      console.log("\n🔧 Testing claimable NFT functionality...");
      const TestNFT = await ethers.getContractFactory("Art3HubClaimableNFT");
      const testNFT = TestNFT.attach(testNFTAddress);

      // Add a test claim code
      const testClaimCode = "TEST-CODE-123";
      const currentTime = Math.floor(Date.now() / 1000);
      const endTime = currentTime + (7 * 24 * 60 * 60); // 7 days from now

      console.log("Adding test claim code...");
      const addCodeTx = await testNFT.addClaimCode(
        testClaimCode,
        10, // max 10 claims
        currentTime, // start now
        endTime, // end in 7 days
        "https://ipfs.io/ipfs/test-metadata/1.json"
      );
      await addCodeTx.wait();
      console.log("✅ Test claim code added");

      // Test claim code validation
      const [isValid, message] = await testNFT.validateClaimCode(testClaimCode, deployer.address);
      console.log(`🔍 Claim code validation: ${isValid ? '✅' : '❌'} - ${message}`);

      if (isValid) {
        // Test claiming
        console.log("🎯 Testing NFT claim...");
        const claimTx = await testNFT.claimNFT(testClaimCode);
        const claimReceipt = await claimTx.wait();
        console.log(`✅ NFT claimed! Tx: ${claimReceipt?.hash}`);

        // Check balance
        const balance = await testNFT.balanceOf(deployer.address);
        console.log(`🏆 NFT balance: ${balance}`);
      }
    }

    // Prepare deployment summary
    const deploymentSummary = {
      network: {
        name: network.name,
        chainId: Number(network.chainId)
      },
      deployer: deployer.address,
      contracts: {
        Art3HubClaimableNFTFactory: {
          address: factoryAddress,
          deploymentTx: factory.deploymentTransaction()?.hash
        },
        testNFT: testNFTAddress ? {
          address: testNFTAddress,
          claimCode: "TEST-CODE-123"
        } : null
      },
      timestamp: new Date().toISOString(),
      gasUsed: {
        factory: factory.deploymentTransaction()?.gasLimit?.toString()
      }
    };

    // Save deployment summary
    const timestamp = Date.now();
    const summaryFileName = `claimable-nft-factory-deployment-baseSepolia-${timestamp}.json`;
    const summaryPath = path.join(__dirname, "../deployments", summaryFileName);
    
    writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2));
    console.log(`📄 Deployment summary saved to: ${summaryPath}`);

    // Create markdown summary
    const markdownSummary = `
# Art3Hub Claimable NFT Factory Deployment

## Network Information
- **Network**: ${network.name}
- **Chain ID**: ${network.chainId}
- **Deployer**: ${deployer.address}
- **Deployment Time**: ${new Date().toISOString()}

## Deployed Contracts

### Art3HubClaimableNFTFactory
- **Address**: \`${factoryAddress}\`
- **Deployment Tx**: \`${factory.deploymentTransaction()?.hash}\`

### Test Claimable NFT
- **Address**: \`${testNFTAddress}\`
- **Test Claim Code**: \`TEST-CODE-123\`

## Environment Variables
Add these to your \`.env\` file:

\`\`\`bash
# Art3Hub Claimable NFT Factory (Base Sepolia)
NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=${factoryAddress}
\`\`\`

## Usage Example

\`\`\`typescript
// Deploy new claimable NFT
const factory = new ethers.Contract(factoryAddress, factoryABI, signer);
const tx = await factory.deployClaimableNFT(
  "My Collection",
  "MYCOL",
  "https://ipfs.io/ipfs/metadata/",
  ownerAddress
);
\`\`\`

## Next Steps
1. Update the app to use factory contract: \`NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=${factoryAddress}\`
2. Update admin API to deploy via factory
3. Update claiming API to work with individual contracts
4. Add gasless relayer support for claimable NFT operations
`;

    const markdownFileName = `claimable-nft-factory-deployment-baseSepolia-${timestamp}.md`;
    const markdownPath = path.join(__dirname, "../deployments", markdownFileName);
    
    writeFileSync(markdownPath, markdownSummary);
    console.log(`📝 Markdown summary saved to: ${markdownPath}`);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`Factory Address: ${factoryAddress}`);
    console.log(`Test NFT Address: ${testNFTAddress}`);
    console.log(`\nAdd to .env: NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532=${factoryAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });