import { query, transaction } from '../config/database.js';

class Market {
  static async create(marketData) {
    const {
      title,
      description,
      race_id,
      market_type,
      status = 'open',
      closing_time,
      selections = []
    } = marketData;

    try {
      return await transaction(async (client) => {
        // Create the market
        const marketResult = await client.query(
          `INSERT INTO markets (
            title, description, race_id, market_type, status, 
            closing_time, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING *`,
          [title, description, race_id, market_type, status, closing_time]
        );

        const market = marketResult.rows[0];

        // Create market selections
        if (selections.length > 0) {
          for (const selection of selections) {
            await client.query(
              `INSERT INTO market_selections (
                market_id, title, odds, is_winner, created_at
              ) VALUES ($1, $2, $3, $4, NOW())`,
              [market.id, selection.title, selection.odds, selection.is_winner || false]
            );
          }
        }

        return market;
      });
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        `SELECT m.*, r.name as race_name, r.date_time as race_date, r.circuit_name
         FROM markets m
         LEFT JOIN races r ON m.race_id = r.id
         WHERE m.id = $1`,
        [id]
      );
      
      if (!result.rows[0]) return null;

      // Get selections for this market
      const selectionsResult = await query(
        `SELECT * FROM market_selections WHERE market_id = $1 ORDER BY created_at`,
        [id]
      );

      const market = result.rows[0];
      market.selections = selectionsResult.rows;

      return market;
    } catch (error) {
      console.error('Error finding market by ID:', error);
      throw error;
    }
  }

  static async findAll(limit = 50, offset = 0, status = null) {
    try {
      let queryStr = `
        SELECT m.*, r.name as race_name, r.date_time as race_date, r.circuit_name
        FROM markets m
        LEFT JOIN races r ON m.race_id = r.id
      `;
      
      const params = [];
      if (status) {
        queryStr += ` WHERE m.status = $1`;
        params.push(status);
      }
      
      queryStr += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(queryStr, params);
      
      // Get selections for each market
      for (const market of result.rows) {
        const selectionsResult = await query(
          `SELECT * FROM market_selections WHERE market_id = $1 ORDER BY created_at`,
          [market.id]
        );
        market.selections = selectionsResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error finding all markets:', error);
      throw error;
    }
  }

  static async findByRaceId(raceId) {
    try {
      const result = await query(
        `SELECT m.*, r.name as race_name, r.date_time as race_date, r.circuit_name
         FROM markets m
         LEFT JOIN races r ON m.race_id = r.id
         WHERE m.race_id = $1
         ORDER BY m.created_at`,
        [raceId]
      );
      
      // Get selections for each market
      for (const market of result.rows) {
        const selectionsResult = await query(
          `SELECT * FROM market_selections WHERE market_id = $1 ORDER BY created_at`,
          [market.id]
        );
        market.selections = selectionsResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error finding markets by race ID:', error);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const result = await query(
        `UPDATE markets SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, status]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating market status:', error);
      throw error;
    }
  }

  static async closeMarket(id) {
    try {
      return await transaction(async (client) => {
        // Close the market
        const marketResult = await client.query(
          `UPDATE markets SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *`,
          [id]
        );

        if (!marketResult.rows[0]) {
          throw new Error('Market not found');
        }

        // Get all pending bets for this market
        const betsResult = await client.query(
          `SELECT * FROM bets WHERE market_id = $1 AND status = 'pending'`,
          [id]
        );

        // Cancel all pending bets
        for (const bet of betsResult.rows) {
          await client.query(
            `UPDATE bets SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
            [bet.id]
          );

          // Refund the stake to user's balance
          await client.query(
            `UPDATE users SET balance_cents = balance_cents + $1 WHERE id = $2`,
            [bet.stake_cents, bet.user_id]
          );
        }

        return {
          market: marketResult.rows[0],
          cancelledBets: betsResult.rows.length
        };
      });
    } catch (error) {
      console.error('Error closing market:', error);
      throw error;
    }
  }

  static async settleMarket(id, winningSelectionId) {
    try {
      return await transaction(async (client) => {
        // Update market status
        const marketResult = await client.query(
          `UPDATE markets SET status = 'settled', updated_at = NOW() WHERE id = $1 RETURNING *`,
          [id]
        );

        if (!marketResult.rows[0]) {
          throw new Error('Market not found');
        }

        // Mark winning selection
        await client.query(
          `UPDATE market_selections SET is_winner = true WHERE market_id = $1 AND id = $2`,
          [id, winningSelectionId]
        );

        // Settle all bets for this market
        const betsResult = await client.query(
          `SELECT * FROM bets WHERE market_id = $1 AND status = 'pending'`,
          [id]
        );

        for (const bet of betsResult.rows) {
          const isWinner = bet.selection_id === winningSelectionId;
          const status = isWinner ? 'won' : 'lost';
          const winnings = isWinner ? Math.floor(bet.stake_cents * bet.odds / 100) : 0;

          // Update bet status
          await client.query(
            `UPDATE bets SET status = $1, result = $2, updated_at = NOW() WHERE id = $3`,
            [status, isWinner ? 'win' : 'loss', bet.id]
          );

          if (isWinner) {
            // Add winnings to user balance
            await client.query(
              `UPDATE users SET 
                balance_cents = balance_cents + $1,
                total_bets_won = total_bets_won + 1
                WHERE id = $2`,
              [winnings, bet.user_id]
            );
          }

          // Update user's total bets placed
          await client.query(
            `UPDATE users SET total_bets_placed = total_bets_placed + 1 WHERE id = $1`,
            [bet.user_id]
          );
        }

        return {
          market: marketResult.rows[0],
          settledBets: betsResult.rows.length
        };
      });
    } catch (error) {
      console.error('Error settling market:', error);
      throw error;
    }
  }

  static async getMarketStats(id) {
    try {
      const result = await query(
        `SELECT 
           COUNT(b.id) as total_bets,
           SUM(b.stake_cents) as total_volume_cents,
           COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bets,
           COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_bets,
           COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lost_bets
         FROM markets m
         LEFT JOIN bets b ON m.id = b.market_id
         WHERE m.id = $1
         GROUP BY m.id`,
        [id]
      );
      
      return result.rows[0] || {
        total_bets: 0,
        total_volume_cents: 0,
        pending_bets: 0,
        won_bets: 0,
        lost_bets: 0
      };
    } catch (error) {
      console.error('Error getting market stats:', error);
      throw error;
    }
  }

  static async getUpcomingMarkets(limit = 10) {
    try {
      const result = await query(
        `SELECT m.*, r.name as race_name, r.date_time as race_date, r.circuit_name
         FROM markets m
         LEFT JOIN races r ON m.race_id = r.id
         WHERE m.status = 'open' AND m.closing_time > NOW()
         ORDER BY m.closing_time ASC
         LIMIT $1`,
        [limit]
      );
      
      // Get selections for each market
      for (const market of result.rows) {
        const selectionsResult = await query(
          `SELECT * FROM market_selections WHERE market_id = $1 ORDER BY created_at`,
          [market.id]
        );
        market.selections = selectionsResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting upcoming markets:', error);
      throw error;
    }
  }
}

export default Market;
