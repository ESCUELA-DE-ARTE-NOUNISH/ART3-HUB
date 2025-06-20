/**
 * Database migration script for chat memory system
 * Run this to set up the necessary tables for intelligent chat functionality
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  try {
    console.log('🚀 Starting chat memory database migration...')
    
    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'database', 'chat-memory-schema.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found at:', schemaPath)
      console.log('📝 Please ensure the chat-memory-schema.sql file exists in the database directory')
      return
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE FUNCTION') || 
          statement.includes('CREATE INDEX') || statement.includes('CREATE TRIGGER') ||
          statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY')) {
        
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          })
          
          if (error) {
            console.error(`❌ Error executing statement ${i + 1}:`, error)
            // Continue with next statement for non-critical errors
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (statementError) {
          console.error(`❌ Exception executing statement ${i + 1}:`, statementError)
        }
      }
    }
    
    // Test the migration by checking if tables exist
    console.log('\n🔍 Verifying migration...')
    
    const tablesToCheck = [
      'conversation_sessions',
      'conversation_messages', 
      'user_memory',
      'assessment_responses'
    ]
    
    for (const tableName of tablesToCheck) {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${tableName}' verification failed:`, error.message)
      } else {
        console.log(`✅ Table '${tableName}' is accessible`)
      }
    }
    
    // Test the functions
    console.log('\n🧪 Testing functions...')
    
    try {
      const { error } = await supabase.rpc('get_or_create_user_memory', {
        p_wallet_address: '0x1234567890123456789012345678901234567890'
      })
      
      if (error) {
        console.log(`❌ Function 'get_or_create_user_memory' test failed:`, error.message)
      } else {
        console.log(`✅ Function 'get_or_create_user_memory' is working`)
      }
    } catch (funcError) {
      console.log(`❌ Function test error:`, funcError)
    }
    
    console.log('\n🎉 Migration completed!')
    console.log('📋 Summary:')
    console.log('  - conversation_sessions: Tracks chat sessions with stage and outcome')
    console.log('  - conversation_messages: Stores individual messages in conversations')
    console.log('  - user_memory: Persistent user context and learning progress')
    console.log('  - assessment_responses: User answers during conversation assessment')
    console.log('\n💡 You can now use the intelligent chat system!')
    console.log('🔗 Access it at: /[locale]/ai-agent/intelligent')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative direct SQL execution if RPC doesn't work
async function runMigrationDirect() {
  try {
    console.log('🚀 Starting direct SQL migration...')
    
    const schemaPath = path.join(process.cwd(), 'database', 'chat-memory-schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
    
    console.log('📋 Please run the following SQL in your Supabase SQL editor:')
    console.log('='.repeat(80))
    console.log(schemaSql)
    console.log('='.repeat(80))
    console.log('\n💡 After running the SQL, you can test the intelligent chat system')
    
  } catch (error) {
    console.error('❌ Error reading schema file:', error)
  }
}

// Check if running directly
if (require.main === module) {
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY')
    console.log('\n📝 Please set these in your .env.local file')
    process.exit(1)
  }
  
  // Try RPC migration first, fallback to direct if needed
  runMigration().catch(() => {
    console.log('\n⚠️  RPC migration failed, showing direct SQL approach...')
    runMigrationDirect()
  })
}

export { runMigration, runMigrationDirect }