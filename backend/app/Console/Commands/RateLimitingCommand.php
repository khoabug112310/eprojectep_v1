<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AdvancedRateLimitingService;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class RateLimitingCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'rate-limit:manage 
                          {action : The action to perform (analytics|reset|status|cleanup)}
                          {--identifier= : Client identifier for reset action}
                          {--api-version= : API version (v1|v2)}
                          {--days=7 : Number of days for analytics}
                          {--format=table : Output format (table|json)}
                          {--cleanup-older-than=7 : Days to keep analytics data}';

    /**
     * The console command description.
     */
    protected $description = 'Manage API rate limiting - view analytics, reset limits, check status, or cleanup old data';

    protected $rateLimitService;

    public function __construct(AdvancedRateLimitingService $rateLimitService)
    {
        parent::__construct();
        $this->rateLimitService = $rateLimitService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'analytics' => $this->showAnalytics(),
            'reset' => $this->resetLimits(),
            'status' => $this->showStatus(),
            'cleanup' => $this->cleanupOldData(),
            default => $this->showHelp(),
        };
    }

    /**
     * Show rate limiting analytics
     */
    private function showAnalytics(): int
    {
        $this->info('📊 Rate Limiting Analytics');
        $this->line('');

        $days = (int) $this->option('days');
        $format = $this->option('format');
        $version = $this->option('api-version');

        $filters = [
            'start_date' => Carbon::now()->subDays($days)->format('Y-m-d'),
            'end_date' => Carbon::now()->format('Y-m-d'),
        ];

        if ($version) {
            $filters['version'] = $version;
        }

        try {
            $analytics = $this->rateLimitService->getAnalytics($filters);

            if (empty($analytics)) {
                $this->warn('No analytics data found for the specified period.');
                return 0;
            }

            if ($format === 'json') {
                $this->line(json_encode($analytics, JSON_PRETTY_PRINT));
                return 0;
            }

            // Calculate summary
            $totalRequests = array_sum(array_column($analytics, 'total_requests'));
            $totalBlocked = array_sum(array_column($analytics, 'blocked_requests'));
            $blockRate = $totalRequests > 0 ? ($totalBlocked / $totalRequests) * 100 : 0;

            $this->info("Period: {$filters['start_date']} to {$filters['end_date']}");
            $this->info("Total Requests: " . number_format($totalRequests));
            $this->info("Blocked Requests: " . number_format($totalBlocked));
            $this->info("Block Rate: " . number_format($blockRate, 2) . '%');
            $this->line('');

            // Show top blocked categories
            $categoryStats = [];
            foreach ($analytics as $item) {
                $key = $item['version'] . '/' . $item['category'];
                if (!isset($categoryStats[$key])) {
                    $categoryStats[$key] = ['requests' => 0, 'blocked' => 0];
                }
                $categoryStats[$key]['requests'] += $item['total_requests'];
                $categoryStats[$key]['blocked'] += $item['blocked_requests'];
            }

            // Sort by block rate
            uasort($categoryStats, function ($a, $b) {
                $aRate = $a['requests'] > 0 ? ($a['blocked'] / $a['requests']) : 0;
                $bRate = $b['requests'] > 0 ? ($b['blocked'] / $b['requests']) : 0;
                return $bRate <=> $aRate;
            });

            $headers = ['Version/Category', 'Total Requests', 'Blocked', 'Block Rate'];
            $rows = [];

            foreach (array_slice($categoryStats, 0, 10) as $category => $stats) {
                $blockRate = $stats['requests'] > 0 ? ($stats['blocked'] / $stats['requests']) * 100 : 0;
                $rows[] = [
                    $category,
                    number_format($stats['requests']),
                    number_format($stats['blocked']),
                    number_format($blockRate, 2) . '%'
                ];
            }

            $this->table($headers, $rows);

        } catch (\Exception $e) {
            $this->error('Failed to retrieve analytics: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Reset rate limits for a client
     */
    private function resetLimits(): int
    {
        $identifier = $this->option('identifier');
        $version = $this->option('api-version');

        if (!$identifier) {
            $this->error('Identifier is required for reset action. Use --identifier option.');
            return 1;
        }

        try {
            $result = $this->rateLimitService->resetClientLimits($identifier, $version);

            if ($result) {
                $versionText = $version ? "version {$version}" : 'all versions';
                $this->info("✅ Successfully reset rate limits for {$identifier} ({$versionText})");
            } else {
                $this->error('❌ Failed to reset rate limits');
                return 1;
            }

        } catch (\Exception $e) {
            $this->error('Failed to reset rate limits: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Show system status
     */
    private function showStatus(): int
    {
        $this->info('🔍 Rate Limiting System Status');
        $this->line('');

        try {
            // Check Redis connection
            $redisStatus = $this->checkRedisConnection();
            $this->line("Redis Connection: " . ($redisStatus ? '✅ Healthy' : '❌ Unhealthy'));

            // Check Cache connection
            $cacheStatus = $this->checkCacheConnection();
            $this->line("Cache Connection: " . ($cacheStatus ? '✅ Healthy' : '❌ Unhealthy'));

            // Show configuration
            $this->line('');
            $this->info('📋 Configuration:');
            
            $reflection = new \ReflectionClass($this->rateLimitService);
            $rateLimitsProperty = $reflection->getConstant('RATE_LIMITS');

            foreach ($rateLimitsProperty as $version => $roles) {
                $this->line("  {$version}:");
                foreach ($roles as $role => $categories) {
                    $this->line("    {$role}:");
                    foreach ($categories as $category => $limits) {
                        $this->line("      {$category}: {$limits['requests']} requests/{$limits['window']}s");
                    }
                }
            }

            // Show current active rate limits
            $this->line('');
            $this->info('📊 Current Active Limits:');
            $this->showActiveRateLimits();

        } catch (\Exception $e) {
            $this->error('Failed to check status: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Cleanup old analytics data
     */
    private function cleanupOldData(): int
    {
        $this->info('🧹 Cleaning up old rate limiting data');

        $daysToKeep = (int) $this->option('cleanup-older-than');
        $cutoffDate = Carbon::now()->subDays($daysToKeep);

        try {
            $deletedKeys = 0;
            $pattern = 'rate_limit_analytics:*';
            
            $keys = Redis::keys($pattern);
            
            foreach ($keys as $key) {
                // Extract date from key (format: rate_limit_analytics:YYYY-MM-DD:HH:version:role:category)
                $parts = explode(':', $key);
                if (count($parts) >= 3) {
                    $keyDate = Carbon::parse($parts[2]);
                    if ($keyDate->lt($cutoffDate)) {
                        Redis::del($key);
                        $deletedKeys++;
                    }
                }
            }

            $this->info("✅ Cleaned up {$deletedKeys} old analytics records");
            $this->info("Kept data from {$cutoffDate->format('Y-m-d')} onwards");

        } catch (\Exception $e) {
            $this->error('Failed to cleanup old data: ' . $e->getMessage());
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
        $this->line('📊 analytics  - Show rate limiting analytics');
        $this->line('   Options: --days=7 --api-version=v1 --format=table|json');
        $this->line('');
        $this->line('🔄 reset     - Reset rate limits for a client');
        $this->line('   Options: --identifier=user:123 --api-version=v1');
        $this->line('');
        $this->line('🔍 status    - Show system status and configuration');
        $this->line('');
        $this->line('🧹 cleanup   - Cleanup old analytics data');
        $this->line('   Options: --cleanup-older-than=7');
        $this->line('');
        $this->line('Examples:');
        $this->line('  php artisan rate-limit:manage analytics --days=30');
        $this->line('  php artisan rate-limit:manage reset --identifier=user:123');
        $this->line('  php artisan rate-limit:manage status');
        $this->line('  php artisan rate-limit:manage cleanup --cleanup-older-than=30');

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
     * Check Cache connection
     */
    private function checkCacheConnection(): bool
    {
        try {
            \Illuminate\Support\Facades\Cache::put('health_check', 'test', 1);
            $value = \Illuminate\Support\Facades\Cache::get('health_check');
            return $value === 'test';
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Show currently active rate limits
     */
    private function showActiveRateLimits(): void
    {
        try {
            $pattern = 'rate_limit:*';
            $keys = Redis::keys($pattern);
            
            if (empty($keys)) {
                $this->line('  No active rate limits');
                return;
            }

            $headers = ['Client', 'Version', 'Category', 'Current Usage', 'TTL'];
            $rows = [];

            foreach (array_slice($keys, 0, 20) as $key) {
                $parts = explode(':', $key);
                if (count($parts) >= 4) {
                    $version = $parts[1];
                    $category = $parts[2];
                    $client = implode(':', array_slice($parts, 3));
                    
                    $usage = Redis::get($key) ?: 0;
                    $ttl = Redis::ttl($key);
                    
                    $rows[] = [
                        $client,
                        $version,
                        $category,
                        $usage,
                        $ttl > 0 ? "{$ttl}s" : 'N/A'
                    ];
                }
            }

            if (!empty($rows)) {
                $this->table($headers, $rows);
                
                if (count($keys) > 20) {
                    $this->line("... and " . (count($keys) - 20) . " more active limits");
                }
            }

        } catch (\Exception $e) {
            $this->line('  Unable to retrieve active limits: ' . $e->getMessage());
        }
    }
}