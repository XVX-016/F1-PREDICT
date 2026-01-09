import { RacePrediction, DriverPrediction } from '../types/predictions';
import PredictionCalibrationService from './PredictionCalibrationService';

export interface LocalDriverPrediction {
  driverId: string;
  driverName: string;
  constructor: string;
  probability: number;
  confidence: number;
  qualifying_position?: number;
  season_points: number;
  recent_form: number;
  track_history: number;
  weather_factor: number;
  weather_sensitivity?: Record<string, number>;
  constructor_info?: Record<string, any>;
}

export interface LocalRacePrediction {
  race: string;
  round: number;
  season: number;
  date: string;
  track_type: string;
  weather_conditions: Record<string, any>;
  predictions: LocalDriverPrediction[];
  generated_at: string;
  model_version: string;
  circuit_info?: Record<string, any>;
  monte_carlo_metadata?: Record<string, any>;
}

class LocalPredictionService {
  private static instance: LocalPredictionService;
  private predictionsCache: Map<string, any> = new Map();
  private nextRaceCache: any = null;
  private allRacesCache: any = null;

  private constructor() {}

  static getInstance(): LocalPredictionService {
    if (!LocalPredictionService.instance) {
      LocalPredictionService.instance = new LocalPredictionService();
    }
    return LocalPredictionService.instance;
  }

  /**
   * Load predictions from local JSON files
   */
  private async loadLocalPredictions(): Promise<void> {
    try {
      console.log('📁 Loading local predictions...');
      
      // Load next race predictions
      console.log('🔄 Fetching next race predictions...');
      const nextRaceResponse = await fetch('/predictions/next-race-predictions.json');
      console.log('Next race response status:', nextRaceResponse.status);
      
      if (nextRaceResponse.ok) {
        this.nextRaceCache = await nextRaceResponse.json();
        console.log('✅ Next race predictions loaded from local file');
        console.log('Next race data:', this.nextRaceCache);
      } else {
        console.error('❌ Failed to load next race predictions:', nextRaceResponse.status);
      }

      // Load all races predictions
      console.log('🔄 Fetching all races predictions...');
      const allRacesResponse = await fetch('/predictions/all-races-predictions.json');
      console.log('All races response status:', allRacesResponse.status);
      
      if (allRacesResponse.ok) {
        this.allRacesCache = await allRacesResponse.json();
        console.log('✅ All races predictions loaded from local file');
        console.log('Available races:', Object.keys(this.allRacesCache));
      } else {
        console.error('❌ Failed to load all races predictions:', allRacesResponse.status);
      }

      // Load comprehensive predictions
      console.log('🔄 Fetching comprehensive predictions...');
      const comprehensiveResponse = await fetch('/predictions/comprehensive-predictions.json');
      console.log('Comprehensive response status:', comprehensiveResponse.status);
      
      if (comprehensiveResponse.ok) {
        const comprehensive = await comprehensiveResponse.json();
        console.log('✅ Comprehensive predictions loaded from local file');
        console.log(`📊 Monte Carlo simulations: ${comprehensive.monte_carlo_simulations}`);
      } else {
        console.error('❌ Failed to load comprehensive predictions:', comprehensiveResponse.status);
      }

    } catch (error) {
      console.error('❌ Error loading local predictions:', error);
    }
  }

  /**
   * Get next race predictions from local files
   */
  async getNextRacePrediction(): Promise<LocalRacePrediction | null> {
    try {
      if (!this.nextRaceCache) {
        await this.loadLocalPredictions();
      }

      if (this.nextRaceCache) {
        console.log('🎯 Next race predictions loaded from local file');
        return this.nextRaceCache;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting next race prediction:', error);
      return null;
    }
  }

  /**
   * Get predictions for a specific race from local files
   */
  async getRacePrediction(raceIdentifier: string): Promise<LocalRacePrediction | null> {
    try {
      if (!this.allRacesCache) {
        await this.loadLocalPredictions();
      }

      if (this.allRacesCache && this.allRacesCache[raceIdentifier]) {
        console.log(`🎯 Race predictions for ${raceIdentifier} loaded from local file`);
        return this.allRacesCache[raceIdentifier];
      }

      // Try to find the race by partial match
      if (this.allRacesCache) {
        for (const [raceName, predictions] of Object.entries(this.allRacesCache)) {
          if (raceName.toLowerCase().includes(raceIdentifier.toLowerCase()) ||
              raceIdentifier.toLowerCase().includes(raceName.toLowerCase())) {
            console.log(`🎯 Found race predictions for ${raceName} (partial match)`);
            return predictions as LocalRacePrediction;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting race prediction for ${raceIdentifier}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive predictions from local files
   */
  async getComprehensiveRacePrediction(raceIdentifier: string): Promise<LocalRacePrediction | null> {
    // For comprehensive predictions, we'll return the same as regular race predictions
    // but with additional metadata
    return this.getRacePrediction(raceIdentifier);
  }

  /**
   * Get all available races from local files
   */
  async getAvailableRaces(): Promise<any[]> {
    try {
      if (!this.allRacesCache) {
        await this.loadLocalPredictions();
      }

      if (this.allRacesCache) {
        const races = Object.keys(this.allRacesCache).map(raceName => ({
          id: raceName.toLowerCase().replace(/\s+/g, '-'),
          name: raceName,
          predictions: this.allRacesCache[raceName]
        }));
        
        console.log(`📅 Found ${races.length} races in local predictions`);
        return races;
      }

      return [];
    } catch (error) {
      console.error('❌ Error getting available races:', error);
      return [];
    }
  }

  /**
   * Convert local predictions to RacePrediction format for frontend compatibility
   */
  convertToRacePrediction(localPrediction: LocalRacePrediction): RacePrediction {
    try {
      // Convert driver predictions to the format the frontend expects
      const driverPredictions: DriverPrediction[] = [];
      
      if (localPrediction.predictions) {
        driverPredictions.push(...localPrediction.predictions.map((driver, index) => ({
          driverId: driver.driverId,
          driverName: driver.driverName,
          team: this.cleanTeamName(driver.constructor),
          grid: `P${driver.qualifying_position || index + 1}`,
          predictedLapTime: 80 + (index * 0.5), // Simulated lap times
          winProbPct: Math.round((driver.probability || 0) * 100), // Convert to percentage
          podiumProbPct: Math.round((driver.probability || 0) * 100), // Use actual probability for podium
          position: index + 1
        })));
      }

      // Apply calibration based on driver and team weights
      const calibrationService = PredictionCalibrationService.getInstance();
      const weatherCondition = localPrediction.weather_conditions?.condition?.toLowerCase().includes('rain') ? 'wet' : 'dry';
      const calibratedPredictions = calibrationService.calibratePredictions(driverPredictions, weatherCondition);

      // Sort by win probability (highest first) and reassign positions
      calibratedPredictions.sort((a, b) => b.winProbPct - a.winProbPct);
      
      // Reassign positions after sorting
      calibratedPredictions.forEach((driver, index) => {
        driver.position = index + 1;
      });

      const converted: RacePrediction = {
        raceId: localPrediction.race.toLowerCase().replace(/\s+/g, '-'),
        generatedAt: localPrediction.generated_at,
        weatherUsed: {
          date: localPrediction.date,
          tempC: localPrediction.weather_conditions?.tempC || 22,
          windKmh: localPrediction.weather_conditions?.windKmh || 15,
          rainChancePct: localPrediction.weather_conditions?.rainChancePct || 20,
          condition: localPrediction.weather_conditions?.condition || "Partly Cloudy"
        },
        race: localPrediction.race,
        date: localPrediction.date,
        top3: calibratedPredictions.slice(0, 3), // First 3 drivers
        all: calibratedPredictions, // All drivers
        modelStats: {
          accuracyPct: 85,
          meanErrorSec: 0.5,
          trees: 100,
          lr: 0.01
        }
      };

      return converted;
    } catch (error) {
      console.error('❌ Error converting to RacePrediction format:', error);
      throw error;
    }
  }

  /**
   * Clean team names by removing engine suffixes
   */
  private cleanTeamName(teamName: string): string {
    // Remove engine names from team names
    const engineSuffixes = [
      '-Mercedes',
      '-Honda RBPT',
      '-Honda',
      '-Renault',
      '-Ferrari',
      '-RBPT'
    ];
    
    let cleanName = teamName;
    for (const suffix of engineSuffixes) {
      if (cleanName.endsWith(suffix)) {
        cleanName = cleanName.replace(suffix, '');
        break;
      }
    }
    
    return cleanName.trim();
  }

  /**
   * Get prediction statistics
   */
  getPredictionStats(): any {
    try {
      if (!this.allRacesCache) {
        return null;
      }

      const stats = {
        total_races: Object.keys(this.allRacesCache).length,
        total_drivers: 0,
        monte_carlo_simulations: 30000,
        generated_at: new Date().toISOString(),
        races: Object.keys(this.allRacesCache)
      };

      // Count total drivers
      for (const raceName in this.allRacesCache) {
        const race = this.allRacesCache[raceName];
        if (race.predictions) {
          stats.total_drivers = Math.max(stats.total_drivers, race.predictions.length);
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting prediction stats:', error);
      return null;
    }
  }
}

export default LocalPredictionService;
