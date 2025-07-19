require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testFreshNFTClaim() {
  console.log('🧪 Creating fresh NFT and testing claim flow...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Step 1: Create a fresh NFT
    console.log('📋 Step 1: Creating fresh NFT...');
    
    const timestamp = Date.now();
    const testNFTData = {
      title: `Fresh Test NFT ${timestamp}`,
      description: 'Testing the complete claim flow with ownership check',
      claimCode: `FRESH${timestamp}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'published',
      maxClaims: 5,
      network: 'base-sepolia',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
    };
    
    console.log('🔍 Creating NFT with claim code:', testNFTData.claimCode);
    
    const createResponse = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      },
      body: JSON.stringify(testNFTData)
    });
    
    if (!createResponse.ok) {
      console.error('❌ NFT creation failed');
      return;
    }
    
    const createResult = JSON.parse(await createResponse.text());
    console.log('✅ NFT created:', {
      id: createResult.nft?.id,
      title: createResult.nft?.title,
      claimCode: createResult.nft?.claimCode,
      contractAddress: createResult.nft?.contractAddress
    });
    
    // Step 2: Wait a moment for deployment to complete
    console.log('⏳ Waiting 3 seconds for deployment to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Test the claim
    console.log('📋 Step 2: Testing claim...');
    
    const claimResponse = await fetch('http://localhost:3001/api/nfts/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3001'
      },
      body: JSON.stringify({
        claimCode: testNFTData.claimCode
      })
    });
    
    const claimText = await claimResponse.text();
    
    console.log('📄 Raw claim response status:', claimResponse.status);
    console.log('📄 Raw claim response (first 200 chars):', claimText.substring(0, 200));
    
    if (!claimResponse.ok) {
      console.error('❌ Claim request failed');
      return;
    }
    
    let claimResult;
    try {
      claimResult = JSON.parse(claimText);
    } catch (parseError) {
      console.error('❌ Failed to parse claim response as JSON');
      console.log('Full response:', claimText.substring(0, 500));
      return;
    }
    
    console.log('📄 Claim result:', {
      success: claimResult.success,
      message: claimResult.message,
      txHash: claimResult.txHash,
      tokenId: claimResult.tokenId,
      contractAddress: claimResult.contractAddress
    });
    
    if (claimResult.success) {
      console.log('🎉 SUCCESS: Complete claim flow working!');
    } else {
      console.log('❌ FAILURE: Claim failed -', claimResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFreshNFTClaim();