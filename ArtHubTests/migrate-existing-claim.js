#!/usr/bin/env node

/**
 * Migrate existing "Just Goku" claim to create NFT record for /my-nfts display
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function migrateExistingClaim() {
  console.log('🔄 MIGRATING EXISTING "JUST GOKU" CLAIM');
  console.log('======================================');
  console.log('');

  // Step 1: Get the claimable NFT details
  console.log('📊 Step 1: Getting "Just Goku" claimable NFT details...');
  try {
    const adminResponse = await fetch(`${BASE_URL}/api/admin/nfts`);
    const adminData = await adminResponse.json();
    
    const justGoku = adminData.nfts?.find(nft => 
      nft.title.toLowerCase().includes('goku') || 
      nft.claimCode.toLowerCase().includes('goku')
    );
    
    if (!justGoku) {
      console.log('❌ "Just Goku" NFT not found in claimable NFTs');
      return;
    }
    
    console.log('✅ Found "Just Goku" NFT:');
    console.log('   ID:', justGoku.id);
    console.log('   Title:', justGoku.title);
    console.log('   Claim Code:', justGoku.claimCode);
    console.log('   Contract:', justGoku.contractAddress);
    console.log('   Image URL:', justGoku.imageUrl);
    console.log('   Current Claims:', justGoku.currentClaims);
    
    // Step 2: Extract IPFS hash from image URL
    let imageIpfsHash = '';
    if (justGoku.imageUrl) {
      const ipfsMatch = justGoku.imageUrl.match(/\/ipfs\/([^/?]+)/);
      if (ipfsMatch) {
        imageIpfsHash = ipfsMatch[1];
        console.log('   IPFS Hash:', imageIpfsHash);
      } else {
        console.log('   ⚠️ No IPFS hash found in image URL, using placeholder');
        imageIpfsHash = 'QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L';
      }
    }
    
    // Step 3: Create NFT record for the claimed wallet
    const claimedWallet = '0x499D377eF114cC1BF7798cECBB38412701400daF';
    const contractAddress = '0x262ef5091c0357f564882bc211a1c477f9dc3ce8';
    const txHash = '0xcd0bb0188a4b530f1132fc2989c775c1740e2145e96c32835237871ceca05b44';
    const tokenId = 0;
    
    console.log('');
    console.log('📝 Step 2: Creating NFT record for /my-nfts display...');
    console.log('   Wallet:', claimedWallet);
    console.log('   Contract:', contractAddress);
    console.log('   Token ID:', tokenId);
    console.log('   TX Hash:', txHash);
    
    const nftPayload = {
      wallet_address: claimedWallet.toLowerCase(),
      name: justGoku.title,
      description: justGoku.description || '',
      image_ipfs_hash: imageIpfsHash,
      metadata_ipfs_hash: justGoku.metadataIpfsHash || '',
      transaction_hash: txHash,
      network: justGoku.network || 'base',
      royalty_percentage: 0,
      contract_address: contractAddress,
      token_id: tokenId
    };
    
    console.log('');
    console.log('📤 Creating NFT record...');
    const createResponse = await fetch(`${BASE_URL}/api/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nftPayload)
    });
    
    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ NFT record created successfully!');
      console.log('   NFT ID:', createResult.nft?.id);
      console.log('   Name:', createResult.nft?.name);
      console.log('   Wallet:', createResult.nft?.wallet_address);
      console.log('');
      console.log('🎉 MIGRATION COMPLETE!');
      console.log('   "Just Goku" should now appear in /my-nfts page');
      console.log('   for wallet:', claimedWallet);
    } else {
      console.log('❌ Failed to create NFT record:', createResult);
    }
    
    // Step 4: Verify the NFT appears in /my-nfts
    console.log('');
    console.log('🔍 Step 3: Verifying NFT appears in /my-nfts...');
    
    const verifyResponse = await fetch(`${BASE_URL}/api/nfts?wallet_address=${claimedWallet}`);
    const verifyData = await verifyResponse.json();
    
    const foundNFT = verifyData.nfts?.find(nft => nft.name === justGoku.title);
    
    if (foundNFT) {
      console.log('✅ SUCCESS: NFT found in /my-nfts!');
      console.log('   Name:', foundNFT.name);
      console.log('   Contract:', foundNFT.contract_address);
      console.log('   Token ID:', foundNFT.token_id);
      console.log('   Created:', foundNFT.created_at);
    } else {
      console.log('❌ NFT still not found in /my-nfts');
      console.log('   Total NFTs for wallet:', verifyData.nfts?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
  }
}

// Run the migration
migrateExistingClaim().catch(console.error);