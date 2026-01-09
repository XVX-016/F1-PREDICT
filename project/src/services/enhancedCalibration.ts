// Enhanced F1 Prediction Calibration Service
// Applies team-based weighting and recent form adjustments

export interface EnhancedCalibrationParams {
  temperature: number;
  logisticSlope: number;
  logisticIntercept: number;
  driverTiers: Record<string, number>; // Driver performance tiers
  teamWeights: Record<string, number>;
  recentFormWeights: Record<string, number>;
  trackTypeAdjustments: Record<string, number>;
  trackDifficultyAdjustments: Record<string, number>;
  driverTrackAdjustments: Record<string, Record<string, number>>;
  trackSpecificAdjustments: Record<string, Record<string, number>>; // Per-race track adjustments
}

export interface DriverPrediction {
  driverName: string;
  team: string;
  winProbability: number;
  podiumProbability: number;
  position: number;
}

// 2025 F1 Drivers List - Only current season drivers (20 drivers total)
const F1_2025_DRIVERS = [
  'Lando Norris', 'Oscar Piastri',
  'Charles Leclerc', 'Lewis Hamilton',
  'Max Verstappen', 'Yuki Tsunoda',
  'George Russell', 'Kimi Antonelli',
  'Fernando Alonso', 'Lance Stroll',
  'Pierre Gasly', 'Jack Doohan',
  'Franco Colapinto', 'Alexander Albon',
  'Carlos Sainz', 'Nico Hulkenberg',
  'Gabriel Bortoleto', 'Isack Hadjar',
  'Liam Lawson', 'Esteban Ocon',
  'Oliver Bearman'
];

// 2025 F1 Teams - Updated with correct team assignments
const F1_2025_TEAMS = {
  'Lando Norris': 'McLaren',
  'Oscar Piastri': 'McLaren',

  'Charles Leclerc': 'Ferrari',
  'Lewis Hamilton': 'Ferrari',

  'Max Verstappen': 'Red Bull Racing',
  'Yuki Tsunoda': 'Red Bull Racing',

  'George Russell': 'Mercedes',
  'Kimi Antonelli': 'Mercedes',

  'Fernando Alonso': 'Aston Martin',
  'Lance Stroll': 'Aston Martin',

  'Pierre Gasly': 'Alpine',
  'Jack Doohan': 'Alpine',
  'Franco Colapinto': 'Alpine',

  'Alexander Albon': 'Williams',
  'Carlos Sainz': 'Williams',

  'Nico Hulkenberg': 'Sauber',
  'Gabriel Bortoleto': 'Sauber',

  'Isack Hadjar': 'Racing Bulls',
  'Liam Lawson': 'Racing Bulls',

  'Esteban Ocon': 'Haas',
  'Oliver Bearman': 'Haas'
};

// Enhanced calibration parameters - Driver tier system for realistic predictions
const ENHANCED_CALIBRATION_PARAMS: EnhancedCalibrationParams = {
  temperature: 0.55, // slightly higher to soften extremes
  logisticSlope: 6.063542319320187,
  logisticIntercept: -3.4323975147437498,
  driverTiers: {
    // Tier 1 (Super Elite): Verstappen
    "Max Verstappen": 1.4,
    
    // Tier 2 (Elite): Norris, Leclerc, Hamilton
    "Lando Norris": 1.25,
    "Charles Leclerc": 1.2,
    "Lewis Hamilton": 1.2,
    
    // Tier 3 (Strong): Russell, Piastri, Sainz, Alonso
    "George Russell": 1.1,
    "Oscar Piastri": 1.1,
    "Carlos Sainz": 1.1,
    "Fernando Alonso": 1.1,
    
    // Tier 4 (Midfield): Stroll, Gasly, Ocon, Tsunoda, Albon, Hulkenberg
    "Lance Stroll": 1.0,
    "Pierre Gasly": 1.0,
    "Esteban Ocon": 1.0,
    "Yuki Tsunoda": 1.0,
    "Alexander Albon": 1.0,
    "Nico Hulkenberg": 1.0,
    
    // Tier 5 (Developing): Antonelli, Bearman, Colapinto, Lawson, Hadjar, Bortoleto, Doohan
    "Kimi Antonelli": 0.9,
    "Oliver Bearman": 0.9,
    "Franco Colapinto": 0.9,
    "Liam Lawson": 0.9,
    "Isack Hadjar": 0.9,
    "Gabriel Bortoleto": 0.9,
    "Jack Doohan": 0.9
  },
  teamWeights: {
    "McLaren": 1.15,         // Reduced from 1.5 to prevent domination
    "Red Bull Racing": 1.2,  // Increased to reflect current performance
    "Ferrari": 1.1,
    "Mercedes": 1.05,
    "Aston Martin": 1.0,
    "Alpine": 0.95,
    "Haas": 0.85,
    "Racing Bulls": 0.9,
    "Williams": 0.9,
    "Sauber": 0.85
  },
  recentFormWeights: {
    "Lando Norris": 1.3,   // Reduced from 1.6
    "Oscar Piastri": 1.2,  // Reduced from 1.5
    "Max Verstappen": 1.1, // Increased from 0.9
    "Charles Leclerc": 1.1,
    "George Russell": 1.05,
    "Lewis Hamilton": 0.95,
    "Carlos Sainz": 1.0,
    "Fernando Alonso": 1.0,
    "Lance Stroll": 1.0,
    "Pierre Gasly": 1.0,
    "Esteban Ocon": 1.0,
    "Nico Hulkenberg": 1.0,
    "Yuki Tsunoda": 1.0,
    "Alexander Albon": 1.0,
    "Kimi Antonelli": 0.9,
    "Oliver Bearman": 0.9,
    "Franco Colapinto": 0.9,
    "Liam Lawson": 0.9,
    "Isack Hadjar": 0.9,
    "Gabriel Bortoleto": 0.9,
    "Jack Doohan": 0.9
  },
  trackTypeAdjustments: {
    "street_circuit": 1.15,
    "permanent_circuit": 1.0,
    "high_speed": 0.95
  },
  trackDifficultyAdjustments: {
    "very_high": 1.20,         // Very difficult tracks favor experienced drivers
    "high": 1.10,              // High difficulty tracks favor skilled drivers
    "medium": 1.0,             // Medium difficulty - neutral
    "low": 0.95,               // Low difficulty tracks favor aggressive drivers
  },
  driverTrackAdjustments: {
    "Max Verstappen": {
      "street_circuit": 1.25,      // Exceptional on street circuits
      "high_speed": 1.15,          // Strong on high-speed tracks
      "permanent_circuit": 1.10    // Good on all permanent circuits
    },
    "Charles Leclerc": {
      "street_circuit": 1.20,      // Very strong on street circuits
      "high_speed": 1.05,          // Good on high-speed tracks
      "permanent_circuit": 1.0     // Neutral on permanent circuits
    },
    "Lewis Hamilton": {
      "street_circuit": 1.15,      // Strong on street circuits
      "high_speed": 1.10,          // Good on high-speed tracks
      "permanent_circuit": 1.05    // Slightly better on permanent circuits
    },
    "Lando Norris": {
      "street_circuit": 1.10,      // Good on street circuits
      "high_speed": 1.0,           // Neutral on high-speed tracks
      "permanent_circuit": 1.05    // Slightly better on permanent circuits
    }
  },
  trackSpecificAdjustments: {
    "Australian Grand Prix": {
      "Oscar Piastri": 1.1,
      "Max Verstappen": 1.05
    },
    "Saudi Arabian Grand Prix": {
      "Max Verstappen": 1.05,
      "Yuki Tsunoda": 1.05
    },
    "Bahrain Grand Prix": {
      "Max Verstappen": 1.05,
      "Fernando Alonso": 1.05,
      "Charles Leclerc": 0.95
    },
    "Japanese Grand Prix": {
      "Yuki Tsunoda": 1.1,
      "Max Verstappen": 1.05
    },
    "Chinese Grand Prix": {
      "Max Verstappen": 1.05,
      "Fernando Alonso": 1.05
    },
    "Miami Grand Prix": {
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05
    },
    "Emilia Romagna Grand Prix": {
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05,
      "Lando Norris": 1.05
    },
    "Monaco Grand Prix": {
      "Charles Leclerc": 1.1,
      "Max Verstappen": 1.05,
      "Lando Norris": 0.95
    },
    "Canadian Grand Prix": {
      "Max Verstappen": 1.05,
      "Lewis Hamilton": 1.05
    },
    "Spanish Grand Prix": {
      "Fernando Alonso": 1.1,
      "Carlos Sainz": 1.05,
      "Max Verstappen": 1.05
    },
    "Austrian Grand Prix": {
      "Max Verstappen": 1.1,
      "Lando Norris": 1.05
    },
    "British Grand Prix": {
      "Lewis Hamilton": 1.1,
      "George Russell": 1.05,
      "Lando Norris": 1.05
    },
    "Hungarian Grand Prix": {
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05
    },
    "Belgian Grand Prix": {
      "Max Verstappen": 1.1,
      "Lando Norris": 1.05
    },
    "Dutch Grand Prix": {
      "Max Verstappen": 1.1,
      "Lando Norris": 1.05
    },
    "Italian Grand Prix": {
      "Lando Norris": 1.1,
      "Oscar Piastri": 1.05,
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05
    },
    "Azerbaijan Grand Prix": {
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05
    },
    "Singapore Grand Prix": {
      "Charles Leclerc": 1.05,
      "Max Verstappen": 1.05
    },
    "United States Grand Prix": {
      "Max Verstappen": 1.05,
      "Lando Norris": 1.05,
      "Oscar Piastri": 1.05
    },
    "Mexican Grand Prix": {
      "Max Verstappen": 1.05,
      "Fernando Alonso": 1.05
    },
    "Brazilian Grand Prix": {
      "Lewis Hamilton": 1.05,
      "Max Verstappen": 1.05
    },
    "Las Vegas Grand Prix": {
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05
    },
    "Qatar Grand Prix": {
      "Max Verstappen": 1.05,
      "Fernando Alonso": 1.05
    },
    "Abu Dhabi Grand Prix": {
      "Max Verstappen": 1.05,
      "Charles Leclerc": 1.05
    }
  }
};

export class EnhancedCalibrationService {
  private static instance: EnhancedCalibrationService;
  private calibrationParams: EnhancedCalibrationParams;

  private constructor() {
    this.calibrationParams = ENHANCED_CALIBRATION_PARAMS;
  }

  public static getInstance(): EnhancedCalibrationService {
    if (!EnhancedCalibrationService.instance) {
      EnhancedCalibrationService.instance = new EnhancedCalibrationService();
    }
    return EnhancedCalibrationService.instance;
  }

  /**
   * Apply temperature scaling to probabilities
   */
  private applyTemperatureScaling(probabilities: number[]): number[] {
    const { temperature } = this.calibrationParams;
    
    return probabilities.map(prob => {
      const logit = Math.log(prob / (1 - prob));
      const scaledLogit = logit / temperature;
      return 1 / (1 + Math.exp(-scaledLogit));
    });
  }

  /**
   * Apply logistic calibration to probabilities
   */
  private applyLogisticCalibration(probabilities: number[]): number[] {
    const { logisticSlope, logisticIntercept } = this.calibrationParams;
    
    return probabilities.map(prob => {
      const logit = Math.log(prob / (1 - prob));
      const calibratedLogit = logisticSlope * logit + logisticIntercept;
      return 1 / (1 + Math.exp(-calibratedLogit));
    });
  }

  /**
   * Apply driver tier adjustments (new method)
   */
  private applyDriverTiers(predictions: DriverPrediction[]): DriverPrediction[] {
    const { driverTiers } = this.calibrationParams;
    
    return predictions.map(prediction => {
      const tierMultiplier = driverTiers[prediction.driverName] || 1.0;
      
      return {
        ...prediction,
        winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * tierMultiplier)),
        podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * tierMultiplier))
      };
    });
  }

  /**
   * Apply team-based weighting to probabilities
   */
  private applyTeamWeighting(predictions: DriverPrediction[]): DriverPrediction[] {
    const { teamWeights, recentFormWeights } = this.calibrationParams;
    
    return predictions.map(prediction => {
      const teamWeight = teamWeights[prediction.team] || 1.0;
      const recentFormWeight = recentFormWeights[prediction.driverName] || 1.0;
      const combinedWeight = teamWeight * recentFormWeight;
      
      return {
        ...prediction,
        winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * combinedWeight)),
        podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * combinedWeight))
      };
    });
  }

  /**
   * Apply track-specific adjustments (new method)
   */
  private applyTrackSpecificAdjustments(predictions: DriverPrediction[], raceName: string): DriverPrediction[] {
    const { trackSpecificAdjustments } = this.calibrationParams;
    const raceAdjustments = trackSpecificAdjustments[raceName];
    
    if (!raceAdjustments) return predictions;
    
    return predictions.map(prediction => {
      const trackAdjustment = raceAdjustments[prediction.driverName] || 1.0;
      
      return {
        ...prediction,
        winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * trackAdjustment)),
        podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * trackAdjustment))
      };
    });
  }

  /**
   * Normalize probabilities to sum to 1
   */
  private normalizeProbabilities(predictions: DriverPrediction[]): DriverPrediction[] {
    const totalWinProb = predictions.reduce((sum, pred) => sum + pred.winProbability, 0);
    const totalPodiumProb = predictions.reduce((sum, pred) => sum + pred.podiumProbability, 0);
    
    return predictions.map(prediction => ({
      ...prediction,
      winProbability: prediction.winProbability / totalWinProb,
      podiumProbability: prediction.podiumProbability / totalPodiumProb
    }));
  }

  /**
   * Apply track type adjustments
   */
  private applyTrackTypeAdjustments(predictions: DriverPrediction[], trackType: string): DriverPrediction[] {
    const { trackTypeAdjustments } = this.calibrationParams;
    const adjustment = trackTypeAdjustments[trackType] || 1.0;
    
    return predictions.map(prediction => ({
      ...prediction,
      winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * adjustment)),
      podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * adjustment))
    }));
  }

  /**
   * Apply track difficulty adjustments
   */
  private applyTrackDifficultyAdjustments(predictions: DriverPrediction[], difficulty: string): DriverPrediction[] {
    const { trackDifficultyAdjustments } = this.calibrationParams;
    const adjustment = trackDifficultyAdjustments[difficulty] || 1.0;
    
    return predictions.map(prediction => ({
      ...prediction,
      winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * adjustment)),
      podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * adjustment))
    }));
  }

  /**
   * Apply driver-track specific adjustments
   */
  private applyDriverTrackAdjustments(predictions: DriverPrediction[], trackType: string): DriverPrediction[] {
    const { driverTrackAdjustments } = this.calibrationParams;
    
    return predictions.map(prediction => {
      const driverAdjustments = driverTrackAdjustments[prediction.driverName];
      if (!driverAdjustments) return prediction;
      
      const adjustment = driverAdjustments[trackType] || 1.0;
      
      return {
        ...prediction,
        winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * adjustment)),
        podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * adjustment))
      };
    });
  }

  /**
   * Enforce win probability ≤ podium probability constraint
   */
  private enforceProbabilityConstraints(predictions: DriverPrediction[]): DriverPrediction[] {
    return predictions.map(prediction => ({
      ...prediction,
      podiumProbability: Math.max(prediction.podiumProbability, prediction.winProbability)
    }));
  }

  /**
   * Apply complete enhanced calibration pipeline
   */
  public applyEnhancedCalibration(
    predictions: DriverPrediction[], 
    trackType: string = "permanent_circuit",
    difficulty: string = "medium",
    raceName: string = "Generic Race"
  ): DriverPrediction[] {
    console.log("🔧 Applying enhanced calibration...");
    
    // Filter to only 2025 drivers
    const filteredPredictions = this.filter2025Drivers(predictions);
    
    if (filteredPredictions.length === 0) {
      console.log("⚠️ No 2025 drivers found, generating base predictions");
      return this.generateBase2025Predictions(); // Use base predictions instead of recursive call
    }
    
    // Extract raw probabilities
    const rawWinProbs = filteredPredictions.map(p => p.winProbability);
    const rawPodiumProbs = filteredPredictions.map(p => p.podiumProbability);
    
    // Step 1: Apply temperature scaling
    const tempScaledWin = this.applyTemperatureScaling(rawWinProbs);
    const tempScaledPodium = this.applyTemperatureScaling(rawPodiumProbs);
    
    // Step 2: Apply logistic calibration
    const logisticCalibratedWin = this.applyLogisticCalibration(tempScaledWin);
    const logisticCalibratedPodium = this.applyLogisticCalibration(tempScaledPodium);
    
    // Step 3: Create intermediate predictions
    let calibratedPredictions = filteredPredictions.map((pred, i) => ({
      ...pred,
      winProbability: logisticCalibratedWin[i],
      podiumProbability: logisticCalibratedPodium[i]
    }));
    
    // Step 4: Apply driver tiers (NEW)
    calibratedPredictions = this.applyDriverTiers(calibratedPredictions);
    
    // Step 5: Apply team weighting
    calibratedPredictions = this.applyTeamWeighting(calibratedPredictions);
    
    // Step 6: Apply track type adjustments
    calibratedPredictions = this.applyTrackTypeAdjustments(calibratedPredictions, trackType);
    
    // Step 7: Apply track difficulty adjustments
    calibratedPredictions = this.applyTrackDifficultyAdjustments(calibratedPredictions, difficulty);
    
    // Step 8: Apply driver-track specific adjustments
    calibratedPredictions = this.applyDriverTrackAdjustments(calibratedPredictions, trackType);
    
    // Step 9: Apply track-specific adjustments (NEW)
    calibratedPredictions = this.applyTrackSpecificAdjustments(calibratedPredictions, raceName);
    
    // Step 10: Normalize probabilities
    calibratedPredictions = this.normalizeProbabilities(calibratedPredictions);
    
    // Step 11: Enforce probability constraints (win ≤ podium)
    calibratedPredictions = this.enforceProbabilityConstraints(calibratedPredictions);
    
    // Step 12: Sort by win probability
    calibratedPredictions.sort((a, b) => b.winProbability - a.winProbability);
    
    // Update positions
    calibratedPredictions = calibratedPredictions.map((pred, index) => ({
      ...pred,
      position: index + 1
    }));
    
    console.log("✅ Enhanced calibration applied successfully");
    console.log("🎯 Key adjustments:");
    console.log(`   • Driver tiers applied (Verstappen: ${this.calibrationParams.driverTiers["Max Verstappen"]}x)`);
    console.log(`   • McLaren team weight: ${this.calibrationParams.teamWeights.McLaren}x`);
    console.log(`   • Red Bull team weight: ${this.calibrationParams.teamWeights["Red Bull Racing"]}x`);
    console.log(`   • Track-specific adjustments for: ${raceName}`);
    console.log(`   • Track type: ${trackType}`);
    console.log(`   • Track difficulty: ${difficulty}`);
    console.log(`   • 2025 drivers only: ${calibratedPredictions.length}/20`);
    
    return calibratedPredictions;
  }

  /**
   * Get calibration summary for debugging
   */
  public getCalibrationSummary(): {
    driverTiers: Record<string, number>;
    teamWeights: Record<string, number>;
    recentFormWeights: Record<string, number>;
  } {
    return {
      driverTiers: this.calibrationParams.driverTiers,
      teamWeights: this.calibrationParams.teamWeights,
      recentFormWeights: this.calibrationParams.recentFormWeights
    };
  }

  /**
   * Update calibration parameters (for dynamic adjustments)
   */
  public updateCalibrationParams(newParams: Partial<EnhancedCalibrationParams>): void {
    this.calibrationParams = { ...this.calibrationParams, ...newParams };
    console.log("🔄 Calibration parameters updated");
  }

  /**
   * Filter predictions to only include 2025 drivers
   */
  private filter2025Drivers(predictions: DriverPrediction[]): DriverPrediction[] {
    return predictions.filter(prediction => 
      F1_2025_DRIVERS.includes(prediction.driverName)
    );
  }

  /**
   * Generate base predictions for all 2025 drivers
   */
  public generateBase2025Predictions(): DriverPrediction[] {
    console.log(`🔍 generateBase2025Predictions called`);
    console.log(`🔍 F1_2025_DRIVERS:`, F1_2025_DRIVERS);
    console.log(`🔍 F1_2025_TEAMS:`, F1_2025_TEAMS);
    
    const basePredictions: DriverPrediction[] = F1_2025_DRIVERS.map((driverName, index) => {
      const team = F1_2025_TEAMS[driverName as keyof typeof F1_2025_TEAMS] || "Unknown";
      console.log(`🔍 Mapping ${driverName} to team: ${team}`);
      
      return {
        driverName,
        team: team,
        winProbability: Math.max(0.01, 0.25 - index * 0.01), // Base probabilities
        podiumProbability: Math.max(0.05, 0.6 - index * 0.02),
        position: index + 1
      };
    });

    console.log(`🔍 Base predictions created: ${basePredictions.length} drivers`);
    const normalized = this.normalizeProbabilities(basePredictions);
    console.log(`🔍 Normalized predictions: ${normalized.length} drivers`);
    
    return normalized;
  }

  /**
   * Generate track-specific predictions for all 2025 tracks
   */
  public generateTrackPredictions(trackName: string): DriverPrediction[] {
    console.log(`🔍 generateTrackPredictions called for: ${trackName}`);
    
    const basePredictions = this.generateBase2025Predictions();
    console.log(`🔍 Base predictions generated: ${basePredictions.length} drivers`);
    
    const trackType = this.getTrackType(trackName);
    const difficulty = this.getTrackDifficulty(trackName);
    
    console.log(`🔍 Track type: ${trackType}, Difficulty: ${difficulty}`);
    
    // Debug: Log team assignments in base predictions
    console.log(`🔍 Base prediction team assignments:`);
    basePredictions.forEach(d => {
      console.log(`  ${d.driverName}: ${d.team}`);
    });
    
    const result = this.applyEnhancedCalibration(basePredictions, trackType, difficulty, trackName);
    
    console.log(`🔍 Final track predictions: ${result.length} drivers`);
    console.log(`🔍 Final team assignments:`);
    result.forEach(d => {
      console.log(`  ${d.driverName}: ${d.team}`);
    });
    
    return result;
  }

  /**
   * Get track type based on race name
   */
  private getTrackType(raceName: string): string {
    const streetCircuits = [
      'Monaco Grand Prix', 'Singapore Grand Prix', 'Azerbaijan Grand Prix',
      'Miami Grand Prix', 'Las Vegas Grand Prix', 'Australian Grand Prix'
    ];
    
    const highSpeedCircuits = [
      'Monza Grand Prix', 'Italian Grand Prix', 'Belgian Grand Prix', 
      'Saudi Arabian Grand Prix', 'Dutch Grand Prix'
    ];

    if (streetCircuits.includes(raceName)) {
      return 'street_circuit';
    } else if (highSpeedCircuits.includes(raceName)) {
      return 'high_speed';
    } else {
      return 'permanent_circuit';
    }
  }

  /**
   * Get track difficulty based on race name
   */
  private getTrackDifficulty(raceName: string): string {
    const veryHighDifficulty = [
      'Monaco Grand Prix', 'Singapore Grand Prix', 'Hungarian Grand Prix'
    ];
    
    const highDifficulty = [
      'Spa Grand Prix', 'Belgian Grand Prix', 'Japanese Grand Prix',
      'Brazilian Grand Prix', 'Mexican Grand Prix'
    ];
    
    const lowDifficulty = [
      'Monza Grand Prix', 'Italian Grand Prix', 'Austrian Grand Prix'
    ];

    if (veryHighDifficulty.includes(raceName)) {
      return 'very_high';
    } else if (highDifficulty.includes(raceName)) {
      return 'high';
    } else if (lowDifficulty.includes(raceName)) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  /**
   * Get list of all 2025 drivers
   */
  public get2025Drivers(): string[] {
    return [...F1_2025_DRIVERS];
  }

  /**
   * Get team for a specific driver
   */
  public getDriverTeam(driverName: string): string {
    return F1_2025_TEAMS[driverName as keyof typeof F1_2025_TEAMS] || "Unknown";
  }
}

// Export singleton instance
export const enhancedCalibrationService = EnhancedCalibrationService.getInstance();
