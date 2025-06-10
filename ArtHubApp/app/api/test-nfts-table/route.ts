import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured, getSupabaseConfig } from '@/lib/supabase'

export async function GET() {
  try {
    // Check configuration
    const config = getSupabaseConfig()
    console.log('Supabase config:', config)
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        error: 'Database not configured',
        config: config
      }, { status: 503 })
    }

    // Test if nfts table exists and try to count records
    const { count, error } = await supabase
      .from('nfts')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('NFTs table error:', error)
      
      // Check if it's a table not found error
      if (error.message.includes('relation "nfts" does not exist')) {
        return NextResponse.json({ 
          error: 'NFTs table does not exist - please run the SQL migration',
          sqlFile: 'database/nfts-table.sql',
          details: error.message 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Database query failed', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'NFTs table exists and is accessible',
      count: count || 0
    })

  } catch (error) {
    console.error('Error testing NFTs table:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}