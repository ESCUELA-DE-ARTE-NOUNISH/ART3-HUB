require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testFirebaseConfig() {
  console.log('🧪 Testing Firebase configuration...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Test a simple admin API endpoint to see if Firebase is accessible
    console.log('📋 Testing admin user API endpoint...');
    
    const response = await fetch('http://localhost:3001/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      }
    });
    
    const responseText = await response.text();
    
    console.log('📄 Admin users response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Admin users API request failed:', {
        status: response.status,
        statusText: response.statusText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText.substring(0, 300));
      }
    } else {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Firebase connection working!');
        console.log('📄 Users found:', Array.isArray(result) ? result.length : 'Unknown format');
        
        if (Array.isArray(result) && result.length > 0) {
          console.log('📋 Sample user:', {
            id: result[0].id,
            wallet_address: result[0].wallet_address
          });
        }
      } catch (parseError) {
        console.error('❌ Could not parse response as JSON:', parseError);
        console.error('Raw response (first 300 chars):', responseText.substring(0, 300));
      }
    }
    
    // Test environment variables
    console.log('\n🔧 Testing environment variables...');
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];
    
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFirebaseConfig();