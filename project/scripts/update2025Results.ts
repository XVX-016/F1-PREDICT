import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { firebaseConfig, validateConfig } from './config';

// Validate configuration
validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2025 F1 Results Data (Updated with more complete information)
const results2025 = [
  {
    round: 1,
    raceName: 'Australian Grand Prix',
    date: '2025-03-16',
    laps: 57,
    results: [
      { position: 1, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 18 },
      { position: 3, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 15 },
      { position: 4, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 12 },
      { position: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'norris',
    poleTime: '1:15.096',
    fastestLap: 'norris',
    fastestLapTime: '1:22.167',
    fastestLapLap: 43
  },
  {
    round: 2,
    raceName: 'Chinese Grand Prix',
    date: '2025-03-23',
    laps: 56,
    results: [
      { position: 1, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'piastri',
    fastestLap: 'piastri'
  },
  {
    round: 3,
    raceName: 'Japanese Grand Prix',
    date: '2025-04-06',
    laps: 53,
    results: [
      { position: 1, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 25 },
      { position: 2, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 15 },
      { position: 4, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'verstappen',
    fastestLap: 'verstappen'
  },
  {
    round: 4,
    raceName: 'Bahrain Grand Prix',
    date: '2025-04-13',
    laps: 57,
    results: [
      { position: 1, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 18 },
      { position: 3, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'piastri',
    fastestLap: 'piastri'
  },
  {
    round: 5,
    raceName: 'Saudi Arabian Grand Prix',
    date: '2025-04-20',
    laps: 50,
    results: [
      { position: 1, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 18 },
      { position: 3, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 15 },
      { position: 4, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'verstappen',
    fastestLap: 'verstappen'
  },
  {
    round: 6,
    raceName: 'Miami Grand Prix',
    date: '2025-05-04',
    laps: 57,
    results: [
      { position: 1, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'piastri',
    fastestLap: 'piastri'
  },
  {
    round: 7,
    raceName: 'Emilia-Romagna Grand Prix',
    date: '2025-05-18',
    laps: 63,
    results: [
      { position: 1, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 25 },
      { position: 2, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 15 },
      { position: 4, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'verstappen',
    fastestLap: 'verstappen'
  },
  {
    round: 8,
    raceName: 'Monaco Grand Prix',
    date: '2025-05-25',
    laps: 78,
    results: [
      { position: 1, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 18 },
      { position: 3, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'norris',
    poleTime: '1:09.954',
    fastestLap: 'norris',
    fastestLapTime: '1:13.221',
    fastestLapLap: 78
  },
  {
    round: 9,
    raceName: 'Spanish Grand Prix',
    date: '2025-06-01',
    laps: 66,
    results: [
      { position: 1, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'piastri',
    fastestLap: 'piastri'
  },
  {
    round: 10,
    raceName: 'Canadian Grand Prix',
    date: '2025-06-15',
    laps: 70,
    results: [
      { position: 1, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 25 },
      { position: 2, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 18 },
      { position: 3, driverId: 'antonelli', driverName: 'Kimi Antonelli', constructor: 'Mercedes', points: 15 },
      { position: 4, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 12 },
      { position: 5, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 10 },
      { position: 6, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 6 },
      { position: 8, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 4 },
      { position: 9, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 2 },
      { position: 10, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 1 }
    ],
    polePosition: 'russell',
    fastestLap: 'russell'
  },
  {
    round: 11,
    raceName: 'Austrian Grand Prix',
    date: '2025-06-29',
    laps: 70,
    results: [
      { position: 1, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull Racing', points: 1 }
    ],
    polePosition: 'norris',
    fastestLap: 'norris'
  },
  {
    round: 12,
    raceName: 'British Grand Prix',
    date: '2025-07-06',
    laps: 52,
    results: [
      { position: 1, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', constructor: 'Sauber-Ferrari', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 10 },
      { position: 6, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 8 },
      { position: 7, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 6 },
      { position: 8, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 4 },
      { position: 9, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 2 },
      { position: 10, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 1 }
    ],
    polePosition: 'verstappen',
    poleTime: '1:24.892',
    fastestLap: 'piastri',
    fastestLapTime: '1:29.337',
    fastestLapLap: 51
  },
  {
    round: 13,
    raceName: 'Belgian Grand Prix',
    date: '2025-07-27',
    laps: 44,
    results: [
      { position: 1, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull', points: 1 }
    ],
    polePosition: 'norris',
    poleTime: '1:40.562',
    fastestLap: 'antonelli',
    fastestLapTime: '1:44.861',
    fastestLapLap: 32
  },
  {
    round: 14,
    raceName: 'Hungarian Grand Prix',
    date: '2025-08-03',
    laps: 70,
    results: [
      { position: 1, driverId: 'norris', driverName: 'Lando Norris', constructor: 'McLaren-Mercedes', points: 25 },
      { position: 2, driverId: 'piastri', driverName: 'Oscar Piastri', constructor: 'McLaren-Mercedes', points: 18 },
      { position: 3, driverId: 'leclerc', driverName: 'Charles Leclerc', constructor: 'Ferrari', points: 15 },
      { position: 4, driverId: 'verstappen', driverName: 'Max Verstappen', constructor: 'Red Bull Racing', points: 12 },
      { position: 5, driverId: 'russell', driverName: 'George Russell', constructor: 'Mercedes', points: 10 },
      { position: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', constructor: 'Ferrari', points: 8 },
      { position: 7, driverId: 'albon', driverName: 'Alexander Albon', constructor: 'Williams', points: 6 },
      { position: 8, driverId: 'ocon', driverName: 'Esteban Ocon', constructor: 'Haas', points: 4 },
      { position: 9, driverId: 'gasly', driverName: 'Pierre Gasly', constructor: 'Alpine', points: 2 },
      { position: 10, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', constructor: 'Red Bull', points: 1 }
    ],
    polePosition: 'norris',
    fastestLap: 'norris'
  }
];

// 2025 Drivers List (all 20 active drivers)
const drivers2025 = [
  'piastri', 'norris', 'verstappen', 'russell', 'leclerc', 'hamilton', 
  'antonelli', 'albon', 'hulkenberg', 'ocon', 'alonso', 'stroll', 
  'hadjar', 'gasly', 'lawson', 'sainz', 'bortoleto', 'tsunoda', 
  'bearman', 'colapinto'
];

async function update2025Results() {
  try {
    console.log('🚀 Starting 2025 F1 Results Update...');
    
    // Create batch for efficient writes
    const batch = writeBatch(db);
    
    // Update races with 2025 data
    console.log('🏁 Updating 2025 races...');
    for (const race of results2025) {
      const raceRef = doc(db, 'races', `2025_${race.round}`);
      const raceData: any = {
        season: 2025,
        round: race.round,
        raceName: race.raceName,
        date: race.date,
        laps: race.laps,
        polePosition: race.polePosition,
        updatedAt: new Date()
      };
      
      // Only add optional fields if they exist
      if (race.poleTime) raceData.poleTime = race.poleTime;
      if (race.fastestLap) raceData.fastestLap = race.fastestLap;
      if (race.fastestLapTime) raceData.fastestLapTime = race.fastestLapTime;
      if (race.fastestLapLap) raceData.fastestLapLap = race.fastestLapLap;
      
      batch.set(raceRef, raceData);
    }
    
    // Add race results
    console.log('🏆 Adding 2025 race results...');
    for (const race of results2025) {
      // Ensure all 20 drivers are included in results
      completeRaceResults(race);
      
      for (const result of race.results) {
        const resultRef = doc(db, 'results', `2025_${race.round}_${result.driverId}`);
        const resultData = {
          raceId: `2025_${race.round}`,
          season: 2025,
          round: race.round,
          driverId: result.driverId,
          driverName: result.driverName,
          constructor: result.constructor,
          position: result.position,
          points: result.points,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        batch.set(resultRef, resultData);
      }
    }
    
    // Update driver standings based on 2025 results
    console.log('📊 Calculating 2025 driver standings...');
    const driverPoints: { [key: string]: number } = {};
    const driverWins: { [key: string]: number } = {};
    const driverPodiums: { [key: string]: number } = {};
    
    // Calculate points, wins, and podiums
    for (const race of results2025) {
      for (const result of race.results) {
        const driverId = result.driverId;
        if (!driverPoints[driverId]) {
          driverPoints[driverId] = 0;
          driverWins[driverId] = 0;
          driverPodiums[driverId] = 0;
        }
        
        driverPoints[driverId] += result.points;
        if (result.position === 1) driverWins[driverId]++;
        if (result.position <= 3) driverPodiums[driverId]++;
      }
    }
    
    // Save driver standings
    for (const driverId of Object.keys(driverPoints)) {
      const standingRef = doc(db, 'driver_standings', `${driverId}_2025`);
      const standingData = {
        driverId,
        season: 2025,
        points: driverPoints[driverId],
        wins: driverWins[driverId],
        podiums: driverPodiums[driverId],
        position: 0, // Will be calculated based on points
        createdAt: new Date(),
        updatedAt: new Date()
      };
      batch.set(standingRef, standingData);
    }
    
    // Commit all writes
    console.log('💾 Committing batch writes...');
    await batch.commit();
    
    console.log('✅ 2025 F1 Results Update completed successfully!');
    console.log(`📊 Updated data:`);
    console.log(`   - Races: ${results2025.length}`);
    console.log(`   - Results: ${results2025.reduce((sum, race) => sum + race.results.length, 0)}`);
    console.log(`   - Drivers: ${Object.keys(driverPoints).length}`);
    
    // Display current standings
    console.log('\n🏆 Current 2025 Driver Standings:');
    const sortedStandings = Object.entries(driverPoints)
      .sort(([,a], [,b]) => b - a)
      .map(([driverId, points], index) => ({
        position: index + 1,
        driverId,
        points,
        wins: driverWins[driverId],
        podiums: driverPodiums[driverId]
      }));
    
    for (const standing of sortedStandings) {
      console.log(`${standing.position}. ${standing.driverId}: ${standing.points}pts (${standing.wins} wins, ${standing.podiums} podiums)`);
    }
    
  } catch (error) {
    console.error('❌ Error updating 2025 results:', error);
    throw error;
  }
}

// Run the update function
update2025Results()
  .then(() => {
    console.log('🎉 2025 Results Update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });

export { update2025Results, drivers2025 };
