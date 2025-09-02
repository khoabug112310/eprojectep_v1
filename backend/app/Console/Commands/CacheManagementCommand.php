<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ApiResponseCachingService;
use Illuminate\Support\Facades\Redis;

class CacheManagementCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cache:api-manage 
                          {action : The action to perform (stats|clear|invalidate|warmup|health)}
                          {--tags=* : Cache tags to invalidate}
                          {--event= : Event name to trigger invalidation}
                          {--endpoints=* : Endpoints to warm up}
                          {--format=table : Output format (table|json)}';

    /**
     * The console command description.
     */
    protected $description = 'Manage API response caching - view stats, clear cache, invalidate by tags/events, or warm up cache';

    protected $cachingService;

    public function __construct(ApiResponseCachingService $cachingService)
    {
        parent::__construct();
        $this->cachingService = $cachingService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'stats' => $this->showStats(),
            'clear' => $this->clearCache(),
            'invalidate' => $this->invalidateCache(),
            'warmup' => $this->warmupCache(),
            'health' => $this->showHealth(),
            default => $this->showHelp(),
        };
    }

    /**
     * Show cache statistics
     */
    private function showStats(): int
    {
        $this->info('📊 API Cache Statistics');
        $this->line('');

        $format = $this->option('format');

        try {
            $stats = $this->cachingService->getCacheStats();

            if ($format === 'json') {
                $this->line(json_encode($stats, JSON_PRETTY_PRINT));
                return 0;
            }

            // Display summary
            $this->info('📈 Summary:');
            $this->line("Total Cache Keys: " . number_format($stats['total_keys']));
            $this->line("Memory Usage: " . ($stats['memory_usage'] ?? 'unknown'));
            $this->line("Hit Rate: " . ($stats['hit_rate'] ?? 0) . '%');
            $this->line('');

            // Display Redis info
            if (isset($stats['redis_info'])) {
                $this->info('🔧 Redis Info:');
                $this->line("Connected Clients: " . ($stats['redis_info']['connected_clients'] ?? 'unknown'));
                $this->line("Used Memory: " . ($stats['redis_info']['used_memory'] ?? 'unknown'));
                $this->line("Keyspace Hits: " . number_format($stats['redis_info']['keyspace_hits'] ?? 0));
                $this->line("Keyspace Misses: " . number_format($stats['redis_info']['keyspace_misses'] ?? 0));
                $this->line('');
            }

            // Display by tags
            if (!empty($stats['by_tag'])) {
                $this->info('🏷️ Cache Keys by Tag:');
                $headers = ['Tag', 'Count'];
                $rows = [];
                
                arsort($stats['by_tag']);
                foreach ($stats['by_tag'] as $tag => $count) {
                    $rows[] = [$tag, number_format($count)];
                }
                
                $this->table($headers, $rows);
                $this->line('');
            }

            // Display by endpoint type
            if (!empty($stats['by_endpoint_type'])) {
                $this->info('🎯 Cache Keys by Endpoint Type:');
                $headers = ['Endpoint Type', 'Count'];
                $rows = [];
                
                arsort($stats['by_endpoint_type']);
                foreach ($stats['by_endpoint_type'] as $type => $count) {
                    $rows[] = [$type, number_format($count)];
                }
                
                $this->table($headers, $rows);
            }

        } catch (\Exception $e) {
            $this->error('Failed to retrieve cache statistics: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Clear cache
     */
    private function clearCache(): int
    {
        $this->info('🧹 Clearing API Cache');

        if ($this->confirm('Are you sure you want to clear all API cache?')) {
            try {
                $cleared = $this->cachingService->clearAllCache();
                $this->info("✅ Successfully cleared {$cleared} cache keys");
            } catch (\Exception $e) {
                $this->error('Failed to clear cache: ' . $e->getMessage());
                return 1;
            }
        } else {
            $this->info('Cache clear cancelled');
        }

        return 0;
    }

    /**
     * Invalidate cache by tags or events
     */
    private function invalidateCache(): int
    {
        $tags = $this->option('tags');
        $event = $this->option('event');

        if (empty($tags) && empty($event)) {
            $this->error('Either --tags or --event option is required for invalidation');
            return 1;
        }

        try {
            if (!empty($tags)) {
                $this->info('🗑️ Invalidating cache by tags: ' . implode(', ', $tags));
                $invalidated = $this->cachingService->invalidateByTags($tags);
                $this->info("✅ Invalidated {$invalidated} cache keys");
            }

            if (!empty($event)) {
                $this->info("🗑️ Invalidating cache by event: {$event}");
                $invalidated = $this->cachingService->invalidateByEvent($event);
                $this->info("✅ Invalidated {$invalidated} cache keys");
            }

        } catch (\Exception $e) {
            $this->error('Failed to invalidate cache: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Warm up cache
     */
    private function warmupCache(): int
    {
        $endpoints = $this->option('endpoints');

        $this->info('🔥 Warming up API cache');
        
        if (empty($endpoints)) {
            $this->line('No specific endpoints provided, using default endpoints');
        }

        try {
            $results = $this->cachingService->warmupCache($endpoints);
            
            $this->info('📈 Warmup Results:');
            $headers = ['Endpoint', 'Status', 'Message'];
            $rows = [];
            
            foreach ($results as $endpoint => $result) {
                $rows[] = [
                    $endpoint,
                    $result['status'],
                    $result['message'] ?? ($result['error'] ?? 'N/A')
                ];
            }
            
            $this->table($headers, $rows);

        } catch (\Exception $e) {
            $this->error('Failed to warm up cache: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Show health status
     */
    private function showHealth(): int
    {
        $this->info('🏥 API Cache Health Status');
        $this->line('');

        try {
            // Check Redis connection
            $redisStatus = $this->checkRedisConnection();
            $this->line("Redis Connection: " . ($redisStatus ? '✅ Healthy' : '❌ Unhealthy'));

            // Check cache connection
            $cacheStatus = $this->checkCacheConnection();
            $this->line("Cache Connection: " . ($cacheStatus ? '✅ Healthy' : '❌ Unhealthy'));

            $this->line('');

            // Show cache performance
            $stats = $this->cachingService->getCacheStats();
            
            $this->info('⚡ Performance Metrics:');
            $this->line("Hit Rate: " . ($stats['hit_rate'] ?? 0) . '%');
            $this->line("Total Keys: " . number_format($stats['total_keys'] ?? 0));
            $this->line("Memory Usage: " . ($stats['memory_usage'] ?? 'unknown'));

            $this->line('');

            // Show cache configuration
            $this->info('⚙️ Cache Configuration:');
            $reflection = new \ReflectionClass($this->cachingService);
            $cacheConfig = $reflection->getConstant('CACHE_CONFIG');

            $headers = ['Endpoint Type', 'TTL (seconds)', 'Tags'];
            $rows = [];

            foreach ($cacheConfig as $type => $config) {
                $rows[] = [
                    $type,
                    $config['ttl'],
                    implode(', ', $config['tags'])
                ];
            }

            $this->table($headers, $rows);

        } catch (\Exception $e) {
            $this->error('Failed to check health status: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Show help information
     */
    private function showHelp(): int
    {
        $this->error('Invalid action. Available actions:');
        $this->line('');
        $this->line('📊 stats    - Show cache statistics and performance metrics');
        $this->line('   Options: --format=table|json');
        $this->line('');
        $this->line('🧹 clear    - Clear all API cache');
        $this->line('');
        $this->line('🗑️ invalidate - Invalidate cache by tags or events');
        $this->line('   Options: --tags=movies,theaters --event=movie_updated');
        $this->line('');
        $this->line('🔥 warmup   - Warm up cache for specific endpoints');
        $this->line('   Options: --endpoints=/api/v1/movies,/api/v1/theaters');
        $this->line('');
        $this->line('🏥 health   - Show cache health status and configuration');
        $this->line('');
        $this->line('Examples:');
        $this->line('  php artisan cache:api-manage stats --format=json');
        $this->line('  php artisan cache:api-manage invalidate --tags=movies,showtimes');
        $this->line('  php artisan cache:api-manage invalidate --event=movie_updated');
        $this->line('  php artisan cache:api-manage warmup --endpoints=/api/v1/movies');
        $this->line('  php artisan cache:api-manage health');
        $this->line('  php artisan cache:api-manage clear');

        return 1;
    }

    /**
     * Check Redis connection
     */
    private function checkRedisConnection(): bool
    {
        try {
            Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check cache connection
     */
    private function checkCacheConnection(): bool
    {
        try {
            \Illuminate\Support\Facades\Cache::put('health_check_cmd', 'test', 1);
            $value = \Illuminate\Support\Facades\Cache::get('health_check_cmd');
            return $value === 'test';
        } catch (\Exception $e) {
            return false;
        }
    }
}