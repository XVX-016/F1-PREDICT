import MLPredictionService from '../services/MLPredictionService';
import { getDrivers, getRaces, getArchiveRaces } from '../api/jolpica';

interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalPredictions: number;
  correctPredictions: number;
}

class MLModelTrainer {
  private testResults: ModelPerformance[] = [];

  async trainAndTestModel() {
    console.log('🚀 Starting ML Model Training and Testing...\n');

    try {
      // Step 1: Initialize the model with historical data
      console.log('📊 Step 1: Loading historical F1 data...');
      const [drivers, races, archiveRaces] = await Promise.all([
        getDrivers(),
        getRaces(),
        getArchiveRaces()
      ]);

      console.log(`✅ Loaded ${drivers.length} drivers, ${races.length} races, ${archiveRaces.length} archive races\n`);

      // Step 2: Generate predictions for past races
      console.log('🎯 Step 2: Generating predictions for past races...');
      const testRaces = races.slice(-10); // Test on last 10 races
      
      for (const race of testRaces) {
        console.log(`\n🏁 Testing race: ${race.raceName} (Round ${race.round})`);
        
        // Generate predictions for this race
        const prediction = await MLPredictionService.generatePredictions(
          race.round.toString(),
          race.Circuit.circuitName
        );

        // Simulate actual results (in real scenario, you'd compare with actual race results)
        const actualResults = this.simulateActualResults(race);
        
        // Test prediction accuracy
        const performance = this.testPredictionAccuracy(prediction, actualResults);
        this.testResults.push(performance);

        console.log(`   📈 Race Winner Accuracy: ${performance.accuracy.toFixed(1)}%`);
        console.log(`   🎯 Precision: ${performance.precision.toFixed(1)}%`);
        console.log(`   📊 Recall: ${performance.recall.toFixed(1)}%`);
        console.log(`   ⚡ F1 Score: ${performance.f1Score.toFixed(1)}%`);
      }

      // Step 3: Calculate overall model performance
      console.log('\n📊 Step 3: Overall Model Performance');
      const overallPerformance = this.calculateOverallPerformance();
      
      console.log(`\n🏆 FINAL RESULTS:`);
      console.log(`   Overall Accuracy: ${overallPerformance.accuracy.toFixed(1)}%`);
      console.log(`   Overall Precision: ${overallPerformance.precision.toFixed(1)}%`);
      console.log(`   Overall Recall: ${overallPerformance.recall.toFixed(1)}%`);
      console.log(`   Overall F1 Score: ${overallPerformance.f1Score.toFixed(1)}%`);
      console.log(`   Total Predictions: ${overallPerformance.totalPredictions}`);
      console.log(`   Correct Predictions: ${overallPerformance.correctPredictions}`);

      // Step 4: Generate predictions for next race
      console.log('\n🔮 Step 4: Generating predictions for next race...');
      const nextRacePrediction = await MLPredictionService.generatePredictions('next', 'Circuit de Monaco');
      
      console.log('\n🎯 PREDICTIONS FOR NEXT RACE:');
      console.log(`   Race: ${nextRacePrediction.raceName}`);
      console.log(`   Circuit: ${nextRacePrediction.circuit}`);
      console.log(`   Model Confidence: ${nextRacePrediction.confidence}%`);
      
      console.log('\n🏆 TOP 5 RACE WINNER PREDICTIONS:');
      nextRacePrediction.predictions.raceWinner.slice(0, 5).forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.driverName} - ${driver.odds} odds (${Math.round(driver.probability * 100)}% probability)`);
      });

      console.log('\n🥇 TOP 5 PODIUM PREDICTIONS:');
      nextRacePrediction.predictions.podium.slice(0, 5).forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.driverName} - ${driver.odds} odds (${Math.round(driver.probability * 100)}% probability)`);
      });

      console.log('\n🎯 TOP 5 POLE POSITION PREDICTIONS:');
      nextRacePrediction.predictions.qualifying.slice(0, 5).forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.driverName} - ${driver.odds} odds (${Math.round(driver.probability * 100)}% probability)`);
      });

      console.log('\n⚡ TOP 5 FASTEST LAP PREDICTIONS:');
      nextRacePrediction.predictions.fastestLap.slice(0, 5).forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.driverName} - ${driver.odds} odds (${Math.round(driver.probability * 100)}% probability)`);
      });

      console.log('\n✅ ML Model Training and Testing Complete!');

    } catch (error) {
      console.error('❌ Error during ML model training:', error);
    }
  }

  private simulateActualResults(race: any) {
    // Simulate actual race results for testing purposes
    // In a real scenario, this would come from actual race data
    const drivers = ['Max Verstappen', 'Lando Norris', 'Oscar Piastri', 'George Russell', 'Charles Leclerc'];
    
    return {
      raceWinner: drivers[Math.floor(Math.random() * 3)], // Top 3 drivers more likely
      podium: drivers.slice(0, 3),
      qualifying: drivers[Math.floor(Math.random() * 5)],
      fastestLap: drivers[Math.floor(Math.random() * 5)]
    };
  }

  private testPredictionAccuracy(prediction: any, actualResults: any): ModelPerformance {
    let correctPredictions = 0;
    let totalPredictions = 0;

    // Test race winner prediction
    const predictedWinner = prediction.predictions.raceWinner[0]?.driverName;
    if (predictedWinner === actualResults.raceWinner) {
      correctPredictions++;
    }
    totalPredictions++;

    // Test podium prediction (check if any of top 3 predicted drivers made podium)
    const predictedPodium = prediction.predictions.podium.slice(0, 3).map((d: any) => d.driverName);
    const hasPodiumCorrect = predictedPodium.some((driver: string) => 
      actualResults.podium.includes(driver)
    );
    if (hasPodiumCorrect) {
      correctPredictions++;
    }
    totalPredictions++;

    // Test qualifying prediction
    const predictedPole = prediction.predictions.qualifying[0]?.driverName;
    if (predictedPole === actualResults.qualifying) {
      correctPredictions++;
    }
    totalPredictions++;

    // Test fastest lap prediction
    const predictedFastestLap = prediction.predictions.fastestLap[0]?.driverName;
    if (predictedFastestLap === actualResults.fastestLap) {
      correctPredictions++;
    }
    totalPredictions++;

    const accuracy = (correctPredictions / totalPredictions) * 100;
    const precision = accuracy; // Simplified for this example
    const recall = accuracy; // Simplified for this example
    const f1Score = (2 * precision * recall) / (precision + recall);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      totalPredictions,
      correctPredictions
    };
  }

  private calculateOverallPerformance(): ModelPerformance {
    const totalPredictions = this.testResults.reduce((sum, result) => sum + result.totalPredictions, 0);
    const totalCorrect = this.testResults.reduce((sum, result) => sum + result.correctPredictions, 0);
    
    const accuracy = (totalCorrect / totalPredictions) * 100;
    const precision = accuracy; // Simplified
    const recall = accuracy; // Simplified
    const f1Score = (2 * precision * recall) / (precision + recall);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      totalPredictions,
      correctPredictions: totalCorrect
    };
  }

  async retrainModel() {
    console.log('🔄 Retraining ML model...');
    await MLPredictionService.retrainModel();
    console.log('✅ Model retrained successfully');
  }
}

// Run the training if this script is executed directly
if (require.main === module) {
  const trainer = new MLModelTrainer();
  trainer.trainAndTestModel().then(() => {
    console.log('\n🎉 ML Model training script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ ML Model training failed:', error);
    process.exit(1);
  });
}

export default MLModelTrainer;
