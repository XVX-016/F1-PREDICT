// Test script for LocalPredictionService
// Run this in the browser console to test if local predictions are working

async function testLocalPredictions() {
  try {
    console.log('🧪 Testing LocalPredictionService...');
    
    // Test 1: Direct fetch
    console.log('\n📁 Test 1: Direct file fetch');
    const response = await fetch('/predictions/next-race-predictions.json');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ File loaded successfully');
      console.log('Race:', data.race);
      console.log('Drivers:', data.predictions?.length || 0);
      console.log('Sample driver:', data.predictions?.[0]);
    } else {
      console.error('❌ Failed to load file');
    }
    
    // Test 2: Test the service methods
    console.log('\n🎯 Test 2: Service methods');
    
    // Import the service
    const { default: LocalPredictionService } = await import('./services/LocalPredictionService.ts');
    const service = LocalPredictionService.getInstance();
    
    console.log('✅ Service imported');
    
    // Test next race
    const nextRace = await service.getNextRacePrediction();
    console.log('Next race result:', nextRace ? 'Success' : 'Failed');
    
    if (nextRace) {
      console.log('Race name:', nextRace.race);
      console.log('Driver count:', nextRace.predictions?.length || 0);
      
      // Test conversion
      const converted = service.convertToRacePrediction(nextRace);
      console.log('✅ Conversion successful');
      console.log('Top 3:', converted.top3?.length || 0);
      console.log('All drivers:', converted.all?.length || 0);
      
      // Show sample data
      if (converted.top3 && converted.top3.length > 0) {
        console.log('Sample top 3 driver:', converted.top3[0]);
      }
    }
    
    // Test available races
    const availableRaces = await service.getAvailableRaces();
    console.log('Available races:', availableRaces?.length || 0);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLocalPredictions();
