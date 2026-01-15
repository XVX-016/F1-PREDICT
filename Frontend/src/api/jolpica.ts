// API cache for better performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_DURATION = 10000; // 10 seconds

// Static fallback data for when API is completely unresponsive
const FALLBACK_DATA = {
  drivers: {
    MRData: {
      DriverTable: {
        Drivers: [
          { driverId: 'verstappen', givenName: 'Max', familyName: 'Verstappen', nationality: 'Dutch', dateOfBirth: '1997-09-30' },
          { driverId: 'norris', givenName: 'Lando', familyName: 'Norris', nationality: 'British', dateOfBirth: '1999-11-13' },
          { driverId: 'piastri', givenName: 'Oscar', familyName: 'Piastri', nationality: 'Australian', dateOfBirth: '2001-04-06' },
          { driverId: 'leclerc', givenName: 'Charles', familyName: 'Leclerc', nationality: 'Monegasque', dateOfBirth: '1997-10-16' },
          { driverId: 'sainz', givenName: 'Carlos', familyName: 'Sainz', nationality: 'Spanish', dateOfBirth: '1994-09-01' },
          { driverId: 'hamilton', givenName: 'Lewis', familyName: 'Hamilton', nationality: 'British', dateOfBirth: '1985-01-07' },
          { driverId: 'russell', givenName: 'George', familyName: 'Russell', nationality: 'British', dateOfBirth: '1998-02-15' },
          { driverId: 'alonso', givenName: 'Fernando', familyName: 'Alonso', nationality: 'Spanish', dateOfBirth: '1981-07-29' },
          { driverId: 'stroll', givenName: 'Lance', familyName: 'Stroll', nationality: 'Canadian', dateOfBirth: '1998-10-29' },
          { driverId: 'ocon', givenName: 'Esteban', familyName: 'Ocon', nationality: 'French', dateOfBirth: '1996-09-17' },
          { driverId: 'gasly', givenName: 'Pierre', familyName: 'Gasly', nationality: 'French', dateOfBirth: '1996-02-07' },
          { driverId: 'tsunoda', givenName: 'Yuki', familyName: 'Tsunoda', nationality: 'Japanese', dateOfBirth: '2000-05-11' },
          { driverId: 'albon', givenName: 'Alexander', familyName: 'Albon', nationality: 'Thai', dateOfBirth: '1996-03-23' },
          { driverId: 'bottas', givenName: 'Valtteri', familyName: 'Bottas', nationality: 'Finnish', dateOfBirth: '1989-08-28' },
          { driverId: 'zhou', givenName: 'Guanyu', familyName: 'Zhou', nationality: 'Chinese', dateOfBirth: '1999-05-30' },
          { driverId: 'magnussen', givenName: 'Kevin', familyName: 'Magnussen', nationality: 'Danish', dateOfBirth: '1992-10-05' },
          { driverId: 'ricciardo', givenName: 'Daniel', familyName: 'Ricciardo', nationality: 'Australian', dateOfBirth: '1989-07-01' },
          { driverId: 'lawson', givenName: 'Liam', familyName: 'Lawson', nationality: 'New Zealander', dateOfBirth: '2002-02-11' },
          { driverId: 'hulkenberg', givenName: 'Nico', familyName: 'Hülkenberg', nationality: 'German', dateOfBirth: '1987-08-19' },
          { driverId: 'sargeant', givenName: 'Logan', familyName: 'Sargeant', nationality: 'American', dateOfBirth: '2000-12-31' }
        ]
      }
    }
  },
  constructors: {
    MRData: {
      ConstructorTable: {
        Constructors: [
          { constructorId: 'red_bull', name: 'Red Bull Racing', nationality: 'Austrian' },
          { constructorId: 'mclaren', name: 'McLaren', nationality: 'British' },
          { constructorId: 'ferrari', name: 'Ferrari', nationality: 'Italian' },
          { constructorId: 'mercedes', name: 'Mercedes', nationality: 'German' },
          { constructorId: 'aston_martin', name: 'Aston Martin', nationality: 'British' },
          { constructorId: 'alpine', name: 'Alpine', nationality: 'French' },
          { constructorId: 'racing_bulls', name: 'Racing Bulls', nationality: 'Italian' },
          { constructorId: 'haas', name: 'Haas F1 Team', nationality: 'American' },
          { constructorId: 'williams', name: 'Williams', nationality: 'British' },
          { constructorId: 'sauber', name: 'Stake F1 Team Kick Sauber', nationality: 'Swiss' }
        ]
      }
    }
  },
  races: {
    MRData: {
      RaceTable: {
        Races: [
          { round: '1', raceName: 'Bahrain Grand Prix', circuit: { circuitName: 'Bahrain International Circuit', Location: { country: 'Bahrain', locality: 'Sakhir' } }, date: '2025-03-02' },
          { round: '2', raceName: 'Saudi Arabian Grand Prix', circuit: { circuitName: 'Jeddah Corniche Circuit', Location: { country: 'Saudi Arabia', locality: 'Jeddah' } }, date: '2025-03-09' },
          { round: '3', raceName: 'Australian Grand Prix', circuit: { circuitName: 'Albert Park Circuit', Location: { country: 'Australia', locality: 'Melbourne' } }, date: '2025-03-23' },
          { round: '4', raceName: 'Japanese Grand Prix', circuit: { circuitName: 'Suzuka International Racing Course', Location: { country: 'Japan', locality: 'Suzuka' } }, date: '2025-04-13' },
          { round: '5', raceName: 'Chinese Grand Prix', circuit: { circuitName: 'Shanghai International Circuit', Location: { country: 'China', locality: 'Shanghai' } }, date: '2025-04-20' },
          { round: '6', raceName: 'Miami Grand Prix', circuit: { circuitName: 'Miami International Autodrome', Location: { country: 'USA', locality: 'Miami' } }, date: '2025-05-04' },
          { round: '7', raceName: 'Emilia Romagna Grand Prix', circuit: { circuitName: 'Autodromo Enzo e Dino Ferrari', Location: { country: 'Italy', locality: 'Imola' } }, date: '2025-05-18' },
          { round: '8', raceName: 'Monaco Grand Prix', circuit: { circuitName: 'Circuit de Monaco', Location: { country: 'Monaco', locality: 'Monte-Carlo' } }, date: '2025-05-25' },
          { round: '9', raceName: 'Spanish Grand Prix', circuit: { circuitName: 'Circuit de Barcelona-Catalunya', Location: { country: 'Spain', locality: 'Montmeló' } }, date: '2025-06-01' },
          { round: '10', raceName: 'Canadian Grand Prix', circuit: { circuitName: 'Circuit Gilles Villeneuve', Location: { country: 'Canada', locality: 'Montreal' } }, date: '2025-06-15' },
          { round: '11', raceName: 'Austrian Grand Prix', circuit: { circuitName: 'Red Bull Ring', Location: { country: 'Austria', locality: 'Spielberg' } }, date: '2025-06-29' },
          { round: '12', raceName: 'British Grand Prix', circuit: { circuitName: 'Silverstone Circuit', Location: { country: 'UK', locality: 'Silverstone' } }, date: '2025-07-06' },
          { round: '13', raceName: 'Hungarian Grand Prix', circuit: { circuitName: 'Hungaroring', Location: { country: 'Hungary', locality: 'Budapest' } }, date: '2025-07-27' },
          { round: '14', raceName: 'Belgian Grand Prix', circuit: { circuitName: 'Circuit de Spa-Francorchamps', Location: { country: 'Belgium', locality: 'Spa' } }, date: '2025-08-03' },
          { round: '15', raceName: 'Dutch Grand Prix', circuit: { circuitName: 'Circuit Zandvoort', Location: { country: 'Netherlands', locality: 'Zandvoort' } }, date: '2025-08-31' },
          { round: '16', raceName: 'Italian Grand Prix', circuit: { circuitName: 'Autodromo Nazionale Monza', Location: { country: 'Italy', locality: 'Monza' } }, date: '2025-09-07' },
          { round: '17', raceName: 'Azerbaijan Grand Prix', circuit: { circuitName: 'Baku City Circuit', Location: { country: 'Azerbaijan', locality: 'Baku' } }, date: '2025-09-21' },
          { round: '18', raceName: 'Singapore Grand Prix', circuit: { circuitName: 'Marina Bay Street Circuit', Location: { country: 'Singapore', locality: 'Marina Bay' } }, date: '2025-10-05' },
          { round: '19', raceName: 'United States Grand Prix', circuit: { circuitName: 'Circuit of the Americas', Location: { country: 'USA', locality: 'Austin' } }, date: '2025-10-19' },
          { round: '20', raceName: 'Mexican Grand Prix', circuit: { circuitName: 'Autódromo Hermanos Rodríguez', Location: { country: 'Mexico', locality: 'Mexico City' } }, date: '2025-10-26' },
          { round: '21', raceName: 'Brazilian Grand Prix', circuit: { circuitName: 'Autódromo José Carlos Pace', Location: { country: 'Brazil', locality: 'São Paulo' } }, date: '2025-11-09' },
          { round: '22', raceName: 'Las Vegas Grand Prix', circuit: { circuitName: 'Las Vegas Strip Circuit', Location: { country: 'USA', locality: 'Las Vegas' } }, date: '2025-11-23' },
          { round: '23', raceName: 'Qatar Grand Prix', circuit: { circuitName: 'Lusail International Circuit', Location: { country: 'Qatar', locality: 'Lusail' } }, date: '2025-11-30' },
          { round: '24', raceName: 'Abu Dhabi Grand Prix', circuit: { circuitName: 'Yas Marina Circuit', Location: { country: 'UAE', locality: 'Abu Dhabi' } }, date: '2025-12-07' }
        ]
      }
    }
  }
};

// Helper function to create a timeout promise
const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
};

// Helper function to fetch with timeout and retry
const fetchWithTimeout = async (url: string, retries = 2): Promise<any> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

      const response = await Promise.race([
        fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        createTimeout(TIMEOUT_DURATION)
      ]) as Response;

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`Jolpica API attempt ${attempt + 1} failed for ${url}:`, error);

      if (attempt === retries) {
        // Final attempt fallback: use Ergast directly if Jolpica fails
        if (url.includes('api.jolpi.ca/ergast')) {
          try {
            const ergastUrl = url
              .replace('https://api.jolpi.ca/ergast/f1', 'https://ergast.com/api/f1')
              .replace(/(\/?)(drivers|constructors|races|results|driverstandings|constructorstandings)(\/?)(.*)$/i, '/$2$3$4.json');
            console.warn(`Falling back to Ergast: ${ergastUrl}`);
            const res = await fetch(ergastUrl, { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
              const json = await res.json();
              return json;
            }
          } catch (fallbackErr) {
            console.warn('Ergast fallback failed:', fallbackErr);
          }
        }
        throw new Error(`Failed to fetch data after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Helper function to get cached data or fetch new data
const getCachedOrFetch = async (key: string, fetchFn: () => Promise<any>, fallbackKey?: string) => {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached data for ${key}`);
    return cached.data;
  }

  try {
    console.log(`Fetching fresh data for ${key}`);
    const data = await fetchFn();
    cache.set(key, { data, timestamp: now });
    return data;
  } catch (error) {
    // If fetch fails, return cached data even if expired
    if (cached) {
      console.warn(`Fetch failed for ${key}, using expired cached data`);
      return cached.data;
    }

    // If no cached data and fallback key provided, use static fallback data
    if (fallbackKey && FALLBACK_DATA[fallbackKey as keyof typeof FALLBACK_DATA]) {
      console.warn(`API completely failed for ${key}, using static fallback data`);
      return FALLBACK_DATA[fallbackKey as keyof typeof FALLBACK_DATA];
    }

    throw error;
  }
};

import { ENV_CONFIG } from '../config/environment';

const BASE_URL = `${ENV_CONFIG.JOLPICA_BASE_URL}/2025`;

// Jolpica API functions (now serving as fallback to FastF1)
export const getDrivers = async () => {
  return getCachedOrFetch('drivers', () => fetchWithTimeout(`${BASE_URL}/drivers`), 'drivers');
};

export const getConstructors = async () => {
  return getCachedOrFetch('constructors', () => fetchWithTimeout(`${BASE_URL}/constructors`), 'constructors');
};

export const getRaces = async () => {
  return getCachedOrFetch('races', () => fetchWithTimeout(`${BASE_URL}/races`), 'races');
};

export const getResults = async (round?: number) => {
  const url = round ? `${BASE_URL}/${round}/results` : `${BASE_URL}/results`;
  const key = round ? `results-${round}` : 'results';
  return getCachedOrFetch(key, () => fetchWithTimeout(url));
};

export const getDriverStandings = async () => {
  return getCachedOrFetch('driver-standings', () => fetchWithTimeout(`${BASE_URL}/driverstandings`));
};

export const getConstructorStandings = async () => {
  return getCachedOrFetch('constructor-standings', () => fetchWithTimeout(`${BASE_URL}/constructorstandings`));
};

// Add more as needed (sprint, qualifying, pitstop, lap, status) 

// Archive API functions with improved error handling
export const getArchiveRaces = async (year: number) => {
  const key = `archive-races-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${ENV_CONFIG.JOLPICA_BASE_URL}/${year}/races?limit=100`));
};

export const getArchiveResults = async (year: number, round?: number) => {
  const url = round
    ? `${ENV_CONFIG.JOLPICA_BASE_URL}/${year}/${round}/results?limit=100`
    : `${ENV_CONFIG.JOLPICA_BASE_URL}/${year}/results?limit=1000`;
  const key = round ? `archive-results-${year}-${round}` : `archive-results-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(url));
};

export const getArchiveDriverStandings = async (year: number) => {
  const key = `archive-driver-standings-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${ENV_CONFIG.JOLPICA_BASE_URL}/${year}/driverstandings?limit=100`));
};

export const getArchiveConstructorStandings = async (year: number) => {
  const key = `archive-constructor-standings-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${ENV_CONFIG.JOLPICA_BASE_URL}/${year}/constructorstandings?limit=100`));
};

// Utility function to clear cache
export const clearCache = () => {
  cache.clear();
  console.log('API cache cleared');
};

// Utility function to get cache stats
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
};

// Utility function to preload cache with fallback data
export const preloadFallbackData = () => {
  const now = Date.now();
  console.log('Preloading fallback data into cache...');

  // Preload with fallback data that will be used if API fails
  Object.entries(FALLBACK_DATA).forEach(([key, data]) => {
    cache.set(key, { data, timestamp: now - CACHE_DURATION - 1 }); // Mark as expired so it will try API first
  });

  console.log('Fallback data preloaded successfully');
};

// Utility function to check if we're using fallback data
export const isUsingFallbackData = (key: string) => {
  const cached = cache.get(key);
  if (!cached) return false;

  // Check if the cached data matches our fallback data
  const fallbackData = FALLBACK_DATA[key as keyof typeof FALLBACK_DATA];
  if (!fallbackData) return false;

  return JSON.stringify(cached.data) === JSON.stringify(fallbackData);
};

// Utility function to get API health status
export const getApiHealthStatus = async () => {
  try {
    const startTime = Date.now();
    await fetchWithTimeout(`${BASE_URL}/drivers`, 1); // Single attempt with short timeout
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize the API with fallback data
export const initializeJolpicaApi = () => {
  console.log('Initializing Jolpica API with fallback data...');
  preloadFallbackData();

  // Test API health on initialization
  getApiHealthStatus().then(health => {
    console.log('Jolpica API Health Check:', health);
  }).catch(error => {
    console.warn('Failed to check Jolpica API health:', error);
  });
}; 