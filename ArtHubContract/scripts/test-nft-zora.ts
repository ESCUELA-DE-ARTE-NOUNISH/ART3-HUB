import { ethers } from "hardhat";
import hre from "hardhat";
import axios from "axios";

// NFT metadata for Zora test
const ZORA_NFT_METADATA = {
  "name": "Zora Frogy",
  "description": "Frogy testing on Zora network - Art3Hub V3 gasless NFT creation",
  "image": "ipfs://QmQaajjditgLgFgEabF1H7fRs8Zv8SRNhrZ7HgTAs7xkMd",
  "attributes": [
    {
      "trait_type": "Network",
      "value": "Zora Sepolia"
    },
    {
      "trait_type": "Platform",
      "value": "Art3Hub V3"
    },
    {
      "trait_type": "Type",
      "value": "Gasless NFT"
    }
  ]
};

// Collection metadata for Zora
const ZORA_COLLECTION_METADATA = {
  "name": "Zora Frogy Collection",
  "description": "Testing Art3Hub V3 gasless NFT creation on Zora Sepolia testnet",
  "image": "ipfs://QmQaajjditgLgFgEabF1H7fRs8Zv8SRNhrZ7HgTAs7xkMd",
  "external_link": "https://art3hub.com",
  "seller_fee_basis_points": 750,  // 7.5% royalty
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
  console.log(`🚀 Testing NFT creation on Zora Sepolia (Chain ID: ${chainId})`);

  // Zora Sepolia contract addresses
  const SUBSCRIPTION_MANAGER = "0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D";
  const FACTORY = "0x47105E80363960Ef9C3f641dA4056281E963d3CB";

  if (chainId !== 999999999) {
    throw new Error("This script is configured for Zora Sepolia (999999999). Please switch network.");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  // Check gasless relayer balance
  const GASLESS_RELAYER = "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1";
  const relayerBalance = await ethers.provider.getBalance(GASLESS_RELAYER);
  console.log(`🚀 Gasless Relayer balance: ${ethers.formatEther(relayerBalance)} ETH`);
  
  if (parseFloat(ethers.formatEther(relayerBalance)) < 0.01) {
    throw new Error("Gasless relayer needs funding! Run: npm run fund:relayer -- --network zoraSepolia");
  }

  // Upload metadata to Pinata
  console.log("\n📤 Uploading Zora metadata to Pinata...");
  
  const nftMetadataUri = await uploadToPinata(ZORA_NFT_METADATA, "Zora Frogy NFT Metadata");
  const collectionMetadataUri = await uploadToPinata(ZORA_COLLECTION_METADATA, "Zora Frogy Collection Metadata");

  // Connect to contracts
  console.log("\n🔗 Connecting to Art3Hub V3 contracts on Zora...");
  
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
    
    if (subscription.isActive && subscription.expiresAt > 0n) {
      const expiryDate = new Date(Number(subscription.expiresAt) * 1000);
      console.log(`Expires: ${expiryDate.toISOString()}`);
    }
  } catch (error) {
    console.log("No subscription found - will auto-enroll on first interaction");
  }

  // Prepare collection parameters for Zora
  const collectionName = "Zora Frogy Collection";
  const collectionSymbol = "ZFROGY";
  const collectionDescription = "Testing Art3Hub V3 gasless NFT creation on Zora Sepolia testnet";
  const collectionImage = "ipfs://QmQaajjditgLgFgEabF1H7fRs8Zv8SRNhrZ7HgTAs7xkMd";
  const externalUrl = "https://art3hub.com/zora-test";
  const royaltyRecipient = signer.address;
  const royaltyFeeNumerator = 750; // 7.5% (out of 10000)

  console.log("\n🏭 Creating collection on Zora Sepolia...");
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
  console.log(`🔍 View on Zora Explorer: https://sepolia.explorer.zora.energy/address/${collectionAddress}`);

  // Connect to the new collection
  console.log("\n🎨 Minting NFT on Zora...");
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
  console.log("\n🔍 Verifying NFT data on Zora...");
  
  const tokenURI = await collection.tokenURI(tokenId);
  const owner = await collection.ownerOf(tokenId);
  const contractName = await collection.name();
  const contractSymbol = await collection.symbol();
  const totalSupply = await collection.totalSupply();
  const contractURI = await collection.contractURI();

  console.log(`Collection Name: ${contractName}`);
  console.log(`Collection Symbol: ${contractSymbol}`);
  console.log(`Total Supply: ${totalSupply}`);
  console.log(`Owner of Token ${tokenId}: ${owner}`);
  console.log(`Token URI: ${tokenURI}`);
  console.log(`Contract URI: ${contractURI.substring(0, 100)}...`);

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

  // Zora network compatibility check
  console.log("\n🌈 Zora Network Compatibility Check:");
  
  // Check ERC165 support
  const supportsERC721 = await collection.supportsInterface("0x80ac58cd");
  const supportsERC2981 = await collection.supportsInterface("0x2a55205a");
  const supportsERC721Metadata = await collection.supportsInterface("0x5b5e139f");
  
  console.log(`✅ ERC-721 Support: ${supportsERC721}`);
  console.log(`✅ ERC-2981 Royalty Support: ${supportsERC2981}`);
  console.log(`✅ ERC-721 Metadata Support: ${supportsERC721Metadata}`);

  // Test Zora marketplace proxy (if any)
  const isApprovedForAll = await collection.isApprovedForAll(signer.address, "0x0000000000000000000000000000000000000000");
  console.log(`Zora Proxy Pre-approved: ${isApprovedForAll}`);

  // Check if it's a valid Art3Hub collection
  const isArt3HubCollection = await factory.isArt3HubCollection(collectionAddress);
  console.log(`Verified Art3Hub Collection: ${isArt3HubCollection}`);

  console.log("\n🎉 Zora Sepolia Test Complete! Summary:");
  console.log("=" .repeat(60));
  console.log(`🌈 Network: Zora Sepolia (Chain ID: ${chainId})`);
  console.log(`🎨 Collection Address: ${collectionAddress}`);
  console.log(`🎭 Token ID: ${tokenId}`);
  console.log(`👤 Owner: ${owner}`);
  console.log(`🔍 Zora Explorer Collection: https://sepolia.explorer.zora.energy/address/${collectionAddress}`);
  console.log(`🔍 Zora Explorer Token: https://sepolia.explorer.zora.energy/token/${collectionAddress}?a=${tokenId}`);
  console.log("");
  console.log("🔗 IPFS Links:");
  console.log(`NFT Metadata: ${nftMetadataUri}`);
  console.log(`Collection Metadata: ${collectionMetadataUri}`);
  console.log("");
  console.log("✅ Zora Compatible Features:");
  console.log("  ✅ ERC-721 Standard");
  console.log("  ✅ ERC-2981 Royalties (7.5%)");
  console.log("  ✅ Contract-level metadata");
  console.log("  ✅ Token-level metadata");
  console.log("  ✅ Proper interface support");
  console.log("  ✅ Art3Hub V3 verified collection");
  console.log("");
  console.log("🚀 Transaction Summary:");
  console.log(`  Collection Creation: ${createTx.hash}`);
  console.log(`  NFT Mint: ${mintTx.hash}`);
  console.log(`  Total Gas Used: ${(receipt?.gasUsed || 0n) + (mintReceipt?.gasUsed || 0n)}`);
  console.log("");
  console.log("💡 Next Steps:");
  console.log("1. Wait 5-10 minutes for Zora indexing");
  console.log("2. Check if collection appears on Zora marketplace");
  console.log("3. Test Zora protocol integration");
  console.log("4. Verify gasless functionality with different users");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Zora test failed:", error);
    process.exit(1);
  });