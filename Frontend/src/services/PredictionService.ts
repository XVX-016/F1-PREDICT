import { Race, Weather, DriverPrediction, RacePrediction } from '../types/predictions';
import { sampleRaces } from '../data/sampleRaces';

class PredictionService {
  private cache: Map<string, RacePrediction> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  async getNextRace(): Promise<Race | null> {
    try {
      // Always use sample data for now
      const races = sampleRaces;
      
      // Update race statuses
      const now = new Date();
      races.forEach(race => {
        race.status = this.getRaceStatus(race, now);
      });
      
      // Find next race
      const nextRace = races
        .filter(r => r.status !== "finished")
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      
      return nextRace || null;
    } catch (error) {
      console.error('Error in getNextRace:', error);
      return null;
    }
  }

  async getRacePredictions(raceId: string, weather?: Weather): Promise<RacePrediction | null> {
    try {
      const cacheKey = weather ? `${raceId}:custom:${this.hashWeather(weather)}` : `${raceId}:default`;
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey) || null;
      }

      // If no prediction exists, generate one
      const race = await this.getRaceById(raceId);
      if (!race) return null;

      const weatherToUse = weather || await this.getForecastWeather(race);
      if (!weatherToUse) return null;

      const prediction = await this.computePrediction(race, weatherToUse);
      if (prediction) {
        this.updateCache(cacheKey, prediction);
        return prediction;
      }

      return null;
    } catch (error) {
      console.error('Error fetching race predictions:', error);
      return null;
    }
  }

  async generateCustomPrediction(raceId: string, weather: Weather): Promise<RacePrediction | null> {
    try {
      const race = await this.getRaceById(raceId);
      if (!race) return null;

      const prediction = await this.computePrediction(race, weather);
      if (prediction) {
        const cacheKey = `${raceId}:custom:${this.hashWeather(weather)}`;
        this.updateCache(cacheKey, prediction);
        return prediction;
      }

      return null;
    } catch (error) {
      console.error('Error generating custom prediction:', error);
      return null;
    }
  }

  async getForecastWeather(race: Race): Promise<Weather> {
    // Mock weather forecast - replace with actual OpenWeatherMap API call
    const conditions = ["Sunny", "Cloudy", "Rain", "Storm"] as const;
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate realistic weather based on location and season
    let baseTemp = 22; // Default 22°C
    let baseRainChance = 15; // Default 15%
    
    // Adjust based on location
    if (race.country === "Australia" || race.country === "Saudi Arabia") {
      baseTemp = 28; // Hotter climates
      baseRainChance = 5; // Less rain
    } else if (race.country === "Japan" || race.country === "China") {
      baseTemp = 18; // Moderate climates
      baseRainChance = 25; // More rain
    } else if (race.country === "Monaco" || race.country === "Italy") {
      baseTemp = 20; // Mediterranean climate
      baseRainChance = 20; // Moderate rain
    } else if (race.country === "Canada") {
      baseTemp = 15; // Cooler climate
      baseRainChance = 30; // More rain
    }
    
    // Add some randomness
    const tempVariation = (Math.random() - 0.5) * 10; // ±5°C
    const rainVariation = (Math.random() - 0.5) * 20; // ±10%
    
    return {
      date: race.startDate,
      tempC: Math.round(baseTemp + tempVariation),
      windKmh: Math.round(8 + Math.random() * 20), // 8-28 km/h
      rainChancePct: Math.max(0, Math.min(100, Math.round(baseRainChance + rainVariation))),
      condition: randomCondition
    };
  }

  private async getRaceById(raceId: string): Promise<Race | null> {
    try {
      // Use sample data from local source
      const race = sampleRaces.find(r => r.id === raceId);
      return race || null;
    } catch (error) {
      console.error('Error fetching race:', error);
      return null;
    }
  }

  private async computePrediction(race: Race, weather: Weather): Promise<RacePrediction | null> {
    try {
      // This is a stub - replace with your actual ML model
      const mockPrediction = this.generateMockPrediction(race, weather);
      return mockPrediction;
    } catch (error) {
      console.error('Error computing prediction:', error);
      return null;
    }
  }

  private generateMockPrediction(race: Race, weather: Weather): RacePrediction {
    // Enhanced driver database with realistic ratings and track performance
    const drivers = [
      { id: "NOR", name: "Lando Norris", team: "McLaren", baseRating: 89, consistency: 0.88, wetWeatherBonus: 0.12, trackAdaptability: 0.87 },
      { id: "PIA", name: "Oscar Piastri", team: "McLaren", baseRating: 85, consistency: 0.85, wetWeatherBonus: 0.08, trackAdaptability: 0.84 },
      { id: "LEC", name: "Charles Leclerc", team: "Ferrari", baseRating: 91, consistency: 0.87, wetWeatherBonus: 0.15, trackAdaptability: 0.89 },
      { id: "HAM", name: "Lewis Hamilton", team: "Ferrari", baseRating: 93, consistency: 0.90, wetWeatherBonus: 0.20, trackAdaptability: 0.93 },
      { id: "VER", name: "Max Verstappen", team: "Red Bull Racing", baseRating: 95, consistency: 0.95, wetWeatherBonus: 0.18, trackAdaptability: 0.94 },
      { id: "TSU", name: "Yuki Tsunoda", team: "Red Bull Racing", baseRating: 82, consistency: 0.80, wetWeatherBonus: 0.10, trackAdaptability: 0.81 },
      { id: "RUS", name: "George Russell", team: "Mercedes", baseRating: 87, consistency: 0.85, wetWeatherBonus: 0.09, trackAdaptability: 0.84 },
      { id: "ANT", name: "Kimi Antonelli", team: "Mercedes", baseRating: 78, consistency: 0.75, wetWeatherBonus: 0.05, trackAdaptability: 0.76 },
      { id: "ALO", name: "Fernando Alonso", team: "Aston Martin", baseRating: 90, consistency: 0.89, wetWeatherBonus: 0.16, trackAdaptability: 0.88 },
      { id: "STR", name: "Lance Stroll", team: "Aston Martin", baseRating: 80, consistency: 0.78, wetWeatherBonus: 0.08, trackAdaptability: 0.79 },
      { id: "GAS", name: "Pierre Gasly", team: "Alpine", baseRating: 83, consistency: 0.82, wetWeatherBonus: 0.11, trackAdaptability: 0.81 },
      { id: "DOO", name: "Jack Doohan", team: "Alpine", baseRating: 75, consistency: 0.72, wetWeatherBonus: 0.04, trackAdaptability: 0.73 },
      { id: "COL", name: "Franco Colapinto", team: "Alpine", baseRating: 76, consistency: 0.73, wetWeatherBonus: 0.05, trackAdaptability: 0.74 },
      { id: "ALB", name: "Alexander Albon", team: "Williams", baseRating: 81, consistency: 0.80, wetWeatherBonus: 0.09, trackAdaptability: 0.79 },
      { id: "SAI", name: "Carlos Sainz", team: "Williams", baseRating: 88, consistency: 0.86, wetWeatherBonus: 0.14, trackAdaptability: 0.85 },
      { id: "HUL", name: "Nico Hulkenberg", team: "Sauber", baseRating: 79, consistency: 0.77, wetWeatherBonus: 0.07, trackAdaptability: 0.76 },
      { id: "BOR", name: "Gabriel Bortoleto", team: "Sauber", baseRating: 74, consistency: 0.71, wetWeatherBonus: 0.03, trackAdaptability: 0.72 },
      { id: "HAD", name: "Isack Hadjar", team: "Racing Bulls", baseRating: 77, consistency: 0.74, wetWeatherBonus: 0.06, trackAdaptability: 0.75 },
      { id: "LAW", name: "Liam Lawson", team: "Racing Bulls", baseRating: 78, consistency: 0.75, wetWeatherBonus: 0.07, trackAdaptability: 0.76 },
      { id: "OCO", name: "Esteban Ocon", team: "Haas", baseRating: 82, consistency: 0.80, wetWeatherBonus: 0.10, trackAdaptability: 0.79 },
      { id: "BEA", name: "Oliver Bearman", team: "Haas", baseRating: 76, consistency: 0.73, wetWeatherBonus: 0.05, trackAdaptability: 0.74 }
    ];

    // Track-specific performance modifiers
    const trackModifiers = this.getTrackModifiers(race.circuit);
    
    // Recent form bonus (last 3 races performance)
    const recentFormBonus = this.getRecentFormBonus();
    
    // Weather impact calculation
    const weatherImpact = this.calculateAdvancedWeatherImpact(weather);
    
    // Generate predictions with enhanced algorithm
    const driverPredictions: DriverPrediction[] = drivers.map((driver) => {
      // Base win probability from driver rating
      let baseWinProb = (driver.baseRating - 70) * 1.2; // Scale rating to probability
      
      // Apply consistency modifier
      baseWinProb *= driver.consistency;
      
      // Apply track-specific modifier
      baseWinProb *= trackModifiers[driver.team] || 1.0;
      
      // Apply recent form bonus
      baseWinProb *= (1 + recentFormBonus[driver.id] * 0.1);
      
      // Apply weather impact
      let weatherMultiplier = 1.0;
      
      if (weather.rainChancePct > 30) {
        // Rain favors experienced drivers and those with good wet weather performance
        weatherMultiplier = 1.0 + (driver.wetWeatherBonus * (weather.rainChancePct / 100));
      }
      
      if (weather.tempC > 35) {
        // High temperatures favor drivers with good tire management
        weatherMultiplier *= (0.95 + driver.consistency * 0.1);
      } else if (weather.tempC < 5) {
        // Low temperatures favor drivers with good cold weather setup
        weatherMultiplier *= (0.92 + driver.trackAdaptability * 0.15);
      }
      
      if (weather.windKmh > 25) {
        // High winds favor drivers with good car control
        weatherMultiplier *= (0.90 + driver.consistency * 0.12);
      }
      
      // Apply weather multiplier
      baseWinProb *= weatherMultiplier;
      
      // Add controlled randomness (±8% instead of ±15%)
      const randomFactor = 0.92 + Math.random() * 0.16;
      baseWinProb *= randomFactor;
      
      // Clamp probabilities to realistic ranges
      baseWinProb = Math.max(0.5, Math.min(35, baseWinProb));
      
      // Calculate podium probability (higher than win probability)
      const podiumProb = Math.min(100, baseWinProb * (2.5 + Math.random() * 0.5));

      return {
        driverId: driver.id,
        driverName: driver.name,
        team: driver.team,
        winProbPct: Math.round(baseWinProb * 10) / 10,
        podiumProbPct: Math.round(podiumProb * 10) / 10,
        position: 0 // Will be set after sorting
      };
    });

    // Sort by win probability (highest first)
    driverPredictions.sort((a, b) => b.winProbPct - a.winProbPct);

    // Update positions after sorting
    driverPredictions.forEach((driver, index) => {
      driver.position = index + 1;
    });

    // Calculate improved model stats based on weather conditions
    const modelAccuracy = this.calculateAdvancedModelAccuracy(weather, race.circuit);
    const meanError = this.calculateAdvancedMeanError(weather, race.circuit);

    return {
      raceId: race.id,
      generatedAt: new Date().toISOString(),
      weatherUsed: weather,
      top3: driverPredictions.slice(0, 3),
      all: driverPredictions,
      modelStats: {
        accuracyPct: modelAccuracy,
        meanErrorSec: meanError,
        trees: 200 + Math.floor(Math.random() * 100), // 200-300 trees
        lr: Math.round((0.05 + Math.random() * 0.15) * 100) / 100 // 0.05-0.20 learning rate
      }
    };
  }

  private getTrackModifiers(circuit: string): Record<string, number> {
    // Track-specific performance modifiers for different teams
    const modifiers: Record<string, Record<string, number>> = {
      "Albert Park Circuit": { // Australia - high speed, technical
        "Red Bull": 1.05, "Mercedes": 1.02, "Ferrari": 1.03, "McLaren": 1.04
      },
      "Jeddah Corniche Circuit": { // Saudi Arabia - high speed, street circuit
        "Red Bull": 1.06, "Mercedes": 1.01, "Ferrari": 1.02, "McLaren": 1.03
      },
      "Bahrain International Circuit": { // Bahrain - technical, tire degradation
        "Red Bull": 1.04, "Mercedes": 1.03, "Ferrari": 1.05, "McLaren": 1.02
      },
      "Circuit of the Americas": { // USA - technical, elevation changes
        "Red Bull": 1.03, "Mercedes": 1.04, "Ferrari": 1.02, "McLaren": 1.05
      },
      "Silverstone Circuit": { // UK - high speed, flowing
        "Red Bull": 1.05, "Mercedes": 1.06, "Ferrari": 1.03, "McLaren": 1.04
      },
      "Monaco Circuit": { // Monaco - tight, technical, no overtaking
        "Red Bull": 1.02, "Mercedes": 1.01, "Ferrari": 1.04, "McLaren": 1.03
      }
    };
    
    return modifiers[circuit] || {};
  }

  private getRecentFormBonus(): Record<string, number> {
    // Simulate recent form based on last 3 races
    const formBonus: Record<string, number> = {};
    
    // Top performers get positive bonus, others get slight negative
    const topDrivers = ["VER", "NOR", "LEC", "HAM"];
    const midDrivers = ["SAI", "RUS", "ALO", "PIA"];
    
    topDrivers.forEach(driver => {
      formBonus[driver] = 0.1 + Math.random() * 0.2; // +10% to +30%
    });
    
    midDrivers.forEach(driver => {
      formBonus[driver] = -0.05 + Math.random() * 0.1; // -5% to +5%
    });
    
    // Other drivers get slight negative bonus
    ["STR", "GAS", "OCO", "ALB", "TSU", "RIC", "BOT", "ZHO", "HUL", "MAG", "LAW", "BEA"].forEach(driver => {
      formBonus[driver] = -0.1 + Math.random() * 0.1; // -10% to 0%
    });
    
    return formBonus;
  }

  private calculateAdvancedWeatherImpact(weather: Weather): number {
    let impact = 1.0;
    
    // Rain significantly affects predictions
    if (weather.rainChancePct > 50) impact *= 0.82;
    else if (weather.rainChancePct > 30) impact *= 0.90;
    else if (weather.rainChancePct > 15) impact *= 0.96;
    
    // Extreme temperatures reduce accuracy
    if (weather.tempC > 40 || weather.tempC < 0) impact *= 0.85;
    else if (weather.tempC > 35 || weather.tempC < 5) impact *= 0.92;
    else if (weather.tempC > 30 || weather.tempC < 10) impact *= 0.97;
    
    // High winds reduce precision
    if (weather.windKmh > 35) impact *= 0.85;
    else if (weather.windKmh > 25) impact *= 0.90;
    else if (weather.windKmh > 15) impact *= 0.95;
    
    return impact;
  }

  private calculateAdvancedModelAccuracy(weather: Weather, circuit: string): number {
    let baseAccuracy = 91; // Higher base accuracy
    
    // Circuit complexity affects accuracy
    const complexCircuits = ["Monaco Circuit", "Singapore Street Circuit", "Hungaroring"];
    if (complexCircuits.includes(circuit)) baseAccuracy -= 3;
    
    // Weather conditions affect model accuracy
    if (weather.rainChancePct > 50) baseAccuracy -= 6; // Rain reduces accuracy
    else if (weather.rainChancePct > 30) baseAccuracy -= 3;
    else if (weather.rainChancePct > 15) baseAccuracy -= 1;
    
    if (weather.tempC > 40 || weather.tempC < 0) baseAccuracy -= 4; // Extreme temps
    else if (weather.tempC > 35 || weather.tempC < 5) baseAccuracy -= 2;
    
    if (weather.windKmh > 35) baseAccuracy -= 5; // High winds
    else if (weather.windKmh > 25) baseAccuracy -= 3;
    else if (weather.windKmh > 15) baseAccuracy -= 1;
    
    // Add some randomness
    const randomVariation = Math.random() * 4 - 2; // ±2%
    
    return Math.max(78, Math.min(96, Math.round(baseAccuracy + randomVariation)));
  }

  private calculateAdvancedMeanError(weather: Weather, circuit: string): number {
    let baseError = 0.6; // Lower base error for better accuracy
    
    // Circuit complexity affects error
    const complexCircuits = ["Monaco Circuit", "Singapore Street Circuit", "Hungaroring"];
    if (complexCircuits.includes(circuit)) baseError *= 1.2;
    
    // Weather conditions affect prediction error
    if (weather.rainChancePct > 50) baseError *= 1.3; // Rain increases error
    else if (weather.rainChancePct > 30) baseError *= 1.15;
    else if (weather.rainChancePct > 15) baseError *= 1.05;
    
    if (weather.tempC > 40 || weather.tempC < 0) baseError *= 1.25; // Extreme temps
    else if (weather.tempC > 35 || weather.tempC < 5) baseError *= 1.1;
    
    if (weather.windKmh > 35) baseError *= 1.2; // High winds
    else if (weather.windKmh > 25) baseError *= 1.1;
    else if (weather.windKmh > 15) baseError *= 1.05;
    
    // Add some randomness
    const randomVariation = (Math.random() - 0.5) * 0.3; // ±0.15s
    
    return Math.round((baseError + randomVariation) * 10) / 10;
  }

  private getRaceStatus(race: Race, now: Date): "upcoming" | "live" | "finished" {
    const startDate = new Date(race.startDate);
    const endDate = new Date(race.endDate + "T23:59:59");
    
    if (now < startDate) return "upcoming";
    if (now >= startDate && now <= endDate) return "live";
    return "finished";
  }

  private hashWeather(weather: Weather): string {
    return `${weather.tempC}-${weather.windKmh}-${weather.rainChancePct}-${weather.condition}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private updateCache(cacheKey: string, prediction: RacePrediction): void {
    this.cache.set(cacheKey, prediction);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  // Clean up expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  constructor() {
    // Clean up cache every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
  }
}

export default new PredictionService();
