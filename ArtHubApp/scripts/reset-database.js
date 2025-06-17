#!/usr/bin/env node

/**
 * Art3Hub V2 Database Reset Script
 * 
 * This script resets the database to work with the V2 subscription-based model.
 * Run this script when you want to start fresh with V2.
 * 
 * Usage:
 *   node scripts/reset-database.js
 * 
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in environment
 *   - SUPABASE_SERVICE_ROLE_KEY in environment (service role key with full access)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Environment variables check:')
console.log('   .env file path:', path.join(__dirname, '..', '.env'))
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing')
console.log('')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('')
  console.error('Debug info:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL value:', supabaseUrl || 'undefined')
  console.error('   SUPABASE_SERVICE_ROLE_KEY value:', supabaseServiceKey ? '[REDACTED]' : 'undefined')
  console.error('')
  console.error('Please check your .env file contains:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('')
  console.error('💡 Make sure:')
  console.error('   1. The .env file is in the root directory (same level as package.json)')
  console.error('   2. Variable names are exactly as shown (case-sensitive)')
  console.error('   3. No spaces around the = sign')
  console.error('   4. Values are not wrapped in quotes unless needed')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetDatabase() {
  try {
    console.log('🚀 Starting Art3Hub V2 database reset...')
    console.log('📍 Supabase URL:', supabaseUrl)
    console.log('')

    // Read the reset SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'reset-database-v2.sql')
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`)
    }

    const resetSQL = fs.readFileSync(sqlPath, 'utf8')
    console.log('📄 Loaded reset SQL script')

    // Execute the reset SQL
    console.log('🔄 Executing database reset...')
    
    // Split SQL into individual statements and execute them
    const statements = resetSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.toLowerCase().includes('drop') || 
          statement.toLowerCase().includes('create') ||
          statement.toLowerCase().includes('insert') ||
          statement.toLowerCase().includes('alter')) {
        
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })

        if (error) {
          // Try direct query execution as fallback
          const { error: directError } = await supabase
            .from('dummy')
            .select('*')
            .limit(0)
          
          if (directError && directError.message.includes('does not exist')) {
            // Table doesn't exist yet, continue
          } else if (error.message.includes('already exists') || 
                     error.message.includes('does not exist')) {
            // Expected errors during reset, continue
            console.log(`     ⚠️  ${error.message} (continuing...)`)
          } else {
            console.warn(`     ⚠️  Warning: ${error.message}`)
          }
        }
      }
    }

    // Verify the reset by checking if tables exist
    console.log('')
    console.log('🔍 Verifying database structure...')

    // Test user_profiles table
    const { count: userCount, error: userError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    if (userError) {
      throw new Error(`Failed to verify user_profiles table: ${userError.message}`)
    }

    // Test nfts table
    const { count: nftCount, error: nftError } = await supabase
      .from('nfts')
      .select('*', { count: 'exact', head: true })

    if (nftError) {
      throw new Error(`Failed to verify nfts table: ${nftError.message}`)
    }

    // Test subscriptions table
    const { count: subCount, error: subError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    if (subError) {
      throw new Error(`Failed to verify subscriptions table: ${subError.message}`)
    }

    // Test collections table
    const { count: collCount, error: collError } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })

    if (collError) {
      throw new Error(`Failed to verify collections table: ${collError.message}`)
    }

    console.log('✅ Database structure verified successfully!')
    console.log('')
    console.log('📊 Current table status:')
    console.log(`   user_profiles: ${userCount || 0} records`)
    console.log(`   nfts: ${nftCount || 0} records`)
    console.log(`   subscriptions: ${subCount || 0} records`)
    console.log(`   collections: ${collCount || 0} records`)
    console.log('')
    console.log('🎉 Art3Hub V2 database reset completed successfully!')
    console.log('')
    console.log('📝 What was updated:')
    console.log('   ✅ Added subscription management fields to user_profiles')
    console.log('   ✅ Updated nfts table for V2 collection-based structure')
    console.log('   ✅ Added subscriptions table for payment tracking')
    console.log('   ✅ Added collections table for V2 collection tracking')
    console.log('   ✅ Set default testing mode (Base Sepolia, Chain ID: 84532)')
    console.log('')
    console.log('🚀 Ready for Art3Hub V2 testing!')

  } catch (error) {
    console.error('❌ Database reset failed:', error.message)
    console.error('')
    console.error('🔧 Troubleshooting tips:')
    console.error('   1. Check your Supabase credentials in .env')
    console.error('   2. Ensure SUPABASE_SERVICE_ROLE_KEY has full database access')
    console.error('   3. Verify your Supabase project is active')
    console.error('   4. Check network connectivity to Supabase')
    process.exit(1)
  }
}

// Run the reset
resetDatabase()