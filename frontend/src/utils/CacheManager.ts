// Cache Manager for CineBook Frontend
// Provides intelligent caching strategies and utilities
import React from 'react'

export interface CacheConfig {
  name: string;
  version: string;
  maxAge: number;
  maxSize: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  compression?: boolean;
  encryption?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
  etag?: string;
  expiresAt: number;
  compressed?: boolean;
  encrypted?: boolean;
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  name: 'cinebook-app-cache',
  version: '1.0.0',
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 50, // 50 entries
  strategy: 'stale-while-revalidate',
  compression: true,
  encryption: false
};

class CacheManager {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private compressionSupported: boolean;
  private compressionStream?: CompressionStream;
  private decompressionStream?: DecompressionStream;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      missRate: 0,
      lastCleanup: Date.now()
    };
    
    this.compressionSupported = this.checkCompressionSupport();
    this.initializeCompression();
    this.loadFromStorage();
    this.startPeriodicCleanup();
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.updateStats('miss');
      return null;
    }

    this.updateStats('hit');
    
    // Decompress if needed
    let data = entry.data;
    if (entry.compressed && this.compressionSupported) {
      data = await this.decompress(data);
    }

    return data;
  }

  // Set data in cache
  async set<T>(key: string, data: T, options: Partial<CacheConfig> = {}): Promise<void> {
    const config = { ...this.config, ...options };
    let processedData = data;

    // Compress if enabled
    if (config.compression && this.compressionSupported) {
      try {
        processedData = await this.compress(data) as T
      } catch (error) {
        console.warn('Compression failed, using uncompressed data:', error)
        processedData = data
      }
    }

    const entry: CacheEntry = {
      data: processedData,
      timestamp: Date.now(),
      version: config.version,
      expiresAt: Date.now() + config.maxAge,
      compressed: config.compression && this.compressionSupported,
      encrypted: config.encryption
    };

    this.cache.set(key, entry);
    this.manageCacheSize();
    await this.persistToStorage();
  }

  // Check if data exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  // Remove data from cache
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      await this.persistToStorage();
    }
    return deleted;
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.entryCount = 0;
    this.stats.totalSize = 0;
    await this.persistToStorage();
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Preload data into cache
  async preload<T>(items: Array<{ key: string; fetchFn: () => Promise<T> }>): Promise<void> {
    const promises = items.map(async ({ key, fetchFn }) => {
      if (!this.has(key)) {
        try {
          const data = await fetchFn();
          await this.set(key, data);
        } catch (error) {
          console.warn(`Failed to preload cache entry: ${key}`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  // Invalidate entries by pattern
  async invalidate(pattern: string | RegExp): Promise<number> {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      await this.persistToStorage();
    }

    return count;
  }

  // Fetch with cache strategy
  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Partial<CacheConfig> = {}
  ): Promise<T> {
    const strategy = options.strategy || this.config.strategy;

    switch (strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(key, fetchFn, options);
      case 'network-first':
        return this.networkFirstStrategy(key, fetchFn, options);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(key, fetchFn, options);
      default:
        return this.staleWhileRevalidateStrategy(key, fetchFn, options);
    }
  }

  // Cache-first strategy
  private async cacheFirstStrategy<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Partial<CacheConfig>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  // Network-first strategy
  private async networkFirstStrategy<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Partial<CacheConfig>
  ): Promise<T> {
    try {
      const data = await fetchFn();
      await this.set(key, data, options);
      return data;
    } catch (error) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      throw error;
    }
  }

  // Stale-while-revalidate strategy
  private async staleWhileRevalidateStrategy<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Partial<CacheConfig>
  ): Promise<T> {
    const cached = await this.get<T>(key);

    // Background refresh
    fetchFn()
      .then(data => this.set(key, data, options))
      .catch(error => console.warn(`Background refresh failed for ${key}:`, error));

    if (cached !== null) {
      return cached;
    }

    // If no cache, wait for network
    return fetchFn();
  }

  // Check if compression is supported
  private checkCompressionSupport(): boolean {
    return typeof window !== 'undefined' && 
           'CompressionStream' in window && 
           'DecompressionStream' in window;
  }

  // Initialize compression streams
  private initializeCompression(): void {
    if (this.compressionSupported) {
      try {
        this.compressionStream = new CompressionStream('gzip');
        this.decompressionStream = new DecompressionStream('gzip');
      } catch (error) {
        console.warn('Failed to initialize compression:', error);
        this.compressionSupported = false;
      }
    }
  }

  // Compress data
  private async compress<T>(data: T): Promise<string> {
    if (!this.compressionSupported) {
      return JSON.stringify(data);
    }

    try {
      const serialized = JSON.stringify(data);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(serialized));
          controller.close();
        }
      });

      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const chunks: Uint8Array[] = [];
      const reader = compressedStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      return btoa(String.fromCharCode(...compressed));
    } catch (error) {
      console.warn('Compression failed, falling back to JSON:', error);
      return JSON.stringify(data);
    }
  }

  // Decompress data
  private async decompress(compressedData: string): Promise<any> {
    if (!this.compressionSupported) {
      return JSON.parse(compressedData);
    }

    try {
      const binaryString = atob(compressedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        }
      });

      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const chunks: Uint8Array[] = [];
      const reader = decompressedStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }

      const text = new TextDecoder().decode(decompressed);
      return JSON.parse(text);
    } catch (error) {
      console.warn('Decompression failed, parsing as JSON:', error);
      return JSON.parse(compressedData);
    }
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  // Manage cache size
  private manageCacheSize(): void {
    if (this.cache.size > this.config.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    this.stats.entryCount = this.cache.size;
  }

  // Update statistics
  private updateStats(type: 'hit' | 'miss'): void {
    const total = this.stats.hitRate + this.stats.missRate + 1;
    
    if (type === 'hit') {
      this.stats.hitRate = (this.stats.hitRate + 1) / total;
      this.stats.missRate = this.stats.missRate / total;
    } else {
      this.stats.hitRate = this.stats.hitRate / total;
      this.stats.missRate = (this.stats.missRate + 1) / total;
    }
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(`cache-${this.config.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.entries);
        this.stats = data.stats || this.stats;
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  // Persist cache to localStorage
  private async persistToStorage(): Promise<void> {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats
      };
      localStorage.setItem(`cache-${this.config.name}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  // Cleanup expired entries
  private cleanup(): void {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.lastCleanup = Date.now();
      this.stats.entryCount = this.cache.size;
      this.persistToStorage();
    }
  }
}

// Create cache manager instances for different data types
export const movieCache = new CacheManager({
  name: 'movies',
  maxAge: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
  strategy: 'stale-while-revalidate'
});

export const apiCache = new CacheManager({
  name: 'api-responses',
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  strategy: 'network-first'
});

export const userCache = new CacheManager({
  name: 'user-data',
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxSize: 20,
  strategy: 'cache-first'
});

export const imageCache = new CacheManager({
  name: 'images',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 200,
  strategy: 'cache-first',
  compression: false // Images are already compressed
});

// React hook for cache management
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheManager: CacheManager = apiCache,
  options: Partial<CacheConfig> = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await cacheManager.fetchWithCache(key, fetchFn, options);
        
        if (isMounted) {
          setData(result);
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
  }, [key, cacheManager, options]);

  const invalidate = React.useCallback(() => {
    cacheManager.delete(key);
  }, [key, cacheManager]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      await cacheManager.delete(key);
      const result = await cacheManager.fetchWithCache(key, fetchFn, options);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, cacheManager, options]);

  return {
    data,
    loading,
    error,
    invalidate,
    refresh
  };
}

export default CacheManager;

// Export the CacheManager class for direct usage
export { CacheManager };