import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const chainId = Number(await hre.network.provider.send("eth_chainId"));
  console.log(`💰 Funding gasless relayer on chain ID: ${chainId}`);

  const GASLESS_RELAYER = "0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1";
  const FUNDING_AMOUNT = ethers.parseEther("0.1"); // 0.1 ETH

  // Get network name
  let networkName = "Unknown";
  if (chainId === 84532) networkName = "Base Sepolia";
  else if (chainId === 999999999) networkName = "Zora Sepolia";
  else if (chainId === 44787) networkName = "Celo Alfajores";

  console.log(`📋 Network: ${networkName}`);
  console.log(`🎯 Target: ${GASLESS_RELAYER}`);
  console.log(`💵 Amount: ${ethers.formatEther(FUNDING_AMOUNT)} ETH`);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 From: ${signer.address}`);

  // Check balances before
  const senderBalance = await ethers.provider.getBalance(signer.address);
  const relayerBalance = await ethers.provider.getBalance(GASLESS_RELAYER);

  console.log("\n📊 Balances Before:");
  console.log(`   Sender: ${ethers.formatEther(senderBalance)} ETH`);
  console.log(`   Relayer: ${ethers.formatEther(relayerBalance)} ETH`);

  if (senderBalance < FUNDING_AMOUNT) {
    throw new Error("Insufficient balance to fund relayer");
  }

  // Send transaction
  console.log("\n🚀 Sending transaction...");
  const tx = await signer.sendTransaction({
    to: GASLESS_RELAYER,
    value: FUNDING_AMOUNT
  });

  console.log(`📄 Transaction hash: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed! Gas used: ${receipt?.gasUsed}`);

  // Check balances after
  const senderBalanceAfter = await ethers.provider.getBalance(signer.address);
  const relayerBalanceAfter = await ethers.provider.getBalance(GASLESS_RELAYER);

  console.log("\n📊 Balances After:");
  console.log(`   Sender: ${ethers.formatEther(senderBalanceAfter)} ETH`);
  console.log(`   Relayer: ${ethers.formatEther(relayerBalanceAfter)} ETH`);

  console.log("\n🎉 Gasless relayer funded successfully!");
  console.log(`✅ Ready for gasless transactions on ${networkName}`);
  
  // Explorer link
  if (chainId === 999999999) {
    console.log(`🔍 View transaction: https://sepolia.explorer.zora.energy/tx/${tx.hash}`);
  } else if (chainId === 84532) {
    console.log(`🔍 View transaction: https://sepolia.basescan.org/tx/${tx.hash}`);
  } else if (chainId === 44787) {
    console.log(`🔍 View transaction: https://alfajores.celoscan.io/tx/${tx.hash}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Funding failed:", error);
    process.exit(1);
  });