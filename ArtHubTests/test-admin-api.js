require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testAdminAPI() {
  console.log('🧪 Testing admin API...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    const testData = {
      title: 'Test Admin Claimable NFT',
      description: 'Test description for admin claimable NFT',
      claimCode: 'ADMIN123',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'published', // This triggers contract deployment
      maxClaims: 100,
      network: 'base-sepolia',
      image: 'https://example.com/test-image.png'
    };
    
    console.log('📋 Test data:', testData);
    console.log('🌐 Testing endpoint: http://localhost:3001/api/admin/nfts');
    console.log('🔐 Admin wallet:', process.env.NEXT_PUBLIC_ADMIN_WALLET);
    
    const response = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001' // Ensure the correct host header
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (!response.ok) {
      console.error('❌ Request failed:', {
        status: response.status,
        statusText: response.statusText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Could not parse error response as JSON');
      }
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ Admin API successful:', result);
      
      if (result.contractDeployment) {
        console.log('🎉 Contract deployed:', result.contractDeployment);
      }
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAdminAPI();