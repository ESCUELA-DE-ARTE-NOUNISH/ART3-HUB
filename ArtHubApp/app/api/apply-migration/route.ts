import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured',
      }, { status: 500 })
    }

    const results = []

    // First, let's check the current table structure
    console.log('Checking current table structure...')
    const { data: currentData, error: currentError } = await supabase
      .from('nfts')
      .select('*')
      .limit(1)

    if (currentError) {
      return NextResponse.json({
        error: 'Cannot connect to nfts table',
        details: currentError.message
      }, { status: 500 })
    }

    results.push({ 
      step: 'table_check', 
      status: 'success', 
      current_columns: currentData?.[0] ? Object.keys(currentData[0]) : [] 
    })

    // Since we can't use ALTER TABLE directly through Supabase client,
    // we'll need to use the SQL editor or handle this differently.
    // For now, let's test if the columns already exist by trying to select them
    
    console.log('Testing if new columns exist...')
    const { data: testColumns, error: testError } = await supabase
      .from('nfts')
      .select('id, artist_name, category, view_count, likes_count, tags')
      .limit(1)

    if (testError) {
      results.push({ 
        step: 'column_test', 
        status: 'columns_missing', 
        error: testError.message,
        message: 'The columns do not exist yet. You need to apply the migration through Supabase SQL editor.'
      })
      
      return NextResponse.json({
        success: false,
        message: 'Migration needed: columns do not exist',
        results,
        instructions: {
          message: 'Please apply the migration manually through Supabase SQL editor',
          sql_file: '/Users/osx/Projects/Nouns/ART3-HUB/ArtHubApp/database/migration-add-artist-category.sql',
          steps: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the SQL from migration-add-artist-category.sql',
            '4. Execute the SQL',
            '5. Run this endpoint again to verify'
          ]
        }
      })
    }

    results.push({ step: 'column_test', status: 'columns_exist' })

    // If we get here, columns exist. Let's update any records that need default values
    console.log('Updating records with missing values...')
    
    // Update artist_name for records that don't have it
    const { data: updateArtistData, error: updateArtistError } = await supabase
      .from('nfts')
      .update({ artist_name: 'Unknown Artist' })
      .is('artist_name', null)
      .select()

    if (updateArtistError) {
      results.push({ step: 'update_artist_name', status: 'error', error: updateArtistError.message })
    } else {
      results.push({ 
        step: 'update_artist_name', 
        status: 'success', 
        updated_count: updateArtistData?.length || 0 
      })
    }

    // Update category for records that don't have it
    const { data: updateCategoryData, error: updateCategoryError } = await supabase
      .from('nfts')
      .update({ category: 'Digital Art' })
      .is('category', null)
      .select()

    if (updateCategoryError) {
      results.push({ step: 'update_category', status: 'error', error: updateCategoryError.message })
    } else {
      results.push({ 
        step: 'update_category', 
        status: 'success', 
        updated_count: updateCategoryData?.length || 0 
      })
    }

    // Final test - fetch some records to show the new structure
    const { data: finalData, error: finalError } = await supabase
      .from('nfts')
      .select('id, name, artist_name, category, view_count, likes_count')
      .limit(3)

    if (finalError) {
      results.push({ step: 'final_test', status: 'error', error: finalError.message })
    } else {
      results.push({ step: 'final_test', status: 'success', sample_data: finalData })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration verification completed successfully',
      results
    })

  } catch (error) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}