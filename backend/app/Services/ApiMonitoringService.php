<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ApiMonitoringService
{
    /**
     * Record API version usage
     *
     * @param string $version
     * @param string $endpoint
     * @param array $context
     */
    public function recordVersionUsage(string $version, string $endpoint, array $context = []): void
    {
        $key = "api_usage:{$version}:" . date('Y-m-d');
        $endpointKey = "api_endpoint:{$endpoint}:" . date('Y-m-d');
        
        // Increment version usage counters
        Cache::increment($key, 1);
        Cache::increment($endpointKey, 1);
        
        // Store usage data with TTL of 30 days
        $ttl = 30 * 24 * 60 * 60; // 30 days in seconds
        
        $usageData = [
            'version' => $version,
            'endpoint' => $endpoint,
            'timestamp' => now()->toISOString(),
            'context' => $context
        ];
        
        // Store in cache with date-based key
        $usageListKey = "api_usage_log:" . date('Y-m-d-H');
        $currentUsage = Cache::get($usageListKey, []);
        $currentUsage[] = $usageData;
        
        // Keep only last 1000 entries per hour to prevent memory issues
        if (count($currentUsage) > 1000) {
            $currentUsage = array_slice($currentUsage, -1000);
        }
        
        Cache::put($usageListKey, $currentUsage, $ttl);
    }
    
    /**
     * Get API usage statistics
     *
     * @param int $days
     * @return array
     */
    public function getUsageStatistics(int $days = 7): array
    {
        $stats = [
            'total_requests' => 0,
            'version_breakdown' => [],
            'endpoint_usage' => [],
            'daily_usage' => [],
            'deprecated_usage' => 0
        ];
        
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            
            // Get version usage for each day
            foreach (['v1', 'v2'] as $version) {
                $key = "api_usage:{$version}:{$date}";
                $count = Cache::get($key, 0);
                
                if (!isset($stats['version_breakdown'][$version])) {
                    $stats['version_breakdown'][$version] = 0;
                }
                $stats['version_breakdown'][$version] += $count;
                $stats['total_requests'] += $count;
                
                if ($version === 'v1') {
                    $stats['deprecated_usage'] += $count;
                }
            }
            
            $dayTotal = ($stats['version_breakdown']['v1'] ?? 0) + ($stats['version_breakdown']['v2'] ?? 0);
            $stats['daily_usage'][$date] = $dayTotal;
        }
        
        return $stats;
    }
    
    /**
     * Get most popular endpoints
     *
     * @param int $limit
     * @param int $days
     * @return array
     */
    public function getPopularEndpoints(int $limit = 10, int $days = 7): array
    {
        $endpoints = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            
            // Get all endpoint usage keys for this date
            $pattern = "api_endpoint:*:{$date}";
            // Note: In production, you'd want to use Redis SCAN for this
            // For now, we'll track common endpoints
            $commonEndpoints = [
                '/api/v1/movies', '/api/v2/movies',
                '/api/v1/theaters', '/api/v2/theaters',
                '/api/v1/bookings', '/api/v2/bookings',
                '/api/v1/auth/login', '/api/v2/auth/login'
            ];
            
            foreach ($commonEndpoints as $endpoint) {
                $key = "api_endpoint:{$endpoint}:{$date}";
                $count = Cache::get($key, 0);
                
                if (!isset($endpoints[$endpoint])) {
                    $endpoints[$endpoint] = 0;
                }
                $endpoints[$endpoint] += $count;
            }
        }
        
        // Sort by usage and limit results
        arsort($endpoints);
        return array_slice($endpoints, 0, $limit, true);
    }
    
    /**
     * Check if API version is deprecated
     *
     * @param string $version
     * @return array|null
     */
    public function getDeprecationInfo(string $version): ?array
    {
        $deprecations = [
            'v1' => [
                'deprecated' => true,
                'sunset_date' => '2025-12-31',
                'migration_guide' => '/docs/api/v1-to-v2-migration',
                'message' => 'API v1 is deprecated. Please migrate to v2 before 2025-12-31.',
                'severity' => 'warning'
            ]
        ];
        
        return $deprecations[$version] ?? null;
    }
    
    /**
     * Log deprecated API usage
     *
     * @param string $version
     * @param string $endpoint
     * @param array $context
     */
    public function logDeprecatedUsage(string $version, string $endpoint, array $context = []): void
    {
        $deprecationInfo = $this->getDeprecationInfo($version);
        
        if ($deprecationInfo) {
            Log::warning('Deprecated API version accessed', [
                'version' => $version,
                'endpoint' => $endpoint,
                'deprecation_info' => $deprecationInfo,
                'context' => $context,
                'timestamp' => now()->toISOString()
            ]);
            
            // Track deprecation usage for reporting
            $key = "deprecated_usage:{$version}:" . date('Y-m-d');
            Cache::increment($key, 1);
        }
    }
    
    /**
     * Get API health metrics
     *
     * @return array
     */
    public function getHealthMetrics(): array
    {
        $stats = $this->getUsageStatistics(1); // Last 24 hours
        
        return [
            'status' => 'healthy',
            'uptime' => '99.9%', // Would be calculated from actual monitoring
            'total_requests_24h' => $stats['total_requests'],
            'deprecated_usage_percentage' => $stats['total_requests'] > 0 
                ? round(($stats['deprecated_usage'] / $stats['total_requests']) * 100, 2) 
                : 0,
            'version_distribution' => $stats['version_breakdown'],
            'last_check' => now()->toISOString()
        ];
    }
}