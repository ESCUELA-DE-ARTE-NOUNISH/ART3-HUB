const { ethers } = require('ethers');

async function verifyContract() {
  console.log('🔍 Verifying Zora Sepolia contract...');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.rpc.zora.energy');
  const contractAddress = '0x4C3139A3bDf6AeC62d8b65B053e41cd738b41e8F';
  
  try {
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    console.log('Contract code length:', code.length);
    
    if (code === '0x') {
      console.log('❌ No contract found at this address');
      return;
    }
    
    console.log('✅ Contract exists');
    
    // Try to call deploymentFee with minimal ABI
    const minimalABI = [
      {
        "inputs": [],
        "name": "deploymentFee",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const contract = new ethers.Contract(contractAddress, minimalABI, provider);
    
    try {
      const fee = await contract.deploymentFee();
      console.log('✅ Deployment fee:', ethers.formatEther(fee), 'ETH');
    } catch (error) {
      console.log('❌ Error calling deploymentFee:', error.message);
      
      // Try with different function signatures
      try {
        const tx = {
          to: contractAddress,
          data: '0xaff4b63d' // deploymentFee() function selector
        };
        const result = await provider.call(tx);
        console.log('Raw call result:', result);
      } catch (rawError) {
        console.log('❌ Raw call also failed:', rawError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyContract().catch(console.error);