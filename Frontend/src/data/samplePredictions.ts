import { RacePrediction, Weather } from '../types/predictions';

// Sample weather data for different race locations
const sampleWeather: Record<string, Weather> = {
  "Australian Grand Prix": {
    date: "2025-03-16",
    tempC: 22,
    windKmh: 15,
    rainChancePct: 10,
    condition: "Sunny"
  },
  "Chinese Grand Prix": {
    date: "2025-03-23",
    tempC: 18,
    windKmh: 12,
    rainChancePct: 25,
    condition: "Cloudy"
  },
  "Japanese Grand Prix": {
    date: "2025-04-06",
    tempC: 16,
    windKmh: 18,
    rainChancePct: 40,
    condition: "Cloudy"
  },
  "Bahrain Grand Prix": {
    date: "2025-04-13",
    tempC: 28,
    windKmh: 22,
    rainChancePct: 5,
    condition: "Sunny"
  },
  "Saudi Arabian Grand Prix": {
    date: "2025-04-20",
    tempC: 32,
    windKmh: 8,
    rainChancePct: 0,
    condition: "Sunny"
  },
  "Miami Grand Prix": {
    date: "2025-05-04",
    tempC: 26,
    windKmh: 14,
    rainChancePct: 30,
    condition: "Cloudy"
  },
  "Emilia-Romagna Grand Prix": {
    date: "2025-05-18",
    tempC: 20,
    windKmh: 16,
    rainChancePct: 35,
    condition: "Cloudy"
  },
  "Monaco Grand Prix": {
    date: "2025-05-25",
    tempC: 22,
    windKmh: 10,
    rainChancePct: 20,
    condition: "Sunny"
  },
  "Spanish Grand Prix": {
    date: "2025-06-01",
    tempC: 24,
    windKmh: 18,
    rainChancePct: 15,
    condition: "Sunny"
  },
  "Canadian Grand Prix": {
    date: "2025-06-15",
    tempC: 18,
    windKmh: 20,
    rainChancePct: 45,
    condition: "Cloudy"
  },
  "Austrian Grand Prix": {
    date: "2025-06-29",
    tempC: 19,
    windKmh: 14,
    rainChancePct: 30,
    condition: "Cloudy"
  },
  "British Grand Prix": {
    date: "2025-07-06",
    tempC: 17,
    windKmh: 22,
    rainChancePct: 50,
    condition: "Rain"
  },
  "Belgian Grand Prix": {
    date: "2025-07-27",
    tempC: 18,
    windKmh: 16,
    rainChancePct: 40,
    condition: "Cloudy"
  },
  "Hungarian Grand Prix": {
    date: "2025-08-03",
    tempC: 25,
    windKmh: 12,
    rainChancePct: 20,
    condition: "Sunny"
  },
  "Dutch Grand Prix": {
    date: "2025-08-31",
    tempC: 20,
    windKmh: 24,
    rainChancePct: 35,
    condition: "Cloudy"
  },
  "Italian Grand Prix": {
    date: "2025-09-07",
    tempC: 23,
    windKmh: 14,
    rainChancePct: 15,
    condition: "Sunny"
  },
  "Azerbaijan Grand Prix": {
    date: "2025-09-21",
    tempC: 26,
    windKmh: 18,
    rainChancePct: 10,
    condition: "Sunny"
  },
  "Singapore Grand Prix": {
    date: "2025-10-05",
    tempC: 28,
    windKmh: 8,
    rainChancePct: 60,
    condition: "Rain"
  },
  "United States Grand Prix": {
    date: "2025-10-19",
    tempC: 22,
    windKmh: 16,
    rainChancePct: 25,
    condition: "Cloudy"
  },
  "Mexico City Grand Prix": {
    date: "2025-10-26",
    tempC: 20,
    windKmh: 12,
    rainChancePct: 15,
    condition: "Sunny"
  },
  "São Paulo Grand Prix": {
    date: "2025-11-09",
    tempC: 24,
    windKmh: 14,
    rainChancePct: 30,
    condition: "Cloudy"
  },
  "Las Vegas Grand Prix": {
    date: "2025-11-22",
    tempC: 15,
    windKmh: 20,
    rainChancePct: 5,
    condition: "Sunny"
  },
  "Qatar Grand Prix": {
    date: "2025-11-30",
    tempC: 26,
    windKmh: 16,
    rainChancePct: 0,
    condition: "Sunny"
  },
  "Abu Dhabi Grand Prix": {
    date: "2025-12-07",
    tempC: 28,
    windKmh: 12,
    rainChancePct: 0,
    condition: "Sunny"
  }
};

// Sample predictions for each race - Now generated dynamically using enhanced calibration
export const samplePredictions: Record<string, RacePrediction> = {};

// Generate predictions for all races using a template
export async function generateSamplePrediction(raceName: string): Promise<RacePrediction> {
  const weather = sampleWeather[raceName] || sampleWeather["Australian Grand Prix"];
  
  // Use enhanced calibration service to get proper 2025 drivers
  try {
    const { enhancedCalibrationService } = await import('../services/enhancedCalibration');
    const all2025Drivers = enhancedCalibrationService.get2025Drivers();
    
    // Generate predictions for all 20 drivers
    const allDrivers = all2025Drivers.map((driverName, index) => {
      const team = enhancedCalibrationService.getDriverTeam(driverName);
      const baseWinProb = Math.max(0.5, 20 - index * 0.8);
      const basePodiumProb = Math.max(2.0, 60 - index * 2.5);
      
      return {
        driverId: driverName.toLowerCase().replace(/\s+/g, '_'),
        driverName: driverName,
        team: team,
        winProbPct: baseWinProb,
        podiumProbPct: basePodiumProb,
        position: index + 1
      };
    });
    
    // Sort by win probability
    allDrivers.sort((a, b) => b.winProbPct - a.winProbPct);
    
    // Update positions
    allDrivers.forEach((driver, index) => {
      driver.position = index + 1;
    });
    
    const top3 = allDrivers.slice(0, 3);
    
    return {
      raceId: raceName.toLowerCase().replace(/\s+/g, '_'),
      generatedAt: new Date().toISOString(),
      weatherUsed: weather,
      top3: top3,
      all: allDrivers,
      modelStats: { accuracyPct: 87, meanErrorSec: 0.9, trees: 250, lr: 0.12 }
    };
  } catch (error) {
    console.warn('Failed to use enhanced calibration, falling back to base prediction');
    
    // Fallback: generate basic predictions for 2025 drivers
    const fallbackDrivers = [
      'Max Verstappen', 'Yuki Tsunoda',
      'Charles Leclerc', 'Lewis Hamilton',
      'George Russell', 'Andrea Kimi Antonelli',
      'Lando Norris', 'Oscar Piastri',
      'Fernando Alonso', 'Lance Stroll',
      'Pierre Gasly', 'Franco Colapinto',
      'Esteban Ocon', 'Oliver Bearman',
      'Liam Lawson', 'Isack Hadjar',
      'Alexander Albon', 'Carlos Sainz',
      'Nico Hulkenberg', 'Gabriel Bortoleto'
    ];
    
    const allDrivers = fallbackDrivers.map((driverName, index) => ({
      driverId: driverName.toLowerCase().replace(/\s+/g, '_'),
      driverName: driverName,
      team: "Unknown", // Will be filled by MLPredictionService
      winProbPct: Math.max(0.5, 20 - index * 0.8),
      podiumProbPct: Math.max(2.0, 60 - index * 2.5),
      position: index + 1
    }));
    
    // Sort by win probability
    allDrivers.sort((a, b) => b.winProbPct - a.winProbPct);
    
    // Update positions
    allDrivers.forEach((driver, index) => {
      driver.position = index + 1;
    });
    
    const top3 = allDrivers.slice(0, 3);
  
  return {
    raceId: raceName.toLowerCase().replace(/\s+/g, '_'),
    generatedAt: new Date().toISOString(),
    weatherUsed: weather,
      top3: top3,
      all: allDrivers,
      modelStats: { accuracyPct: 87, meanErrorSec: 0.9, trees: 250, lr: 0.12 }
    };
  }
}
