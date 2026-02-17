// Environment configuration for F1 Prediction System
// This file provides default values and can be overridden by .env file

export const ENV_CONFIG = {
  // ML & Backend Service Configuration (standardized to use same base for simplicity if deployed together)
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://f1-predict.onrender.com',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'https://f1-predict.onrender.com',
  ML_SERVICE_URL: import.meta.env.VITE_ML_SERVICE_URL || import.meta.env.VITE_API_BASE_URL || 'https://f1-predict.onrender.com',
  SUPABASE_ASSETS_BASE: 'https://uivvxlorutmjgouporrv.supabase.co/storage/v1/object/public/assets',

  // ML Service Proxy (Vite dev server)
  ML_SERVICE_PROXY: import.meta.env.VITE_MODEL_SERVICE_PROXY || '/ml',

  // Weather API
  WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY || '',
  OPENWEATHER_API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY || '',

  // Local API Configuration (replaces external Jolpica API)
  JOLPICA_BASE_URL: import.meta.env.VITE_JOLPICA_BASE_URL || '/ergast/f1',
  FAST_F1_BASE_URL: import.meta.env.VITE_FAST_F1_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',

  // Feature Flags
  LIVE_DATA_ENABLED: import.meta.env.VITE_LIVE_DATA_ENABLED === 'true',
  USE_SAMPLE_PREDICTIONS: import.meta.env.VITE_USE_SAMPLE_PREDICTIONS === 'true',
  USE_LOCAL_ONLY: true,

  // ML Model Configuration
  ML_MODEL_ENABLED: import.meta.env.VITE_ML_MODEL_ENABLED !== 'false',
  ML_MODEL_UPDATE_INTERVAL: parseInt(import.meta.env.VITE_ML_MODEL_UPDATE_INTERVAL || '300000'),

  // WebSocket Configuration
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'wss://f1-predict.onrender.com/ws/live',
  WEBSOCKET_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_ATTEMPTS || '5'),
  WEBSOCKET_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_INTERVAL || '1000'),
};

// Helper function to get environment variable with fallback
export const getEnvVar = (key: string, fallback: string = ''): string => {
  return (import.meta as any).env?.[key] || fallback;
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return (import.meta as any).env?.MODE === 'development';
};

// Helper function to check if we're in production mode
export const isProduction = (): boolean => {
  return (import.meta as any).env?.MODE === 'production';
};

// Helper function to check if local services are available
export const isLocalServicesAvailable = (): boolean => {
  return ENV_CONFIG.JOLPICA_BASE_URL.includes('localhost') || ENV_CONFIG.FAST_F1_BASE_URL.includes('localhost');
};

