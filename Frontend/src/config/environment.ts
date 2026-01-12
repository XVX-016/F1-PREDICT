// Environment configuration for F1 Prediction System
// This file provides default values and can be overridden by .env file

export const ENV_CONFIG = {
  // ML Service Configuration
  ML_SERVICE_URL: (import.meta as any).env?.VITE_MODEL_SERVICE_URL || 'http://localhost:8000',
  ML_SERVICE_PROXY: (import.meta as any).env?.VITE_MODEL_SERVICE_PROXY || '/ml',

  // Backend Configuration
  BACKEND_URL: (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001',

  // API Configuration
  API_BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000',

  // Weather API
  WEATHER_API_KEY: (import.meta as any).env?.VITE_WEATHER_API_KEY || '',
  OPENWEATHER_API_KEY: (import.meta as any).env?.VITE_OPENWEATHER_API_KEY || '',

  // Firebase Configuration (placeholders)
  FIREBASE_API_KEY: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'your_api_key_here',
  FIREBASE_AUTH_DOMAIN: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'your_project.firebaseapp.com',
  FIREBASE_PROJECT_ID: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'your_project_id',
  FIREBASE_STORAGE_BUCKET: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'your_project.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || 'your_sender_id',
  FIREBASE_APP_ID: (import.meta as any).env?.VITE_FIREBASE_APP_ID || 'your_app_id',
  FIREBASE_MEASUREMENT_ID: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || 'your_measurement_id',

  // Local API Configuration (replaces external Jolpica API)
  JOLPICA_BASE_URL: (import.meta as any).env?.VITE_JOLPICA_BASE_URL || '/ergast/f1',
  FAST_F1_BASE_URL: (import.meta as any).env?.VITE_FAST_F1_BASE_URL || 'http://localhost:8000',

  // Feature Flags
  LIVE_DATA_ENABLED: (import.meta as any).env?.VITE_LIVE_DATA_ENABLED === 'true' ? true : false,
  USE_SAMPLE_PREDICTIONS: (import.meta as any).env?.VITE_USE_SAMPLE_PREDICTIONS === 'true', // default false - use XGBoost model
  USE_LOCAL_ONLY: true,

  // ML Model Configuration
  ML_MODEL_ENABLED: (import.meta as any).env?.VITE_ML_MODEL_ENABLED !== 'false', // default true
  ML_MODEL_UPDATE_INTERVAL: parseInt((import.meta as any).env?.VITE_ML_MODEL_UPDATE_INTERVAL || '300000'),

  // WebSocket Configuration
  WEBSOCKET_URL: (import.meta as any).env?.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws/live',
  WEBSOCKET_RECONNECT_ATTEMPTS: parseInt((import.meta as any).env?.VITE_WEBSOCKET_RECONNECT_ATTEMPTS || '5'),
  WEBSOCKET_RECONNECT_INTERVAL: parseInt((import.meta as any).env?.VITE_WEBSOCKET_RECONNECT_INTERVAL || '1000'),
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

