import { NextResponse } from 'next/server'
import { supabase, getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    const config = getSupabaseConfig()
    console.log('Supabase configuration:', config)

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured',
        config
      }, { status: 500 })
    }

    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message,
        config
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      config,
      data
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}