// Debug script for predictions
// Run this in the browser console to test the LocalPredictionService

async function debugPredictions() {
  try {
    console.log('🔍 Debugging predictions...');

    // Test 1: Direct fetch of prediction files
    console.log('\n📁 Test 1: Direct file access');

    const nextRaceResponse = await fetch('/predictions/next-race-predictions.json');
    console.log('Next race response status:', nextRaceResponse.status);

    if (nextRaceResponse.ok) {
      const nextRaceData = await nextRaceResponse.json();
      console.log('✅ Next race data loaded successfully');
      console.log('Race:', nextRaceData.race);
      console.log('Drivers:', nextRaceData.predictions?.length || 0);
      console.log('Sample driver:', nextRaceData.predictions?.[0]);
    } else {
      console.error('❌ Failed to load next race predictions');
    }

    // Test 2: Test LocalPredictionService
    console.log('\n🎯 Test 2: LocalPredictionService');

    try {
      // Import the service dynamically
      const { default: LocalPredictionService } = await import('./services/LocalPredictionService.ts');
      const localService = LocalPredictionService.getInstance();

      console.log('✅ LocalPredictionService imported successfully');

      // Test next race prediction
      const nextRacePrediction = await localService.getNextRacePrediction();
      console.log('Next race prediction result:', nextRacePrediction);

      if (nextRacePrediction) {
        // Test conversion
        const converted = localService.convertToRacePrediction(nextRacePrediction);
        console.log('Conversion successful');
        console.log('Converted prediction:', converted);
        console.log('Top 3 drivers:', converted.top3);
        console.log('All drivers:', converted.all?.length || 0);
      }

    } catch (importError) {
      console.error('Failed to import LocalPredictionService:', importError);
    }

    // Test 3: Check if PredictPage is calling the service
    console.log('\n📱 Test 3: PredictPage integration');

    // Check if the page has the service instance
    if (window.PredictPage) {
      console.log('PredictPage found');
    } else {
      console.log('PredictPage not found in window object');
    }

    // Check for any global errors
    console.log('\n Global errors check');
    if (window.lastError) {
      console.error('Last error:', window.lastError);
    }

    console.log('\n Debug completed!');

  } catch (error) {
    console.error(' Debug failed:', error);
  }
}

// Also add error handler to catch any unhandled errors
window.addEventListener('error', (event) => {
  console.error(' Unhandled error:', event.error);
  window.lastError = event.error;
});

// Run the debug
debugPredictions();
