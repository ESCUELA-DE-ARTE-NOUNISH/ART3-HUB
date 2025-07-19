require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testScoobyMintOnly() {
  console.log('🧪 Testing Scooby2025 NFT minting process only...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Step 1: Validate the existing claim code 
    console.log('📋 Step 1: Validating existing Scooby2025 claim code...');
    const validateResponse = await fetch(`http://localhost:3000/api/nfts/claim?code=Scooby2025`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3000'
      }
    });
    
    const validateResult = JSON.parse(await validateResponse.text());
    console.log('📋 Validation result:', {
      valid: validateResult.valid,
      message: validateResult.message,
      contractAddress: validateResult.nft?.contractAddress,
      nftTitle: validateResult.nft?.title
    });
    
    if (!validateResult.valid) {
      console.log('❌ FAILURE: Claim code validation failed -', validateResult.message);
      console.log('🔍 Please create a claimable NFT with "Scooby2025" first');
      return;
    }
    
    console.log('✅ Claim code is valid, proceeding with mint...');
    
    // Step 2: Test the actual mint/claim process
    console.log('📋 Step 2: Testing NFT minting process...');
    const claimResponse = await fetch('http://localhost:3000/api/nfts/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3000'
      },
      body: JSON.stringify({
        claimCode: 'Scooby2025'
      })
    });
    
    const claimText = await claimResponse.text();
    console.log('📄 Mint response status:', claimResponse.status);
    console.log('📄 Mint response (first 300 chars):', claimText.substring(0, 300));
    
    if (!claimResponse.ok) {
      console.error('❌ Mint request failed:', claimResponse.status);
      return;
    }
    
    const claimResult = JSON.parse(claimText);
    console.log('📄 Detailed mint result:', {
      success: claimResult.success,
      message: claimResult.message,
      txHash: claimResult.txHash,
      tokenId: claimResult.tokenId,
      contractAddress: claimResult.contractAddress
    });
    
    if (claimResult.success) {
      console.log('🎉 SUCCESS: Scooby2025 minting completed successfully!');
      console.log('🔗 Transaction Hash:', claimResult.txHash);
      console.log('🏷️ Token ID:', claimResult.tokenId);
      console.log('📝 Contract:', claimResult.contractAddress);
    } else {
      console.log('❌ FAILURE: Minting failed -', claimResult.message);
      
      // Additional debugging info
      if (claimResult.message && claimResult.message.includes('ClaimNFT simulation failed')) {
        console.log('🔍 This suggests the addClaimCode step may have failed during NFT creation');
        console.log('🔍 Check server logs for addClaimCode transaction status');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testScoobyMintOnly();