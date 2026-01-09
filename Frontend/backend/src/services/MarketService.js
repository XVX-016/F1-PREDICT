import Market from '../models/Market.js';
import { query } from '../config/database.js';
import cron from 'node-cron';

export class MarketService {
  constructor() {
    this.setupCronJobs();
  }

  setupCronJobs() {
    // Check every 10 minutes for markets that need to be closed
    cron.schedule('*/10 * * * *', async () => {
      try {
        await this.closeExpiredMarkets();
      } catch (error) {
        console.error('Error closing expired markets:', error);
      }
    });

    // Check every hour for new races that need markets
    cron.schedule('0 * * * *', async () => {
      try {
        await this.createUpcomingMarkets();
      } catch (error) {
        console.error('Error creating upcoming markets:', error);
      }
    });

    // Check every 30 minutes for markets ready for resolution
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.checkForResolution();
      } catch (error) {
        console.error('Error checking for market resolution:', error);
      }
    });
  }

  async createUpcomingMarkets() {
    const upcomingRaces = await query(
      `SELECT * FROM races 
       WHERE date_time > NOW() 
       AND date_time <= NOW() + INTERVAL '7 days'
       AND status = 'upcoming'
       ORDER BY date_time ASC`
    );

    for (const race of upcomingRaces.rows) {
      await this.createMarketsForRace(race);
    }
  }

  async createMarketsForRace(race) {
    const marketCloseBuffer = parseInt(process.env.MARKET_CLOSE_BUFFER_HOURS) || 2;
    const closesAt = new Date(race.date_time);
    closesAt.setHours(closesAt.getHours() - marketCloseBuffer);

    // Get all drivers for this season
    const driversResult = await query(
      'SELECT * FROM drivers WHERE season = $1 ORDER BY name',
      [race.season]
    );
    const drivers = driversResult.rows;

    // Create race winner market
    const existingWinnerMarket = await query(
      'SELECT id FROM markets WHERE race_id = $1 AND market_type = $2',
      [race.id, 'race_winner']
    );

    if (existingWinnerMarket.rows.length === 0) {
      const winnerOutcomes = drivers.map(driver => ({
        driver_id: driver.id,
        outcome_type: 'driver',
        title: driver.name,
        odds: this.calculateInitialOdds(driver),
        probability: 1 / drivers.length
      }));

      await Market.create({
        race_id: race.id,
        market_type: 'race_winner',
        title: `${race.name} - Race Winner`,
        description: `Who will win the ${race.name}?`,
        opens_at: new Date(),
        closes_at: closesAt,
        outcomes: winnerOutcomes
      });

      console.log(`✅ Created race winner market for ${race.name}`);
    }

    // Create podium market
    const existingPodiumMarket = await query(
      'SELECT id FROM markets WHERE race_id = $1 AND market_type = $2',
      [race.id, 'podium']
    );

    if (existingPodiumMarket.rows.length === 0) {
      const podiumOutcomes = drivers.map(driver => ({
        driver_id: driver.id,
        outcome_type: 'driver',
        title: `${driver.name} to finish on podium`,
        odds: this.calculatePodiumOdds(driver),
        probability: 3 / drivers.length
      }));

      await Market.create({
        race_id: race.id,
        market_type: 'podium',
        title: `${race.name} - Podium Finish`,
        description: `Who will finish on the podium at the ${race.name}?`,
        opens_at: new Date(),
        closes_at: closesAt,
        outcomes: podiumOutcomes
      });

      console.log(`✅ Created podium market for ${race.name}`);
    }

    // Create fastest lap market
    const existingFastestLapMarket = await query(
      'SELECT id FROM markets WHERE race_id = $1 AND market_type = $2',
      [race.id, 'fastest_lap']
    );

    if (existingFastestLapMarket.rows.length === 0) {
      const fastestLapOutcomes = drivers.map(driver => ({
        driver_id: driver.id,
        outcome_type: 'driver',
        title: `${driver.name} fastest lap`,
        odds: this.calculateFastestLapOdds(driver),
        probability: 1 / drivers.length
      }));

      await Market.create({
        race_id: race.id,
        market_type: 'fastest_lap',
        title: `${race.name} - Fastest Lap`,
        description: `Who will set the fastest lap in the ${race.name}?`,
        opens_at: new Date(),
        closes_at: closesAt,
        outcomes: fastestLapOutcomes
      });

      console.log(`✅ Created fastest lap market for ${race.name}`);
    }
  }

  calculateInitialOdds(driver) {
    // Simple initial odds based on team strength
    const teamOdds = {
      'Red Bull Racing': 2.5,
      'McLaren': 3.5,
      'Ferrari': 4.0,
      'Mercedes': 5.0,
      'Aston Martin': 15.0,
      'Alpine': 25.0,
      'Williams': 50.0,
      'Sauber': 75.0,
      'Haas': 100.0,
      'RB': 60.0
    };

    return teamOdds[driver.team] || 100.0;
  }

  calculatePodiumOdds(driver) {
    return this.calculateInitialOdds(driver) * 0.6; // Podium more likely than win
  }

  calculateFastestLapOdds(driver) {
    return this.calculateInitialOdds(driver) * 0.8; // Fastest lap somewhat likely
  }

  async closeExpiredMarkets() {
    const closedMarkets = await Market.closeExpiredMarkets();
    
    for (const market of closedMarkets) {
      console.log(`🔒 Closed market: ${market.title}`);
      // Emit WebSocket event for real-time updates
      this.emitMarketUpdate(market.id, { status: 'closed' });
    }

    return closedMarkets;
  }

  async checkForResolution() {
    const marketsForResolution = await Market.getMarketsForResolution();
    
    for (const market of marketsForResolution) {
      try {
        await this.resolveMarket(market);
      } catch (error) {
        console.error(`Error resolving market ${market.id}:`, error);
      }
    }
  }

  async resolveMarket(market) {
    // Get race results
    const raceResults = await query(
      `SELECT rr.*, d.name as driver_name, d.driver_id
       FROM race_results rr
       JOIN drivers d ON rr.driver_id = d.id
       WHERE rr.race_id = $1
       ORDER BY rr.position ASC`,
      [market.race_id]
    );

    if (raceResults.rows.length === 0) {
      console.log(`No race results available for market ${market.id}`);
      return;
    }

    let winningOutcomeId = null;
    const resolutionData = { results: raceResults.rows };

    // Determine winning outcome based on market type
    switch (market.market_type) {
      case 'race_winner':
        const winner = raceResults.rows[0]; // First position
        const winnerOutcome = await query(
          `SELECT mo.id FROM market_outcomes mo
           JOIN drivers d ON mo.driver_id = d.id
           WHERE mo.market_id = $1 AND d.driver_id = $2`,
          [market.id, winner.driver_id]
        );
        if (winnerOutcome.rows.length > 0) {
          winningOutcomeId = winnerOutcome.rows[0].id;
        }
        break;

      case 'podium':
        // For podium markets, all top 3 finishers win
        const podiumFinishers = raceResults.rows.slice(0, 3);
        for (const finisher of podiumFinishers) {
          const outcome = await query(
            `SELECT mo.id FROM market_outcomes mo
             JOIN drivers d ON mo.driver_id = d.id
             WHERE mo.market_id = $1 AND d.driver_id = $2`,
            [market.id, finisher.driver_id]
          );
          if (outcome.rows.length > 0) {
            await query(
              'UPDATE market_outcomes SET is_winning_outcome = true WHERE id = $1',
              [outcome.rows[0].id]
            );
          }
        }
        break;

      case 'fastest_lap':
        const fastestLapDriver = raceResults.rows.find(r => r.fastest_lap);
        if (fastestLapDriver) {
          const fastestOutcome = await query(
            `SELECT mo.id FROM market_outcomes mo
             JOIN drivers d ON mo.driver_id = d.id
             WHERE mo.market_id = $1 AND d.driver_id = $2`,
            [market.id, fastestLapDriver.driver_id]
          );
          if (fastestOutcome.rows.length > 0) {
            winningOutcomeId = fastestOutcome.rows[0].id;
          }
        }
        break;
    }

    // Resolve the market
    await Market.resolve(market.id, winningOutcomeId, resolutionData);
    
    // Resolve all bets for this market
    const { Bet } = await import('../models/Bet.js');
    await Bet.resolve(market.id, winningOutcomeId);

    console.log(`✅ Resolved market: ${market.title}`);
    
    // Emit WebSocket event
    this.emitMarketUpdate(market.id, { 
      status: 'resolved', 
      winningOutcomeId,
      resolutionData 
    });
  }

  async updateMarketOdds(marketId) {
    const updatedOutcomes = await Market.updateOdds(marketId);
    
    // Emit WebSocket event for real-time odds updates
    this.emitMarketUpdate(marketId, { 
      type: 'odds_update',
      outcomes: updatedOutcomes 
    });

    return updatedOutcomes;
  }

  emitMarketUpdate(marketId, data) {
    // WebSocket implementation would go here
    // For now, just log the event
    console.log(`📡 Market update emitted for ${marketId}:`, data);
  }

  async getActiveMarkets() {
    return Market.findActiveMarkets();
  }

  async getMarketById(id) {
    return Market.findById(id);
  }

  async getMarketsByRace(raceId) {
    return Market.findByRaceId(raceId);
  }

  async getMarketStats(id) {
    return Market.getMarketStats(id);
  }

  // Manual market creation for special events
  async createCustomMarket(marketData) {
    return Market.create(marketData);
  }

  // Manual market resolution for edge cases
  async manuallyResolveMarket(marketId, winningOutcomeId, resolutionData) {
    await Market.resolve(marketId, winningOutcomeId, resolutionData);
    
    const { Bet } = await import('../models/Bet.js');
    await Bet.resolve(marketId, winningOutcomeId);

    console.log(`🔧 Manually resolved market: ${marketId}`);
    this.emitMarketUpdate(marketId, { 
      status: 'resolved', 
      winningOutcomeId,
      resolutionData,
      manual: true
    });
  }

  async getUpcomingRaces(limit = 10) {
    const result = await query(
      `SELECT * FROM races 
       WHERE date_time > NOW() 
       ORDER BY date_time ASC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async getRecentResults(limit = 5) {
    const result = await query(
      `SELECT r.*, COUNT(m.id) as market_count
       FROM races r
       LEFT JOIN markets m ON r.id = m.race_id
       WHERE r.status = 'completed'
       GROUP BY r.id
       ORDER BY r.date_time DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

export default MarketService;
