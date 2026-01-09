// Simple test script to verify F1 endpoints
const baseUrl = 'http://localhost:3001';

async function testEndpoint(endpoint, description) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description}: SUCCESS`);
      console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`❌ ${description}: FAILED (${response.status})`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
  }
  console.log('');
}

async function runTests() {
  console.log('🧪 Testing F1 Backend Endpoints...\n');
  
  // Test health endpoint
  await testEndpoint('/health', 'Health Check');
  
  // Test F1 endpoints
  await testEndpoint('/f1/races', 'F1 Races List');
  await testEndpoint('/f1/live/status', 'Live Status');
  await testEndpoint('/f1/live/race/2025/1', 'Live Race Data');
  await testEndpoint('/f1/results/2025/1', 'Race Results');
  
  // Test API endpoints
  await testEndpoint('/api/v1/races', 'API Races List');
  
  console.log('🎯 Testing completed!');
}

// Run tests
runTests();
