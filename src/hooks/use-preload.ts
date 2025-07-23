import { useCallback } from 'react';

// Store preloaded components to avoid duplicate loading
const preloadedComponents = new Set<string>();

export const usePreload = () => {
  const preloadComponent = useCallback((importFunction: () => Promise<any>, key: string) => {
    if (preloadedComponents.has(key)) {
      return; // Already preloaded
    }
    
    preloadedComponents.add(key);
    
    // Preload the component
    importFunction().catch(() => {
      // If preload fails, remove from set so it can be retried
      preloadedComponents.delete(key);
    });
  }, []);

  return { preloadComponent };
};

// Simple preload functions for high-traffic routes only
export const preloadRoutes = {
  // Only preload routes that are commonly accessed
  library: () => import('@/pages/Library'),
  agora: () => import('@/pages/Agora'),
}; 