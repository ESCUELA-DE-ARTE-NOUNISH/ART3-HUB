import { ethers } from "hardhat";
import hre from "hardhat";

interface ContractDeployment {
  name: string;
  address: string;
  constructorArgs: any[];
}

interface NetworkConfig {
  name: string;
  chainId: number;
  contracts: ContractDeployment[];
  explorerUrl: string;
}

async function main() {
  const chainId = Number(await hre.network.provider.send("eth_chainId"));
  console.log(`🔍 Verifying contracts on chain ID: ${chainId}`);

  // Network configurations
  const networkConfigs: { [key: number]: NetworkConfig } = {
    84532: {
      name: "Base Sepolia",
      chainId: 84532,
      explorerUrl: "https://sepolia.basescan.org",
      contracts: [
        {
          name: "Art3HubSubscriptionV3",
          address: "0x4189c14EfcfB71CAAb5Bb6cd162504a37DF2b4Dc",
          constructorArgs: [
            "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC
            "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9", // Treasury
            "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
            "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
          ]
        },
        {
          name: "Art3HubFactoryV3",
          address: "0x2634b3389c0CBc733bE05ba459A0C2e844594161",
          constructorArgs: [
            "0x4189c14EfcfB71CAAb5Bb6cd162504a37DF2b4Dc", // Subscription Manager
            "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
            "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
          ]
        },
        {
          name: "Art3HubCollectionV3",
          address: "0xC02C22986839b9F70E8c1a1aBDB7721f3739d034",
          constructorArgs: []
        }
      ]
    },
    999999999: {
      name: "Zora Sepolia",
      chainId: 999999999,
      explorerUrl: "https://sepolia.explorer.zora.energy",
      contracts: [
        {
          name: "Art3HubSubscriptionV3",
          address: "0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D",
          constructorArgs: [
            "0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4", // USDC
            "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9", // Treasury
            "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
            "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
          ]
        },
        {
          name: "Art3HubFactoryV3",
          address: "0x47105E80363960Ef9C3f641dA4056281E963d3CB",
          constructorArgs: [
            "0x20D07582c3cB6a0b32Aa8be59456c6BBBaDD993D", // Subscription Manager
            "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
            "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
          ]
        },
        {
          name: "Art3HubCollectionV3",
          address: "0x4Cf261D4F37F4d5870e6172108b1eEfE1592daCd",
          constructorArgs: []
        }
      ]
    },
    44787: {
      name: "Celo Alfajores",
      chainId: 44787,
      explorerUrl: "https://alfajores.celoscan.io",
      contracts: [
        {
          name: "Art3HubSubscriptionV3",
          address: "0xFf85176d8BDA8Ead51d9A67a4e1c0dDDDF695C30",
          constructorArgs: [
            "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B", // USDC
            "0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9", // Treasury
            "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
            "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
          ]
        },
        {
          name: "Art3HubFactoryV3",
          address: "0x996Cc8EE4a9E43B27bFfdB8274B24d61B30B188E",
          constructorArgs: [
            "0xFf85176d8BDA8Ead51d9A67a4e1c0dDDDF695C30", // Subscription Manager
            "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1", // Relayer
            "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"  // Owner
          ]
        },
        {
          name: "Art3HubCollectionV3",
          address: "0xB482D3298f34423E98A67A54DE5d33612f200918",
          constructorArgs: []
        }
      ]
    }
  };

  const config = networkConfigs[chainId];
  if (!config) {
    console.error(`❌ No configuration found for chain ID: ${chainId}`);
    return;
  }

  console.log(`📋 Network: ${config.name}`);
  console.log(`🔗 Explorer: ${config.explorerUrl}`);
  console.log(`📝 Contracts to verify: ${config.contracts.length}`);
  console.log("");

  // Verify each contract
  for (const contract of config.contracts) {
    console.log(`🔍 Verifying ${contract.name}...`);
    console.log(`📍 Address: ${contract.address}`);
    console.log(`⚙️  Constructor args: [${contract.constructorArgs.map(arg => `"${arg}"`).join(", ")}]`);
    
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });
      
      console.log(`✅ ${contract.name} verified successfully!`);
      console.log(`🔗 View at: ${config.explorerUrl}/address/${contract.address}#code`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contract.name} already verified`);
        console.log(`🔗 View at: ${config.explorerUrl}/address/${contract.address}#code`);
      } else {
        console.error(`❌ Failed to verify ${contract.name}:`, error.message);
        
        // For Blockscout networks, provide manual verification info
        if (chainId === 999999999) {
          console.log("📋 Manual Blockscout verification info:");
          console.log(`   - Contract Name: ${contract.name}`);
          console.log(`   - Contract Address: ${contract.address}`);
          console.log(`   - Compiler Version: 0.8.20`);
          console.log(`   - Optimization: Enabled (200 runs)`);
          console.log(`   - Constructor Args (ABI-encoded): ${await encodeConstructorArgs(contract.constructorArgs)}`);
        }
      }
    }
    console.log("");
  }

  // Summary
  console.log("🎉 Verification process completed!");
  console.log("");
  console.log("📋 Contract Links:");
  for (const contract of config.contracts) {
    console.log(`${contract.name}: ${config.explorerUrl}/address/${contract.address}#code`);
  }
}

async function encodeConstructorArgs(args: any[]): Promise<string> {
  if (args.length === 0) return "0x";
  
  try {
    // This is a simplified encoding - for complex types, use ethers.AbiCoder
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "address", "address"], // Adjust types based on contract
      args
    );
    return encoded;
  } catch (error) {
    console.warn("⚠️  Could not encode constructor args:", error);
    return "Manual encoding required";
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });