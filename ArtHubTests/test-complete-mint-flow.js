require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testCompleteMintFlow() {
  console.log('🧪 Testing complete mint flow with the updated API...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Test the fixed mint flow with just the claim code
    const testPayload = {
      claimCode: 'Snoopy2025'
    };
    
    console.log('📋 Testing complete mint flow with payload:', testPayload);
    
    const response = await fetch('http://localhost:3000/api/nfts/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF', // Use the connected wallet from the user's issue
        'host': 'localhost:3000'
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Mint flow failed:', {
        status: response.status,
        statusText: response.statusText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText);
      }
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ Complete mint flow test successful!');
      console.log('📄 Response:', {
        success: result.success,
        txHash: result.txHash,
        tokenId: result.tokenId,
        contractAddress: result.contractAddress,
        message: result.message,
        nftTitle: result.nft?.title,
        nftImageUrl: result.nft?.imageUrl
      });
      
      if (result.success && result.txHash && result.tokenId) {
        console.log('🎉 SUCCESS: Complete gasless mint flow working!');
        console.log('🔗 Transaction hash:', result.txHash);
        console.log('🏷️ Token ID:', result.tokenId);
        console.log('📜 Contract:', result.contractAddress);
        console.log('🖼️ NFT:', result.nft?.title);
      } else {
        console.log('⚠️ Partial success - some fields missing');
      }
      
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
      console.error('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testCompleteMintFlow();