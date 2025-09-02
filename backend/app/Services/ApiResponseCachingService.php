<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ApiResponseCachingService
{
    /**
     * Cache configuration for different endpoint types
     */
    private const CACHE_CONFIG = [
        'movies' => [
            'ttl' => 3600, // 1 hour
            'tags' => ['movies', 'public_data'],
            'invalidate_on' => ['movie_updated', 'movie_created', 'movie_deleted'],
            'vary_by' => ['user_role', 'api_version'],
        ],
        'theaters' => [
            'ttl' => 7200, // 2 hours
            'tags' => ['theaters', 'public_data'],
            'invalidate_on' => ['theater_updated', 'theater_created', 'theater_deleted'],
            'vary_by' => ['api_version'],
        ],
        'showtimes' => [
            'ttl' => 900, // 15 minutes
            'tags' => ['showtimes', 'dynamic_data'],
            'invalidate_on' => ['showtime_updated', 'booking_created', 'seats_locked'],
            'vary_by' => ['date', 'theater_id', 'movie_id'],
        ],
        'user_data' => [
            'ttl' => 300, // 5 minutes
            'tags' => ['user_data', 'private_data'],
            'invalidate_on' => ['user_updated', 'booking_created', 'booking_updated'],
            'vary_by' => ['user_id'],
        ],
        'admin_reports' => [
            'ttl' => 1800, // 30 minutes
            'tags' => ['reports', 'admin_data'],
            'invalidate_on' => ['booking_created', 'payment_processed'],
            'vary_by' => ['date_range', 'report_type'],
        ],
    ];

    /**
     * Default cache settings
     */
    private const DEFAULT_CACHE = [
        'ttl' => 600, // 10 minutes
        'tags' => ['general'],
        'invalidate_on' => [],
        'vary_by' => ['api_version'],
    ];

    /**
     * Routes that should not be cached
     */
    private const UNCACHEABLE_PATTERNS = [
        '/auth/login',
        '/auth/logout',
        '/auth/register',
        '/bookings',
        '/payments',
        '/seats/lock',
        '/seats/unlock',
        '/health',
        '/monitoring',
        '/rate-limiting',
    ];

    /**
     * Check if response should be cached
     */
    public function shouldCache(Request $request, Response $response): bool
    {
        // Don't cache non-GET requests
        if (!$request->isMethod('GET')) {
            return false;
        }

        // Don't cache error responses
        if ($response->getStatusCode() >= 400) {
            return false;
        }

        // Don't cache if user is authenticated for certain endpoints
        if ($request->user() && $this->isPrivateEndpoint($request)) {
            return false;
        }

        // Check against uncacheable patterns
        $path = $request->getPathInfo();
        foreach (self::UNCACHEABLE_PATTERNS as $pattern) {
            if (str_contains($path, $pattern)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get cached response if available
     */
    public function getCachedResponse(Request $request): ?array
    {
        if (!$this->shouldCache($request, new Response())) {
            return null;
        }

        $cacheKey = $this->generateCacheKey($request);
        
        try {
            $cached = Redis::get($cacheKey);
            if ($cached) {
                $data = json_decode($cached, true);
                
                // Check if cache is still valid
                if ($this->isCacheValid($data)) {
                    Log::info('Cache hit', [
                        'key' => $cacheKey,
                        'endpoint' => $request->getPathInfo(),
                        'ttl_remaining' => $data['expires_at'] - time()
                    ]);
                    
                    return $data;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Cache retrieval failed', [
                'key' => $cacheKey,
                'error' => $e->getMessage()
            ]);
            
            // Fallback to Laravel cache
            return Cache::get($cacheKey);
        }

        return null;
    }

    /**
     * Cache a response
     */
    public function cacheResponse(Request $request, Response $response): void
    {
        if (!$this->shouldCache($request, $response)) {
            return;
        }

        $config = $this->getCacheConfig($request);
        $cacheKey = $this->generateCacheKey($request);
        
        $cacheData = [
            'content' => $response->getContent(),
            'headers' => $this->filterHeaders($response->headers->all()),
            'status_code' => $response->getStatusCode(),
            'cached_at' => time(),
            'expires_at' => time() + $config['ttl'],
            'tags' => $config['tags'],
            'endpoint_type' => $this->getEndpointType($request),
            'vary_data' => $this->getVaryData($request, $config['vary_by']),
        ];

        try {
            Redis::setex($cacheKey, $config['ttl'], json_encode($cacheData));
            
            // Add to tag sets for invalidation
            foreach ($config['tags'] as $tag) {
                Redis::sadd("cache_tag:{$tag}", $cacheKey);
                Redis::expire("cache_tag:{$tag}", $config['ttl'] + 300); // Extra 5 minutes
            }
            
            Log::info('Response cached', [
                'key' => $cacheKey,
                'endpoint' => $request->getPathInfo(),
                'ttl' => $config['ttl'],
                'tags' => $config['tags']
            ]);
            
        } catch (\Exception $e) {
            Log::warning('Cache storage failed', [
                'key' => $cacheKey,
                'error' => $e->getMessage()
            ]);
            
            // Fallback to Laravel cache
            Cache::put($cacheKey, $cacheData, $config['ttl']);
        }
    }

    /**
     * Invalidate cache by tags
     */
    public function invalidateByTags(array $tags): int
    {
        $invalidated = 0;
        
        try {
            foreach ($tags as $tag) {
                $tagKey = "cache_tag:{$tag}";
                $cacheKeys = Redis::smembers($tagKey);
                
                if (!empty($cacheKeys)) {
                    Redis::del($cacheKeys);
                    Redis::del($tagKey);
                    $invalidated += count($cacheKeys);
                    
                    Log::info('Cache invalidated by tag', [
                        'tag' => $tag,
                        'keys_invalidated' => count($cacheKeys)
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Cache invalidation failed', [
                'tags' => $tags,
                'error' => $e->getMessage()
            ]);
        }
        
        return $invalidated;
    }

    /**
     * Invalidate cache by event
     */
    public function invalidateByEvent(string $event, array $context = []): int
    {
        $tagsToInvalidate = [];
        
        foreach (self::CACHE_CONFIG as $endpointType => $config) {
            if (in_array($event, $config['invalidate_on'])) {
                $tagsToInvalidate = array_merge($tagsToInvalidate, $config['tags']);
            }
        }
        
        if (!empty($tagsToInvalidate)) {
            $tagsToInvalidate = array_unique($tagsToInvalidate);
            Log::info('Cache invalidation triggered by event', [
                'event' => $event,
                'context' => $context,
                'tags_to_invalidate' => $tagsToInvalidate
            ]);
            
            return $this->invalidateByTags($tagsToInvalidate);
        }
        
        return 0;
    }

    /**
     * Warm up cache for specific endpoints
     */
    public function warmupCache(array $endpoints = []): array
    {
        $results = [];
        
        $defaultEndpoints = [
            '/api/v1/movies',
            '/api/v2/movies',
            '/api/v1/theaters',
            '/api/v2/theaters',
        ];
        
        $endpointsToWarm = !empty($endpoints) ? $endpoints : $defaultEndpoints;
        
        foreach ($endpointsToWarm as $endpoint) {
            try {
                // Create a mock request for the endpoint
                $request = Request::create($endpoint, 'GET');
                
                // This would typically involve making an actual request
                // For now, we'll just mark the endpoint as prepared for warmup
                $results[$endpoint] = [
                    'status' => 'prepared',
                    'message' => 'Endpoint prepared for cache warmup'
                ];
                
            } catch (\Exception $e) {
                $results[$endpoint] = [
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $results;
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        try {
            $stats = [
                'total_keys' => 0,
                'by_tag' => [],
                'by_endpoint_type' => [],
                'memory_usage' => 0,
                'hit_rate' => 0,
                'redis_info' => []
            ];
            
            // Get all cache keys
            $pattern = $this->getCacheKeyPrefix() . '*';
            $keys = Redis::keys($pattern);
            $stats['total_keys'] = count($keys);
            
            // Analyze keys by tags and endpoint types
            foreach ($keys as $key) {
                try {
                    $data = json_decode(Redis::get($key), true);
                    if ($data && isset($data['tags'], $data['endpoint_type'])) {
                        foreach ($data['tags'] as $tag) {
                            $stats['by_tag'][$tag] = ($stats['by_tag'][$tag] ?? 0) + 1;
                        }
                        
                        $endpointType = $data['endpoint_type'];
                        $stats['by_endpoint_type'][$endpointType] = 
                            ($stats['by_endpoint_type'][$endpointType] ?? 0) + 1;
                    }
                } catch (\Exception $e) {
                    // Skip invalid cache entries
                    continue;
                }
            }
            
            // Get Redis info
            $redisInfo = Redis::info();
            $stats['memory_usage'] = $redisInfo['used_memory_human'] ?? 'unknown';
            $stats['redis_info'] = [
                'connected_clients' => $redisInfo['connected_clients'] ?? 0,
                'used_memory' => $redisInfo['used_memory_human'] ?? 'unknown',
                'keyspace_hits' => $redisInfo['keyspace_hits'] ?? 0,
                'keyspace_misses' => $redisInfo['keyspace_misses'] ?? 0,
            ];
            
            // Calculate hit rate
            $hits = $redisInfo['keyspace_hits'] ?? 0;
            $misses = $redisInfo['keyspace_misses'] ?? 0;
            $total = $hits + $misses;
            $stats['hit_rate'] = $total > 0 ? round(($hits / $total) * 100, 2) : 0;
            
            return $stats;
            
        } catch (\Exception $e) {
            Log::error('Failed to get cache stats', ['error' => $e->getMessage()]);
            return ['error' => 'Failed to retrieve cache statistics'];
        }
    }

    /**
     * Clear all cache
     */
    public function clearAllCache(): int
    {
        try {
            $pattern = $this->getCacheKeyPrefix() . '*';
            $keys = Redis::keys($pattern);
            
            if (!empty($keys)) {
                Redis::del($keys);
                
                // Clear tag sets
                $tagPattern = 'cache_tag:*';
                $tagKeys = Redis::keys($tagPattern);
                if (!empty($tagKeys)) {
                    Redis::del($tagKeys);
                }
                
                Log::info('All cache cleared', ['keys_cleared' => count($keys)]);
                return count($keys);
            }
            
            return 0;
            
        } catch (\Exception $e) {
            Log::error('Failed to clear cache', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Generate cache key for request
     */
    private function generateCacheKey(Request $request): string
    {
        $parts = [
            $this->getCacheKeyPrefix(),
            $this->getEndpointType($request),
            md5($request->getPathInfo()),
            md5($request->getQueryString() ?? ''),
        ];
        
        // Add vary data
        $config = $this->getCacheConfig($request);
        $varyData = $this->getVaryData($request, $config['vary_by']);
        if (!empty($varyData)) {
            $parts[] = md5(serialize($varyData));
        }
        
        return implode(':', $parts);
    }

    /**
     * Get cache configuration for request
     */
    private function getCacheConfig(Request $request): array
    {
        $endpointType = $this->getEndpointType($request);
        return self::CACHE_CONFIG[$endpointType] ?? self::DEFAULT_CACHE;
    }

    /**
     * Get endpoint type from request
     */
    private function getEndpointType(Request $request): string
    {
        $path = $request->getPathInfo();
        
        if (str_contains($path, '/movies')) {
            return 'movies';
        } elseif (str_contains($path, '/theaters')) {
            return 'theaters';
        } elseif (str_contains($path, '/showtimes')) {
            return 'showtimes';
        } elseif (str_contains($path, '/user') || str_contains($path, '/profile')) {
            return 'user_data';
        } elseif (str_contains($path, '/admin') || str_contains($path, '/reports')) {
            return 'admin_reports';
        }
        
        return 'general';
    }

    /**
     * Get vary data for cache key generation
     */
    private function getVaryData(Request $request, array $varyBy): array
    {
        $data = [];
        
        foreach ($varyBy as $varyKey) {
            switch ($varyKey) {
                case 'user_role':
                    $data['user_role'] = $request->user()?->role ?? 'guest';
                    break;
                case 'user_id':
                    $data['user_id'] = $request->user()?->id ?? 'anonymous';
                    break;
                case 'api_version':
                    $data['api_version'] = $this->extractApiVersion($request);
                    break;
                case 'date':
                    $data['date'] = $request->query('date', Carbon::today()->format('Y-m-d'));
                    break;
                case 'theater_id':
                    $data['theater_id'] = $request->query('theater_id', $request->route('theater_id'));
                    break;
                case 'movie_id':
                    $data['movie_id'] = $request->query('movie_id', $request->route('movie_id'));
                    break;
                case 'date_range':
                    $data['date_range'] = $request->query('start_date') . '-' . $request->query('end_date');
                    break;
                case 'report_type':
                    $data['report_type'] = $request->query('type', 'general');
                    break;
            }
        }
        
        return $data;
    }

    /**
     * Extract API version from request
     */
    private function extractApiVersion(Request $request): string
    {
        if (preg_match('/\/api\/v(\d+)\//', $request->getPathInfo(), $matches)) {
            return 'v' . $matches[1];
        }
        return 'v1';
    }

    /**
     * Check if endpoint contains private data
     */
    private function isPrivateEndpoint(Request $request): bool
    {
        $privatePaths = ['/user', '/profile', '/bookings', '/admin'];
        $path = $request->getPathInfo();
        
        foreach ($privatePaths as $privatePath) {
            if (str_contains($path, $privatePath)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Filter headers for caching
     */
    private function filterHeaders(array $headers): array
    {
        $allowedHeaders = [
            'content-type',
            'cache-control',
            'expires',
            'last-modified',
            'etag',
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
        ];
        
        return array_filter($headers, function ($key) use ($allowedHeaders) {
            return in_array(strtolower($key), $allowedHeaders);
        }, ARRAY_FILTER_USE_KEY);
    }

    /**
     * Check if cached data is still valid
     */
    private function isCacheValid(array $cacheData): bool
    {
        return isset($cacheData['expires_at']) && $cacheData['expires_at'] > time();
    }

    /**
     * Get cache key prefix
     */
    private function getCacheKeyPrefix(): string
    {
        return 'api_cache:' . config('app.env', 'local');
    }
}