<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AdvancedRateLimitingService
{
    /**
     * Rate limiting configurations by API version and role
     */
    private const RATE_LIMITS = [
        'v1' => [
            'guest' => [
                'auth' => ['requests' => 10, 'window' => 60], // 10 requests per minute for auth
                'general' => ['requests' => 100, 'window' => 60], // 100 requests per minute for general APIs
                'booking' => ['requests' => 20, 'window' => 60], // 20 booking requests per minute
            ],
            'user' => [
                'auth' => ['requests' => 15, 'window' => 60],
                'general' => ['requests' => 200, 'window' => 60],
                'booking' => ['requests' => 30, 'window' => 60],
            ],
            'admin' => [
                'auth' => ['requests' => 50, 'window' => 60],
                'general' => ['requests' => 1000, 'window' => 60],
                'booking' => ['requests' => 100, 'window' => 60],
            ],
        ],
        'v2' => [
            'guest' => [
                'auth' => ['requests' => 15, 'window' => 60], // Enhanced limits for v2
                'general' => ['requests' => 150, 'window' => 60],
                'booking' => ['requests' => 25, 'window' => 60],
            ],
            'user' => [
                'auth' => ['requests' => 20, 'window' => 60],
                'general' => ['requests' => 300, 'window' => 60],
                'booking' => ['requests' => 40, 'window' => 60],
            ],
            'admin' => [
                'auth' => ['requests' => 75, 'window' => 60],
                'general' => ['requests' => 1500, 'window' => 60],
                'booking' => ['requests' => 150, 'window' => 60],
            ],
        ],
    ];

    /**
     * Endpoint categories for rate limiting
     */
    private const ENDPOINT_CATEGORIES = [
        'auth' => [
            '/auth/login',
            '/auth/register',
            '/auth/forgot-password',
            '/auth/reset-password',
        ],
        'booking' => [
            '/bookings',
            '/bookings/{id}/payment',
            '/showtimes/{id}/seats/lock',
        ],
        'general' => [], // Default category for all other endpoints
    ];

    /**
     * Check if request should be rate limited
     */
    public function shouldLimit(Request $request): array
    {
        $identifier = $this->getClientIdentifier($request);
        $category = $this->determineEndpointCategory($request);
        $version = $this->extractApiVersion($request);
        $role = $this->getUserRole($request);

        $limits = $this->getRateLimits($version, $role, $category);
        $key = $this->generateRedisKey($identifier, $version, $category);

        // Get current usage from Redis
        $currentUsage = $this->getCurrentUsage($key, $limits['window']);
        
        // Check if limit exceeded
        $limitExceeded = $currentUsage >= $limits['requests'];
        
        if (!$limitExceeded) {
            // Increment usage counter
            $this->incrementUsage($key, $limits['window']);
        }

        // Track analytics
        $this->trackRateLimitAnalytics($version, $role, $category, $currentUsage, $limits, $limitExceeded);

        return [
            'should_limit' => $limitExceeded,
            'current_usage' => $currentUsage,
            'limit' => $limits['requests'],
            'window' => $limits['window'],
            'reset_time' => $this->getResetTime($key, $limits['window']),
            'retry_after' => $limitExceeded ? $this->getRetryAfter($key, $limits['window']) : null,
        ];
    }

    /**
     * Get client identifier for rate limiting
     */
    private function getClientIdentifier(Request $request): string
    {
        // Prioritize authenticated user ID
        if ($request->user()) {
            return 'user:' . $request->user()->id;
        }

        // Handle proxy headers for real IP first
        if ($request->hasHeader('X-Forwarded-For')) {
            $forwardedIps = explode(',', $request->header('X-Forwarded-For'));
            $ip = trim($forwardedIps[0]);
            return 'ip:' . $ip;
        } elseif ($request->hasHeader('X-Real-IP')) {
            $ip = $request->header('X-Real-IP');
            return 'ip:' . $ip;
        }

        // Fall back to IP address for anonymous users
        $ip = $request->ip();
        return 'ip:' . $ip;
    }

    /**
     * Determine endpoint category for rate limiting
     */
    private function determineEndpointCategory(Request $request): string
    {
        $path = $request->getPathInfo();
        
        // Remove API version prefix for comparison
        $normalizedPath = preg_replace('/^\/api\/v[12]/', '', $path);

        foreach (self::ENDPOINT_CATEGORIES as $category => $patterns) {
            foreach ($patterns as $pattern) {
                // Convert Laravel route pattern to regex
                $regex = '#^' . preg_replace('/\{[^}]+\}/', '[^/]+', $pattern) . '$#';
                if (preg_match($regex, $normalizedPath)) {
                    return $category;
                }
            }
        }

        return 'general';
    }

    /**
     * Extract API version from request
     */
    private function extractApiVersion(Request $request): string
    {
        // Check URL path first
        if (preg_match('/\/api\/v(\d+)\//', $request->getPathInfo(), $matches)) {
            return 'v' . $matches[1];
        }

        // Check API-Version header
        if ($request->hasHeader('API-Version')) {
            return $request->header('API-Version');
        }

        // Check Accept header
        if ($request->hasHeader('Accept')) {
            $accept = $request->header('Accept');
            if (preg_match('/application\/vnd\.cinebook\.v(\d+)\+json/', $accept, $matches)) {
                return 'v' . $matches[1];
            }
        }

        // Default to v1
        return 'v1';
    }

    /**
     * Get user role for rate limiting
     */
    private function getUserRole(Request $request): string
    {
        if (!$request->user()) {
            return 'guest';
        }

        return $request->user()->role ?? 'user';
    }

    /**
     * Get rate limits for specific version, role, and category
     */
    private function getRateLimits(string $version, string $role, string $category): array
    {
        $limits = self::RATE_LIMITS[$version][$role][$category] ?? 
                 self::RATE_LIMITS[$version][$role]['general'] ??
                 self::RATE_LIMITS['v1']['guest']['general'];

        return $limits;
    }

    /**
     * Generate Redis key for rate limiting
     */
    private function generateRedisKey(string $identifier, string $version, string $category): string
    {
        return "rate_limit:{$version}:{$category}:{$identifier}";
    }

    /**
     * Get current usage from Redis
     */
    private function getCurrentUsage(string $key, int $window): int
    {
        try {
            return (int) Redis::get($key) ?: 0;
        } catch (\Exception $e) {
            Log::warning('Redis rate limit check failed', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            
            // Fallback to cache if Redis fails
            return (int) Cache::get($key, 0);
        }
    }

    /**
     * Increment usage counter in Redis
     */
    private function incrementUsage(string $key, int $window): void
    {
        try {
            Redis::pipeline(function ($pipe) use ($key, $window) {
                $pipe->incr($key);
                $pipe->expire($key, $window);
            });
        } catch (\Exception $e) {
            Log::warning('Redis rate limit increment failed', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            
            // Fallback to cache
            $current = Cache::get($key, 0);
            Cache::put($key, $current + 1, $window);
        }
    }

    /**
     * Get reset time for rate limit window
     */
    private function getResetTime(string $key, int $window): int
    {
        try {
            $ttl = Redis::ttl($key);
            if ($ttl > 0) {
                return Carbon::now()->addSeconds($ttl)->timestamp;
            }
        } catch (\Exception $e) {
            Log::warning('Redis TTL check failed', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
        }

        return Carbon::now()->addSeconds($window)->timestamp;
    }

    /**
     * Get retry after seconds
     */
    private function getRetryAfter(string $key, int $window): int
    {
        try {
            $ttl = Redis::ttl($key);
            return $ttl > 0 ? $ttl : $window;
        } catch (\Exception $e) {
            Log::warning('Redis retry after check failed', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return $window;
        }
    }

    /**
     * Track rate limiting analytics
     */
    private function trackRateLimitAnalytics(
        string $version, 
        string $role, 
        string $category, 
        int $currentUsage, 
        array $limits, 
        bool $limitExceeded
    ): void {
        $date = Carbon::now()->format('Y-m-d');
        $hour = Carbon::now()->format('H');
        
        $analyticsKey = "rate_limit_analytics:{$date}:{$hour}:{$version}:{$role}:{$category}";
        
        try {
            Redis::pipeline(function ($pipe) use ($analyticsKey, $limitExceeded, $currentUsage, $limits) {
                $pipe->hincrby($analyticsKey, 'total_requests', 1);
                
                if ($limitExceeded) {
                    $pipe->hincrby($analyticsKey, 'blocked_requests', 1);
                }
                
                $pipe->hset($analyticsKey, 'limit', $limits['requests']);
                $pipe->expire($analyticsKey, 86400 * 7); // Keep for 7 days
            });
            
            // Handle peak usage separately to avoid pipeline complexity
            try {
                $existingPeak = Redis::hget($analyticsKey, 'peak_usage') ?: 0;
                if ($currentUsage > $existingPeak) {
                    Redis::hset($analyticsKey, 'peak_usage', $currentUsage);
                }
            } catch (\Exception $e) {
                // If peak usage tracking fails, continue without it
                Log::debug('Peak usage tracking failed', ['error' => $e->getMessage()]);
            }
        } catch (\Exception $e) {
            Log::warning('Rate limit analytics tracking failed', [
                'error' => $e->getMessage(),
                'version' => $version,
                'role' => $role,
                'category' => $category
            ]);
        }
    }

    /**
     * Get rate limiting analytics
     */
    public function getAnalytics(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? Carbon::now()->subDays(7)->format('Y-m-d');
        $endDate = $filters['end_date'] ?? Carbon::now()->format('Y-m-d');
        $version = $filters['version'] ?? null;
        $role = $filters['role'] ?? null;
        $category = $filters['category'] ?? null;

        $analytics = [];
        $current = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($current->lte($end)) {
            $date = $current->format('Y-m-d');
            
            for ($hour = 0; $hour < 24; $hour++) {
                $pattern = "rate_limit_analytics:{$date}:" . sprintf('%02d', $hour) . ':*';
                
                try {
                    $keys = Redis::keys($pattern);
                    
                    foreach ($keys as $key) {
                        $parts = explode(':', $key);
                        $keyVersion = $parts[3] ?? '';
                        $keyRole = $parts[4] ?? '';
                        $keyCategory = $parts[5] ?? '';
                        
                        // Apply filters
                        if ($version && $keyVersion !== $version) continue;
                        if ($role && $keyRole !== $role) continue;
                        if ($category && $keyCategory !== $category) continue;
                        
                        $data = Redis::hgetall($key);
                        
                        $analytics[] = [
                            'timestamp' => $date . ' ' . sprintf('%02d', $hour) . ':00:00',
                            'version' => $keyVersion,
                            'role' => $keyRole,
                            'category' => $keyCategory,
                            'total_requests' => (int) ($data['total_requests'] ?? 0),
                            'blocked_requests' => (int) ($data['blocked_requests'] ?? 0),
                            'peak_usage' => (int) ($data['peak_usage'] ?? 0),
                            'limit' => (int) ($data['limit'] ?? 0),
                            'block_rate' => $this->calculateBlockRate($data),
                        ];
                    }
                } catch (\Exception $e) {
                    Log::warning('Rate limit analytics retrieval failed', [
                        'pattern' => $pattern,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            $current->addDay();
        }

        return $analytics;
    }

    /**
     * Calculate block rate percentage
     */
    private function calculateBlockRate(array $data): float
    {
        $total = (int) ($data['total_requests'] ?? 0);
        $blocked = (int) ($data['blocked_requests'] ?? 0);
        
        if ($total === 0) {
            return 0.0;
        }
        
        return round(($blocked / $total) * 100, 2);
    }

    /**
     * Get current rate limit status for a client
     */
    public function getClientStatus(Request $request): array
    {
        $identifier = $this->getClientIdentifier($request);
        $version = $this->extractApiVersion($request);
        $role = $this->getUserRole($request);
        
        $categories = ['auth', 'booking', 'general'];
        $status = [];
        
        foreach ($categories as $category) {
            $limits = $this->getRateLimits($version, $role, $category);
            $key = $this->generateRedisKey($identifier, $version, $category);
            $currentUsage = $this->getCurrentUsage($key, $limits['window']);
            
            $status[$category] = [
                'current_usage' => $currentUsage,
                'limit' => $limits['requests'],
                'window' => $limits['window'],
                'remaining' => max(0, $limits['requests'] - $currentUsage),
                'reset_time' => $this->getResetTime($key, $limits['window']),
                'percentage_used' => round(($currentUsage / $limits['requests']) * 100, 2),
            ];
        }
        
        return [
            'identifier' => $identifier,
            'version' => $version,
            'role' => $role,
            'categories' => $status,
        ];
    }

    /**
     * Reset rate limits for a specific client (admin function)
     */
    public function resetClientLimits(string $identifier, string $version = null): bool
    {
        try {
            $versions = $version ? [$version] : ['v1', 'v2'];
            $categories = ['auth', 'booking', 'general'];
            
            $keysToDelete = [];
            foreach ($versions as $v) {
                foreach ($categories as $category) {
                    $keysToDelete[] = "rate_limit:{$v}:{$category}:{$identifier}";
                }
            }
            
            if (!empty($keysToDelete)) {
                Redis::del($keysToDelete);
            }
            
            Log::info('Rate limits reset for client', [
                'identifier' => $identifier,
                'version' => $version,
                'keys_deleted' => count($keysToDelete)
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to reset rate limits', [
                'identifier' => $identifier,
                'version' => $version,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
}