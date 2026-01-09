import { query, transaction } from '../config/database.js';

class Bet {
  static async create(betData) {
    const {
      user_id,
      market_id,
      selection_id,
      stake_cents,
      odds,
      bet_type,
      status = 'pending'
    } = betData;

    try {
      const result = await query(
        `INSERT INTO bets (
          user_id, market_id, selection_id, stake_cents, odds, 
          bet_type, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *`,
        [user_id, market_id, selection_id, stake_cents, odds, bet_type, status]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        `SELECT b.*, u.username, u.avatar_url, m.title as market_title
         FROM bets b
         JOIN users u ON b.user_id = u.id
         JOIN markets m ON b.market_id = m.id
         WHERE b.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding bet by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT b.*, m.title as market_title, m.status as market_status
         FROM bets b
         JOIN markets m ON b.market_id = m.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error finding bets by user ID:', error);
      throw error;
    }
  }

  static async findByMarketId(marketId) {
    try {
      const result = await query(
        `SELECT b.*, u.username, u.avatar_url
         FROM bets b
         JOIN users u ON b.user_id = u.id
         WHERE b.market_id = $1
         ORDER BY b.created_at DESC`,
        [marketId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error finding bets by market ID:', error);
      throw error;
    }
  }

  static async updateStatus(id, status, result = null) {
    try {
      let queryStr = `UPDATE bets SET status = $2, updated_at = NOW()`;
      let params = [id, status];

      if (result !== null) {
        queryStr += `, result = $3`;
        params.push(result);
      }

      queryStr += ` WHERE id = $1 RETURNING *`;

      const result = await query(queryStr, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating bet status:', error);
      throw error;
    }
  }

  static async settleBets(marketId, winningSelectionId) {
    try {
      // Get all bets for this market
      const bets = await this.findByMarketId(marketId);
      
      for (const bet of bets) {
        let status, result;
        
        if (bet.selection_id === winningSelectionId) {
          status = 'won';
          result = 'win';
        } else {
          status = 'lost';
          result = 'loss';
        }
        
        await this.updateStatus(bet.id, status, result);
      }
      
      return bets.length;
    } catch (error) {
      console.error('Error settling bets:', error);
      throw error;
    }
  }

  static async getUserStats(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total_bets,
           COUNT(CASE WHEN status = 'won' THEN 1 END) as bets_won,
           COUNT(CASE WHEN status = 'lost' THEN 1 END) as bets_lost,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as bets_pending,
           SUM(CASE WHEN status = 'won' THEN stake_cents * odds / 100 ELSE 0 END) as total_winnings_cents,
           SUM(stake_cents) as total_stake_cents
         FROM bets 
         WHERE user_id = $1`,
        [userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  static async getActiveBets(userId) {
    try {
      const result = await query(
        `SELECT b.*, m.title as market_title, m.status as market_status
         FROM bets b
         JOIN markets m ON b.market_id = m.id
         WHERE b.user_id = $1 AND b.status = 'pending'
         ORDER BY b.created_at DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting active bets:', error);
      throw error;
    }
  }
}

export default Bet;
