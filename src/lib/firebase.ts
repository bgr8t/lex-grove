// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { requireEnvVar } from '../utils/security';

// Helper function to get environment variables from either source
const getEnv = (key: string) => {
  // @ts-ignore - process.env might not be typed correctly
  return import.meta.env[key] || (typeof process !== 'undefined' && process.env && process.env[key]) || null;
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: requireEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: requireEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// Check for missing configuration
const missingConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
  throw new Error('Missing required Firebase configuration. Please check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (import.meta.env.MODE === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default app; 