<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AdvancedRateLimitingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RateLimitingController extends Controller
{
    protected $rateLimitService;

    public function __construct(AdvancedRateLimitingService $rateLimitService)
    {
        $this->rateLimitService = $rateLimitService;
    }

    /**
     * Get rate limiting analytics
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date|before_or_equal:today',
            'end_date' => 'nullable|date|after_or_equal:start_date|before_or_equal:today',
            'version' => 'nullable|in:v1,v2',
            'role' => 'nullable|in:guest,user,admin',
            'category' => 'nullable|in:auth,booking,general',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $analytics = $this->rateLimitService->getAnalytics($request->all());
            
            // Calculate summary statistics
            $summary = $this->calculateAnalyticsSummary($analytics);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'analytics' => $analytics,
                    'summary' => $summary,
                    'filters' => $request->all()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy dữ liệu phân tích rate limiting',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Get current rate limit status for client
     */
    public function getClientStatus(Request $request): JsonResponse
    {
        try {
            $status = $this->rateLimitService->getClientStatus($request);
            
            return response()->json([
                'success' => true,
                'data' => $status
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy trạng thái rate limiting',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Reset rate limits for a client (admin only)
     */
    public function resetClientLimits(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string',
            'version' => 'nullable|in:v1,v2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->rateLimitService->resetClientLimits(
                $request->input('identifier'),
                $request->input('version')
            );
            
            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Đã reset rate limits thành công',
                    'data' => [
                        'identifier' => $request->input('identifier'),
                        'version' => $request->input('version') ?? 'all'
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể reset rate limits'
                ], 500);
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi reset rate limits',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Get rate limiting configuration
     */
    public function getConfiguration(): JsonResponse
    {
        try {
            // Use reflection to get the rate limits configuration
            $reflectionClass = new \ReflectionClass(AdvancedRateLimitingService::class);
            $rateLimitsProperty = $reflectionClass->getProperty('RATE_LIMITS');
            $rateLimitsProperty->setAccessible(true);
            $rateLimits = $rateLimitsProperty->getValue();

            $endpointCategoriesProperty = $reflectionClass->getProperty('ENDPOINT_CATEGORIES');
            $endpointCategoriesProperty->setAccessible(true);
            $endpointCategories = $endpointCategoriesProperty->getValue();

            return response()->json([
                'success' => true,
                'data' => [
                    'rate_limits' => $rateLimits,
                    'endpoint_categories' => $endpointCategories,
                    'supported_versions' => array_keys($rateLimits),
                    'supported_roles' => array_keys($rateLimits['v1']),
                    'supported_categories' => array_keys($endpointCategories)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy cấu hình rate limiting',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Get rate limiting health status
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

            $allHealthy = collect($health)->except(['timestamp', 'service_status'])
                ->every(fn($status) => $status === 'healthy');

            $health['overall_status'] = $allHealthy ? 'healthy' : 'degraded';

            return response()->json([
                'success' => true,
                'data' => $health
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể kiểm tra health status',
                'error' => config('app.debug') ? $e->getMessage() : 'Lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Calculate analytics summary
     */
    private function calculateAnalyticsSummary(array $analytics): array
    {
        if (empty($analytics)) {
            return [
                'total_requests' => 0,
                'total_blocked' => 0,
                'average_block_rate' => 0,
                'peak_usage' => 0,
                'most_limited_category' => null,
                'most_limited_version' => null,
            ];
        }

        $totalRequests = array_sum(array_column($analytics, 'total_requests'));
        $totalBlocked = array_sum(array_column($analytics, 'blocked_requests'));
        $averageBlockRate = $totalRequests > 0 ? ($totalBlocked / $totalRequests) * 100 : 0;
        $peakUsage = max(array_column($analytics, 'peak_usage'));

        // Find most limited category and version
        $categoryStats = [];
        $versionStats = [];

        foreach ($analytics as $item) {
            $category = $item['category'];
            $version = $item['version'];

            if (!isset($categoryStats[$category])) {
                $categoryStats[$category] = ['requests' => 0, 'blocked' => 0];
            }
            if (!isset($versionStats[$version])) {
                $versionStats[$version] = ['requests' => 0, 'blocked' => 0];
            }

            $categoryStats[$category]['requests'] += $item['total_requests'];
            $categoryStats[$category]['blocked'] += $item['blocked_requests'];
            $versionStats[$version]['requests'] += $item['total_requests'];
            $versionStats[$version]['blocked'] += $item['blocked_requests'];
        }

        // Calculate block rates and find highest
        $mostLimitedCategory = null;
        $highestCategoryBlockRate = 0;
        foreach ($categoryStats as $category => $stats) {
            $blockRate = $stats['requests'] > 0 ? ($stats['blocked'] / $stats['requests']) * 100 : 0;
            if ($blockRate > $highestCategoryBlockRate) {
                $highestCategoryBlockRate = $blockRate;
                $mostLimitedCategory = $category;
            }
        }

        $mostLimitedVersion = null;
        $highestVersionBlockRate = 0;
        foreach ($versionStats as $version => $stats) {
            $blockRate = $stats['requests'] > 0 ? ($stats['blocked'] / $stats['requests']) * 100 : 0;
            if ($blockRate > $highestVersionBlockRate) {
                $highestVersionBlockRate = $blockRate;
                $mostLimitedVersion = $version;
            }
        }

        return [
            'total_requests' => $totalRequests,
            'total_blocked' => $totalBlocked,
            'average_block_rate' => round($averageBlockRate, 2),
            'peak_usage' => $peakUsage,
            'most_limited_category' => $mostLimitedCategory,
            'most_limited_version' => $mostLimitedVersion,
            'category_breakdown' => $categoryStats,
            'version_breakdown' => $versionStats,
        ];
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
            \Illuminate\Support\Facades\Cache::put('health_check', 'test', 1);
            $value = \Illuminate\Support\Facades\Cache::get('health_check');
            return $value === 'test' ? 'healthy' : 'unhealthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }
}