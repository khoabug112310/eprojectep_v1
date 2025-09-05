// API Cache Service for CineBook
// Handles intelligent caching and invalidation of API responses
import React from 'react'

import { apiCache, CacheManager } from '../utils/CacheManager';

export interface ApiCacheConfig {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  tags?: string[]; // Cache tags for invalidation
  versioning?: boolean;
  compression?: boolean;
}

export interface CacheInvalidationRule {
  pattern: string | RegExp;
  triggers: string[]; // Events that trigger invalidation
  dependencies?: string[]; // Related cache keys to invalidate
}

export interface ApiResponse<T = any> {
  data: T;
  timestamp: number;
  etag?: string;
  cacheHit: boolean;
  stale?: boolean;
}

class ApiCacheService {
  private cacheManager: CacheManager;
  private invalidationRules: Map<string, CacheInvalidationRule>;
  private pendingRequests: Map<string, Promise<any>>;

  constructor() {
    this.cacheManager = apiCache;
    this.invalidationRules = new Map();
    this.pendingRequests = new Map();
    this.setupDefaultInvalidationRules();
  }

  // Cache a GET request with intelligent invalidation
  async cacheRequest<T>(
    url: string,
    fetchFn: () => Promise<T>,
    config: ApiCacheConfig = {}
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey(url, config);
    
    // Check for pending request to avoid duplicate calls
    if (this.pendingRequests.has(cacheKey)) {
      const data = await this.pendingRequests.get(cacheKey);
      return {
        data,
        timestamp: Date.now(),
        cacheHit: false,
        stale: false
      };
    }

    // Try to get from cache first
    const cached = await this.cacheManager.get<T>(cacheKey);
    
    if (cached && !config.staleWhileRevalidate) {
      return {
        data: cached,
        timestamp: Date.now(),
        cacheHit: true,
        stale: false
      };
    }

    // Setup the fetch promise
    const fetchPromise = this.executeRequest(fetchFn, cacheKey, config);
    this.pendingRequests.set(cacheKey, fetchPromise);

    try {
      const data = await fetchPromise;
      
      if (cached && config.staleWhileRevalidate) {
        // Return stale data immediately, update cache in background
        return {
          data: cached,
          timestamp: Date.now(),
          cacheHit: true,
          stale: true
        };
      }

      return {
        data,
        timestamp: Date.now(),
        cacheHit: false,
        stale: false
      };
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Execute the actual request with caching
  private async executeRequest<T>(
    fetchFn: () => Promise<T>,
    cacheKey: string,
    config: ApiCacheConfig
  ): Promise<T> {
    try {
      const data = await fetchFn();
      
      // Cache the successful response
      await this.cacheManager.set(cacheKey, data, {
        maxAge: config.ttl || 5 * 60 * 1000, // Default 5 minutes
        compression: config.compression
      });

      // Store cache tags for invalidation
      if (config.tags) {
        await this.storeCacheTags(cacheKey, config.tags);
      }

      return data;
    } catch (error) {
      // Try to return stale data on error
      const staleData = await this.cacheManager.get<T>(cacheKey);
      if (staleData) {
        console.warn('Returning stale data due to network error:', error);
        return staleData;
      }
      throw error;
    }
  }

  // Generate cache key from URL and config
  private generateCacheKey(url: string, config: ApiCacheConfig): string {
    const baseKey = url;
    const configHash = config.versioning ? JSON.stringify(config) : '';
    return `${baseKey}:${this.hashString(configHash)}`;
  }

  // Simple hash function for cache keys
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Store cache tags for invalidation
  private async storeCacheTags(cacheKey: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const existingKeys = await this.cacheManager.get<string[]>(tagKey) || [];
      
      if (!existingKeys.includes(cacheKey)) {
        existingKeys.push(cacheKey);
        await this.cacheManager.set(tagKey, existingKeys, { maxAge: 24 * 60 * 60 * 1000 });
      }
    }
  }

  // Invalidate cache by tags
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidatedCount = 0;

    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const cacheKeys = await this.cacheManager.get<string[]>(tagKey);
      
      if (cacheKeys) {
        for (const cacheKey of cacheKeys) {
          await this.cacheManager.delete(cacheKey);
          invalidatedCount++;
        }
        
        // Remove the tag entry
        await this.cacheManager.delete(tagKey);
      }
    }

    return invalidatedCount;
  }

  // Invalidate cache by URL pattern
  async invalidateByPattern(pattern: string | RegExp): Promise<number> {
    return this.cacheManager.invalidate(pattern);
  }

  // Trigger invalidation based on events
  async triggerInvalidation(event: string, data?: any): Promise<void> {
    const promises: Promise<any>[] = [];

    for (const [ruleId, rule] of this.invalidationRules) {
      if (rule.triggers.includes(event)) {
        promises.push(this.cacheManager.invalidate(rule.pattern));
        
        // Invalidate dependencies
        if (rule.dependencies) {
          promises.push(...rule.dependencies.map(dep => this.cacheManager.delete(dep)));
        }
      }
    }

    await Promise.all(promises);
  }

  // Add invalidation rule
  addInvalidationRule(ruleId: string, rule: CacheInvalidationRule): void {
    this.invalidationRules.set(ruleId, rule);
  }

  // Remove invalidation rule
  removeInvalidationRule(ruleId: string): boolean {
    return this.invalidationRules.delete(ruleId);
  }

  // Setup default invalidation rules
  private setupDefaultInvalidationRules(): void {
    // Movie-related invalidations
    this.addInvalidationRule('movies-create', {
      pattern: /^\/api\/movies/,
      triggers: ['movie:created', 'movie:updated', 'movie:deleted'],
      dependencies: ['movies:featured', 'movies:popular']
    });

    // Booking-related invalidations
    this.addInvalidationRule('bookings-update', {
      pattern: /^\/api\/showtimes\/\d+\/seats/,
      triggers: ['booking:created', 'booking:cancelled'],
      dependencies: ['user:bookings']
    });

    // User-related invalidations
    this.addInvalidationRule('user-update', {
      pattern: /^\/api\/user/,
      triggers: ['user:updated', 'user:preferences-changed']
    });

    // Admin-related invalidations
    this.addInvalidationRule('admin-data', {
      pattern: /^\/api\/admin/,
      triggers: ['admin:data-changed', 'movie:created', 'theater:updated']
    });
  }

  // Preload critical data
  async preloadCriticalData(): Promise<void> {
    const criticalEndpoints = [
      {
        key: '/api/movies?featured=true',
        fetchFn: () => fetch('/api/movies?featured=true').then(r => r.json()),
        config: { ttl: 10 * 60 * 1000, tags: ['movies', 'featured'] }
      },
      {
        key: '/api/theaters',
        fetchFn: () => fetch('/api/theaters').then(r => r.json()),
        config: { ttl: 30 * 60 * 1000, tags: ['theaters'] }
      },
      {
        key: '/api/genres',
        fetchFn: () => fetch('/api/genres').then(r => r.json()),
        config: { ttl: 60 * 60 * 1000, tags: ['genres'] }
      }
    ];

    await Promise.all(
      criticalEndpoints.map(({ key, fetchFn, config }) =>
        this.cacheRequest(key, fetchFn, config).catch(err =>
          console.warn(`Failed to preload ${key}:`, err)
        )
      )
    );
  }

  // Get cache statistics
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  // Clear all API cache
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }
}

// HTTP Cache Headers Handler
export class HttpCacheHandler {
  // Check if response can be cached based on headers
  static canCache(response: Response): boolean {
    const cacheControl = response.headers.get('cache-control');
    
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        return false;
      }
    }

    return response.ok && response.status < 400;
  }

  // Get TTL from cache headers
  static getTTLFromHeaders(response: Response): number {
    const cacheControl = response.headers.get('cache-control');
    
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        return parseInt(maxAgeMatch[1]) * 1000; // Convert to milliseconds
      }
    }

    const expires = response.headers.get('expires');
    if (expires) {
      const expiresTime = new Date(expires).getTime();
      const now = Date.now();
      return Math.max(0, expiresTime - now);
    }

    return 5 * 60 * 1000; // Default 5 minutes
  }

  // Check if cached response is still valid using ETags
  static async isValidByETag(url: string, etag: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'If-None-Match': etag }
      });
      
      return response.status === 304; // Not Modified
    } catch {
      return false;
    }
  }
}

// Singleton instance
const apiCacheService = new ApiCacheService();

// React hooks for API caching
export function useApiCache<T>(
  url: string,
  options: ApiCacheConfig = {},
  dependencies: any[] = []
) {
  const [response, setResponse] = React.useState<ApiResponse<T> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiResponse = await apiCacheService.cacheRequest<T>(
          url,
          () => fetch(url).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            return r.json();
          }),
          options
        );

        if (isMounted) {
          setResponse(apiResponse);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, ...dependencies]);

  const invalidate = React.useCallback(async () => {
    if (options.tags) {
      await apiCacheService.invalidateByTags(options.tags);
    } else {
      await apiCacheService.invalidateByPattern(url);
    }
  }, [url, options.tags]);

  const refresh = React.useCallback(async () => {
    await invalidate();
    // Trigger re-fetch by updating dependencies
    setLoading(true);
  }, [invalidate]);

  return {
    data: response?.data || null,
    loading,
    error,
    cacheHit: response?.cacheHit || false,
    stale: response?.stale || false,
    timestamp: response?.timestamp || 0,
    invalidate,
    refresh
  };
}

// Hook for cache invalidation events
export function useCacheInvalidation() {
  const triggerInvalidation = React.useCallback((event: string, data?: any) => {
    return apiCacheService.triggerInvalidation(event, data);
  }, []);

  const invalidateByTags = React.useCallback((tags: string[]) => {
    return apiCacheService.invalidateByTags(tags);
  }, []);

  const invalidateByPattern = React.useCallback((pattern: string | RegExp) => {
    return apiCacheService.invalidateByPattern(pattern);
  }, []);

  return {
    triggerInvalidation,
    invalidateByTags,
    invalidateByPattern
  };
}

export { apiCacheService };
export default ApiCacheService;