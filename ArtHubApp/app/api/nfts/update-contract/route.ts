import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.DATABASE_URL?.includes('supabase.co') 
  ? process.env.DATABASE_URL.replace('postgresql://postgres.', 'https://').replace('.pooler.supabase.com:5432/', '.supabase.co/')
  : process.env.SUPABASE_URL

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function POST(request: NextRequest) {
  try {
    const { transaction_hash, contract_address } = await request.json()
    
    if (!transaction_hash || !contract_address) {
      return NextResponse.json(
        { error: 'Missing transaction_hash or contract_address' }, 
        { status: 400 }
      )
    }

    console.log(`🔄 Updating contract address for transaction ${transaction_hash} to ${contract_address}`)

    // Update the NFT record with the correct contract address
    const { data, error } = await supabase
      .from('nfts')
      .update({ 
        contract_address: contract_address,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_hash', transaction_hash)
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update NFT contract address' }, 
        { status: 500 }
      )
    }

    console.log('✅ Contract address updated successfully:', data)
    
    return NextResponse.json({ 
      success: true, 
      updated: data?.length || 0,
      nft: data?.[0] || null
    })

  } catch (error) {
    console.error('❌ Error updating contract address:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}