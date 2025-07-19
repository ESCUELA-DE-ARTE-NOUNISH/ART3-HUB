const { ethers } = require('ethers');
require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testAdminKey() {
  console.log('🧪 Testing admin private key...');
  
  try {
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    const expectedAdminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    
    console.log('🔑 Admin private key (first 10 chars):', adminPrivateKey?.substring(0, 10) + '...');
    console.log('👑 Expected admin wallet:', expectedAdminWallet);
    
    if (!adminPrivateKey) {
      console.error('❌ ADMIN_PRIVATE_KEY not configured');
      return;
    }
    
    // Create wallet from private key
    const formattedKey = adminPrivateKey.startsWith('0x') ? adminPrivateKey : `0x${adminPrivateKey}`;
    const wallet = new ethers.Wallet(formattedKey);
    
    console.log('🏛️ Derived wallet address:', wallet.address);
    console.log('✅ Keys match:', wallet.address.toLowerCase() === expectedAdminWallet?.toLowerCase());
    
    if (wallet.address.toLowerCase() !== expectedAdminWallet?.toLowerCase()) {
      console.error('❌ Admin private key does not match admin wallet address!');
      console.error('   Private key derives to:', wallet.address);
      console.error('   Expected address:', expectedAdminWallet);
    } else {
      console.log('✅ Admin private key is correctly configured');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAdminKey();