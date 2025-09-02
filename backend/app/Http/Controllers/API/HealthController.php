<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\SeatLockingService;
use App\Services\DatabaseConnectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    private DatabaseConnectionService $dbService;

    public function __construct(DatabaseConnectionService $dbService)
    {
        $this->dbService = $dbService;
    }
    /**
     * Check overall system health
     */
    public function index()
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'seat_locking' => $this->checkSeatLocking(),
            'connection_pools' => $this->checkConnectionPools()
        ];
        
        $allHealthy = collect($checks)->every(fn($check) => $check['status'] === 'healthy');
        
        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'checks' => $checks,
            'system_info' => [
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'php_version' => PHP_VERSION
            ],
            'timestamp' => now()->toISOString()
        ], $allHealthy ? 200 : 503);
    }
    
    /**
     * Check Redis connectivity and seat locking service
     */
    public function redis(SeatLockingService $seatLockingService)
    {
        $result = $seatLockingService->testConnection();
        
        return response()->json([
            'service' => 'redis',
            'status' => $result['success'] ? 'healthy' : 'unhealthy',
            'details' => $result,
            'timestamp' => now()->toISOString()
        ], $result['success'] ? 200 : 503);
    }
    
    /**
     * Get seat locking statistics
     */
    public function seatLockingStats(SeatLockingService $seatLockingService)
    {
        $stats = $seatLockingService->getLockStatistics();
        
        return response()->json([
            'service' => 'seat_locking',
            'status' => $stats['success'] ? 'healthy' : 'unhealthy',
            'statistics' => $stats['statistics'] ?? null,
            'timestamp' => now()->toISOString()
        ]);
    }
    
    /**
     * Dedicated seat locking health check
     */
    public function seatLockingHealth(SeatLockingService $seatLockingService)
    {
        try {
            $connectionTest = $seatLockingService->testConnection();
            $stats = $seatLockingService->getLockStatistics();
            
            $isHealthy = isset($connectionTest['redis_status']) && $connectionTest['redis_status'] === 'connected';
            
            return response()->json([
                'success' => true,
                'service' => 'seat-locking',
                'status' => $isHealthy ? 'healthy' : 'unhealthy',
                'data' => array_merge(
                    $connectionTest,
                    [
                        'memory_usage' => memory_get_usage(true),
                        'active_locks' => $stats['total_locks'] ?? 0,
                        'lock_statistics' => $stats ?? []
                    ]
                ),
                'timestamp' => now()->toISOString()
            ], $isHealthy ? 200 : 503);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'service' => 'seat-locking',
                'status' => 'unhealthy',
                'message' => 'Seat locking service temporarily unavailable',
                'error' => $e->getMessage()
            ], 503);
        }
    }
    
    /**
     * Get detailed database health information
     */
    public function database()
    {
        $healthStatus = $this->dbService->getDatabaseHealth();
        
        return response()->json($healthStatus, $healthStatus['success'] ? 200 : 503);
    }
    
    /**
     * Get connection pool statistics
     */
    public function connectionPools()
    {
        $poolStats = $this->dbService->getConnectionPoolStats();
        
        return response()->json($poolStats, $poolStats['success'] ? 200 : 503);
    }
    
    /**
     * Get slow query statistics
     */
    public function slowQueries()
    {
        $slowQueryStats = $this->dbService->getSlowQueryStats();
        
        return response()->json($slowQueryStats, $slowQueryStats['success'] ? 200 : 503);
    }
    
    /**
     * Test transaction performance
     */
    public function transactionPerformance()
    {
        $transactionTest = $this->dbService->testTransactionPerformance();
        
        return response()->json($transactionTest, $transactionTest['success'] ? 200 : 503);
    }
    
    /**
     * Check database connectivity
     */
    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'healthy',
                'message' => 'Database connection successful'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Database connection failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Check Redis connectivity
     */
    private function checkRedis(): array
    {
        try {
            Cache::store('redis')->put('health_check', 'test', 10);
            $value = Cache::store('redis')->get('health_check');
            Cache::store('redis')->forget('health_check');
            
            if ($value === 'test') {
                return [
                    'status' => 'healthy',
                    'message' => 'Redis connection successful'
                ];
            } else {
                return [
                    'status' => 'unhealthy',
                    'message' => 'Redis operation failed'
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Redis connection failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Check connection pools health
     */
    private function checkConnectionPools(): array
    {
        try {
            $poolStats = $this->dbService->getConnectionPoolStats();
            
            if (!$poolStats['success']) {
                return [
                    'status' => 'unhealthy',
                    'message' => 'Connection pool check failed'
                ];
            }
            
            $mysqlPool = $poolStats['data']['mysql_pool'];
            $redisPool = $poolStats['data']['redis_pool'];
            
            return [
                'status' => 'healthy',
                'message' => 'Connection pools configured',
                'mysql_pool_configured' => $mysqlPool['configured'],
                'redis_pool_configured' => $redisPool['configured']
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Connection pool check failed',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Check seat locking service
     */
    private function checkSeatLocking(): array
    {
        try {
            $seatLockingService = app(SeatLockingService::class);
            $connectionTest = $seatLockingService->testConnection();
            
            return [
                'status' => $connectionTest['success'] ? 'healthy' : 'unhealthy',
                'message' => $connectionTest['message'] ?? 'Seat locking service check'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Seat locking service failed',
                'error' => $e->getMessage()
            ];
        }
    }
}