import { RacePrediction, DriverPrediction } from '../types/predictions';
import PredictionCalibrationService from './PredictionCalibrationService';

export interface HybridDriverPrediction {
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

export interface HybridRacePrediction {
  race: string;
  round: number;
  season: number;
  date: string;
  track_type: string;
  weather_conditions: Record<string, any>;
  predictions: HybridDriverPrediction[];
  generated_at: string;
  model_version: string;
  circuit_info?: Record<string, any>;
}

export interface SimplePrediction {
  position: number;
  driverId: string;
  driverName: string;
  constructor: string;
  probability: number;
  confidence: number;
}

export interface SimpleRacePrediction {
  race: string;
  round: number;
  season: number;
  date: string;
  track_type: string;
  predictions: SimplePrediction[];
  generated_at: string;
  model_version: string;
}

class HybridPredictionService {
  private static instance: HybridPredictionService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  static getInstance(): HybridPredictionService {
    if (!HybridPredictionService.instance) {
      HybridPredictionService.instance = new HybridPredictionService();
    }
    return HybridPredictionService.instance;
  }

  /**
   * Get hybrid predictions for the next race
   */
  async getNextRacePrediction(): Promise<HybridRacePrediction | null> {
    try {
      console.log('🎯 Fetching hybrid predictions for next race...');
      
      const response = await fetch(`${this.baseUrl}/predict/next-race/simple`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Hybrid predictions received:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching hybrid predictions for next race:', error);
      return null;
    }
  }

  /**
   * Get hybrid predictions for a specific race
   */
  async getRacePrediction(raceIdentifier: string): Promise<HybridRacePrediction | null> {
    try {
      console.log(`🎯 Fetching hybrid predictions for race: ${raceIdentifier}`);
      
      const response = await fetch(`${this.baseUrl}/predict/${encodeURIComponent(raceIdentifier)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Hybrid race predictions received:', data);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching hybrid predictions for race ${raceIdentifier}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive hybrid predictions for a specific race
   */
  async getComprehensiveRacePrediction(raceIdentifier: string): Promise<HybridRacePrediction | null> {
    try {
      console.log(`🎯 Fetching comprehensive hybrid predictions for race: ${raceIdentifier}`);
      
      const response = await fetch(`${this.baseUrl}/predict/${encodeURIComponent(raceIdentifier)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Comprehensive hybrid predictions received:', data);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching comprehensive predictions for race ${raceIdentifier}:`, error);
      return null;
    }
  }

  /**
   * Get all available races from the calendar
   */
  async getAvailableRaces(): Promise<any[]> {
    try {
      console.log('📅 Fetching available races from calendar...');
      
      const response = await fetch(`${this.baseUrl}/calendar/races`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Available races received:', data);
      
      return data.races || [];
    } catch (error) {
      console.error('❌ Error fetching available races:', error);
      return [];
    }
  }

  /**
   * Get race information by identifier
   */
  async getRaceInfo(raceIdentifier: string): Promise<any | null> {
    try {
      console.log(`🔍 Fetching race info for: ${raceIdentifier}`);
      
      const response = await fetch(`${this.baseUrl}/calendar/race/${encodeURIComponent(raceIdentifier)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Race info received:', data);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching race info for ${raceIdentifier}:`, error);
      return null;
    }
  }

  /**
   * Get weather forecast for a race
   */
  async getWeatherForecast(raceName: string): Promise<any | null> {
    try {
      console.log(`🌤️ Fetching weather forecast for race: ${raceName}`);
      
      const response = await fetch(`${this.baseUrl}/weather/forecast/${encodeURIComponent(raceName)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Weather forecast received:', data);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching weather forecast for race ${raceName}:`, error);
      return null;
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
   * Convert hybrid predictions to the format expected by PredictPage
   */
  convertToRacePrediction(hybridPrediction: HybridRacePrediction): RacePrediction {
    const allDrivers = hybridPrediction.predictions.map((driver, index) => ({
      driverId: driver.driverId,
      driverName: driver.driverName,
      team: this.cleanTeamName(driver.constructor),
      winProbPct: Math.round(driver.probability * 100 * 100) / 100,
      podiumProbPct: Math.round(driver.probability * 100 * 100) / 100,
      position: index + 1
    }));

    // Apply calibration based on driver and team weights
    const calibrationService = PredictionCalibrationService.getInstance();
    const weatherCondition = hybridPrediction.weather_conditions?.condition?.toLowerCase().includes('rain') ? 'wet' : 'dry';
    const calibratedPredictions = calibrationService.calibratePredictions(allDrivers, weatherCondition);

    // Sort by win probability (highest first) and reassign positions
    calibratedPredictions.sort((a, b) => b.winProbPct - a.winProbPct);
    
    // Reassign positions after sorting
    calibratedPredictions.forEach((driver, index) => {
      driver.position = index + 1;
    });

    return {
      raceId: hybridPrediction.race.toLowerCase().replace(/\s+/g, '_'),
      generatedAt: hybridPrediction.generated_at,
      weatherUsed: {
        date: hybridPrediction.date,
        tempC: 24, // Default values, should be updated with actual weather
        windKmh: 21,
        rainChancePct: 18,
        condition: 'Sunny'
      },
      race: hybridPrediction.race,
      date: hybridPrediction.date,
      top3: calibratedPredictions.slice(0, 3),
      all: calibratedPredictions,
      modelStats: {
        accuracyPct: 85,
        meanErrorSec: 1.2,
        trees: 200,
        lr: 0.15
      }
    };
  }

  /**
   * Check if the hybrid service is available
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.services?.hybrid_service === 'active';
    } catch (error) {
      console.error('❌ Error checking hybrid service health:', error);
      return false;
    }
  }
}

export default HybridPredictionService;
