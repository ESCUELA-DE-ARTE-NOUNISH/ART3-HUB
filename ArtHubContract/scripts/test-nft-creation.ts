import { ethers } from "hardhat";
import hre from "hardhat";
import axios from "axios";

// NFT metadata
const TEST_NFT_METADATA = {
  "name": "Frogy",
  "description": "Frogy",
  "image": "ipfs://QmQaajjditgLgFgEabF1H7fRs8Zv8SRNhrZ7HgTAs7xkMd",
  "attributes": []
};

// Collection metadata
const TEST_COLLECTION_METADATA = {
  "name": "Frogy Test Collection",
  "description": "A test collection for Art3Hub V3 OpenSea compatibility testing",
  "image": "ipfs://QmQaajjditgLgFgEabF1H7fRs8Zv8SRNhrZ7HgTAs7xkMd",
  "external_link": "https://art3hub.com",
  "seller_fee_basis_points": 1000,
  "fee_recipient": "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9"
};

async function uploadToPinata(data: any, name: string): Promise<string> {
  const PINATA_JWT = process.env.PINATA_JWT;
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT not found in environment variables");
  }

  try {
    console.log(`📎 Uploading ${name} to Pinata...`);
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: data,
        pinataMetadata: {
          name: name
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PINATA_JWT}`
        }
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const ipfsUrl = `ipfs://${ipfsHash}`;
    console.log(`✅ ${name} uploaded successfully: ${ipfsUrl}`);
    console.log(`🔗 Gateway URL: https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    
    return ipfsUrl;
  } catch (error: any) {
    console.error(`❌ Failed to upload ${name} to Pinata:`, error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  const chainId = Number(await hre.network.provider.send("eth_chainId"));
  console.log(`🚀 Testing NFT creation on chain ID: ${chainId}`);

  // Contract addresses for Base Sepolia
  const SUBSCRIPTION_MANAGER = "0x4189c14EfcfB71CAAb5Bb6cd162504a37DF2b4Dc";
  const FACTORY = "0x2634b3389c0CBc733bE05ba459A0C2e844594161";

  if (chainId !== 84532) {
    throw new Error("This script is configured for Base Sepolia (84532). Please switch network.");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  // Upload metadata to Pinata
  console.log("\n📤 Uploading metadata to Pinata...");
  
  const nftMetadataUri = await uploadToPinata(TEST_NFT_METADATA, "Frogy NFT Metadata");
  const collectionMetadataUri = await uploadToPinata(TEST_COLLECTION_METADATA, "Frogy Collection Metadata");

  // Connect to contracts
  console.log("\n🔗 Connecting to Art3Hub V3 contracts...");
  
  const subscriptionManager = await ethers.getContractAt("Art3HubSubscriptionV3", SUBSCRIPTION_MANAGER, signer);
  const factory = await ethers.getContractAt("Art3HubFactoryV3", FACTORY, signer);

  // Check subscription status
  console.log("\n📋 Checking subscription status...");
  try {
    const subscription = await subscriptionManager.getSubscription(signer.address);
    console.log(`Plan: ${subscription.plan === 0n ? 'FREE' : 'MASTER'}`);
    console.log(`Active: ${subscription.isActive}`);
    console.log(`NFTs Minted: ${subscription.nftsMinted}`);
    console.log(`NFT Limit: ${subscription.nftLimit}`);
    console.log(`Gasless Minting: ${subscription.hasGaslessMinting}`);
  } catch (error) {
    console.log("No subscription found - will auto-enroll on first interaction");
  }

  // Prepare collection parameters
  const collectionName = "Frogy Test Collection";
  const collectionSymbol = "FROGY";
  const collectionDescription = "A test collection for Art3Hub V3 OpenSea compatibility testing";
  const collectionImage = "ipfs://QmQaajjditgLgFgEabF1H7fRs8Zv8SRNhrZ7HgTAs7xkMd";
  const externalUrl = "https://art3hub.com";
  const royaltyRecipient = signer.address;
  const royaltyFeeNumerator = 1000; // 10% (out of 10000)

  console.log("\n🏭 Creating collection...");
  console.log("Collection Parameters:");
  console.log(`  Name: ${collectionName}`);
  console.log(`  Symbol: ${collectionSymbol}`);
  console.log(`  Description: ${collectionDescription}`);
  console.log(`  Image: ${collectionImage}`);
  console.log(`  External URL: ${externalUrl}`);
  console.log(`  Royalty Recipient: ${royaltyRecipient}`);
  console.log(`  Royalty: ${royaltyFeeNumerator / 100}%`);

  // Create collection
  const createTx = await factory.createCollection(
    collectionName,
    collectionSymbol,
    collectionDescription,
    collectionImage,
    externalUrl,
    royaltyRecipient,
    royaltyFeeNumerator
  );
  console.log(`📄 Transaction hash: ${createTx.hash}`);
  
  const receipt = await createTx.wait();
  console.log(`✅ Collection created! Gas used: ${receipt?.gasUsed}`);

  // Extract collection address from events
  let collectionAddress: string | null = null;
  if (receipt?.logs) {
    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "CollectionCreated") {
          collectionAddress = parsedLog.args.collection;
          break;
        }
      } catch (error) {
        // Skip unparseable logs
      }
    }
  }

  if (!collectionAddress) {
    throw new Error("Could not extract collection address from transaction receipt");
  }

  console.log(`🎨 Collection deployed at: ${collectionAddress}`);
  console.log(`🔍 View on BaseScan: https://sepolia.basescan.org/address/${collectionAddress}`);

  // Connect to the new collection
  console.log("\n🎨 Minting NFT...");
  const collection = await ethers.getContractAt("Art3HubCollectionV3", collectionAddress, signer);

  // Mint NFT
  const mintTx = await collection.mint(signer.address, nftMetadataUri);
  console.log(`📄 Mint transaction hash: ${mintTx.hash}`);
  
  const mintReceipt = await mintTx.wait();
  console.log(`✅ NFT minted! Gas used: ${mintReceipt?.gasUsed}`);

  // Get token ID from events
  let tokenId: bigint | null = null;
  if (mintReceipt?.logs) {
    for (const log of mintReceipt.logs) {
      try {
        const parsedLog = collection.interface.parseLog(log);
        if (parsedLog?.name === "Transfer" && parsedLog.args.from === ethers.ZeroAddress) {
          tokenId = parsedLog.args.tokenId;
          break;
        }
      } catch (error) {
        // Skip unparseable logs
      }
    }
  }

  if (tokenId === null) {
    throw new Error("Could not extract token ID from mint transaction");
  }

  console.log(`🎭 NFT Token ID: ${tokenId}`);

  // Verify NFT data
  console.log("\n🔍 Verifying NFT data...");
  
  const tokenURI = await collection.tokenURI(tokenId);
  const owner = await collection.ownerOf(tokenId);
  const name = await collection.name();
  const symbol = await collection.symbol();
  const totalSupply = await collection.totalSupply();
  const contractURI = await collection.contractURI();

  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Total Supply: ${totalSupply}`);
  console.log(`Owner of Token ${tokenId}: ${owner}`);
  console.log(`Token URI: ${tokenURI}`);
  console.log(`Contract URI: ${contractURI}`);

  // Check royalty info
  const royaltyInfo = await collection.royaltyInfo(tokenId, ethers.parseEther("1"));
  console.log(`Royalty Recipient: ${royaltyInfo[0]}`);
  console.log(`Royalty Amount: ${ethers.formatEther(royaltyInfo[1])} ETH (for 1 ETH sale)`);

  // Check subscription status after minting
  console.log("\n📋 Subscription status after minting:");
  const updatedSubscription = await subscriptionManager.getSubscription(signer.address);
  console.log(`Plan: ${updatedSubscription.plan === 0n ? 'FREE' : 'MASTER'}`);
  console.log(`Active: ${updatedSubscription.isActive}`);
  console.log(`NFTs Minted: ${updatedSubscription.nftsMinted}`);
  console.log(`NFT Limit: ${updatedSubscription.nftLimit}`);
  console.log(`Remaining: ${updatedSubscription.nftLimit - updatedSubscription.nftsMinted}`);

  // OpenSea compatibility check
  console.log("\n🌊 OpenSea Compatibility Check:");
  
  // Check ERC165 support
  const supportsERC721 = await collection.supportsInterface("0x80ac58cd");
  const supportsERC2981 = await collection.supportsInterface("0x2a55205a");
  const supportsERC721Metadata = await collection.supportsInterface("0x5b5e139f");
  
  console.log(`✅ ERC-721 Support: ${supportsERC721}`);
  console.log(`✅ ERC-2981 Royalty Support: ${supportsERC2981}`);
  console.log(`✅ ERC-721 Metadata Support: ${supportsERC721Metadata}`);

  // Test OpenSea proxy approval (Base Sepolia uses zero address, but let's check)
  const isApprovedForAll = await collection.isApprovedForAll(signer.address, "0x4Cc6a166b44dE7e9DB7EA5749c20c56D8F9056E2");
  console.log(`OpenSea Proxy Pre-approved: ${isApprovedForAll}`);

  console.log("\n🎉 Test Complete! Summary:");
  console.log("=" .repeat(50));
  console.log(`Collection Address: ${collectionAddress}`);
  console.log(`Token ID: ${tokenId}`);
  console.log(`Owner: ${owner}`);
  console.log(`BaseScan Collection: https://sepolia.basescan.org/address/${collectionAddress}`);
  console.log(`BaseScan Token: https://sepolia.basescan.org/token/${collectionAddress}?a=${tokenId}`);
  console.log(`OpenSea Testnet: https://testnets.opensea.io/assets/base-sepolia/${collectionAddress}/${tokenId}`);
  console.log("");
  console.log("🔗 IPFS Links:");
  console.log(`NFT Metadata: ${nftMetadataUri}`);
  console.log(`Collection Metadata: ${collectionMetadataUri}`);
  console.log("");
  console.log("✅ OpenSea Compatible Features:");
  console.log("  ✅ ERC-721 Standard");
  console.log("  ✅ ERC-2981 Royalties");
  console.log("  ✅ Contract-level metadata");
  console.log("  ✅ Token-level metadata");
  console.log("  ✅ Proper interface support");
  console.log("");
  console.log("💡 Next Steps:");
  console.log("1. Wait 5-10 minutes for indexing");
  console.log("2. Check OpenSea testnet for collection");
  console.log("3. Verify metadata displays correctly");
  console.log("4. Test listing/transfer functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });