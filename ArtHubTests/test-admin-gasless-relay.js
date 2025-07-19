require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testAdminGaslessRelay() {
  console.log('🧪 Testing admin NFT creation with gasless relay addClaimCode...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Create a test NFT via admin API
    console.log('📋 Creating NFT via admin API...');
    
    const timestamp = Date.now();
    const testNFTData = {
      title: `Gasless Test NFT ${timestamp}`,
      description: 'Testing addClaimCode via gasless relay',
      claimCode: `GASLESS${timestamp}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'published',
      maxClaims: 5,
      network: 'base-sepolia',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
    };
    
    console.log('🔍 Creating NFT with claim code:', testNFTData.claimCode);
    
    const createResponse = await fetch('http://localhost:3002/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3002'
      },
      body: JSON.stringify(testNFTData)
    });
    
    const responseText = await createResponse.text();
    console.log('📄 Admin API response status:', createResponse.status);
    console.log('📄 Admin API response (first 300 chars):', responseText.substring(0, 300));
    
    if (!createResponse.ok) {
      console.error('❌ Admin NFT creation failed');
      return;
    }
    
    const createResult = JSON.parse(responseText);
    console.log('✅ NFT created:', {
      id: createResult.nft?.id,
      title: createResult.nft?.title,
      claimCode: createResult.nft?.claimCode,
      contractAddress: createResult.nft?.contractAddress
    });
    
    // Wait for deployment to complete
    console.log('⏳ Waiting 5 seconds for deployment and addClaimCode...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test claim validation
    console.log('📋 Testing claim code validation...');
    const validateResponse = await fetch(`http://localhost:3002/api/nfts/claim?code=${testNFTData.claimCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3002'
      }
    });
    
    const validateText = await validateResponse.text();
    console.log('📄 Validation response:', validateText.substring(0, 200));
    
    const validateResult = JSON.parse(validateText);
    console.log('📋 Validation result:', {
      valid: validateResult.valid,
      message: validateResult.message,
      nftTitle: validateResult.nft?.title
    });
    
    if (validateResult.valid) {
      console.log('🎉 SUCCESS: AddClaimCode via gasless relay is working!');
    } else {
      console.log('❌ FAILURE: AddClaimCode still failing -', validateResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAdminGaslessRelay();