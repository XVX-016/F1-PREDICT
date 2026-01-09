// Simple test for LocalPredictionService
// Run this in the browser console to test

async function testLocalService() {
  try {
    console.log('🧪 Testing LocalPredictionService...');
    
    // Test loading next race predictions
    const nextRaceResponse = await fetch('/predictions/next-race-predictions.json');
    if (nextRaceResponse.ok) {
      const nextRaceData = await nextRaceResponse.json();
      console.log('✅ Next race data loaded:', nextRaceData);
      console.log(`📊 Race: ${nextRaceData.race}`);
      console.log(`🏎️ Drivers: ${nextRaceData.predictions?.length || 0}`);
      
      if (nextRaceData.predictions && nextRaceData.predictions.length > 0) {
        console.log('👥 Sample drivers:');
        nextRaceData.predictions.slice(0, 3).forEach((driver, i) => {
          console.log(`  ${i + 1}. ${driver.driverName} (${driver.driverId}) - ${driver.constructor}`);
        });
      }
    } else {
      console.error('❌ Failed to load next race predictions');
    }
    
    // Test loading all races predictions
    const allRacesResponse = await fetch('/predictions/all-races-predictions.json');
    if (allRacesResponse.ok) {
      const allRacesData = await allRacesResponse.json();
      console.log('✅ All races data loaded');
      console.log(`📅 Races available: ${Object.keys(allRacesData).length}`);
      console.log('🏁 Available races:', Object.keys(allRacesData));
    } else {
      console.error('❌ Failed to load all races predictions');
    }
    
    console.log('🎉 Local service test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLocalService();
