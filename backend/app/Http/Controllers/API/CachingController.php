<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ApiResponseCachingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CachingController extends Controller
{
    protected $cachingService;

    public function __construct(ApiResponseCachingService $cachingService)
    {
        $this->cachingService = $cachingService;
    }

    /**
     * Get cache statistics
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->cachingService->getCacheStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thống kê cache',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Invalidate cache by tags
     */
    public function invalidateByTags(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tags' => 'required|array|min:1',
            'tags.*' => 'required|string|in:movies,theaters,showtimes,user_data,admin_data,public_data,private_data,dynamic_data,reports,general'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $invalidated = $this->cachingService->invalidateByTags($request->input('tags'));
            
            return response()->json([
                'success' => true,
                'message' => 'Cache đã được xóa theo tags',
                'data' => [
                    'tags' => $request->input('tags'),
                    'keys_invalidated' => $invalidated
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa cache',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Invalidate cache by event
     */
    public function invalidateByEvent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'event' => 'required|string|in:movie_updated,movie_created,movie_deleted,theater_updated,theater_created,theater_deleted,showtime_updated,booking_created,seats_locked,user_updated,booking_updated,payment_processed',
            'context' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $invalidated = $this->cachingService->invalidateByEvent(
                $request->input('event'),
                $request->input('context', [])
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Cache đã được xóa theo event',
                'data' => [
                    'event' => $request->input('event'),
                    'context' => $request->input('context', []),
                    'keys_invalidated' => $invalidated
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa cache theo event',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Warm up cache for specific endpoints
     */
    public function warmupCache(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoints' => 'nullable|array',
            'endpoints.*' => 'string|url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $endpoints = $request->input('endpoints', []);
            $results = $this->cachingService->warmupCache($endpoints);
            
            return response()->json([
                'success' => true,
                'message' => 'Cache warmup đã được thực hiện',
                'data' => $results
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể thực hiện cache warmup',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Clear all cache
     */
    public function clearAll(): JsonResponse
    {
        try {
            $cleared = $this->cachingService->clearAllCache();
            
            return response()->json([
                'success' => true,
                'message' => 'Tất cả cache đã được xóa',
                'data' => [
                    'keys_cleared' => $cleared
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa tất cả cache',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Get cache configuration
     */
    public function getConfiguration(): JsonResponse
    {
        try {
            // Use reflection to get cache configuration
            $reflectionClass = new \ReflectionClass(ApiResponseCachingService::class);
            
            $cacheConfigConstant = $reflectionClass->getConstant('CACHE_CONFIG');
            $defaultCacheConstant = $reflectionClass->getConstant('DEFAULT_CACHE');
            $uncacheablePatternsConstant = $reflectionClass->getConstant('UNCACHEABLE_PATTERNS');

            return response()->json([
                'success' => true,
                'data' => [
                    'cache_config' => $cacheConfigConstant,
                    'default_cache' => $defaultCacheConstant,
                    'uncacheable_patterns' => $uncacheablePatternsConstant,
                    'available_tags' => [
                        'movies', 'theaters', 'showtimes', 'user_data', 'admin_data',
                        'public_data', 'private_data', 'dynamic_data', 'reports', 'general'
                    ],
                    'available_events' => [
                        'movie_updated', 'movie_created', 'movie_deleted',
                        'theater_updated', 'theater_created', 'theater_deleted',
                        'showtime_updated', 'booking_created', 'seats_locked',
                        'user_updated', 'booking_updated', 'payment_processed'
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy cấu hình cache',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Get cache health status
     */
    public function getHealthStatus(): JsonResponse
    {
        try {
            $health = [
                'redis_connection' => $this->checkRedisConnection(),
                'cache_connection' => $this->checkCacheConnection(),
                'service_status' => 'operational',
                'timestamp' => now()->toISOString()
            ];

            // Check cache performance
            $stats = $this->cachingService->getCacheStats();
            $health['cache_performance'] = [
                'hit_rate' => $stats['hit_rate'] ?? 0,
                'total_keys' => $stats['total_keys'] ?? 0,
                'memory_usage' => $stats['memory_usage'] ?? 'unknown'
            ];

            $allHealthy = $health['redis_connection'] === 'healthy' && 
                         $health['cache_connection'] === 'healthy';

            $health['overall_status'] = $allHealthy ? 'healthy' : 'degraded';

            return response()->json([
                'success' => true,
                'data' => $health
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể kiểm tra trạng thái cache',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Check Redis connection health
     */
    private function checkRedisConnection(): string
    {
        try {
            \Illuminate\Support\Facades\Redis::ping();
            return 'healthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }

    /**
     * Check cache connection health
     */
    private function checkCacheConnection(): string
    {
        try {
            \Illuminate\Support\Facades\Cache::put('health_check_cache', 'test', 1);
            $value = \Illuminate\Support\Facades\Cache::get('health_check_cache');
            return $value === 'test' ? 'healthy' : 'unhealthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }
}