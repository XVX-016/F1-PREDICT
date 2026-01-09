import express from 'express';
import { db } from '../config/firebase.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import WeatherService from '../services/WeatherService.js';

const router = express.Router();

// Get all races for a season
router.get('/', async (req, res) => {
  try {
    const { season = 2025, status } = req.query;

    // Get races from Firestore
    let racesRef = db.collection('races').where('season', '==', parseInt(season));
    
    if (status) {
      racesRef = racesRef.where('status', '==', status);
    }

    const snapshot = await racesRef.orderBy('round').get();
    
    if (snapshot.empty) {
      // Return mock data for F1 routes if no data exists
      const isF1Route = req.path.includes('/f1');
      if (isF1Route) {
        const mockRaces = [
          {
            round: '1',
            raceName: 'Bahrain Grand Prix',
            Circuit: { circuitName: 'Bahrain International Circuit' },
            date: '2025-03-02T14:00:00Z',
            time: '14:00:00Z'
          },
          {
            round: '2',
            raceName: 'Saudi Arabian Grand Prix',
            Circuit: { circuitName: 'Jeddah Corniche Circuit' },
            date: '2025-03-09T14:00:00Z',
            time: '14:00:00Z'
          },
          {
            round: '3',
            raceName: 'Australian Grand Prix',
            Circuit: { circuitName: 'Albert Park Circuit' },
            date: '2025-03-23T14:00:00Z',
            time: '14:00:00Z'
          }
        ];
        return res.json({ races: mockRaces });
      }
      
      return res.json({
        success: true,
        data: { races: [], season: parseInt(season), total: 0 }
      });
    }

    const races = [];
    snapshot.forEach(doc => {
      const race = doc.data();
      races.push({
        id: doc.id,
        round: race.round,
        name: race.name,
        circuit: race.circuit,
        country: race.country,
        date_time: race.date_time,
        season: race.season,
        status: race.status,
        created_at: race.created_at,
        updated_at: race.updated_at
      });
    });

    // Check if this is an F1 route request
    const isF1Route = req.path.includes('/f1');
    
    if (isF1Route) {
      // Return F1-compatible format
      res.json({
        races: races.map(race => ({
          round: race.round.toString(),
          raceName: race.name,
          Circuit: {
            circuitName: race.circuit
          },
          date: race.date_time,
          time: '14:00:00Z' // Default time
        }))
      });
    } else {
      // Return standard format
      res.json({
        success: true,
        data: {
          races: races,
          season: parseInt(season),
          total: races.length
        }
      });
    }

  } catch (error) {
    console.error('Get races error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get races'
    });
  }
});

// Get a specific race by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to get race from Firebase
    const raceDoc = await db.collection('races').doc(id).get();
    
    if (!raceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Race not found'
      });
    }

    const race = raceDoc.data();

    res.json({
      success: true,
      data: {
        race: {
          id: raceDoc.id,
          round: race.round,
          name: race.name,
          circuit: race.circuit,
          country: race.country,
          date_time: race.date_time,
          season: race.season,
          status: race.status,
          market_count: 0, // Mock value
          open_markets: 0, // Mock value
          created_at: race.created_at,
          updated_at: race.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Get race error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get race'
    });
  }
});

// Get upcoming races
router.get('/upcoming/list', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get upcoming races from Firebase
    const racesSnapshot = await db.collection('races')
      .where('status', '==', 'upcoming')
      .orderBy('date_time', 'asc')
      .limit(parseInt(limit))
      .get();

    const races = [];
    racesSnapshot.forEach(doc => {
      const race = doc.data();
      races.push({
        id: doc.id,
        round: race.round,
        name: race.name,
        circuit: race.circuit,
        country: race.country,
        date_time: race.date_time,
        season: race.season,
        status: race.status,
        market_count: 0, // Mock value
        open_markets: 0, // Mock value
        created_at: race.created_at,
        updated_at: race.updated_at
      });
    });

    res.json({
      success: true,
      data: {
        races: races,
        total: races.length
      }
    });

  } catch (error) {
    console.error('Get upcoming races error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming races'
    });
  }
});

// Get race markets
router.get('/:id/markets', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock markets data for now
    const mockMarkets = [
      {
        id: 'mock-market-1',
        race_id: id,
        title: 'Race Winner',
        description: 'Who will win the race?',
        status: 'open',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    res.json({
      success: true,
      data: {
        markets: mockMarkets,
        total: mockMarkets.length
      }
    });

  } catch (error) {
    console.error('Get race markets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get race markets'
    });
  }
});

// Get race results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock race results for now
    const mockResults = [
      {
        position: 1,
        driver_id: 'max_verstappen',
        driver_name: 'Max Verstappen',
        team: 'Red Bull Racing',
        points: 25,
        grid_position: 1,
        finish_time: '1:30:00.000'
      },
      {
        position: 2,
        driver_id: 'lewis_hamilton',
        driver_name: 'Lewis Hamilton',
        team: 'Mercedes',
        points: 18,
        grid_position: 2,
        finish_time: '1:30:05.000'
      }
    ];

    res.json({
      success: true,
      data: {
        results: mockResults,
        total: mockResults.length
      }
    });

  } catch (error) {
    console.error('Get race results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get race results'
    });
  }
});

// Get race statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock race statistics for now
    const mockStats = {
      total_laps: 58,
      fastest_lap: {
        driver: 'Max Verstappen',
        time: '1:25.000',
        lap: 45
      },
      safety_cars: 1,
      red_flags: 0,
      total_drivers: 20,
      finished_drivers: 18
    };

    res.json({
      success: true,
      data: mockStats
    });

  } catch (error) {
    console.error('Get race stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get race statistics'
    });
  }
});

// Get race weather
router.get('/:id/weather', async (req, res) => {
  try {
    const { id } = req.params;

    // Get race from Firebase to get circuit info
    const raceDoc = await db.collection('races').doc(id).get();
    
    if (!raceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Race not found'
      });
    }

    const race = raceDoc.data();
    
    // Get weather for the circuit
    const weather = await WeatherService.getWeatherForCircuit(race.circuit);

    res.json({
      success: true,
      data: {
        race_id: id,
        circuit: race.circuit,
        weather: weather
      }
    });

  } catch (error) {
    console.error('Get race weather error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get race weather'
    });
  }
});

// F1-specific endpoints for frontend compatibility
router.get('/results/:season/:round', async (req, res) => {
  try {
    const { season, round } = req.params;
    
    // For now, return mock results data
    // In a real implementation, this would fetch from F1 API or database
    const mockResults = {
      results: [
        {
          driverId: 'max_verstappen',
          driverName: 'Max Verstappen',
          team: 'Red Bull Racing',
          position: 1,
          points: 25,
          status: 'Finished'
        },
        {
          driverId: 'lewis_hamilton',
          driverName: 'Lewis Hamilton',
          team: 'Mercedes',
          position: 2,
          points: 18,
          status: 'Finished'
        },
        {
          driverId: 'charles_leclerc',
          driverName: 'Charles Leclerc',
          team: 'Ferrari',
          position: 3,
          points: 15,
          status: 'Finished'
        }
      ]
    };
    
    res.json(mockResults);
  } catch (error) {
    console.error('Get F1 results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get F1 results'
    });
  }
});

// Live race data endpoint
router.get('/live/status', async (req, res) => {
  try {
    // Mock live status data
    const liveStatus = {
      status: 'pre_race',
      current_session: null,
      last_update: new Date().toISOString(),
      connected_clients: 0
    };
    
    res.json(liveStatus);
  } catch (error) {
    console.error('Get live status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live status'
    });
  }
});

// Live race data endpoint
router.get('/live/race/:season/:round', async (req, res) => {
  try {
    const { season, round } = req.params;
    
    // Get race info from Firestore to determine circuit for weather
    let circuitName = 'Monaco'; // Default fallback
    try {
      const raceSnapshot = await db.collection('races')
        .where('round', '==', parseInt(round))
        .where('season', '==', parseInt(season))
        .limit(1)
        .get();
      
      if (!raceSnapshot.empty) {
        const race = raceSnapshot.docs[0].data();
        circuitName = race.circuit;
      }
    } catch (firestoreError) {
      console.warn('Could not fetch circuit from Firestore, using default:', firestoreError);
    }
    
    // Get real weather data for the circuit
    const weather = await WeatherService.getWeatherForCircuit(circuitName);
    
    const liveData = {
      positions: [
        {
          position: 1,
          driverId: 'max_verstappen',
          driverName: 'Max Verstappen',
          team: 'Red Bull Racing',
          lastLapTime: '1:25.123',
          status: 'Racing'
        },
        {
          position: 2,
          driverId: 'lewis_hamilton',
          driverName: 'Lewis Hamilton',
          team: 'Mercedes',
          lastLapTime: '1:25.456',
          status: 'Racing'
        }
      ],
      lap_number: 15,
      total_laps: 50,
      race_time: '00:25:30',
      live_odds: {},
      weather: weather,
      last_update: new Date().toISOString()
    };
    
    res.json(liveData);
  } catch (error) {
    console.error('Get live race data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live race data'
    });
  }
});

// Prediction endpoints
router.get('/upcoming', async (req, res) => {
  try {
    const { season = 2025 } = req.query;
    
    // Get races from Firestore
    const racesRef = db.collection('races').where('season', '==', parseInt(season));
    const snapshot = await racesRef.orderBy('round').get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        data: { races: [], season: parseInt(season), total: 0 }
      });
    }

    const races = [];
    const now = new Date();
    
    snapshot.forEach(doc => {
      const race = doc.data();
      const raceDate = new Date(race.startDate || race.date_time);
      
      // Determine race status
      let status = 'upcoming';
      if (raceDate <= now) {
        const endDate = new Date(race.endDate || raceDate.getTime() + (3 * 60 * 60 * 1000)); // 3 hours after start
        if (now <= endDate) {
          status = 'live';
        } else {
          status = 'finished';
        }
      }
      
      races.push({
        id: doc.id,
        round: race.round,
        name: race.name,
        circuit: race.circuit,
        city: race.city || 'Unknown',
        country: race.country,
        startDate: race.startDate || race.date_time,
        endDate: race.endDate || new Date(raceDate.getTime() + (3 * 60 * 60 * 1000)).toISOString(),
        timezone: race.timezone || 'UTC',
        has_sprint: race.has_sprint || false,
        status: status
      });
    });

    // Sort by start date
    races.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    res.json({
      success: true,
      data: {
        races: races,
        season: parseInt(season),
        total: races.length
      }
    });
  } catch (error) {
    console.error('Get upcoming races error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming races'
    });
  }
});

router.get('/next', async (req, res) => {
  try {
    const { season = 2025 } = req.query;
    
    // Get races from Firestore
    const racesRef = db.collection('races').where('season', '==', parseInt(season));
    const snapshot = await racesRef.orderBy('round').get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        data: null
      });
    }

    const races = [];
    const now = new Date();
    
    snapshot.forEach(doc => {
      const race = doc.data();
      const raceDate = new Date(race.startDate || race.date_time);
      
      // Determine race status
      let status = 'upcoming';
      if (raceDate <= now) {
        const endDate = new Date(race.endDate || raceDate.getTime() + (3 * 60 * 60 * 1000));
        if (now <= endDate) {
          status = 'live';
        } else {
          status = 'finished';
        }
      }
      
      races.push({
        id: doc.id,
        round: race.round,
        name: race.name,
        circuit: race.circuit,
        city: race.city || 'Unknown',
        country: race.country,
        startDate: race.startDate || race.date_time,
        endDate: race.endDate || new Date(raceDate.getTime() + (3 * 60 * 60 * 1000)).toISOString(),
        timezone: race.timezone || 'UTC',
        has_sprint: race.has_sprint || false,
        status: status
      });
    });

    // Find next race (first race that's not finished)
    const nextRace = races
      .filter(r => r.status !== "finished")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    
    res.json({
      success: true,
      data: nextRace || null
    });
  } catch (error) {
    console.error('Get next race error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next race'
    });
  }
});

router.get('/predictions/:raceId', async (req, res) => {
  try {
    const { raceId } = req.params;
    
    // Check if prediction exists in cache/database
    const predictionRef = db.collection('predictions').doc(`${raceId}:default`);
    const predictionDoc = await predictionRef.get();
    
    if (predictionDoc.exists) {
      const prediction = predictionDoc.data();
      return res.json({
        success: true,
        data: prediction
      });
    }
    
    // If no prediction exists, return 404
    res.status(404).json({
      success: false,
      error: 'Prediction not found'
    });
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get prediction'
    });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { raceId, weather } = req.body;
    
    if (!raceId) {
      return res.status(400).json({
        success: false,
        error: 'Race ID is required'
      });
    }
    
    // Get race info
    const raceRef = db.collection('races').doc(raceId);
    const raceDoc = await raceRef.get();
    
    if (!raceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Race not found'
      });
    }
    
    const race = raceDoc.data();
    
    // Generate prediction (this would call your ML model)
    const prediction = await generatePrediction(race, weather);
    
    // Store prediction
    const cacheKey = weather ? `${raceId}:custom:${hashWeather(weather)}` : `${raceId}:default`;
    const predictionRef = db.collection('predictions').doc(cacheKey);
    await predictionRef.set(prediction);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Generate prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate prediction'
    });
  }
});

router.get('/weather', async (req, res) => {
  try {
    const { raceId } = req.query;
    
    if (!raceId) {
      return res.status(400).json({
        success: false,
        error: 'Race ID is required'
      });
    }
    
    // Get race info
    const raceRef = db.collection('races').doc(raceId);
    const raceDoc = await raceRef.get();
    
    if (!raceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Race not found'
      });
    }
    
    const race = raceDoc.data();
    
    // Get weather forecast for race day
    const weather = await getWeatherForecast(race);
    
    res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather'
    });
  }
});

// Helper functions
async function generatePrediction(race, weather) {
  // This is a stub - replace with your actual ML model
  const mockPrediction = {
    raceId: race.id,
    generatedAt: new Date().toISOString(),
    weatherUsed: weather || {
      date: race.startDate,
      tempC: 22,
      windKmh: 12,
      rainChancePct: 15,
      condition: 'Sunny'
    },
    top3: [
      {
        driverId: 'VER',
        driverName: 'Max Verstappen',
        team: 'Red Bull',
        grid: 'P1',
        predictedLapTime: 85.2,
        winProbPct: 35.0,
        podiumProbPct: 85.0,
        position: 1
      },
      {
        driverId: 'NOR',
        driverName: 'Lando Norris',
        team: 'McLaren',
        grid: 'P2',
        predictedLapTime: 85.8,
        winProbPct: 28.0,
        podiumProbPct: 78.0,
        position: 2
      },
      {
        driverId: 'PIA',
        driverName: 'Oscar Piastri',
        team: 'McLaren',
        grid: 'P3',
        predictedLapTime: 86.1,
        winProbPct: 22.0,
        podiumProbPct: 72.0,
        position: 3
      }
    ],
    all: [], // Would contain all 20 drivers
    modelStats: {
      accuracyPct: 87.3,
      meanErrorSec: 2.41,
      trees: 500,
      lr: 0.7
    }
  };
  
  return mockPrediction;
}

function hashWeather(weather) {
  if (!weather) return 'default';
  return `${weather.tempC}-${weather.windKmh}-${weather.rainChancePct}-${weather.condition}`;
}

async function getWeatherForecast(race) {
  // This is a stub - replace with your actual weather API call
  return {
    date: race.startDate,
    tempC: 22,
    windKmh: 12,
    rainChancePct: 15,
    condition: 'Sunny'
  };
}

export default router;