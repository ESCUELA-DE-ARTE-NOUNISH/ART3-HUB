import { ethers } from "hardhat";

async function main() {
  // Get the relayer signer from environment
  const relayerPrivateKey = process.env.GASLESS_RELAYER_PRIVATE_KEY;
  if (!relayerPrivateKey) {
    throw new Error("GASLESS_RELAYER_PRIVATE_KEY not set in environment");
  }
  const relayer = new ethers.Wallet(relayerPrivateKey.startsWith('0x') ? relayerPrivateKey : `0x${relayerPrivateKey}`);
  const relayerSigner = relayer.connect(ethers.provider);
  
  console.log("🔍 Simulating exact relayer call...");
  console.log("Relayer address:", relayer.address);
  
  // Contract addresses from environment
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  let factoryAddress: string;
  if (chainId === 84532n) {
    factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532 || "";
  } else if (chainId === 999999999n) {
    factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_999999999 || "";
  } else if (chainId === 44787n) {
    factoryAddress = process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_44787 || "";
  } else {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  
  if (!factoryAddress) {
    throw new Error(`Factory address not configured for chain ${chainId}`);
  }
  
  const testUser = process.env.TEST_USER_ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Get factory contract with relayer signer
  const factory = await ethers.getContractAt("Art3HubFactoryV3", factoryAddress, relayerSigner);
  
  // Create the exact voucher structure that's failing
  const voucher = {
    name: "Scooby",
    symbol: "SCOOBY", 
    description: "Scooby Doo",
    image: "ipfs://QmWQrJ2FMV8Y2T73pSoaM6fr2hVovGgfUr8a6h8gL6gwJV",
    externalUrl: "",
    artist: testUser,
    royaltyRecipient: testUser,
    royaltyFeeNumerator: 500,
    nonce: 0,
    deadline: Math.floor(Date.now() / 1000) + 3600
  };
  
  const signature = process.env.TEST_SIGNATURE || "0x97f5ae93263b58a00037a2768171c640f0f9a6a1d7c7b7a5be0e431561cbd2431f8b359a6f1a80e624ff415626b2b6b39328c449d27843eff4a41afea3b784d43e3f31c";
  
  console.log("📋 Testing with voucher:", voucher);
  
  try {
    console.log("🔍 Attempting createCollectionGasless call...");
    
    // First let's check if the relayer is authorized
    const contractRelayer = await factory.gaslessRelayer();
    console.log("Contract expects relayer:", contractRelayer);
    console.log("Our relayer address:", relayer.address);
    console.log("Relayer authorized:", contractRelayer.toLowerCase() === relayer.address.toLowerCase());
    
    // Try to estimate gas first to see if it would work
    console.log("🔍 Estimating gas...");
    const gasEstimate = await factory.createCollectionGasless.estimateGas(voucher, signature);
    console.log("Gas estimate:", gasEstimate.toString());
    
    // If gas estimation succeeds, try the actual call
    console.log("🔍 Making actual call...");
    const tx = await factory.createCollectionGasless(voucher, signature);
    await tx.wait();
    
    console.log("✅ Success! Transaction hash:", tx.hash);
    
  } catch (error) {
    console.log("❌ Call failed:", error.message);
    
    // Try to get more detailed error information
    if (error.message.includes("execution reverted")) {
      console.log("🔍 Detailed error:", error);
    }
    
    // Let's try to manually test each step
    console.log("\n🔍 Testing individual steps:");
    
    try {
      // Check if user is active
      let subscriptionAddress: string;
      if (chainId === 84532n) {
        subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532 || "";
      } else if (chainId === 999999999n) {
        subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_999999999 || "";
      } else if (chainId === 44787n) {
        subscriptionAddress = process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_44787 || "";
      } else {
        throw new Error(`Unsupported network: ${chainId}`);
      }
      
      if (!subscriptionAddress) {
        throw new Error(`Subscription address not configured for chain ${chainId}`);
      }
      
      const subscription = await ethers.getContractAt("Art3HubSubscriptionV3", subscriptionAddress);
      const isActive = await subscription.isUserActive(testUser);
      console.log("User is active:", isActive);
      
      if (!isActive) {
        console.log("User not active, testing autoEnrollFreePlan call...");
        
        // Try calling autoEnrollFreePlan directly as the relayer
        try {
          const enrollTx = await subscription.connect(relayerSigner).autoEnrollFreePlan(testUser);
          await enrollTx.wait();
          console.log("✅ Relayer can call autoEnrollFreePlan directly");
        } catch (enrollError) {
          console.log("❌ Relayer cannot call autoEnrollFreePlan:", enrollError.message);
        }
      }
      
    } catch (substepError) {
      console.log("❌ Substep failed:", substepError.message);
    }
  }
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exitCode = 1;
});