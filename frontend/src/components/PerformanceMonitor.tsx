// Performance Monitor Component for CineBook
// Provides real-time performance monitoring and optimization insights

import React, { useState, useEffect, useCallback } from 'react';
import { apiCacheService } from '../services/ApiCacheService';

export interface PerformanceMetrics {
  pageLoadTime: number;
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  memoryUsage: number;
  cacheHitRate: number;
  apiLatency: number;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  enableReporting: boolean;
  reportingEndpoint?: string;
  sampleRate: number; // 0-1, percentage of sessions to monitor
  thresholds: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

interface PerformanceMonitorProps {
  config?: Partial<PerformanceConfig>;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  children?: React.ReactNode;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableMonitoring: true,
  enableReporting: false,
  sampleRate: 0.1, // Monitor 10% of sessions
  thresholds: {
    lcp: 2500, // 2.5 seconds
    fid: 100,  // 100 milliseconds
    cls: 0.1   // 0.1 units
  }
};

export function PerformanceMonitor({ 
  config = {}, 
  onMetricsUpdate,
  children 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize performance monitoring
  useEffect(() => {
    if (!finalConfig.enableMonitoring || Math.random() > finalConfig.sampleRate) {
      return;
    }

    setIsMonitoring(true);
    const cleanup = initializePerformanceMonitoring();
    
    return cleanup;
  }, [finalConfig]);

  // Initialize performance monitoring
  const initializePerformanceMonitoring = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      processPerformanceEntries(entries);
    });

    // Observe different types of performance entries
    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }

    // Monitor memory usage
    const memoryTimer = setInterval(monitorMemoryUsage, 30000); // Every 30 seconds

    // Monitor cache performance
    const cacheTimer = setInterval(monitorCachePerformance, 60000); // Every minute

    // Initial metrics collection
    setTimeout(collectInitialMetrics, 1000);

    return () => {
      observer.disconnect();
      clearInterval(memoryTimer);
      clearInterval(cacheTimer);
    };
  }, []);

  // Process performance entries
  const processPerformanceEntries = (entries: PerformanceEntry[]) => {
    const newMetrics: Partial<PerformanceMetrics> = {};

    entries.forEach(entry => {
      switch (entry.entryType) {
        case 'navigation':
          const navEntry = entry as PerformanceNavigationTiming;
          newMetrics.pageLoadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          newMetrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          break;

        case 'paint':
          if (entry.name === 'first-contentful-paint') {
            newMetrics.fcp = entry.startTime;
          }
          break;

        case 'largest-contentful-paint':
          newMetrics.lcp = entry.startTime;
          break;

        case 'first-input':
          const fidEntry = entry as PerformanceEventTiming;
          newMetrics.fid = fidEntry.processingStart - fidEntry.startTime;
          break;

        case 'layout-shift':
          const clsEntry = entry as any; // LayoutShift not in standard types
          if (!clsEntry.hadRecentInput) {
            newMetrics.cls = (newMetrics.cls || 0) + clsEntry.value;
          }
          break;
      }
    });

    updateMetrics(newMetrics);
  };

  // Collect initial metrics
  const collectInitialMetrics = () => {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navTiming) {
      const initialMetrics: Partial<PerformanceMetrics> = {
        pageLoadTime: navTiming.loadEventEnd - navTiming.loadEventStart,
        ttfb: navTiming.responseStart - navTiming.requestStart,
      };

      // Get paint timings
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          initialMetrics.fcp = entry.startTime;
        }
      });

      updateMetrics(initialMetrics);
    }
  };

  // Monitor memory usage
  const monitorMemoryUsage = () => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
      updateMetrics({ memoryUsage });
    }
  };

  // Monitor cache performance
  const monitorCachePerformance = () => {
    const cacheStats = apiCacheService.getCacheStats();
    const cacheHitRate = cacheStats.hitRate || 0;
    updateMetrics({ cacheHitRate });
  };

  // Update metrics state
  const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics } as PerformanceMetrics;
      
      // Call callback if provided
      onMetricsUpdate?.(updated);
      
      // Report metrics if enabled
      if (finalConfig.enableReporting) {
        reportMetrics(updated);
      }
      
      return updated;
    });
  };

  // Report metrics to analytics endpoint
  const reportMetrics = async (metrics: PerformanceMetrics) => {
    if (!finalConfig.reportingEndpoint) return;

    try {
      await fetch(finalConfig.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metrics,
          thresholds: finalConfig.thresholds
        })
      });
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  };

  // Performance status indicator
  const getPerformanceStatus = () => {
    if (!metrics) return 'loading';

    const { lcp, fid, cls } = finalConfig.thresholds;
    
    if (metrics.lcp > lcp || metrics.fid > fid || metrics.cls > cls) {
      return 'poor';
    }
    
    if (metrics.lcp > lcp * 0.8 || metrics.fid > fid * 0.8 || metrics.cls > cls * 0.8) {
      return 'needs-improvement';
    }
    
    return 'good';
  };

  if (!isMonitoring) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDebugPanel 
          metrics={metrics} 
          status={getPerformanceStatus()}
          config={finalConfig}
        />
      )}
    </>
  );
}

// Debug panel for development
interface PerformanceDebugPanelProps {
  metrics: PerformanceMetrics | null;
  status: string;
  config: PerformanceConfig;
}

function PerformanceDebugPanel({ metrics, status, config }: PerformanceDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metrics) {
    return (
      <div className="performance-debug-panel loading">
        <div className="performance-indicator">⚡ Loading...</div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'good': return '#10b981';
      case 'needs-improvement': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatMetric = (value: number, unit: string) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(unit === 'ms' ? 0 : 2)}${unit}`;
  };

  return (
    <div className="performance-debug-panel">
      <div 
        className="performance-indicator"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ backgroundColor: getStatusColor() }}
      >
        ⚡ {status.toUpperCase()}
      </div>
      
      {isExpanded && (
        <div className="performance-details">
          <div className="performance-section">
            <h4>Core Web Vitals</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="label">LCP:</span>
                <span className={`value ${metrics.lcp > config.thresholds.lcp ? 'poor' : 'good'}`}>
                  {formatMetric(metrics.lcp, 'ms')}
                </span>
              </div>
              <div className="metric">
                <span className="label">FID:</span>
                <span className={`value ${metrics.fid > config.thresholds.fid ? 'poor' : 'good'}`}>
                  {formatMetric(metrics.fid, 'ms')}
                </span>
              </div>
              <div className="metric">
                <span className="label">CLS:</span>
                <span className={`value ${metrics.cls > config.thresholds.cls ? 'poor' : 'good'}`}>
                  {formatMetric(metrics.cls, '')}
                </span>
              </div>
            </div>
          </div>

          <div className="performance-section">
            <h4>Loading Performance</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="label">Page Load:</span>
                <span className="value">{formatMetric(metrics.pageLoadTime, 'ms')}</span>
              </div>
              <div className="metric">
                <span className="label">TTFB:</span>
                <span className="value">{formatMetric(metrics.ttfb, 'ms')}</span>
              </div>
              <div className="metric">
                <span className="label">FCP:</span>
                <span className="value">{formatMetric(metrics.fcp, 'ms')}</span>
              </div>
            </div>
          </div>

          <div className="performance-section">
            <h4>Resource Usage</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="label">Memory:</span>
                <span className="value">{formatMetric(metrics.memoryUsage * 100, '%')}</span>
              </div>
              <div className="metric">
                <span className="label">Cache Hit Rate:</span>
                <span className="value">{formatMetric(metrics.cacheHitRate * 100, '%')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-debug-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          font-family: monospace;
          font-size: 12px;
        }
        
        .performance-indicator {
          background: #6b7280;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          user-select: none;
        }
        
        .performance-details {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-top: 8px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 250px;
        }
        
        .performance-section {
          margin-bottom: 12px;
        }
        
        .performance-section:last-child {
          margin-bottom: 0;
        }
        
        .performance-section h4 {
          margin: 0 0 6px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: bold;
        }
        
        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .metric .label {
          color: #374151;
        }
        
        .metric .value {
          font-weight: bold;
        }
        
        .metric .value.good {
          color: #10b981;
        }
        
        .metric .value.poor {
          color: #ef4444;
        }
        
        .loading {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

// Hook for performance monitoring
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const startMonitoring = useCallback(() => {
    // This would integrate with the PerformanceMonitor component
    console.log('Performance monitoring started');
  }, []);

  const getWebVitals = useCallback(() => {
    if (!metrics) return null;
    
    return {
      lcp: metrics.lcp,
      fid: metrics.fid,
      cls: metrics.cls
    };
  }, [metrics]);

  return {
    metrics,
    startMonitoring,
    getWebVitals
  };
}

export default PerformanceMonitor;