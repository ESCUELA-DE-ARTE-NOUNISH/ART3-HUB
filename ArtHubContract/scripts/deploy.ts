import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractFactory("Art3NFT");
  const contract = await factory.deploy();
  await contract.deployed();
  console.log(`✅ Deployed ART3NFT to: ${contract.address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});