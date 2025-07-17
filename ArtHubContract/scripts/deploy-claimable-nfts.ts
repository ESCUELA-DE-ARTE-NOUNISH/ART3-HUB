import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Get the network
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;
  console.log(`Deploying to network: ${networkName} (chainId: ${network.chainId})`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Deploy Art3HubClaimableNFTFactory
  console.log("Deploying Art3HubClaimableNFTFactory...");
  const ClaimableNFTFactory = await ethers.getContractFactory("Art3HubClaimableNFTFactory");
  const factoryContract = await ClaimableNFTFactory.deploy(deployer.address);
  await factoryContract.deployed();
  
  console.log(`Art3HubClaimableNFTFactory deployed at: ${factoryContract.address}`);

  // Create a demo collection if not in production
  if (networkName !== "mainnet") {
    console.log("Deploying a demo claimable NFT collection...");
    
    const tx = await factoryContract.deployClaimableNFT(
      "Demo Claimable NFT",
      "DEMONFT",
      "ipfs://QmUjyMtdSJXZ2KNX9JujQ1GcxkXbF4SBtZxnZTvBrKhvMm/",
      deployer.address
    );
    const receipt = await tx.wait();
    
    // Find the deployment event
    const deployEvent = receipt.events?.find(e => e.event === "ClaimableNFTDeployed");
    if (deployEvent && deployEvent.args) {
      const nftAddress = deployEvent.args.nftAddress;
      console.log(`Demo NFT deployed at: ${nftAddress}`);
      
      // Connect to the deployed NFT contract
      const ClaimableNFT = await ethers.getContractFactory("Art3HubClaimableNFT");
      const nftContract = ClaimableNFT.attach(nftAddress);
      
      // Add a sample claim code
      console.log("Adding a sample claim code...");
      
      const now = Math.floor(Date.now() / 1000);
      const oneMonthLater = now + 30 * 24 * 60 * 60;
      
      await nftContract.addClaimCode(
        "DEMO2024",           // Claim code
        100,                  // Max claims (100)
        now,                  // Start time (now)
        oneMonthLater,        // End time (30 days later)
        "ipfs://QmUjyMtdSJXZ2KNX9JujQ1GcxkXbF4SBtZxnZTvBrKhvMm/1.json"  // Metadata URI
      );
      
      console.log("Sample claim code added: DEMO2024");
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: {
      name: networkName,
      chainId: network.chainId.toString()
    },
    factory: {
      address: factoryContract.address,
      deployer: deployer.address,
      blockNumber: factoryContract.deployTransaction.blockNumber
    },
    timestamp: new Date().toISOString()
  };

  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment details to a file
  const fileName = `claimable-nft-deployment-${networkName}-${Date.now()}.json`;
  const filePath = path.join(deploymentsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`Deployment info saved to: ${filePath}`);
  console.log("Deployment completed successfully!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 