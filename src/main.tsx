import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkEnvVariables } from './utils/env-test'

// Check environment variables are loaded
checkEnvVariables()

// Initialize performance monitoring
import { performanceMonitor } from './utils/performance';

// Lazy load Firebase to reduce initial bundle size
const initializeFirebase = () => {
  import('./lib/firebase').catch(error => {
    console.error('Failed to initialize Firebase:', error);
  });
};

// Initialize Firebase after initial render
setTimeout(initializeFirebase, 0);

// Preload critical resources
const preloadCriticalResources = () => {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'font';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
};

// Start critical resource preloading
preloadCriticalResources();

// Enhanced error handling
const handleGlobalError = (error: ErrorEvent) => {
  console.error('Global error:', error);
  // You can send this to your error tracking service
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
  // You can send this to your error tracking service
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Render app with error boundary
const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

// Add loading class to body for initial styling
document.body.classList.add('loading');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove loading class after render
setTimeout(() => {
  document.body.classList.remove('loading');
}, 100);
