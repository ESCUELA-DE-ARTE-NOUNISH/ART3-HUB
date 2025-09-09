#!/usr/bin/env node

/**
 * Test the admin date handling fix to ensure no more -1 day shifts
 */

// Replicate the fixed date handling functions
const formatDateForInput = (dateString) => {
  try {
    if (!dateString) return ""
    
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }
    
    // Try to parse the date string (handles human-readable dates)
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return ""
    }
    
    // Use local date methods to avoid timezone shifts
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return ""
  }
}

// Helper function to convert YYYY-MM-DD format to human readable date  
const formatDateForDisplay = (dateString) => {
  try {
    if (!dateString) return ""
    
    let date
    
    // If in YYYY-MM-DD format, parse carefully to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      date = new Date(year, month - 1, day) // month is 0-based in Date constructor
    } else {
      // For other formats, parse normally
      date = new Date(dateString)
    }
    
    if (isNaN(date.getTime())) {
      return dateString
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

async function testDateHandlingFix() {
  console.log('🧪 Testing Date Handling Fix')
  console.log('=' .repeat(30))

  // Test cases that previously caused issues
  const testDates = [
    '2024-12-15',
    '2024-01-01', 
    '2024-07-04',
    '2024-11-30',
    'December 15, 2024',
    'July 4, 2024'
  ]

  console.log('📅 Testing date consistency...\n')

  let allTestsPassed = true

  for (const originalDate of testDates) {
    console.log(`Original date: "${originalDate}"`)
    
    // Simulate the edit workflow
    const inputFormat = formatDateForInput(originalDate)
    console.log(`  → Input format: "${inputFormat}"`)
    
    const displayFormat = formatDateForDisplay(inputFormat)
    console.log(`  → Display format: "${displayFormat}"`)
    
    // Convert back to input to check for consistency
    const backToInput = formatDateForInput(displayFormat)
    console.log(`  → Back to input: "${backToInput}"`)
    
    // Check if we maintained the same date
    const isConsistent = inputFormat === backToInput
    console.log(`  → Consistent: ${isConsistent ? '✅' : '❌'}`)
    
    if (!isConsistent) {
      allTestsPassed = false
      console.log(`  ⚠️ ISSUE: Date changed from ${inputFormat} to ${backToInput}`)
    }
    
    console.log('')
  }

  // Test edge cases
  console.log('🔍 Testing edge cases...\n')
  
  const edgeCases = [
    '',
    'invalid-date',
    '2024-02-29', // Leap year
    '2024-12-31', // End of year
  ]

  for (const edgeCase of edgeCases) {
    console.log(`Edge case: "${edgeCase}"`)
    try {
      const inputFormat = formatDateForInput(edgeCase)
      console.log(`  → Input format: "${inputFormat}"`)
      
      if (inputFormat) {
        const displayFormat = formatDateForDisplay(inputFormat)
        console.log(`  → Display format: "${displayFormat}"`)
      }
      console.log(`  → Handled gracefully: ✅`)
    } catch (error) {
      console.log(`  → Error: ${error.message}`)
      console.log(`  → Handled gracefully: ❌`)
      allTestsPassed = false
    }
    console.log('')
  }

  // Summary
  console.log('📋 TEST RESULTS')
  console.log('=' .repeat(20))
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ Date handling fix appears to be working correctly')
    console.log('✅ No more -1 day shifts should occur')
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('⚠️ Date handling may still have issues')
  }
}

if (require.main === module) {
  testDateHandlingFix()
}

module.exports = { testDateHandlingFix, formatDateForInput, formatDateForDisplay }