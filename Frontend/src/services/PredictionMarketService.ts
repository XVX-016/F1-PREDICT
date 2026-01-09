import { RacePrediction, DriverPrediction } from '../types/predictions';
import { MarketCategory, MarketOption } from '../types/betting';
import MLPredictionService from './MLPredictionService';

export interface MarketPredictionData {
  raceId: string;
  raceName: string;
  raceDate: Date;
  predictions: {
    winner: DriverPrediction[];
    podium: DriverPrediction[];
    pole: DriverPrediction[];
    fastestLap: DriverPrediction[];
    safetyCar: { probability: number };
    dnf: { probability: number };
    teamPodium: { [team: string]: number };
  };
}

export interface DynamicMarketConfig {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  options: MarketOption[];
  raceId: string;
  raceName: string;
  raceDate: Date;
  expiresAt: Date;
}

class PredictionMarketService {
  private static instance: PredictionMarketService;
  private predictionService: MLPredictionService;

  private constructor() {
    this.predictionService = MLPredictionService.getInstance();
  }

  public static getInstance(): PredictionMarketService {
    if (!PredictionMarketService.instance) {
      PredictionMarketService.instance = new PredictionMarketService();
    }
    return PredictionMarketService.instance;
  }

  /**
   * Convert probability to betting odds (currentPrice)
   */
  private probToOdds(prob: number): number {
    // Ensure probability is between 0 and 1
    const clampedProb = Math.max(0.01, Math.min(0.99, prob));
    // Convert to percentage odds (2-95 range)
    return Math.max(2, Math.min(95, Math.round(clampedProb * 100)));
  }

  /**
   * Generate dynamic markets from ML predictions
   */
  public async generateDynamicMarkets(raceName: string, raceDate?: string): Promise<DynamicMarketConfig[]> {
    try {
      console.log(`🎯 Generating dynamic markets for ${raceName}`);
      
      // Get race predictions from ML service
      const racePrediction = await this.predictionService.getRacePrediction(raceName, raceDate);
      
      if (!racePrediction) {
        console.warn(`⚠️ No predictions available for ${raceName}, using fallback`);
        return this.getFallbackMarkets(raceName, raceDate);
      }

      const raceDateObj = raceDate ? new Date(raceDate) : new Date();
      const expiresAt = new Date(raceDateObj.getTime() + 60 * 60 * 1000); // 1 hour after race

      const markets: DynamicMarketConfig[] = [];

      // 1. Race Winner Market
      markets.push(this.createWinnerMarket(racePrediction, raceName, raceDateObj, expiresAt));

      // 2. Podium Finish Market
      markets.push(this.createPodiumMarket(racePrediction, raceName, raceDateObj, expiresAt));

      // 3. Pole Position Market
      markets.push(this.createPoleMarket(racePrediction, raceName, raceDateObj, expiresAt));

      // 4. Fastest Lap Market
      markets.push(this.createFastestLapMarket(racePrediction, raceName, raceDateObj, expiresAt));

      // 5. Safety Car Market
      markets.push(this.createSafetyCarMarket(raceName, raceDateObj, expiresAt));

      // 6. DNF Count Market
      markets.push(this.createDNFMarket(raceName, raceDateObj, expiresAt));

      // 7. Team Podium Market
      markets.push(this.createTeamPodiumMarket(racePrediction, raceName, raceDateObj, expiresAt));

      console.log(`✅ Generated ${markets.length} dynamic markets for ${raceName}`);
      return markets;

    } catch (error) {
      console.error(`❌ Error generating dynamic markets for ${raceName}:`, error);
      return this.getFallbackMarkets(raceName, raceDate);
    }
  }

  private createWinnerMarket(prediction: RacePrediction, raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    const options: MarketOption[] = prediction.all.map(driver => ({
      id: `winner-${driver.driverId}`,
      title: driver.driverName,
      currentPrice: this.probToOdds(driver.winProbPct / 100),
      marketId: `winner-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      description: `Will ${driver.driverName} win the ${raceName}?`,
      totalVolume: 0,
      totalBets: 0,
      isWinning: false
    }));

    return {
      id: `winner-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Race Winner - ${raceName}`,
      description: `Who will win the ${raceName}?`,
      category: MarketCategory.RACE_WINNER,
      options,
      raceId: prediction.raceId,
      raceName,
      raceDate,
      expiresAt
    };
  }

  private createPodiumMarket(prediction: RacePrediction, raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    const options: MarketOption[] = prediction.all.map(driver => ({
      id: `podium-${driver.driverId}`,
      title: driver.driverName,
      currentPrice: this.probToOdds(driver.podiumProbPct / 100),
      marketId: `podium-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      description: `Will ${driver.driverName} finish on the podium?`,
      totalVolume: 0,
      totalBets: 0,
      isWinning: false
    }));

    return {
      id: `podium-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Podium Finish - ${raceName}`,
      description: `Which drivers will finish on the podium?`,
      category: MarketCategory.PODIUM_FINISH,
      options,
      raceId: prediction.raceId,
      raceName,
      raceDate,
      expiresAt
    };
  }

  private createPoleMarket(prediction: RacePrediction, raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    // Use top 10 drivers for pole position (more realistic)
    const topDrivers = prediction.all.slice(0, 10);
    const options: MarketOption[] = topDrivers.map((driver, index) => {
      // Pole probability decreases with position, but top drivers have higher chances
      const baseProb = Math.max(0.05, 0.4 - (index * 0.03));
      return {
        id: `pole-${driver.driverId}`,
        title: driver.driverName,
        currentPrice: this.probToOdds(baseProb),
        marketId: `pole-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Will ${driver.driverName} get pole position?`,
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      };
    });

    return {
      id: `pole-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Pole Position - ${raceName}`,
      description: `Who will get pole position?`,
      category: MarketCategory.POLE_POSITION,
      options,
      raceId: prediction.raceId,
      raceName,
      raceDate,
      expiresAt
    };
  }

  private createFastestLapMarket(prediction: RacePrediction, raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    // Use top 8 drivers for fastest lap
    const topDrivers = prediction.all.slice(0, 8);
    const options: MarketOption[] = topDrivers.map((driver, index) => {
      // Fastest lap probability based on win probability but adjusted
      const baseProb = Math.max(0.05, (driver.winProbPct / 100) * 0.6 - (index * 0.02));
      return {
        id: `fastest-${driver.driverId}`,
        title: driver.driverName,
        currentPrice: this.probToOdds(baseProb),
        marketId: `fastest-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Will ${driver.driverName} get the fastest lap?`,
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      };
    });

    return {
      id: `fastest-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Fastest Lap - ${raceName}`,
      description: `Who will get the fastest lap?`,
      category: MarketCategory.FASTEST_LAP,
      options,
      raceId: prediction.raceId,
      raceName,
      raceDate,
      expiresAt
    };
  }

  private createSafetyCarMarket(raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    const options: MarketOption[] = [
      {
        id: 'safety-car-yes',
        title: 'Yes',
        currentPrice: 35, // 35% chance
        marketId: `safety-car-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: 'Will there be a safety car?',
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      },
      {
        id: 'safety-car-no',
        title: 'No',
        currentPrice: 65, // 65% chance
        marketId: `safety-car-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: 'Will there be a safety car?',
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      }
    ];

    return {
      id: `safety-car-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Safety Car - ${raceName}`,
      description: `Will there be a safety car deployment?`,
      category: MarketCategory.SAFETY_CAR,
      options,
      raceId: raceName.toLowerCase().replace(/\s+/g, '-'),
      raceName,
      raceDate,
      expiresAt
    };
  }

  private createDNFMarket(raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    const options: MarketOption[] = [
      { id: 'dnf-0-2', title: '0-2', currentPrice: 25, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false },
      { id: 'dnf-3-4', title: '3-4', currentPrice: 40, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false },
      { id: 'dnf-5-6', title: '5-6', currentPrice: 25, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false },
      { id: 'dnf-7+', title: '7+', currentPrice: 10, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false }
    ];

    return {
      id: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `DNF Count - ${raceName}`,
      description: `How many drivers will not finish?`,
      category: MarketCategory.DNF_COUNT,
      options,
      raceId: raceName.toLowerCase().replace(/\s+/g, '-'),
      raceName,
      raceDate,
      expiresAt
    };
  }

  private createTeamPodiumMarket(prediction: RacePrediction, raceName: string, raceDate: Date, expiresAt: Date): DynamicMarketConfig {
    // Group drivers by team and calculate team podium probability
    const teamProbabilities: { [team: string]: number } = {};
    
    prediction.all.forEach(driver => {
      if (!teamProbabilities[driver.team]) {
        teamProbabilities[driver.team] = 0;
      }
      teamProbabilities[driver.team] += driver.podiumProbPct / 100;
    });

    // Normalize team probabilities
    const totalProb = Object.values(teamProbabilities).reduce((sum, prob) => sum + prob, 0);
    Object.keys(teamProbabilities).forEach(team => {
      teamProbabilities[team] = Math.min(0.95, teamProbabilities[team] / totalProb);
    });

    const options: MarketOption[] = Object.entries(teamProbabilities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6) // Top 6 teams
      .map(([team, prob]) => ({
        id: `team-podium-${team.toLowerCase().replace(/\s+/g, '-')}`,
        title: team,
        currentPrice: this.probToOdds(prob),
        marketId: `team-podium-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Will ${team} have a driver on the podium?`,
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      }));

    return {
      id: `team-podium-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Team Podium - ${raceName}`,
      description: `Which teams will have a driver on the podium?`,
      category: MarketCategory.TEAM_PODIUM,
      options,
      raceId: prediction.raceId,
      raceName,
      raceDate,
      expiresAt
    };
  }

  /**
   * Fallback markets when ML predictions are unavailable
   */
  private getFallbackMarkets(raceName: string, raceDate?: string): DynamicMarketConfig[] {
    console.log(`🔄 Using fallback markets for ${raceName}`);
    
    const raceDateObj = raceDate ? new Date(raceDate) : new Date();
    const expiresAt = new Date(raceDateObj.getTime() + 60 * 60 * 1000);

    // Simple fallback with basic driver options
    const fallbackDrivers = [
      { id: 'VER', name: 'Max Verstappen', team: 'Red Bull', winProb: 0.35, podiumProb: 0.55 },
      { id: 'NOR', name: 'Lando Norris', team: 'McLaren', winProb: 0.28, podiumProb: 0.48 },
      { id: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', winProb: 0.12, podiumProb: 0.36 },
      { id: 'RUS', name: 'George Russell', team: 'Mercedes', winProb: 0.08, podiumProb: 0.28 },
      { id: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', winProb: 0.07, podiumProb: 0.25 },
      { id: 'PIA', name: 'Oscar Piastri', team: 'McLaren', winProb: 0.05, podiumProb: 0.20 },
      { id: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', winProb: 0.03, podiumProb: 0.18 },
      { id: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', winProb: 0.02, podiumProb: 0.15 }
    ];

    const markets: DynamicMarketConfig[] = [];

    // Winner Market
    markets.push({
      id: `winner-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Race Winner - ${raceName}`,
      description: `Who will win the ${raceName}?`,
      category: MarketCategory.RACE_WINNER,
      options: fallbackDrivers.map(driver => ({
        id: `winner-${driver.id}`,
        title: driver.name,
        currentPrice: this.probToOdds(driver.winProb),
        marketId: `winner-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Will ${driver.name} win the ${raceName}?`,
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      })),
      raceId: raceName.toLowerCase().replace(/\s+/g, '-'),
      raceName,
      raceDate: raceDateObj,
      expiresAt
    });

    // Podium Market
    markets.push({
      id: `podium-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Podium Finish - ${raceName}`,
      description: `Which drivers will finish on the podium?`,
      category: MarketCategory.PODIUM_FINISH,
      options: fallbackDrivers.map(driver => ({
        id: `podium-${driver.id}`,
        title: driver.name,
        currentPrice: this.probToOdds(driver.podiumProb),
        marketId: `podium-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Will ${driver.name} finish on the podium?`,
        totalVolume: 0,
        totalBets: 0,
        isWinning: false
      })),
      raceId: raceName.toLowerCase().replace(/\s+/g, '-'),
      raceName,
      raceDate: raceDateObj,
      expiresAt
    });

    // Safety Car Market
    markets.push({
      id: `safety-car-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Safety Car - ${raceName}`,
      description: `Will there be a safety car deployment?`,
      category: MarketCategory.SAFETY_CAR,
      options: [
        { id: 'safety-car-yes', title: 'Yes', currentPrice: 35, marketId: `safety-car-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'Will there be a safety car?', totalVolume: 0, totalBets: 0, isWinning: false },
        { id: 'safety-car-no', title: 'No', currentPrice: 65, marketId: `safety-car-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'Will there be a safety car?', totalVolume: 0, totalBets: 0, isWinning: false }
      ],
      raceId: raceName.toLowerCase().replace(/\s+/g, '-'),
      raceName,
      raceDate: raceDateObj,
      expiresAt
    });

    // DNF Market
    markets.push({
      id: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `DNF Count - ${raceName}`,
      description: `How many drivers will not finish?`,
      category: MarketCategory.DNF_COUNT,
      options: [
        { id: 'dnf-0-2', title: '0-2', currentPrice: 25, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false },
        { id: 'dnf-3-4', title: '3-4', currentPrice: 40, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false },
        { id: 'dnf-5-6', title: '5-6', currentPrice: 25, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false },
        { id: 'dnf-7+', title: '7+', currentPrice: 10, marketId: `dnf-${raceName.toLowerCase().replace(/\s+/g, '-')}`, description: 'How many DNFs?', totalVolume: 0, totalBets: 0, isWinning: false }
      ],
      raceId: raceName.toLowerCase().replace(/\s+/g, '-'),
      raceName,
      raceDate: raceDateObj,
      expiresAt
    });

    return markets;
  }
}

export default PredictionMarketService;
