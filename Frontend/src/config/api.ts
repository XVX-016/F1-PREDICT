import { ENV_CONFIG } from './environment';

// API Configuration for F1 Prediction System
export const API_CONFIG = {
  // ML Service endpoints
  ML_SERVICE: {
    BASE_URL: ENV_CONFIG.ML_SERVICE_URL,
    HEALTH: '/health',
    PREDICTIONS: {
      LATEST: '/predictions/latest',
      BY_RACE: '/predictions/race',
    },
    BETTING: {
      MARKETS: '/betting/markets',
      PLACE: '/betting/place',
    },
    LIVE: {
      STATUS: '/live/status',
      RACE: '/live/race',
    },
    PROFILE: '/profile',
  },
  
  // Backend API endpoints
  BACKEND: {
    BASE_URL: ENV_CONFIG.BACKEND_URL,
    USERS: '/users',
    PROFILE: '/users/profile',
  },
  
  // Weather API
  WEATHER: {
    BASE_URL: 'https://api.weatherapi.com/v1',
    FORECAST: '/forecast.json',
  },
  
  // Jolpica F1 API (fallback)
  JOLPICA: {
    BASE_URL: ENV_CONFIG.JOLPICA_BASE_URL,
    DRIVERS: '/drivers',
    RACES: '/races',
  },
};

// Helper function to build full URLs
export const buildUrl = (base: string, endpoint: string, params?: Record<string, string>): string => {
  const url = new URL(endpoint, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

// Check if ML service is available
export const checkMLServiceHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${API_CONFIG.ML_SERVICE.BASE_URL}${API_CONFIG.ML_SERVICE.HEALTH}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('ML Service health check timed out');
    } else {
      console.warn('ML Service health check failed:', error);
    }
    return false;
  }
};
