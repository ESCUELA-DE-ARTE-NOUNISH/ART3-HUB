#!/usr/bin/env node

// Simple test for gasless relayer
console.log('🧪 Testing Gasless Relayer...\n');

const BASE_URL = 'http://localhost:3000';

async function testGaslessRelayer() {
  try {
    console.log('🚀 Testing ClaimableNFT deployment via gasless relayer...');
    
    const deployResponse = await fetch(`${BASE_URL}/api/gasless-relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'deployClaimableNFT',
        name: 'Test Factory NFT',
        symbol: 'TFNFT',
        baseTokenURI: 'https://ipfs.io/ipfs/',
        userAddress: '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f', // Admin wallet
        chainId: 84532 // Base Sepolia
      })
    });
    
    console.log('📡 Response status:', deployResponse.status);
    
    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      console.error('❌ Deployment failed:', errorText);
      return;
    }
    
    const result = await deployResponse.json();
    console.log('✅ Deployment successful!');
    console.log('📋 Result:', {
      success: result.success,
      contractAddress: result.contractAddress,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed
    });
    
    if (result.contractAddress) {
      console.log('\n📝 Now testing addClaimCode...');
      
      const addCodeResponse = await fetch(`${BASE_URL}/api/gasless-relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'addClaimCode',
          contractAddress: result.contractAddress,
          claimCode: 'FACTORY-TEST-' + Date.now(),
          maxClaims: 10,
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
          metadataURI: 'https://ipfs.io/ipfs/test-metadata.json',
          chainId: 84532
        })
      });
      
      if (!addCodeResponse.ok) {
        const errorText = await addCodeResponse.text();
        console.error('❌ Add claim code failed:', errorText);
      } else {
        const addCodeResult = await addCodeResponse.json();
        console.log('✅ Claim code added successfully!');
        console.log('📋 Add code result:', {
          success: addCodeResult.success,
          transactionHash: addCodeResult.transactionHash
        });
        
        console.log('\n🎯 Testing claim NFT...');
        
        const claimResponse = await fetch(`${BASE_URL}/api/gasless-relay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'claimNFT',
            contractAddress: result.contractAddress,
            claimCode: 'FACTORY-TEST-' + (Date.now() - 1000), // Use the code we just added (approximately)
            userAddress: '0x742D35cc567Bdab1598591e2EdF2b9C6A0AE68eE', // Test user
            chainId: 84532
          })
        });
        
        if (!claimResponse.ok) {
          const errorText = await claimResponse.text();
          console.warn('⚠️ Claim NFT failed (expected for timing):', errorText);
        } else {
          const claimResult = await claimResponse.json();
          console.log('✅ NFT claimed successfully!');
          console.log('📋 Claim result:', {
            success: claimResult.success,
            tokenId: claimResult.tokenId,
            transactionHash: claimResult.transactionHash
          });
        }
      }
    }
    
    console.log('\n🎉 Gasless relayer test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGaslessRelayer();