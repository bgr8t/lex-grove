// This file checks if environment variables are being loaded correctly
// You can import this file somewhere to see if variables are defined

export function checkEnvVariables() {
  console.log("Environment Variables Check:");
  console.log({
    "VITE_FIREBASE_API_KEY": import.meta.env.VITE_FIREBASE_API_KEY || "undefined",
    "VITE_FIREBASE_AUTH_DOMAIN": import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "undefined",
    "VITE_FIREBASE_PROJECT_ID": import.meta.env.VITE_FIREBASE_PROJECT_ID || "undefined",
    "NODE_ENV": import.meta.env.MODE || "undefined",
    "BASE_URL": import.meta.env.BASE_URL || "undefined",
  });
}

// Check if running in development
const isDev = import.meta.env.MODE === 'development';
console.log("Running in development mode:", isDev);

// Testing initial load of env variables
checkEnvVariables(); 