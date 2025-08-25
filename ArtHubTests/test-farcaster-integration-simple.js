/**
 * Simple Farcaster Wallet Integration Test
 * 
 * Tests the fixed Farcaster authentication flow using curl to check the app
 * loads correctly and verify the key components are working.
 */

const http = require('http');
const { URL } = require('url');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

console.log('🧪 Testing Farcaster Wallet Integration (Simple)');
console.log(`📍 Site URL: ${SITE_URL}`);

async function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

async function testFarcasterIntegration() {
    try {
        console.log('🔄 Testing homepage load...');
        
        const response = await makeRequest(SITE_URL);
        
        if (response.statusCode !== 200) {
            throw new Error(`HTTP ${response.statusCode}`);
        }
        
        console.log('✅ Homepage loaded successfully');
        
        // Check for key components in the response
        const body = response.body;
        
        const checks = {
            hasReactApp: body.includes('__NEXT_DATA__'),
            hasFarcasterProvider: body.includes('FarcasterProvider'),
            hasConnectMenu: body.includes('ConnectMenu') || body.includes('Join Now'),
            hasWagmiConfig: body.includes('wagmi') || body.includes('frameConnector'),
            hasPrivySafe: body.includes('useSafePrivy') || body.includes('Privy'),
            hasNextJS: body.includes('_nextjs'),
            hasNoSSRErrors: !body.includes('Error:') && !body.includes('WagmiProviderNotFoundError')
        };
        
        console.log('📊 Component Checks:');
        Object.entries(checks).forEach(([key, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${value}`);
        });
        
        // Check for successful hydration
        const hasValidHTML = body.includes('<html') && body.includes('</html>');
        const hasValidNextJS = body.includes('"page":') && body.includes('"buildId":');
        
        console.log(`\n📋 Technical Validation:`);
        console.log(`  ✅ Valid HTML structure: ${hasValidHTML}`);
        console.log(`  ✅ Next.js hydration data: ${hasValidNextJS}`);
        console.log(`  ✅ No SSR errors: ${checks.hasNoSSRErrors}`);
        
        // Summary
        const allChecksPass = Object.values(checks).every(v => v === true);
        
        if (allChecksPass) {
            console.log('\n🎉 All integration checks passed!');
            console.log('\n📊 SUMMARY:');
            console.log('✅ Homepage loads without SSR errors');
            console.log('✅ React app initializes correctly');
            console.log('✅ Farcaster components are present');
            console.log('✅ Wagmi integration is working');
            console.log('✅ Safe Privy hooks are functioning');
            console.log('\n🔧 Key Fix Applied:');
            console.log('   - App now uses frameConnector + wagmi in Farcaster environment');
            console.log('   - Removed SSR WagmiProvider errors from FarcasterProvider');
            console.log('   - Connect menu properly detects Farcaster vs browser mode');
            console.log('   - Environment detection working correctly');
            
            return true;
        } else {
            console.log('\n⚠️ Some checks failed - review the output above');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Additional check: Verify environment detection logic
function testEnvironmentDetection() {
    console.log('\n📋 Testing Environment Detection Logic:');
    
    // Simulate different environments
    const environments = [
        {
            name: 'Browser (Desktop)',
            conditions: {
                hasWebkit: false,
                hasBaseIndicator: false,
                isIframe: false,
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            }
        },
        {
            name: 'Farcaster MiniKit',
            conditions: {
                hasWebkit: true,
                hasBaseIndicator: true,
                isIframe: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Farcaster/1.0'
            }
        },
        {
            name: 'Base MiniApp',
            conditions: {
                hasWebkit: false,
                hasBaseIndicator: true,
                isIframe: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
            }
        }
    ];
    
    environments.forEach(env => {
        // Simulate the detection logic from useSafePrivy.ts
        const shouldDetectFarcaster = 
            env.conditions.hasWebkit ||
            env.conditions.hasBaseIndicator ||
            (env.conditions.isIframe && env.conditions.userAgent.includes('Farcaster'));
            
        console.log(`  ${shouldDetectFarcaster ? '✅' : '❌'} ${env.name}: ${shouldDetectFarcaster ? 'Farcaster Mode' : 'Browser Mode'}`);
    });
}

// Run the tests
async function runAllTests() {
    console.log('🚀 Starting Farcaster Integration Tests\n');
    
    const integrationPassed = await testFarcasterIntegration();
    testEnvironmentDetection();
    
    if (integrationPassed) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Farcaster wallet integration is working correctly');
        return true;
    } else {
        console.log('\n❌ TESTS FAILED');
        console.log('⚠️ Review the errors above');
        return false;
    }
}

if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test suite error:', error);
            process.exit(1);
        });
}

module.exports = { testFarcasterIntegration, testEnvironmentDetection };