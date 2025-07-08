// Simple performance monitoring for navigation
class PerformanceMonitor {
  private navigationStart: number = 0;
  private isEnabled: boolean;

  constructor() {
    // Only enable in production to measure real performance
    this.isEnabled = import.meta.env.PROD;
  }

  startNavigation(route: string) {
    if (!this.isEnabled) return;
    
    this.navigationStart = performance.now();
    console.log(`🚀 Navigation started to: ${route}`);
  }

  endNavigation(route: string) {
    if (!this.isEnabled || !this.navigationStart) return;
    
    const duration = performance.now() - this.navigationStart;
    console.log(`✅ Navigation completed to: ${route} in ${duration.toFixed(2)}ms`);
    
    // Log slow navigations (>500ms) for optimization
    if (duration > 500) {
      console.warn(`⚠️ Slow navigation detected: ${route} took ${duration.toFixed(2)}ms`);
    }
    
    this.navigationStart = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-track route changes via URL monitoring
let currentPath = window.location.pathname;

const trackRouteChange = () => {
  const newPath = window.location.pathname;
  if (newPath !== currentPath) {
    performanceMonitor.endNavigation(currentPath);
    performanceMonitor.startNavigation(newPath);
    currentPath = newPath;
  }
};

// Monitor URL changes for performance tracking
if (typeof window !== 'undefined') {
  // Track initial load
  performanceMonitor.startNavigation(window.location.pathname);
  
  // Track route changes
  window.addEventListener('popstate', trackRouteChange);
  
  // Also track programmatic navigation via link clicks
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    trackRouteChange();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    trackRouteChange();
  };
} 