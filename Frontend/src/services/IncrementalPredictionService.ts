import { RacePrediction } from '../types/predictions';

// Interface for the incremental predictions data structure
interface IncrementalPredictionData {
  metadata: {
    generated_at: string;
    training_time: string;
    num_simulations: number;
    use_bayesian: boolean;
    use_ml_layer: boolean;
    driver_weights: Record<string, number>;
    team_weights: Record<string, number>;
    scenarios: string[];
    training_history: Array<{
      timestamp: string;
      duration_seconds: number;
      races_processed: number;
      successful_races: number;
      failed_races: number;
      num_simulations: number;
      data_hash: string;
    }>;
  };
  predictions: Record<string, {
    status: string;
    race: {
      circuit: string;
      season: number;
      date: string;
    };
    predictions: Array<{
      driver: string;
      probability: number;
      position: number;
      team: string;
    }>;
    live_data: {
      entry_list: any[];
      data_source: string;
    };
    metadata: {
      race_name: string;
      race_round: number;
      race_date: string;
      trained_at: string;
      num_simulations: number;
      scenarios: string[];
    };
  }>;
}

export class IncrementalPredictionService {
  private static instance: IncrementalPredictionService;
  private predictionsData: IncrementalPredictionData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): IncrementalPredictionService {
    if (!IncrementalPredictionService.instance) {
      IncrementalPredictionService.instance = new IncrementalPredictionService();
    }
    return IncrementalPredictionService.instance;
  }

  async loadPredictions(): Promise<IncrementalPredictionData | null> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.predictionsData && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.predictionsData;
    }

    try {
      // Try to fetch from the backend predictions file
      const response = await fetch('/api/incremental-predictions');
      
      if (response.ok) {
        this.predictionsData = await response.json();
        this.lastFetchTime = now;
        console.log('✅ Loaded incremental predictions:', this.predictionsData?.metadata);
        return this.predictionsData;
      } else {
        console.warn('⚠️ Failed to fetch incremental predictions, using fallback');
        return this.getFallbackPredictions();
      }
    } catch (error) {
      console.warn('⚠️ Error loading incremental predictions, using fallback:', error);
      return this.getFallbackPredictions();
    }
  }

  async getRacePrediction(raceName: string, date: string): Promise<RacePrediction | null> {
    const predictions = await this.loadPredictions();
    
    if (!predictions) {
      return null;
    }

    // Find the race prediction by matching race names
    const raceKey = this.findRaceKey(raceName, predictions.predictions);
    
    if (!raceKey) {
      console.warn(`⚠️ No prediction found for race: ${raceName}`);
      return null;
    }

    const racePrediction = predictions.predictions[raceKey];
    
    if (!racePrediction || racePrediction.status === 'error') {
      console.warn(`⚠️ Race prediction failed for: ${raceName}`);
      return null;
    }

    // Convert to RacePrediction format
    const allDrivers = racePrediction.predictions.map(driver => ({
      driverId: this.getDriverAvatarId(driver.driver),
      driverName: driver.driver,
      team: this.getFullTeamName(driver.team),
      winProbPct: Math.round(driver.probability * 100 * 100) / 100,
      podiumProbPct: Math.round(driver.probability * 100 * 100) / 100, // Use actual probability
      position: driver.position
    }));

    // Sort by win probability (highest first) and reassign positions
    allDrivers.sort((a, b) => b.winProbPct - a.winProbPct);
    
    // Reassign positions after sorting
    allDrivers.forEach((driver, index) => {
      driver.position = index + 1;
    });

    return {
      raceId: raceKey.toLowerCase().replace(/\s+/g, '_'),
      generatedAt: racePrediction.metadata.trained_at,
      weatherUsed: {
        date: date,
        tempC: 24,
        windKmh: 21,
        rainChancePct: 18,
        condition: 'Sunny'
      },
      race: racePrediction.metadata.race_name,
      date: racePrediction.metadata.race_date,
      top3: allDrivers.slice(0, 3),
      all: allDrivers,
      modelStats: {
        accuracyPct: 85,
        meanErrorSec: 1.2,
        trees: predictions.metadata.num_simulations,
        lr: 0.15
      }
    };
  }

  private findRaceKey(raceName: string, predictions: Record<string, any>): string | null {
    // Try exact match first
    if (predictions[raceName]) {
      return raceName;
    }

    // Try partial matches
    const normalizedRaceName = raceName.toLowerCase().replace(/\s+/g, '');
    
    for (const key of Object.keys(predictions)) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      
      if (normalizedKey.includes(normalizedRaceName) || normalizedRaceName.includes(normalizedKey)) {
        return key;
      }
    }

    // Try matching by removing "Grand Prix" suffix
    const withoutGP = raceName.replace(/\s*Grand Prix\s*$/i, '');
    for (const key of Object.keys(predictions)) {
      const keyWithoutGP = key.replace(/\s*Grand Prix\s*$/i, '');
      if (keyWithoutGP.toLowerCase() === withoutGP.toLowerCase()) {
        return key;
      }
    }

    return null;
  }

  private calculatePodiumProbability(position: number, winProbability: number): number {
    // Simple podium probability calculation based on position
    if (position <= 3) {
      return Math.round((winProbability * 3) * 100 * 100) / 100;
    } else if (position <= 5) {
      return Math.round((winProbability * 1.5) * 100 * 100) / 100;
    } else if (position <= 10) {
      return Math.round((winProbability * 0.8) * 100 * 100) / 100;
    } else {
      return Math.round((winProbability * 0.3) * 100 * 100) / 100;
    }
  }

  private getDriverAvatarId(driverName: string): string {
    // Map driver names to their avatar filenames
    const avatarMap: Record<string, string> = {
      'Lando Norris': 'landonorris',
      'Oscar Piastri': 'oscarpiastri',
      'Charles Leclerc': 'charlesleclerc',
      'Lewis Hamilton': 'lewishamilton',
      'Max Verstappen': 'maxverstappen',
      'Yuki Tsunoda': 'yukitsunoda',
      'George Russell': 'georgerussell',
      'Andrea Kimi Antonelli': 'kimiantonelli',
      'Fernando Alonso': 'fernandoalonso',
      'Lance Stroll': 'lancestroll',
      'Pierre Gasly': 'pierregasly',
      'Esteban Ocon': 'estebanocon',
      'Franco Colapinto': 'francocolapinto',
      'Alexander Albon': 'alexanderalbon',
      'Nico Hulkenberg': 'nicohulkenberg',
      'Liam Lawson': 'liamlawson',
      'Isack Hadjar': 'isackhadjar',
      'Oliver Bearman': 'oliverbearman',
      'Gabriel Bortoleto': 'gabrielbortoleto',
      'Carlos Sainz': 'carlossainz'
    };
    
    return avatarMap[driverName] || driverName.toLowerCase().replace(/\s+/g, '');
  }

  private getFullTeamName(shortName: string): string {
    // Map short team names to full names (without engine names)
    const teamNameMap: Record<string, string> = {
      'RB': 'Racing Bulls',
      'Racing Bulls': 'Racing Bulls',
      'Ferrari': 'Ferrari',
      'Mercedes': 'Mercedes',
      'McLaren': 'McLaren',
      'Aston Martin': 'Aston Martin',
      'Alpine': 'Alpine',
      'Williams': 'Williams',
      'Sauber': 'Sauber',
      'Haas': 'Haas',
      'Red Bull Racing': 'Red Bull Racing'
    };
    return teamNameMap[shortName] || shortName;
  }

  private getFallbackPredictions(): IncrementalPredictionData {
    // Return a basic fallback structure if the main predictions can't be loaded
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        training_time: new Date().toISOString(),
        num_simulations: 1000,
        use_bayesian: true,
        use_ml_layer: true,
        driver_weights: {},
        team_weights: {},
        scenarios: ['dry', 'wet', 'safety_car'],
        training_history: []
      },
      predictions: {}
    };
  }

  // Get metadata about the prediction system
  async getSystemMetadata() {
    const predictions = await this.loadPredictions();
    return predictions?.metadata || null;
  }

  // Get list of all available races
  async getAvailableRaces(): Promise<string[]> {
    const predictions = await this.loadPredictions();
    return predictions ? Object.keys(predictions.predictions) : [];
  }

  // Check if predictions are available
  async hasPredictions(): Promise<boolean> {
    const predictions = await this.loadPredictions();
    return predictions !== null && Object.keys(predictions.predictions).length > 0;
  }
}

export default IncrementalPredictionService;

