// This file checks if environment variables are being loaded correctly
// You can import this file somewhere to see if variables are defined

import { checkEnvVars, secureLog } from './security';

// List of environment variables to check
const ENV_VARS_TO_CHECK = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PRICE_ID'
];

export function checkEnvVariables() {
  const envStatus = checkEnvVars(ENV_VARS_TO_CHECK);
  secureLog(envStatus);
}

// Check if running in development
const isDev = import.meta.env.MODE === 'development';
console.log('Running in development mode:', isDev);

// Testing initial load of env variables
checkEnvVariables(); 