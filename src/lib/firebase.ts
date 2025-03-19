// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Helper function to get environment variables from either source
const getEnv = (key: string) => {
  // @ts-ignore - process.env might not be typed correctly
  return import.meta.env[key] || (typeof process !== 'undefined' && process.env && process.env[key]) || null;
};

// Log environment variables for debugging
console.log("Firebase config check:", {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') ? "defined" : "undefined",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') ? "defined" : "undefined",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') ? "defined" : "undefined"
});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

// Check for missing configuration
const missingConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
  
  // Fallback to hardcoded values for development ONLY
  if (import.meta.env.DEV) {
    console.warn("Using fallback Firebase configuration for development");
    
    // Direct configuration for your Firebase project (replace with your actual values)
    firebaseConfig.apiKey = "***REDACTED_FIREBASE_API_KEY***";
    firebaseConfig.authDomain = "***REDACTED_FIREBASE_AUTH_DOMAIN***";
    firebaseConfig.projectId = "live-car-nest";
    firebaseConfig.storageBucket = "***REDACTED_FIREBASE_STORAGE_BUCKET***";
    firebaseConfig.messagingSenderId = "***REDACTED_FIREBASE_SENDER_ID***";
    firebaseConfig.appId = "1:***REDACTED_FIREBASE_SENDER_ID***:web:3a72fbd05ab235ca7d4d05";
    firebaseConfig.measurementId = "***REDACTED_FIREBASE_MEASUREMENT_ID***";
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app; 