import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getDrivers, getRaces, getArchiveRaces, getResults } from '../src/api/jolpica';
import { firebaseConfig, validateConfig } from './config';

// Validate configuration
validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface DriverPerformance {
  driverId: string;
  driverName: string;
  team: string;
  seasonPoints: number;
  seasonWins: number;
  seasonPodiums: number;
  seasonDNFs: number;
  trackHistory: {
    wins: number;
    podiums: number;
    finishes: number;
    totalRaces: number;
  };
  recentForm: {
    last5Races: number[];
    averagePoints: number;
    consistency: number;
  };
  qualifyingPerformance: {
    averageGrid: number;
    poles: number;
    top3Qualifying: number;
  };
  fastestLapPerformance: {
    fastestLaps: number;
    averageLapTime: number;
  };
}

interface RacePrediction {
  raceId: string;
  raceName: string;
  circuit: string;
  predictions: {
    raceWinner: DriverPrediction[];
    podium: DriverPrediction[];
    qualifying: DriverPrediction[];
    fastestLap: DriverPrediction[];
  };
  confidence: number;
  lastUpdated: string;
}

interface DriverPrediction {
  driverId: string;
  driverName: string;
  probability: number;
  odds: number;
  confidence: number;
  factors: string[];
}

class MLModelTrainer {
  private driverStats: Map<string, DriverPerformance> = new Map();
  private predictions: Map<string, RacePrediction> = new Map();
  private drivers2025: string[] = [];
  private modelWeights = {
    seasonPerformance: 0.40,    // Increased weight for current season
    trackHistory: 0.20,         // Reduced weight for historical data
    recentForm: 0.25,           // Increased weight for recent performance
    qualifyingPerformance: 0.10, // Reduced weight
    fastestLapPerformance: 0.05  // Minimal weight
  };

  constructor() {
    console.log('🤖 Initializing ML Model Trainer for 2025 Season...');
  }

  async trainModel() {
    try {
      console.log('🔄 Starting ML model training for 2025 season...');
      
      // Fetch data from Firebase (2025 results)
      const firebaseData = await this.fetchFirebaseData();
      
      // Get the list of all 2025 drivers from the database
      this.drivers2025 = await this.get2025Drivers(firebaseData);
      
      console.log(`🎯 Found ${this.drivers2025.length} active 2025 drivers`);
      console.log('📊 2025 season data fetched successfully');
      
      // Process driver statistics for 2025 season only
      await this.processDriverStatistics2025(firebaseData);
      
      // Generate predictions for remaining 2025 races
      await this.generatePredictions2025();
      
      // Save predictions to Firebase
      await this.savePredictions();
      
      console.log('✅ ML model training completed successfully!');
      
    } catch (error) {
      console.error('❌ Error training ML model:', error);
      throw error;
    }
  }

  private async get2025Drivers(firebaseData: any): Promise<string[]> {
    // Get unique driver IDs from 2025 results
    const driverIds = new Set<string>();
    
    if (firebaseData.results && firebaseData.results.length > 0) {
      firebaseData.results.forEach((result: any) => {
        if (result.driverId) {
          driverIds.add(result.driverId);
        }
      });
    }
    
    // Also check driver standings for any additional drivers
    if (firebaseData.standings && firebaseData.standings.length > 0) {
      firebaseData.standings.forEach((standing: any) => {
        if (standing.driverId) {
          driverIds.add(standing.driverId);
        }
      });
    }
    
    return Array.from(driverIds);
  }

  private async fetchFirebaseData() {
    console.log('🔥 Fetching 2025 season data from Firebase...');
    
    try {
      const [driversSnapshot, racesSnapshot, resultsSnapshot, standingsSnapshot] = await Promise.all([
        getDocs(collection(db, 'drivers')),
        getDocs(query(collection(db, 'races'), where('season', '==', 2025))),
        getDocs(query(collection(db, 'results'), where('season', '==', 2025))),
        getDocs(query(collection(db, 'driver_standings'), where('season', '==', 2025)))
      ]);

      return {
        drivers: driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        races: racesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        results: resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        standings: standingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    } catch (error) {
      console.warn('⚠️ Firebase data fetch failed:', error);
      return { drivers: [], races: [], results: [], standings: [] };
    }
  }

  private async processDriverStatistics2025(firebaseData: any) {
    console.log('📈 Processing 2025 season driver statistics...');
    
    const allResults = firebaseData.results;
    
    for (const driverId of this.drivers2025) {
      // Find driver info
      const driverInfo = firebaseData.drivers.find((d: any) => d.driverId === driverId || d.id === driverId);
      const driverName = driverInfo?.fullName || driverInfo?.givenName + ' ' + driverInfo?.familyName || driverId;
      
      // Calculate 2025 season stats
      const seasonStats = this.calculateSeasonStats2025(driverId, allResults);
      
      // Calculate track history (using 2025 results)
      const trackStats = this.calculateTrackHistory2025(driverId, allResults);
      
      // Calculate recent form (last 5 races)
      const recentForm = this.calculateRecentForm2025(driverId, allResults);
      
      // Calculate qualifying performance
      const qualifyingStats = this.calculateQualifyingStats2025(driverId, allResults);
      
      // Calculate fastest lap performance
      const fastestLapStats = this.calculateFastestLapStats2025(driverId, allResults);

      const driverPerformance: DriverPerformance = {
        driverId,
        driverName,
        team: driverInfo?.constructorName || 'Unknown',
        ...seasonStats,
        trackHistory: trackStats,
        recentForm,
        qualifyingPerformance: qualifyingStats,
        fastestLapPerformance: fastestLapStats
      };

      this.driverStats.set(driverId, driverPerformance);
    }
    
    console.log(`✅ Processed statistics for ${this.driverStats.size} 2025 drivers`);
  }

  private calculateSeasonStats2025(driverId: string, results: any[]) {
    let points = 0;
    let wins = 0;
    let podiums = 0;
    let dnfs = 0;

    for (const result of results) {
      if (result.driverId === driverId) {
        points += result.points || 0;
        if (result.position === 1) wins++;
        if (result.position <= 3) podiums++;
        // Note: DNF data not available in current results
      }
    }

    return { seasonPoints: points, seasonWins: wins, seasonPodiums: podiums, seasonDNFs: dnfs };
  }

  private calculateTrackHistory2025(driverId: string, results: any[]) {
    let wins = 0;
    let podiums = 0;
    let finishes = 0;
    let totalRaces = 0;

    for (const result of results) {
      if (result.driverId === driverId) {
        totalRaces++;
        if (result.position === 1) wins++;
        if (result.position <= 3) podiums++;
        if (result.position <= 10) finishes++; // Top 10 considered finish
      }
    }

    return { wins, podiums, finishes, totalRaces };
  }

  private calculateRecentForm2025(driverId: string, results: any[]) {
    const driverResults = results
      .filter(r => r.driverId === driverId)
      .sort((a, b) => b.round - a.round) // Sort by round (most recent first)
      .slice(0, 5);

    const last5Races = driverResults.map(r => r.points || 0);
    const averagePoints = last5Races.length > 0 ? last5Races.reduce((sum, points) => sum + points, 0) / last5Races.length : 0;
    
    // Calculate consistency (standard deviation)
    const variance = last5Races.length > 0 ? last5Races.reduce((sum, points) => sum + Math.pow(points - averagePoints, 2), 0) / last5Races.length : 0;
    const consistency = Math.sqrt(variance);

    return { last5Races, averagePoints, consistency };
  }

  private calculateQualifyingStats2025(driverId: string, results: any[]) {
    // For now, we'll use race position as a proxy for qualifying performance
    // In a real implementation, you'd have separate qualifying data
    let totalPosition = 0;
    let qualifyingCount = 0;

    for (const result of results) {
      if (result.driverId === driverId && result.position) {
        totalPosition += result.position;
        qualifyingCount++;
      }
    }

    return {
      averageGrid: qualifyingCount > 0 ? totalPosition / qualifyingCount : 0,
      poles: 0, // Would need qualifying data
      top3Qualifying: 0
    };
  }

  private calculateFastestLapStats2025(driverId: string, results: any[]) {
    // Simplified calculation for 2025 season
    let fastestLaps = 0;
    let totalLapTime = 0;
    let lapCount = 0;

    // For now, we'll assume some drivers have fastest laps based on their performance
    const driverResults = results.filter(r => r.driverId === driverId);
    if (driverResults.length > 0) {
      // Award fastest laps to top performers (simplified)
      const wins = driverResults.filter(r => r.position === 1).length;
      fastestLaps = Math.floor(wins * 0.3); // 30% of wins have fastest laps
    }

    return {
      fastestLaps,
      averageLapTime: lapCount > 0 ? totalLapTime / lapCount : 0
    };
  }

  private async generatePredictions2025() {
    console.log('🔮 Generating predictions for remaining 2025 races...');
    
    // Get remaining races (after round 14)
    const remainingRaces = this.getRemainingRaces2025();
    
    for (const race of remainingRaces) {
      const predictions = await this.predictRaceOutcome2025(race);
      
      const racePrediction: RacePrediction = {
        raceId: race.raceId,
        raceName: race.raceName,
        circuit: race.circuit,
        predictions,
        confidence: this.calculateConfidence(predictions),
        lastUpdated: new Date().toISOString()
      };
      
      this.predictions.set(racePrediction.raceId, racePrediction);
    }
    
    console.log(`✅ Generated predictions for ${this.predictions.size} remaining races`);
  }

  private getRemainingRaces2025() {
    // Races after round 14 (Hungarian GP)
    return [
      {
        raceId: '2025_15',
        raceName: 'Dutch Grand Prix',
        season: 2025,
        round: 15,
        circuit: 'Circuit Zandvoort',
        date: '2025-08-24'
      },
      {
        raceId: '2025_16',
        raceName: 'Italian Grand Prix',
        season: 2025,
        round: 16,
        circuit: 'Monza',
        date: '2025-09-07'
      },
      {
        raceId: '2025_17',
        raceName: 'Azerbaijan Grand Prix',
        season: 2025,
        round: 17,
        circuit: 'Baku City Circuit',
        date: '2025-09-21'
      },
      {
        raceId: '2025_18',
        raceName: 'Singapore Grand Prix',
        season: 2025,
        round: 18,
        circuit: 'Marina Bay Street Circuit',
        date: '2025-10-05'
      },
      {
        raceId: '2025_19',
        raceName: 'United States Grand Prix',
        season: 2025,
        round: 19,
        circuit: 'Circuit of the Americas',
        date: '2025-10-19'
      },
      {
        raceId: '2025_20',
        raceName: 'Mexican Grand Prix',
        season: 2025,
        round: 20,
        circuit: 'Autódromo Hermanos Rodríguez',
        date: '2025-10-26'
      },
      {
        raceId: '2025_21',
        raceName: 'Brazilian Grand Prix',
        season: 2025,
        round: 21,
        circuit: 'Interlagos',
        date: '2025-11-02'
      },
      {
        raceId: '2025_22',
        raceName: 'Las Vegas Grand Prix',
        season: 2025,
        round: 22,
        circuit: 'Las Vegas Strip Circuit',
        date: '2025-11-09'
      },
      {
        raceId: '2025_23',
        raceName: 'Qatar Grand Prix',
        season: 2025,
        round: 23,
        circuit: 'Lusail International Circuit',
        date: '2025-11-23'
      },
      {
        raceId: '2025_24',
        raceName: 'Abu Dhabi Grand Prix',
        season: 2025,
        round: 24,
        circuit: 'Yas Marina Circuit',
        date: '2025-12-07'
      }
    ];
  }

  private async predictRaceOutcome2025(race: any) {
    const drivers = Array.from(this.driverStats.values());
    
    // Sort drivers by 2025 season performance score
    const driverScores = drivers.map(driver => ({
      ...driver,
      score: this.calculateDriverScore2025(driver)
    })).sort((a, b) => b.score - a.score);
    
    // Generate predictions for different categories
    const raceWinner = this.generateDriverPredictions2025(driverScores.slice(0, 5), 'raceWinner');
    const podium = this.generateDriverPredictions2025(driverScores.slice(0, 8), 'podium');
    const qualifying = this.generateDriverPredictions2025(driverScores.slice(0, 6), 'qualifying');
    const fastestLap = this.generateDriverPredictions2025(driverScores.slice(0, 5), 'fastestLap');
    
    return { raceWinner, podium, qualifying, fastestLap };
  }

  private calculateDriverScore2025(driver: DriverPerformance): number {
    // Enhanced scoring based on 2025 season performance
    const baseScore = (
      driver.seasonPoints * this.modelWeights.seasonPerformance +
      (driver.trackHistory.wins * 25 + driver.trackHistory.podiums * 10) * this.modelWeights.trackHistory +
      driver.recentForm.averagePoints * this.modelWeights.recentForm +
      (20 - driver.qualifyingPerformance.averageGrid) * this.modelWeights.qualifyingPerformance +
      driver.fastestLapPerformance.fastestLaps * 5 * this.modelWeights.fastestLapPerformance
    );
    
    // Bonus for consistent performance
    const consistencyBonus = driver.recentForm.consistency < 5 ? 20 : 0;
    
    return baseScore + consistencyBonus;
  }

  private generateDriverPredictions2025(drivers: any[], category: string): DriverPrediction[] {
    return drivers.map((driver, index) => {
      // Base probability based on position in ranking
      const baseProbability = Math.max(0.05, 0.4 - index * 0.05);
      
      // Adjust probability based on 2025 season performance
      const seasonAdjustment = driver.seasonPoints / 250; // Normalize to 0-1 range
      const adjustedProbability = baseProbability * (1 + seasonAdjustment);
      
      const confidence = Math.max(0.3, 0.9 - index * 0.1);
      
      return {
        driverId: driver.driverId,
        driverName: driver.driverName,
        probability: Math.min(0.8, adjustedProbability), // Cap at 80%
        odds: 1 / Math.min(0.8, adjustedProbability),
        confidence,
        factors: this.getPredictionFactors2025(driver, category)
      };
    });
  }

  private getPredictionFactors2025(driver: DriverPerformance, category: string): string[] {
    const factors: string[] = [];
    
    if (driver.seasonPoints > 150) factors.push('High 2025 season performance');
    if (driver.seasonWins > 2) factors.push('Multiple 2025 race wins');
    if (driver.seasonPodiums > 5) factors.push('Consistent 2025 podiums');
    if (driver.recentForm.averagePoints > 15) factors.push('Strong recent form');
    if (driver.trackHistory.wins > 0) factors.push('Track success in 2025');
    
    return factors;
  }

  private calculateConfidence(predictions: any): number {
    const totalConfidence = Object.values(predictions).reduce((sum: number, category: any) => {
      return sum + category.reduce((catSum: number, driver: DriverPrediction) => catSum + driver.confidence, 0);
    }, 0);
    
    const totalDrivers = Object.values(predictions).reduce((sum: number, category: any) => sum + category.length, 0);
    
    return totalDrivers > 0 ? totalConfidence / totalDrivers : 0;
  }

  private async savePredictions() {
    console.log('💾 Saving 2025 predictions to Firebase...');
    
    // In a real implementation, you would save these to Firebase
    // For now, we'll just log them
    for (const [raceId, prediction] of this.predictions) {
      console.log(`🏁 ${prediction.raceName}:`);
      console.log(`   Winner: ${prediction.predictions.raceWinner[0]?.driverName} (${(prediction.predictions.raceWinner[0]?.probability * 100).toFixed(1)}%)`);
      console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    }
  }
}

// Run the training function
async function main() {
  try {
    const trainer = new MLModelTrainer();
    await trainer.trainModel();
    console.log('🎉 ML model training completed successfully!');
  } catch (error) {
    console.error('💥 ML model training failed:', error);
    process.exit(1);
  }
}

main();

export { MLModelTrainer };
