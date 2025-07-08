import { onCLS, onINP, onFCP, onLCP, onTTFB, type ReportCallback } from 'web-vitals';
import React from 'react';

// Performance thresholds based on Web Vitals recommendations
const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint  
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; needsImprovement: number };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private onMetricCallback?: (metric: PerformanceMetric) => void;

  constructor(onMetric?: (metric: PerformanceMetric) => void) {
    this.onMetricCallback = onMetric;
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    const reportMetric: ReportCallback = (metric) => {
      const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];
      if (!threshold) return;

      let rating: 'good' | 'needs-improvement' | 'poor';
      if (metric.value <= threshold.good) {
        rating = 'good';
      } else if (metric.value <= threshold.needsImprovement) {
        rating = 'needs-improvement';
      } else {
        rating = 'poor';
      }

      const performanceMetric: PerformanceMetric = {
        name: metric.name,
        value: metric.value,
        rating,
        threshold,
      };

      this.metrics.set(metric.name, performanceMetric);
      this.onMetricCallback?.(performanceMetric);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance Metric: ${metric.name}`, {
          value: metric.value,
          rating,
          threshold,
        });
      }
    };

    // Initialize all Web Vitals
    onCLS(reportMetric);
    onINP(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
  }

  getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Get overall performance score (0-100)
  getPerformanceScore(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Export metrics for analytics
  exportMetrics() {
    return Array.from(this.metrics.values()).map(metric => ({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    }));
  }
}

// Resource loading performance utilities
export const measureResourceTiming = () => {
  if (!window.performance || !window.performance.getEntriesByType) return;

  const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const resourceMetrics = entries.map(entry => ({
    name: entry.name,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    type: entry.initiatorType,
  }));

  // Find slow resources (>1000ms)
  const slowResources = resourceMetrics.filter(resource => resource.duration > 1000);
  
  if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('Slow resources detected:', slowResources);
  }

  return resourceMetrics;
};

// Bundle size analysis
export const analyzeBundleSize = () => {
  if (!window.performance || !window.performance.getEntriesByType) return;

  const navigationEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const resourceEntries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const jsResources = resourceEntries.filter(entry => 
    entry.name.includes('.js') || entry.initiatorType === 'script'
  );

  const cssResources = resourceEntries.filter(entry => 
    entry.name.includes('.css') || entry.initiatorType === 'css'
  );

  const totalJSSize = jsResources.reduce((total, resource) => total + (resource.transferSize || 0), 0);
  const totalCSSSize = cssResources.reduce((total, resource) => total + (resource.transferSize || 0), 0);

  return {
    totalJS: Math.round(totalJSSize / 1024), // KB
    totalCSS: Math.round(totalCSSSize / 1024), // KB
    jsFiles: jsResources.length,
    cssFiles: cssResources.length,
    navigation: navigationEntries[0],
  };
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
    };
  }
  return null;
};

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor((metric) => {
  // You can send metrics to analytics service here
  // Example: analytics.track('performance_metric', metric);
});

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = React.useState<Map<string, PerformanceMetric>>(new Map());
  const [performanceScore, setPerformanceScore] = React.useState<number>(0);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(new Map(performanceMonitor.getMetrics()));
      setPerformanceScore(performanceMonitor.getPerformanceScore());
    };

    // Initial update
    updateMetrics();

    // Update periodically
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    performanceScore,
    measureResourceTiming,
    analyzeBundleSize,
    monitorMemoryUsage,
  };
}; 