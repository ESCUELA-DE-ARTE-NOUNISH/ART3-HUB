require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testScoobyCompleteFlow() {
  console.log('🧪 Testing complete Scooby2025 NFT creation and claim flow...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Step 1: Create admin NFT with Scooby2025
    console.log('📋 Step 1: Creating admin NFT with fixed addClaimCode...');
    
    const testNFTData = {
      title: 'Scooby Test NFT',
      description: 'Testing complete flow with Scooby2025 secret code',
      claimCode: 'Scooby2025',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'published',
      maxClaims: 10,
      network: 'base-sepolia',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
    };
    
    console.log('🔍 Creating NFT with claim code:', testNFTData.claimCode);
    
    const createResponse = await fetch('http://localhost:3000/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3000'
      },
      body: JSON.stringify(testNFTData)
    });
    
    if (!createResponse.ok) {
      console.error('❌ Admin NFT creation failed:', createResponse.status);
      return;
    }
    
    const createResult = JSON.parse(await createResponse.text());
    console.log('✅ NFT created:', {
      id: createResult.nft?.id,
      title: createResult.nft?.title,
      claimCode: createResult.nft?.claimCode,
      contractAddress: createResult.nft?.contractAddress
    });
    
    // Step 2: Wait for addClaimCode to complete
    console.log('⏳ Step 2: Waiting 8 seconds for deployment and addClaimCode...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Step 3: Test claim code validation
    console.log('📋 Step 3: Testing claim code validation...');
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
      contractAddress: validateResult.nft?.contractAddress
    });
    
    if (!validateResult.valid) {
      console.log('❌ FAILURE: Claim code validation failed -', validateResult.message);
      return;
    }
    
    // Step 4: Test the actual mint/claim
    console.log('📋 Step 4: Testing actual NFT claim...');
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
    console.log('📄 Claim response (first 200 chars):', claimText.substring(0, 200));
    
    if (!claimResponse.ok) {
      console.error('❌ Claim request failed:', claimResponse.status);
      return;
    }
    
    const claimResult = JSON.parse(claimText);
    console.log('📄 Claim result:', {
      success: claimResult.success,
      message: claimResult.message,
      txHash: claimResult.txHash,
      tokenId: claimResult.tokenId,
      contractAddress: claimResult.contractAddress
    });
    
    if (claimResult.success) {
      console.log('🎉 SUCCESS: Complete Scooby2025 mint-and-transfer flow working!');
      console.log('🔗 Transaction:', claimResult.txHash);
      console.log('🏷️ Token ID:', claimResult.tokenId);
    } else {
      console.log('❌ FAILURE: Claim failed -', claimResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testScoobyCompleteFlow();