import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Contract addresses from environment
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  let subscriptionAddress: string;
  let factoryAddress: string;
  
  if (chainId === 84532n) {
    subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532 || "";
    factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532 || "";
  } else if (chainId === 999999999n) {
    subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_999999999 || "";
    factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_999999999 || "";
  } else if (chainId === 44787n) {
    subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_44787 || "";
    factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_44787 || "";
  } else {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  
  if (!subscriptionAddress || !factoryAddress) {
    throw new Error(`Contract addresses not configured for chain ${chainId}`);
  }
  
  const testUser = process.env.TEST_USER_ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const relayerAddress = process.env.GASLESS_RELAYER || "";
  
  if (!relayerAddress) {
    throw new Error("GASLESS_RELAYER not set in environment");
  }
  
  console.log("🔍 Testing Gasless Flow Step by Step...");
  
  // Get contract instances
  const subscription = await ethers.getContractAt("Art3HubSubscriptionV3", subscriptionAddress);
  const factory = await ethers.getContractAt("Art3HubFactoryV3", factoryAddress);
  
  // Step 1: Check user's initial state
  console.log("\n1️⃣ Checking user's initial state:");
  try {
    const isActive = await subscription.isUserActive(testUser);
    console.log("User is active:", isActive);
    
    const userSubscription = await subscription.getSubscription(testUser);
    console.log("User subscription:", {
      plan: userSubscription.plan,
      isActive: userSubscription.isActive,
      nftsMinted: userSubscription.nftsMinted.toString(),
      nftLimit: userSubscription.nftLimit.toString()
    });
  } catch (error) {
    console.log("Error checking user state:", error.message);
  }
  
  // Step 2: Test if factory can call autoEnrollFreePlan
  console.log("\n2️⃣ Testing factory authorization for autoEnrollFreePlan:");
  try {
    // Check what the subscription contract thinks the factory address is
    const factoryInSubscription = await subscription.factoryContract();
    console.log("Factory address in subscription:", factoryInSubscription);
    console.log("Factory address matches:", factoryInSubscription.toLowerCase() === factoryAddress.toLowerCase());
    
    // Try to call autoEnrollFreePlan from the deployer (should work as owner)
    console.log("Testing autoEnrollFreePlan as owner (deployer)...");
    const tx1 = await subscription.connect(deployer).autoEnrollFreePlan(testUser);
    await tx1.wait();
    console.log("✅ Owner can call autoEnrollFreePlan");
    
    // Check user state after enrollment
    const isActiveAfter = await subscription.isUserActive(testUser);
    console.log("User is active after enrollment:", isActiveAfter);
    
  } catch (error) {
    console.log("❌ Factory authorization test failed:", error.message);
  }
  
  // Step 3: Test the collection creation logic manually
  console.log("\n3️⃣ Testing collection creation logic:");
  try {
    // Create a sample voucher
    const voucher = {
      name: "Test Collection",
      symbol: "TEST",
      description: "Test Description",
      image: "ipfs://test",
      externalUrl: "",
      artist: testUser,
      royaltyRecipient: testUser,
      royaltyFeeNumerator: 500,
      nonce: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600
    };
    
    // Check if user is active
    const isUserActiveNow = await subscription.isUserActive(testUser);
    console.log("Is user active before collection creation:", isUserActiveNow);
    
    if (!isUserActiveNow) {
      console.log("User not active, would call autoEnrollFreePlan...");
      // This is what the factory would do
      const autoEnrollTx = await subscription.connect(deployer).autoEnrollFreePlan(testUser);
      await autoEnrollTx.wait();
      console.log("✅ Auto-enrollment successful");
    }
    
    // Check if user can mint collections (0 NFTs)
    const canCreateCollection = await subscription.canUserMint(testUser, 0);
    console.log("Can user create collection (0 NFTs):", canCreateCollection);
    
  } catch (error) {
    console.log("❌ Collection creation logic test failed:", error.message);
    console.log("Error details:", error);
  }
  
  // Step 4: Test the signature components manually
  console.log("\n4️⃣ Testing signature verification:");
  try {
    // Check current nonce
    const currentNonce = await factory.userNonces(testUser);
    console.log("Current user nonce:", currentNonce.toString());
    
    // Test EIP-712 domain
    const domain = await factory.eip712Domain();
    console.log("Factory EIP-712 domain:", {
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId.toString(),
      verifyingContract: domain.verifyingContract
    });
    
  } catch (error) {
    console.log("❌ Signature verification test failed:", error.message);
  }
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exitCode = 1;
});