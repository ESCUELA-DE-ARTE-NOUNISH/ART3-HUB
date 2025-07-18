const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying ClaimableNFT contract...');
  
  // Get the contract factory
  const ClaimableNFT = await ethers.getContractFactory('ClaimableNFT');
  
  // Deploy the contract
  const contract = await ClaimableNFT.deploy(
    'Art3Hub Claimable NFT',
    'A3CLAIM'
  );
  
  await contract.deployed();
  
  console.log('✅ ClaimableNFT deployed to:', contract.address);
  console.log('📝 Add this to your .env file:');
  
  const network = await ethers.provider.getNetwork();
  
  if (network.chainId === 84532) {
    console.log(`NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_84532=${contract.address}`);
  } else if (network.chainId === 8453) {
    console.log(`NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_8453=${contract.address}`);
  } else {
    console.log(`CLAIMABLE_NFT_CONTRACT_${network.chainId}=${contract.address}`);
  }
  
  console.log('\n📋 Contract Details:');
  console.log('Name:', await contract.name());
  console.log('Symbol:', await contract.symbol());
  console.log('Total Supply:', (await contract.totalSupply()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });