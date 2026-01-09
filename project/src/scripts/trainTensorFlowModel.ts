import TensorFlowMLService from '../services/TensorFlowMLService.ts';
import { getDrivers, getRaces, getArchiveRaces } from '../api/jolpica.ts';

interface TrainingData {
  features: number[][];
  labels: number[];
  driverNames: string[];
}

class TensorFlowTrainer {
  private trainingData: TrainingData = {
    features: [],
    labels: [],
    driverNames: []
  };

  async trainAndTestModel() {
    console.log('🚀 Starting TensorFlow Model Training and Testing...\n');

    try {
      // Step 1: Load F1 data
      console.log('📊 Step 1: Loading F1 data from backend...');
      const [drivers, races, archiveRaces] = await Promise.all([
        getDrivers(),
        getRaces(),
        getArchiveRaces()
      ]);

      console.log(`✅ Loaded ${drivers.length} drivers, ${races.length} races, ${archiveRaces.length} archive races\n`);

      // Step 2: Prepare training data
      console.log('🔧 Step 2: Preparing training data...');
      await this.prepareTrainingData(drivers, races, archiveRaces);

      // Step 3: Train the model
      console.log('🧠 Step 3: Training TensorFlow model...');
      await this.trainModel();

      // Step 4: Test the model
      console.log('🎯 Step 4: Testing model predictions...');
      await this.testModel();

      // Step 5: Save the model
      console.log('💾 Step 5: Saving trained model...');
      await this.saveModel();

      console.log('\n✅ TensorFlow Model Training and Testing Complete!');

    } catch (error) {
      console.error('❌ Error during TensorFlow model training:', error);
    }
  }

  private async prepareTrainingData(drivers: any[], races: any[], archiveRaces: any[]) {
    console.log('   Extracting features from historical data...');
    
    // Create synthetic training data based on driver performance
    const trainingExamples: any[] = [];
    
    // Use recent races and driver stats to create training examples
    const recentRaces = [...races, ...archiveRaces].slice(-50); // Last 50 races
    
    for (const race of recentRaces) {
      if (race.results && race.results.length > 0) {
        // Create features for each driver in this race
        for (const driver of drivers) {
          const driverFeatures = this.extractDriverFeatures(driver, race, recentRaces);
          const isWinner = race.results[0]?.driverId === driver.driverId ? 1 : 0;
          
          trainingExamples.push({
            features: driverFeatures,
            label: isWinner,
            driverName: driver.driverName || driver.givenName + ' ' + driver.familyName
          });
        }
      }
    }

    // Convert to training format
    this.trainingData.features = trainingExamples.map(ex => ex.features);
    this.trainingData.labels = trainingExamples.map(ex => ex.label);
    this.trainingData.driverNames = trainingExamples.map(ex => ex.driverName);

    console.log(`   Created ${this.trainingData.features.length} training examples`);
  }

  private extractDriverFeatures(driver: any, currentRace: any, recentRaces: any[]): number[] {
    // Calculate season stats
    const seasonStats = this.calculateSeasonStats(driver, recentRaces);
    
    // Calculate track history
    const trackHistory = this.calculateTrackHistory(driver, currentRace, recentRaces);
    
    // Calculate recent form
    const recentForm = this.calculateRecentForm(driver, recentRaces);
    
    // Calculate qualifying stats
    const qualifyingStats = this.calculateQualifyingStats(driver, recentRaces);
    
    // Calculate fastest lap stats
    const fastestLapStats = this.calculateFastestLapStats(driver, recentRaces);
    
    // Team strength (simplified)
    const teamStrength = this.getTeamStrength(driver.constructorId || 'unknown');
    
    // Home race bonus
    const homeRaceBonus = this.isHomeRace(driver, currentRace) ? 1 : 0;
    
    return [
      seasonStats.points,
      seasonStats.wins,
      seasonStats.podiums,
      seasonStats.dnfs,
      trackHistory.wins,
      trackHistory.podiums,
      trackHistory.races,
      recentForm.average,
      recentForm.consistency,
      qualifyingStats.averageGrid,
      qualifyingStats.poles,
      fastestLapStats.count,
      teamStrength,
      homeRaceBonus,
      trackHistory.races > 0 ? trackHistory.wins / trackHistory.races : 0
    ];
  }

  private calculateSeasonStats(driver: any, races: any[]): any {
    let points = 0, wins = 0, podiums = 0, dnfs = 0;
    
    for (const race of races) {
      const result = race.results?.find((r: any) => r.driverId === driver.driverId);
      if (result) {
        points += result.points || 0;
        if (result.position === '1') wins++;
        if (['1', '2', '3'].includes(result.position)) podiums++;
        if (result.status !== 'Finished') dnfs++;
      }
    }
    
    return { points, wins, podiums, dnfs };
  }

  private calculateTrackHistory(driver: any, currentRace: any, races: any[]): any {
    const trackRaces = races.filter(race => 
      race.circuit?.circuitId === currentRace.circuit?.circuitId
    );
    
    let wins = 0, podiums = 0;
    for (const race of trackRaces) {
      const result = race.results?.find((r: any) => r.driverId === driver.driverId);
      if (result) {
        if (result.position === '1') wins++;
        if (['1', '2', '3'].includes(result.position)) podiums++;
      }
    }
    
    return { wins, podiums, races: trackRaces.length };
  }

  private calculateRecentForm(driver: any, races: any[]): any {
    const recentResults = races.slice(-10).map(race => {
      const result = race.results?.find((r: any) => r.driverId === driver.driverId);
      return result ? parseInt(result.position) || 20 : 20;
    });
    
         const average = recentResults.reduce((sum, pos) => sum + pos, 0) / recentResults.length;
     // Calculate standard deviation manually
     const variance = recentResults.reduce((sum, pos) => sum + Math.pow(pos - average, 2), 0) / recentResults.length;
     const consistency = Math.sqrt(variance);
    
    return { average, consistency };
  }

  private calculateQualifyingStats(driver: any, races: any[]): any {
    let totalGrid = 0, poles = 0, count = 0;
    
    for (const race of races) {
      const qualifying = race.qualifying?.find((q: any) => q.driverId === driver.driverId);
      if (qualifying && qualifying.position) {
        totalGrid += parseInt(qualifying.position);
        if (qualifying.position === '1') poles++;
        count++;
      }
    }
    
    return {
      averageGrid: count > 0 ? totalGrid / count : 10,
      poles,
      count
    };
  }

  private calculateFastestLapStats(driver: any, races: any[]): any {
    let count = 0;
    
    for (const race of races) {
      const result = race.results?.find((r: any) => r.driverId === driver.driverId);
      if (result && result.FastestLap?.rank === '1') {
        count++;
      }
    }
    
    return { count };
  }

  private getTeamStrength(constructorId: string): number {
    // Simplified team strength mapping
    const teamStrengths: { [key: string]: number } = {
      'red_bull': 0.9,
      'ferrari': 0.85,
      'mclaren': 0.8,
      'mercedes': 0.75,
      'aston_martin': 0.7,
      'alpine': 0.65,
      'williams': 0.6,
      'haas': 0.55,
      'racing_bulls': 0.5,
      'kick_sauber': 0.45
    };
    
    return teamStrengths[constructorId] || 0.5;
  }

  private isHomeRace(driver: any, race: any): boolean {
    // Simplified home race detection
    const homeCountries: { [key: string]: string[] } = {
      'british': ['GBR', 'GB'],
      'dutch': ['NLD', 'NL'],
      'spanish': ['ESP', 'ES'],
      'french': ['FRA', 'FR'],
      'german': ['DEU', 'DE'],
      'italian': ['ITA', 'IT'],
      'australian': ['AUS', 'AU'],
      'canadian': ['CAN', 'CA'],
      'mexican': ['MEX', 'MX'],
      'japanese': ['JPN', 'JP']
    };
    
    const driverNationality = driver.nationality?.toLowerCase();
    const raceCountry = race.circuit?.location?.country;
    
    if (driverNationality && raceCountry) {
      const homeCountriesForDriver = homeCountries[driverNationality];
      return homeCountriesForDriver?.includes(raceCountry) || false;
    }
    
    return false;
  }

  private async trainModel() {
    if (this.trainingData.features.length === 0) {
      console.log('   ⚠️  No training data available, using synthetic data...');
      // Create synthetic training data
      this.createSyntheticTrainingData();
    }

    // Convert to TensorFlow format
    const features = this.trainingData.features;
    const labels = this.trainingData.labels;

    // Create driver features for training
    const driverFeatures = features.map(f => ({
      driverId: `driver_${Math.random().toString(36).substr(2, 9)}`,
      driverName: this.trainingData.driverNames[features.indexOf(f)] || 'Unknown Driver',
      seasonPoints: f[0],
      seasonWins: f[1],
      seasonPodiums: f[2],
      seasonDNFs: f[3],
      trackHistoryWins: f[4],
      trackHistoryPodiums: f[5],
      trackHistoryRaces: f[6],
      recentFormAverage: f[7],
      recentFormConsistency: f[8],
      qualifyingAverageGrid: f[9],
      qualifyingPoles: f[10],
      fastestLaps: f[11],
      teamStrength: f[12],
      homeRaceBonus: f[13]
    }));

    // Train the model
    await TensorFlowMLService.trainModel(driverFeatures, labels);
  }

  private createSyntheticTrainingData() {
    console.log('   Creating synthetic training data for demonstration...');
    
    // Create realistic synthetic data based on F1 patterns
    const syntheticFeatures = [];
    const syntheticLabels = [];
    const syntheticNames = [];
    
    // Generate 1000 training examples
    for (let i = 0; i < 1000; i++) {
      const features = [
        Math.random() * 500, // seasonPoints
        Math.random() * 10,  // seasonWins
        Math.random() * 20,  // seasonPodiums
        Math.random() * 5,   // seasonDNFs
        Math.random() * 3,   // trackHistoryWins
        Math.random() * 8,   // trackHistoryPodiums
        Math.random() * 10,  // trackHistoryRaces
        Math.random() * 20,  // recentFormAverage
        Math.random() * 10,  // recentFormConsistency
        Math.random() * 20,  // qualifyingAverageGrid
        Math.random() * 5,   // qualifyingPoles
        Math.random() * 3,   // fastestLaps
        Math.random(),       // teamStrength
        Math.random() > 0.9 ? 1 : 0, // homeRaceBonus
        Math.random()        // winRate
      ];
      
      // Create realistic win probability based on features
      const winProbability = (
        features[0] / 500 * 0.3 + // season points
        features[1] / 10 * 0.2 +  // season wins
        features[4] / 3 * 0.15 +  // track wins
        features[12] * 0.2 +      // team strength
        features[14] * 0.15       // win rate
      );
      
      const label = Math.random() < winProbability ? 1 : 0;
      
      syntheticFeatures.push(features);
      syntheticLabels.push(label);
      syntheticNames.push(`Driver_${i + 1}`);
    }
    
    this.trainingData.features = syntheticFeatures;
    this.trainingData.labels = syntheticLabels;
    this.trainingData.driverNames = syntheticNames;
  }

  private async testModel() {
    console.log('   Testing model with sample predictions...');
    
    // Create test drivers
    const testDrivers = [
      {
        driverId: 'test_1',
        driverName: 'Max Verstappen',
        seasonPoints: 450,
        seasonWins: 15,
        seasonPodiums: 18,
        seasonDNFs: 1,
        trackHistoryWins: 2,
        trackHistoryPodiums: 5,
        trackHistoryRaces: 8,
        recentFormAverage: 1.2,
        recentFormConsistency: 0.8,
        qualifyingAverageGrid: 2.1,
        qualifyingPoles: 8,
        fastestLaps: 5,
        teamStrength: 0.9,
        homeRaceBonus: 0
      },
      {
        driverId: 'test_2',
        driverName: 'Lewis Hamilton',
        seasonPoints: 380,
        seasonWins: 8,
        seasonPodiums: 15,
        seasonDNFs: 2,
        trackHistoryWins: 3,
        trackHistoryPodiums: 7,
        trackHistoryRaces: 10,
        recentFormAverage: 3.5,
        recentFormConsistency: 0.7,
        qualifyingAverageGrid: 4.2,
        qualifyingPoles: 5,
        fastestLaps: 3,
        teamStrength: 0.75,
        homeRaceBonus: 1
      }
    ];

    try {
      const predictions = await TensorFlowMLService.predictRaceWinner(testDrivers, 'monaco');
      
      console.log('   📊 Sample Predictions:');
      predictions.forEach(pred => {
        console.log(`      ${pred.driverName}: ${(pred.probability * 100).toFixed(1)}% chance to win (odds: ${pred.odds})`);
      });
      
    } catch (error) {
      console.log('   ⚠️  Model not ready for predictions yet, continuing...');
    }
  }

  private async saveModel() {
    try {
      // Save model to localStorage for browser persistence
      const modelData = {
        timestamp: new Date().toISOString(),
        trainingExamples: this.trainingData.features.length,
        modelReady: TensorFlowMLService.isModelReady()
      };
      
      localStorage.setItem('f1_ml_model', JSON.stringify(modelData));
      console.log('   💾 Model metadata saved to localStorage');
      
    } catch (error) {
      console.log('   ⚠️  Could not save model metadata:', error);
    }
  }
}

// Run the training if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Running TensorFlow training in browser...');
  const trainer = new TensorFlowTrainer();
  trainer.trainAndTestModel();
} else {
  // Node.js environment
  console.log('🖥️  Running TensorFlow training in Node.js...');
  const trainer = new TensorFlowTrainer();
  trainer.trainAndTestModel();
}
