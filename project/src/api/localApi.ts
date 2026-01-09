// Local API service for F1 data (replaces external Jolpica API calls)
// This service will connect to locally running Jolpica and Fast-F1 instances

// Use Vite dev server proxies to avoid CORS and port coupling
const LOCAL_BASE_URL = "/ergast/f1";
const FAST_F1_BASE_URL = "/fastf1";

// API cache for better performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_DURATION = 10000; // 10 seconds

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
      console.warn(`Local API attempt ${attempt + 1} failed for ${url}:`, error);
      
      if (attempt === retries) {
        // Final attempt: try Fast-F1 endpoint as fallback
        try {
          const fastF1Url = url
            .replace(LOCAL_BASE_URL, `${FAST_F1_BASE_URL}/api/f1`)
            .replace(/\/+$/, '');
          console.warn(`Falling back to Fast-F1: ${fastF1Url}`);
          const res = await fetch(fastF1Url, { headers: { 'Accept': 'application/json' } });
          if (res.ok) {
            const json = await res.json();
            return json;
          }
        } catch (fallbackErr) {
          console.warn('Fast-F1 fallback failed:', fallbackErr);
        }
        throw new Error(`Failed to fetch data after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Helper function to get cached data or fetch new data
const getCachedOrFetch = async (key: string, fetchFn: () => Promise<any>) => {
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
    throw error;
  }
};

// Local Jolpica API functions
export const getDrivers = async () => {
  return getCachedOrFetch('drivers', () => fetchWithTimeout(`${LOCAL_BASE_URL}/2025/drivers`));
};

export const getConstructors = async () => {
  return getCachedOrFetch('constructors', () => fetchWithTimeout(`${LOCAL_BASE_URL}/2025/constructors`));
};

export const getRaces = async () => {
  return getCachedOrFetch('races', () => fetchWithTimeout(`${LOCAL_BASE_URL}/2025/races`));
};

export const getResults = async (round?: number) => {
  const url = round ? `${LOCAL_BASE_URL}/2025/${round}/results` : `${LOCAL_BASE_URL}/2025/results`;
  const key = round ? `results-${round}` : 'results';
  return getCachedOrFetch(key, () => fetchWithTimeout(url));
};

export const getDriverStandings = async () => {
  return getCachedOrFetch('driver-standings', () => fetchWithTimeout(`${LOCAL_BASE_URL}/2025/driverstandings`));
};

export const getConstructorStandings = async () => {
  return getCachedOrFetch('constructor-standings', () => fetchWithTimeout(`${LOCAL_BASE_URL}/2025/constructorstandings`));
};

// Archive API functions
export const getArchiveRaces = async (year: number) => {
  const key = `archive-races-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${LOCAL_BASE_URL}/${year}/races`));
};

export const getArchiveResults = async (year: number, round?: number) => {
  const url = round ? `${LOCAL_BASE_URL}/${year}/${round}/results` : `${LOCAL_BASE_URL}/${year}/results`;
  const key = round ? `archive-results-${year}-${round}` : `archive-results-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(url));
};

export const getArchiveDriverStandings = async (year: number) => {
  const key = `archive-driver-standings-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${LOCAL_BASE_URL}/${year}/driverstandings`));
};

export const getArchiveConstructorStandings = async (year: number) => {
  const key = `archive-constructor-standings-${year}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${LOCAL_BASE_URL}/${year}/constructorstandings`));
};

// Fast-F1 specific endpoints
export const getFastF1Data = async (endpoint: string) => {
  const key = `fastf1-${endpoint}`;
  return getCachedOrFetch(key, () => fetchWithTimeout(`${FAST_F1_BASE_URL}/api/f1/${endpoint}`));
};

// Utility function to clear cache
export const clearCache = () => {
  cache.clear();
  console.log('Local API cache cleared');
};

// Utility function to get cache stats
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
};

// Health check for local services
export const checkLocalServices = async () => {
  try {
    const [jolpicaHealth, fastF1Health] = await Promise.allSettled([
      fetch(`${LOCAL_BASE_URL}/2025/drivers`),
      fetch(`${FAST_F1_BASE_URL}/health`)
    ]);
    
    return {
      jolpica: jolpicaHealth.status === 'fulfilled' && (jolpicaHealth as any).value.ok,
      fastF1: fastF1Health.status === 'fulfilled' && (fastF1Health as any).value.ok
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return { jolpica: false, fastF1: false };
  }
};
