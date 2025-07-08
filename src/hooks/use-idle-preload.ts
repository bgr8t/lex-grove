import { useEffect } from 'react';

// Simple idle-time preloading for core routes
export const useIdlePreload = () => {
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const startIdlePreload = () => {
      // Wait 2 seconds of inactivity before preloading
      idleTimer = setTimeout(() => {
        // Only preload high-traffic routes that are likely to be visited
        const routesToPreload = [
          () => import('@/pages/Library'),
          () => import('@/pages/ResearchGrove'),
        ];
        
        // Preload one route every 500ms to avoid overwhelming the network
        routesToPreload.forEach((loadRoute, index) => {
          setTimeout(() => {
            loadRoute().catch(() => {
              // Fail silently - preloading is a performance enhancement
            });
          }, index * 500);
        });
      }, 2000);
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      startIdlePreload();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Start the initial timer
    startIdlePreload();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, []);
}; 