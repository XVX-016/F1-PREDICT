import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, writeBatch } from 'firebase/firestore';
import { getDrivers, getRaces, getArchiveRaces, getResults, getDriverStandings, getConstructorStandings } from '../src/api/jolpica';
import { firebaseConfig, validateConfig } from './config';

// Validate configuration
validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Driver {
  driverId: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  constructorId?: string;
  constructorName?: string;
}

interface Race {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time: string;
}

interface Result {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructors: Array<{
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  }>;
}

interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
}

async function seedFirebase() {
  try {
    console.log('🚀 Starting Firebase database seeding...');
    
    // Fetch data from Jolpica API
    console.log('📡 Fetching data from Jolpica API...');
    
    const [driversData, racesData, archiveRacesData] = await Promise.all([
      getDrivers(),
      getRaces(),
      getArchiveRaces(2024)
    ]);
    
    console.log(`✅ Fetched ${driversData.MRData?.DriverTable?.Drivers?.length || 0} drivers`);
    console.log(`✅ Fetched ${racesData.MRData?.RaceTable?.Races?.length || 0} races`);
    console.log(`✅ Fetched ${archiveRacesData.MRData?.RaceTable?.Races?.length || 0} archive races`);
    
    const drivers = driversData.MRData?.DriverTable?.Drivers || [];
    const races = racesData.MRData?.RaceTable?.Races || [];
    const archiveRaces = archiveRacesData.MRData?.RaceTable?.Races || [];
    
    // Create batch for efficient writes
    const batch = writeBatch(db);
    
    // Seed drivers
    console.log('👥 Seeding drivers...');
    for (const driver of drivers) {
      const driverRef = doc(db, 'drivers', driver.driverId);
      const driverData = {
        ...driver,
        fullName: `${driver.givenName} ${driver.familyName}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      batch.set(driverRef, driverData);
    }
    
    // Seed races
    console.log('🏁 Seeding races...');
    for (const race of races) {
      const raceRef = doc(db, 'races', `${race.season}_${race.round}`);
      const raceData = {
        ...race,
        raceId: `${race.season}_${race.round}`,
        season: parseInt(race.season),
        round: parseInt(race.round),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      batch.set(raceRef, raceData);
    }
    
    // Seed archive races
    console.log('📚 Seeding archive races...');
    for (const race of archiveRaces) {
      const raceRef = doc(db, 'archive_races', `${race.season}_${race.round}`);
      const raceData = {
        ...race,
        raceId: `${race.season}_${race.round}`,
        season: parseInt(race.season),
        round: parseInt(race.round),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      batch.set(raceRef, raceData);
    }
    
    // Fetch and seed results for each race
    console.log('🏆 Seeding race results...');
    const allRaces = [...races, ...archiveRaces];
    
    for (const race of allRaces.slice(0, 10)) { // Limit to first 10 races to avoid rate limiting
      try {
        const resultsData = await getResults(race.season, race.round);
        const results = resultsData.MRData?.RaceTable?.Races?.[0]?.Results || [];
        
        for (const result of results) {
          const resultRef = doc(db, 'results', `${race.season}_${race.round}_${result.Driver.driverId}`);
          const resultData = {
            ...result,
            raceId: `${race.season}_${race.round}`,
            season: parseInt(race.season),
            round: parseInt(race.round),
            driverId: result.Driver.driverId,
            constructorId: result.Constructor.constructorId,
            position: parseInt(result.position) || 0,
            points: parseFloat(result.points) || 0,
            grid: parseInt(result.grid) || 0,
            laps: parseInt(result.laps) || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          batch.set(resultRef, resultData);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`⚠️ Failed to fetch results for ${race.season} ${race.raceName}:`, error);
      }
    }
    
    // Fetch and seed driver standings
    console.log('📊 Seeding driver standings...');
    try {
      const driverStandingsData = await getDriverStandings();
      const driverStandings = driverStandingsData.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
      
      for (const standing of driverStandings) {
        const standingRef = doc(db, 'driver_standings', `${standing.Driver.driverId}_${new Date().getFullYear()}`);
        const standingData = {
          ...standing,
          driverId: standing.Driver.driverId,
          season: new Date().getFullYear(),
          position: parseInt(standing.position) || 0,
          points: parseFloat(standing.points) || 0,
          wins: parseInt(standing.wins) || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        batch.set(standingRef, standingData);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch driver standings:', error);
    }
    
    // Fetch and seed constructor standings
    console.log('🏭 Seeding constructor standings...');
    try {
      const constructorStandingsData = await getConstructorStandings();
      const constructorStandings = constructorStandingsData.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
      
      for (const standing of constructorStandings) {
        const standingRef = doc(db, 'constructor_standings', `${standing.Constructor.constructorId}_${new Date().getFullYear()}`);
        const standingData = {
          ...standing,
          constructorId: standing.Constructor.constructorId,
          season: new Date().getFullYear(),
          position: parseInt(standing.position) || 0,
          points: parseFloat(standing.points) || 0,
          wins: parseInt(standing.wins) || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        batch.set(standingRef, standingData);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch constructor standings:', error);
    }
    
    // Commit all writes
    console.log('💾 Committing batch writes...');
    await batch.commit();
    
    console.log('✅ Firebase database seeding completed successfully!');
    console.log(`📊 Seeded data:`);
    console.log(`   - Drivers: ${drivers.length}`);
    console.log(`   - Races: ${races.length}`);
    console.log(`   - Archive Races: ${archiveRaces.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding Firebase database:', error);
    throw error;
  }
}

// Run the seeding function
seedFirebase()
  .then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

export { seedFirebase };
