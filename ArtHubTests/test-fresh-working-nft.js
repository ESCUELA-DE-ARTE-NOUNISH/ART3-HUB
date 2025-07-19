require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testFreshWorkingNFT() {
  console.log('🧪 Creating completely fresh NFT with unique claim code...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Use a unique timestamp-based claim code
    const timestamp = Date.now();
    const uniqueClaimCode = `WORKING${timestamp}`;
    
    // Step 1: Create fresh NFT with unique code
    console.log('📋 Step 1: Creating admin NFT with working addClaimCode system...');
    
    const testNFTData = {
      title: `Working Test NFT ${timestamp}`,
      description: 'Testing with completely fresh NFT and fixed systems',
      claimCode: uniqueClaimCode,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'published',
      maxClaims: 5,
      network: 'base-sepolia',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
    };
    
    console.log('🔍 Creating NFT with claim code:', uniqueClaimCode);
    
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
      const errorText = await createResponse.text();
      console.error('Error details:', errorText);
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
    console.log('⏳ Step 2: Waiting 10 seconds for deployment and addClaimCode...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 3: Test claim code validation
    console.log('📋 Step 3: Testing claim code validation...');
    const validateResponse = await fetch(`http://localhost:3000/api/nfts/claim?code=${uniqueClaimCode}`, {
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
        claimCode: uniqueClaimCode
      })
    });
    
    const claimText = await claimResponse.text();
    console.log('📄 Claim response status:', claimResponse.status);
    console.log('📄 Claim response (first 300 chars):', claimText.substring(0, 300));
    
    if (!claimResponse.ok) {
      console.error('❌ Claim request failed:', claimResponse.status);
      return;
    }
    
    const claimResult = JSON.parse(claimText);
    console.log('📄 Detailed claim result:', {
      success: claimResult.success,
      message: claimResult.message,
      txHash: claimResult.txHash,
      tokenId: claimResult.tokenId,
      contractAddress: claimResult.contractAddress
    });
    
    if (claimResult.success) {
      console.log('🎉 SUCCESS: Complete fresh NFT mint-and-transfer flow working!');
      console.log('🔗 Transaction Hash:', claimResult.txHash);
      console.log('🏷️ Token ID:', claimResult.tokenId);
      console.log('📝 Contract:', claimResult.contractAddress);
      console.log('✅ The NFT minting process is fully operational!');
      console.log('🎯 User can now use claim code:', uniqueClaimCode);
    } else {
      console.log('❌ FAILURE: Claim failed -', claimResult.message);
      
      // Check if it's the same addClaimCode issue
      if (claimResult.message && claimResult.message.includes('ClaimNFT simulation failed')) {
        console.log('🔍 This suggests the addClaimCode step may have failed during NFT creation');
        console.log('🔍 Check server logs for addClaimCode transaction status');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFreshWorkingNFT();