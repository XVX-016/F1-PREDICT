import { DriverPrediction } from '../types/predictions';

export interface DriverWeight {
  driverName: string;
  weight: number;
  consistency: number;
  wetWeatherBonus: number;
  trackAdaptability: number;
}

export interface TeamWeight {
  teamName: string;
  weight: number;
  reliability: number;
  developmentRate: number;
}

class PredictionCalibrationService {
  private static instance: PredictionCalibrationService;
  
  // Driver weights based on 2025 performance expectations
  private driverWeights: Record<string, DriverWeight> = {
    'Max Verstappen': { driverName: 'Max Verstappen', weight: 1.15, consistency: 0.95, wetWeatherBonus: 0.20, trackAdaptability: 0.98 },
    'Charles Leclerc': { driverName: 'Charles Leclerc', weight: 1.08, consistency: 0.88, wetWeatherBonus: 0.15, trackAdaptability: 0.92 },
    'Lewis Hamilton': { driverName: 'Lewis Hamilton', weight: 1.10, consistency: 0.90, wetWeatherBonus: 0.18, trackAdaptability: 0.95 },
    'Lando Norris': { driverName: 'Lando Norris', weight: 1.05, consistency: 0.85, wetWeatherBonus: 0.12, trackAdaptability: 0.88 },
    'Oscar Piastri': { driverName: 'Oscar Piastri', weight: 1.02, consistency: 0.82, wetWeatherBonus: 0.10, trackAdaptability: 0.85 },
    'George Russell': { driverName: 'George Russell', weight: 1.03, consistency: 0.84, wetWeatherBonus: 0.11, trackAdaptability: 0.87 },
    'Carlos Sainz': { driverName: 'Carlos Sainz', weight: 1.04, consistency: 0.86, wetWeatherBonus: 0.13, trackAdaptability: 0.89 },
    'Fernando Alonso': { driverName: 'Fernando Alonso', weight: 1.06, consistency: 0.87, wetWeatherBonus: 0.14, trackAdaptability: 0.91 },
    'Yuki Tsunoda': { driverName: 'Yuki Tsunoda', weight: 0.98, consistency: 0.78, wetWeatherBonus: 0.08, trackAdaptability: 0.82 },
    'Andrea Kimi Antonelli': { driverName: 'Andrea Kimi Antonelli', weight: 0.95, consistency: 0.75, wetWeatherBonus: 0.05, trackAdaptability: 0.80 },
    'Lance Stroll': { driverName: 'Lance Stroll', weight: 0.97, consistency: 0.76, wetWeatherBonus: 0.07, trackAdaptability: 0.81 },
    'Pierre Gasly': { driverName: 'Pierre Gasly', weight: 1.00, consistency: 0.80, wetWeatherBonus: 0.09, trackAdaptability: 0.83 },
    'Esteban Ocon': { driverName: 'Esteban Ocon', weight: 0.99, consistency: 0.79, wetWeatherBonus: 0.08, trackAdaptability: 0.82 },
    'Franco Colapinto': { driverName: 'Franco Colapinto', weight: 0.92, consistency: 0.72, wetWeatherBonus: 0.04, trackAdaptability: 0.78 },
    'Alexander Albon': { driverName: 'Alexander Albon', weight: 1.01, consistency: 0.81, wetWeatherBonus: 0.09, trackAdaptability: 0.84 },
    'Nico Hulkenberg': { driverName: 'Nico Hulkenberg', weight: 0.96, consistency: 0.77, wetWeatherBonus: 0.06, trackAdaptability: 0.80 },
    'Liam Lawson': { driverName: 'Liam Lawson', weight: 0.94, consistency: 0.74, wetWeatherBonus: 0.05, trackAdaptability: 0.79 },
    'Isack Hadjar': { driverName: 'Isack Hadjar', weight: 0.93, consistency: 0.73, wetWeatherBonus: 0.04, trackAdaptability: 0.78 },
    'Oliver Bearman': { driverName: 'Oliver Bearman', weight: 0.91, consistency: 0.71, wetWeatherBonus: 0.03, trackAdaptability: 0.77 },
    'Gabriel Bortoleto': { driverName: 'Gabriel Bortoleto', weight: 0.90, consistency: 0.70, wetWeatherBonus: 0.03, trackAdaptability: 0.76 }
  };

  // Team weights based on 2025 car performance expectations
  private teamWeights: Record<string, TeamWeight> = {
    'Red Bull Racing': { teamName: 'Red Bull Racing', weight: 1.12, reliability: 0.95, developmentRate: 0.90 },
    'Ferrari': { teamName: 'Ferrari', weight: 1.08, reliability: 0.88, developmentRate: 0.85 },
    'Mercedes': { teamName: 'Mercedes', weight: 1.06, reliability: 0.90, developmentRate: 0.88 },
    'McLaren': { teamName: 'McLaren', weight: 1.04, reliability: 0.85, developmentRate: 0.82 },
    'Aston Martin': { teamName: 'Aston Martin', weight: 1.02, reliability: 0.82, developmentRate: 0.80 },
    'Alpine': { teamName: 'Alpine', weight: 0.98, reliability: 0.78, developmentRate: 0.75 },
    'Williams': { teamName: 'Williams', weight: 0.96, reliability: 0.75, developmentRate: 0.72 },
    'Sauber': { teamName: 'Sauber', weight: 0.94, reliability: 0.72, developmentRate: 0.70 },
    'Haas': { teamName: 'Haas', weight: 0.92, reliability: 0.70, developmentRate: 0.68 },
    'Racing Bulls': { teamName: 'Racing Bulls', weight: 0.95, reliability: 0.73, developmentRate: 0.71 }
  };

  private constructor() {}

  static getInstance(): PredictionCalibrationService {
    if (!PredictionCalibrationService.instance) {
      PredictionCalibrationService.instance = new PredictionCalibrationService();
    }
    return PredictionCalibrationService.instance;
  }

  /**
   * Calibrate predictions based on driver and team weights
   */
  calibratePredictions(predictions: DriverPrediction[], weatherCondition: string = 'dry'): DriverPrediction[] {
    return predictions.map(driver => {
      const driverWeight = this.driverWeights[driver.driverName] || { weight: 1.0, consistency: 0.8, wetWeatherBonus: 0.05, trackAdaptability: 0.8 };
      const teamWeight = this.teamWeights[driver.team] || { weight: 1.0, reliability: 0.8, developmentRate: 0.75 };

      // Calculate weather adjustment
      const weatherMultiplier = weatherCondition === 'wet' ? (1 + driverWeight.wetWeatherBonus) : 1.0;

      // Calculate combined weight
      const combinedWeight = driverWeight.weight * teamWeight.weight * weatherMultiplier;

      // Apply calibration
      const calibratedWinProb = Math.min(100, Math.max(0, driver.winProbPct * combinedWeight));
      const calibratedPodiumProb = Math.min(100, Math.max(0, driver.podiumProbPct * combinedWeight));

      return {
        ...driver,
        winProbPct: Math.round(calibratedWinProb * 100) / 100,
        podiumProbPct: Math.round(calibratedPodiumProb * 100) / 100
      };
    });
  }

  /**
   * Get driver weight information
   */
  getDriverWeight(driverName: string): DriverWeight | null {
    return this.driverWeights[driverName] || null;
  }

  /**
   * Get team weight information
   */
  getTeamWeight(teamName: string): TeamWeight | null {
    return this.teamWeights[teamName] || null;
  }

  /**
   * Update driver weight
   */
  updateDriverWeight(driverName: string, weight: DriverWeight): void {
    this.driverWeights[driverName] = weight;
  }

  /**
   * Update team weight
   */
  updateTeamWeight(teamName: string, weight: TeamWeight): void {
    this.teamWeights[teamName] = weight;
  }

  /**
   * Get all driver weights
   */
  getAllDriverWeights(): Record<string, DriverWeight> {
    return { ...this.driverWeights };
  }

  /**
   * Get all team weights
   */
  getAllTeamWeights(): Record<string, TeamWeight> {
    return { ...this.teamWeights };
  }
}

export default PredictionCalibrationService;
