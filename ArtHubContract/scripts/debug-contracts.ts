import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Contract addresses from latest deployment
  const subscriptionAddress = "0x36f59FcF9243bC102CCF602E7c3573D1403B6D4f";
  const factoryAddress = "0x294753692f68D72C23b42B9031c380F298fA33C6";
  const testUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("🔍 Debugging Art3Hub V3 Contract Configuration...");
  console.log("👤 Test user:", testUser);
  console.log("🏭 Factory:", factoryAddress);
  console.log("📝 Subscription:", subscriptionAddress);
  
  // Get contract instances
  const subscription = await ethers.getContractAt("Art3HubSubscriptionV3", subscriptionAddress);
  const factory = await ethers.getContractAt("Art3HubFactoryV3", factoryAddress);
  
  // Check subscription contract configuration
  console.log("\n📝 Subscription Contract Configuration:");
  const factoryInSubscription = await subscription.factoryContract();
  console.log("Factory address in subscription:", factoryInSubscription);
  console.log("Factory matches:", factoryInSubscription.toLowerCase() === factoryAddress.toLowerCase());
  
  const gaslessRelayer = await subscription.gaslessRelayer();
  console.log("Gasless relayer:", gaslessRelayer);
  
  // Check factory contract configuration  
  console.log("\n🏭 Factory Contract Configuration:");
  const subscriptionInFactory = await factory.subscriptionManager();
  console.log("Subscription address in factory:", subscriptionInFactory);
  console.log("Subscription matches:", subscriptionInFactory.toLowerCase() === subscriptionAddress.toLowerCase());
  
  const factoryGaslessRelayer = await factory.gaslessRelayer();
  console.log("Factory gasless relayer:", factoryGaslessRelayer);
  
  // Test user's current state
  console.log("\n👤 User State:");
  try {
    const userSubscription = await subscription.getSubscription(testUser);
    console.log("User subscription:", {
      plan: userSubscription.plan,
      isActive: userSubscription.isActive,
      nftsMinted: userSubscription.nftsMinted.toString(),
      nftLimit: userSubscription.nftLimit.toString(),
      expiresAt: userSubscription.expiresAt.toString()
    });
  } catch (error) {
    console.log("User subscription error:", error.message);
  }
  
  try {
    const canMint = await subscription.canUserMint(testUser, 0);
    console.log("Can user mint (0 NFTs):", canMint);
  } catch (error) {
    console.log("canUserMint error:", error.message);
  }
  
  try {
    const userNonce = await factory.userNonces(testUser);
    console.log("User nonce in factory:", userNonce.toString());
  } catch (error) {
    console.log("User nonce error:", error.message);
  }
  
  // Test auto-enrollment manually
  console.log("\n🧪 Testing Auto-Enrollment:");
  try {
    // Check if factory can call autoEnrollFreePlan
    const tx = await subscription.connect(deployer).autoEnrollFreePlan(testUser);
    await tx.wait();
    console.log("✅ Auto-enrollment successful");
    
    // Check user state after enrollment
    const userSubscriptionAfter = await subscription.getSubscription(testUser);
    console.log("User subscription after enrollment:", {
      plan: userSubscriptionAfter.plan,
      isActive: userSubscriptionAfter.isActive,
      nftsMinted: userSubscriptionAfter.nftsMinted.toString(),
      nftLimit: userSubscriptionAfter.nftLimit.toString()
    });
    
  } catch (error) {
    console.log("❌ Auto-enrollment failed:", error.message);
    console.log("Error details:", error);
  }
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exitCode = 1;
});