import express from 'express';
import { authenticate } from '../middleware/auth.js';
// Models temporarily removed - using mock data

const router = express.Router();

// Mock market data
const mockMarkets = [
  {
    id: 'market-1',
    title: 'Race Winner - Italian Grand Prix',
    description: 'Who will win the Italian Grand Prix?',
    market_type: 'race_winner',
    race_id: 'monza-2025',
    race_name: 'Italian Grand Prix',
    race_date: '2025-09-07T14:00:00Z',
    status: 'open',
    closing_time: '2025-09-07T12:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    selections: [
      { id: 'max-verstappen', title: 'Max Verstappen', odds: 0.35, is_winner: false },
      { id: 'lando-norris', title: 'Lando Norris', odds: 0.28, is_winner: false },
      { id: 'oscar-piastri', title: 'Oscar Piastri', odds: 0.25, is_winner: false },
      { id: 'charles-leclerc', title: 'Charles Leclerc', odds: 0.12, is_winner: false }
    ]
  },
  {
    id: 'market-2',
    title: 'Podium Finish - Italian Grand Prix',
    description: 'Which drivers will finish on the podium?',
    market_type: 'podium',
    race_id: 'monza-2025',
    race_name: 'Italian Grand Prix',
    race_date: '2025-09-07T14:00:00Z',
    status: 'open',
    closing_time: '2025-09-07T12:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    selections: [
      { id: 'mclaren-1-2', title: 'McLaren 1-2', odds: 0.45, is_winner: false },
      { id: 'mclaren-1-3', title: 'McLaren 1-3', odds: 0.35, is_winner: false },
      { id: 'red-bull-win', title: 'Red Bull Win', odds: 0.30, is_winner: false }
    ]
  },
  {
    id: 'market-3',
    title: 'Safety Car - Italian Grand Prix',
    description: 'Will there be a safety car during the race?',
    market_type: 'safety_car',
    race_id: 'monza-2025',
    race_name: 'Italian Grand Prix',
    race_date: '2025-09-07T14:00:00Z',
    status: 'open',
    closing_time: '2025-09-07T12:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    selections: [
      { id: 'yes', title: 'Yes', odds: 0.40, is_winner: false },
      { id: 'no', title: 'No', odds: 0.60, is_winner: false }
    ]
  }
];

// Public routes (no authentication required)
// Get all markets
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, race_id } = req.query;
    const offset = (page - 1) * limit;

    let markets = [...mockMarkets];
    
    // Filter by race_id if provided
    if (race_id) {
      markets = markets.filter(market => market.race_id === race_id);
    }
    
    // Filter by status if provided
    if (status) {
      markets = markets.filter(market => market.status === status);
    }

    // Apply pagination
    const paginatedMarkets = markets.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedMarkets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: markets.length
      }
    });

  } catch (error) {
    console.error('Error getting markets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a specific market
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const market = mockMarkets.find(m => m.id === id);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: 'Market not found'
      });
    }

    // Mock market statistics
    const stats = {
      total_volume_cents: 50000,
      total_bets: 25,
      unique_users: 15
    };

    res.json({
      success: true,
      data: {
        ...market,
        stats
      }
    });

  } catch (error) {
    console.error('Error getting market:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming markets
router.get('/upcoming/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();
    
    // Filter markets that are still open and haven't closed yet
    const upcomingMarkets = mockMarkets
      .filter(market => market.status === 'open' && new Date(market.closing_time) > now)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: upcomingMarkets
    });

  } catch (error) {
    console.error('Error getting upcoming markets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get markets by race
router.get('/race/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;
    const markets = mockMarkets.filter(market => market.race_id === raceId);

    res.json({
      success: true,
      data: markets
    });

  } catch (error) {
    console.error('Error getting markets by race:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Protected routes (require authentication)
router.use(authenticate);

// Get user's active markets (markets they have bets on)
router.get('/user/active', async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Get user's active bets
    const activeBets = await Bet.getActiveBets(user_id);
    
    // Get unique markets from active bets
    const marketIds = [...new Set(activeBets.map(bet => bet.market_id))];
    
    // Get market details for each active market
    const activeMarkets = [];
    for (const marketId of marketIds) {
      const market = await Market.findById(marketId);
      if (market) {
        // Add user's bets for this market
        market.userBets = activeBets.filter(bet => bet.market_id === marketId);
        activeMarkets.push(market);
      }
    }

    res.json({
      success: true,
      data: activeMarkets
    });

  } catch (error) {
    console.error('Error getting user active markets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin routes (require admin role)
router.use('/admin', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
});

// Create a new market (admin only)
router.post('/admin/create', async (req, res) => {
  try {
    const {
      title,
      description,
      race_id,
      market_type,
      closing_time,
      selections
    } = req.body;

    // Validate required fields
    if (!title || !race_id || !market_type || !closing_time || !selections || selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, race_id, market_type, closing_time, selections'
      });
    }

    // Validate selections
    if (selections.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Market must have at least 2 selections'
      });
    }

    // Validate closing time is in the future
    if (new Date(closing_time) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Closing time must be in the future'
      });
    }

    // Create the market
    const market = await Market.create({
      title,
      description,
      race_id,
      market_type,
      closing_time: new Date(closing_time),
      selections
    });

    res.status(201).json({
      success: true,
      data: market,
      message: 'Market created successfully'
    });

  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update market status (admin only)
router.patch('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['open', 'closed', 'suspended', 'settled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const market = await Market.updateStatus(id, status);

    res.json({
      success: true,
      data: market,
      message: `Market status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating market status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Close a market (admin only)
router.post('/admin/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Market.closeMarket(id);

    res.json({
      success: true,
      data: result,
      message: 'Market closed successfully'
    });

  } catch (error) {
    console.error('Error closing market:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Settle a market (admin only)
router.post('/admin/:id/settle', async (req, res) => {
  try {
    const { id } = req.params;
    const { winning_selection_id } = req.body;

    if (!winning_selection_id) {
      return res.status(400).json({
        success: false,
        message: 'Winning selection ID is required'
      });
    }

    const result = await Market.settleMarket(id, winning_selection_id);

    res.json({
      success: true,
      data: result,
      message: 'Market settled successfully'
    });

  } catch (error) {
    console.error('Error settling market:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update market selections (admin only)
router.patch('/admin/:id/selections', async (req, res) => {
  try {
    const { id } = req.params;
    const { selections } = req.body;

    if (!selections || !Array.isArray(selections)) {
      return res.status(400).json({
        success: false,
        message: 'Selections array is required'
      });
    }

    // This would need to be implemented in the Market model
    // For now, we'll return an error
    res.status(501).json({
      success: false,
      message: 'Update selections not yet implemented'
    });

  } catch (error) {
    console.error('Error updating market selections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get market analytics (admin only)
router.get('/admin/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get market stats
    const stats = await Market.getMarketStats(id);
    
    // Get all bets for this market
    const bets = await Bet.findByMarketId(id);
    
    // Calculate additional analytics
    const analytics = {
      ...stats,
      total_users: new Set(bets.map(bet => bet.user_id)).size,
      average_stake: bets.length > 0 ? Math.round(stats.total_volume_cents / bets.length) : 0,
      selection_distribution: {}
    };

    // Calculate selection distribution
    for (const bet of bets) {
      const selectionId = bet.selection_id;
      if (!analytics.selection_distribution[selectionId]) {
        analytics.selection_distribution[selectionId] = {
          total_bets: 0,
          total_volume: 0
        };
      }
      analytics.selection_distribution[selectionId].total_bets++;
      analytics.selection_distribution[selectionId].total_volume += bet.stake_cents;
    }

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting market analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

