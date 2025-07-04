/**
 * Test script for AI Candidate Evaluation Edge Function
 * 
 * This script tests the AI evaluation function to ensure the new simplified
 * version (without LangChain) is working correctly.
 */

// You'll need to replace these with actual values from your database
const TEST_CONFIG = {
  // Get these from your Supabase dashboard
  candidateId: 'a35850ce-eddc-4532-b1ba-107e71d942e7',
  
  // Your Supabase Edge Functions URL
  functionUrl: 'https://msrspatwjkmyhgqucxuh.supabase.co/functions/v1/ai-candidate-evaluation',
  
  // Your Supabase Service Role Key (for direct function testing)
  serviceRoleKey: 'YOUR_SERVICE_ROLE_KEY_HERE',
  
  // OR use the API endpoint with anon key (recommended for testing)
  apiUrl: 'https://msrspatwjkmyhgqucxuh.supabase.co/api/v1/ai-candidate-evaluation',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

async function testAIEvaluationDirect() {
  console.log('🧪 Testing AI Candidate Evaluation Function (Direct - No LangChain)...\n');
  
  try {
    const response = await fetch(TEST_CONFIG.functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.serviceRoleKey}`,
      },
      body: JSON.stringify({
        candidateId: TEST_CONFIG.candidateId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! AI Evaluation completed successfully');
      console.log('\n📊 Evaluation Result:');
      console.log('- Overall Score:', result.evaluation?.overall_score);
      console.log('- Overall Status:', result.evaluation?.overall_status);
      console.log('- Recommendation:', result.evaluation?.recommendation);
      console.log('- Processing Time:', result.processingDurationMs + 'ms');
      console.log('\n🎯 Radar Metrics:');
      const radar = result.evaluation?.radar_metrics;
      if (radar) {
        console.log('- Skills:', radar.skills);
        console.log('- Growth Mindset:', radar.growth_mindset);
        console.log('- Team Work:', radar.team_work);
        console.log('- Culture:', radar.culture);
        console.log('- Communication:', radar.communication);
      }
      console.log('\n💬 Summary:', result.evaluation?.evaluation_summary);
      console.log('\n✨ Direct OpenAI API integration working correctly!');
      console.log('🎉 LangChain compatibility issues are RESOLVED!');
    } else {
      console.log('❌ FAILED! Error:', result.error);
      console.log('Status:', response.status);
      
      // Check for specific error types
      if (result.error?.includes('boot error') || result.error?.includes('langsmith')) {
        console.log('🔧 This indicates LangChain compatibility issues still exist');
      } else if (result.error?.includes('OpenAI')) {
        console.log('🔧 This indicates an OpenAI API issue');
      } else if (result.error?.includes('Candidate not found')) {
        console.log('🔧 Update TEST_CONFIG.candidateId with a valid candidate ID');
      } else if (result.error?.includes('already exists')) {
        console.log('🔧 Evaluation already exists. This is expected behavior.');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

async function testAIEvaluationAPI() {
  console.log('🧪 Testing AI Candidate Evaluation via API...\n');
  
  try {
    const response = await fetch(TEST_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`,
      },
      body: JSON.stringify({
        force: false // Set to true to regenerate existing evaluations
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! AI Evaluation via API completed successfully');
      console.log('\n📊 Evaluation Result:');
      console.log('- Overall Score:', result.evaluation?.overall_score);
      console.log('- Recommendation:', result.evaluation?.recommendation);
      console.log('- Processing Time:', result.processingDurationMs + 'ms');
      console.log('\n✨ API integration working correctly!');
    } else {
      console.log('❌ FAILED! Error:', result.error);
      console.log('Status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ API test failed with error:', error.message);
  }
}

// Quick test to check if function is accessible
async function testFunctionAvailability() {
  console.log('🔍 Testing function availability...\n');
  
  try {
    const response = await fetch(TEST_CONFIG.functionUrl, {
      method: 'OPTIONS', // CORS preflight
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      console.log('✅ Function is accessible and CORS is working');
    } else {
      console.log('❌ Function accessibility issue:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Function not accessible:', error.message);
  }
}

// Instructions for running the test
console.log('📋 INSTRUCTIONS FOR TESTING:');
console.log('1. Update the TEST_CONFIG values above with real data from your database');
console.log('2. Make sure you have a completed candidate (is_completed = true)');
console.log('3. Choose one of the test methods:');
console.log('   - testFunctionAvailability() - Quick test to check if function is accessible');
console.log('   - testAIEvaluationDirect() - Tests Edge Function directly (requires service role key)');
console.log('   - testAIEvaluationAPI() - Tests via your API endpoint (requires anon key)');
console.log('4. Run: node test-ai-evaluation.js');
console.log('5. Or copy the function code and run it in your browser console\n');

console.log('🚀 CHANGES IN THIS VERSION:');
console.log('- Removed all LangChain dependencies');
console.log('- Uses direct OpenAI API calls');
console.log('- Simplified JSON parsing (like aiQuestionService.ts)');
console.log('- Should resolve all boot errors\n');

// Uncomment the line below to run the test (after updating config)
// testFunctionAvailability();
// testAIEvaluationDirect();
// testAIEvaluationAPI();

module.exports = { 
  testFunctionAvailability,
  testAIEvaluationDirect, 
  testAIEvaluationAPI, 
  TEST_CONFIG 
}; 