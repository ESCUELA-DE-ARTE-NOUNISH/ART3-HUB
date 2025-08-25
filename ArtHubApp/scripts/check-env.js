#!/usr/bin/env node

/**
 * Environment Variables Checker
 * 
 * This script checks if all required environment variables are properly loaded.
 */

const fs = require('fs')
const path = require('path')

// Try to load from multiple possible locations
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local')
]

console.log('🔍 Checking for .env files...')

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`✅ Found: ${envPath}`)
    require('dotenv').config({ path: envPath })
  } else {
    console.log(`❌ Not found: ${envPath}`)
  }
}

console.log('')
console.log('📋 Environment Variables Status:')

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_PRIVY_APP_ID',
  'GASLESS_RELAYER_PRIVATE_KEY'
]

const optionalVars = [
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
  'NEXT_PUBLIC_IS_TESTING_MODE',
  'NEXT_PUBLIC_PINATA_API_KEY',
  'OPENROUTER_API_KEY',
  'NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453',
  'NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453'
]

let missingRequired = []

console.log('\n🔑 Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`   ✅ ${varName}: [SET]`)
  } else {
    console.log(`   ❌ ${varName}: [MISSING]`)
    missingRequired.push(varName)
  }
})

console.log('\n🔧 Optional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`   ✅ ${varName}: [SET]`)
  } else {
    console.log(`   ⚠️  ${varName}: [NOT SET]`)
  }
})

if (missingRequired.length > 0) {
  console.log('\n❌ Missing required environment variables:')
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  console.log('\n💡 Please add these to your .env file.')
  process.exit(1)
} else {
  console.log('\n✅ All required environment variables are set!')
  console.log('🚀 You can now run the database reset script.')
}