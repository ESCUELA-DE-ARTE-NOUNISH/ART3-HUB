require('dotenv').config({ path: '../ArtHubApp/.env' });

async function fixSnoopyNFT() {
  console.log('🔧 Fixing Snoopy NFT claim code...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    const contractAddress = '0x325553ea59c95640af4d963ea968d9758306ebe3';
    const claimCode = 'SnoopyNFT';
    
    console.log('📋 NFT Details:');
    console.log('- Contract:', contractAddress);
    console.log('- Claim Code:', claimCode);
    
    // Step 1: Try to add the claim code via gasless relay
    console.log('\n📝 Step 1: Adding claim code via gasless relay...');
    
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = currentTime + (365 * 24 * 60 * 60); // 1 year from now
    
    const addClaimCodePayload = {
      type: 'addClaimCode',
      contractAddress: contractAddress,
      claimCode: claimCode,
      maxClaims: 0, // Unlimited
      startTime: currentTime,
      endTime: endTime,
      metadataURI: 'https://ipfs.io/ipfs/QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L',
      chainId: 84532
    };
    
    console.log('📤 AddClaimCode payload:', addClaimCodePayload);
    
    const gaslessResponse = await fetch('http://localhost:3000/api/gasless-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addClaimCodePayload)
    });
    
    console.log('📥 Gasless relay response status:', gaslessResponse.status, gaslessResponse.statusText);
    
    if (gaslessResponse.ok) {
      const result = await gaslessResponse.json();
      console.log('✅ AddClaimCode successful:', result);
      
      // Wait a moment for the transaction to be confirmed
      console.log('\n⏳ Waiting 10 seconds for transaction confirmation...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Step 2: Test the claim code now
      console.log('\n🧪 Step 2: Testing claim code after fix...');
      const claimResponse = await fetch('http://localhost:3000/api/nfts/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': '0x274F2719A0A241f696D4f82f177160a2531cf4f5',
          'host': 'localhost:3000'
        },
        body: JSON.stringify({
          claimCode: claimCode
        })
      });
      
      const claimText = await claimResponse.text();
      console.log('📄 Claim response status:', claimResponse.status);
      console.log('📄 Claim response:', claimText.substring(0, 500));
      
      if (claimResponse.ok) {
        const claimResult = JSON.parse(claimText);
        if (claimResult.success) {
          console.log('🎉 SUCCESS: Snoopy NFT is now claimable!');
          console.log('🔗 Transaction Hash:', claimResult.txHash);
          console.log('🏷️ Token ID:', claimResult.tokenId);
        } else {
          console.log('❌ Claim still failed:', claimResult.message);
        }
      } else {
        console.log('❌ Claim request failed with status:', claimResponse.status);
      }
      
    } else {
      const errorData = await gaslessResponse.json();
      console.error('❌ AddClaimCode failed:', errorData);
      
      // Check if the claim code already exists
      if (errorData.error && errorData.error.includes('already exists')) {
        console.log('💡 Claim code might already exist. Testing direct claim...');
        
        // Try claiming directly
        const claimResponse = await fetch('http://localhost:3000/api/nfts/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': '0x274F2719A0A241f696D4f82f177160a2531cf4f5',
            'host': 'localhost:3000'
          },
          body: JSON.stringify({
            claimCode: claimCode
          })
        });
        
        const claimResult = JSON.parse(await claimResponse.text());
        if (claimResult.success) {
          console.log('🎉 SUCCESS: Claim code was already working!');
        } else {
          console.log('❌ Claim still failed:', claimResult.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed with error:', error);
  }
}

fixSnoopyNFT();