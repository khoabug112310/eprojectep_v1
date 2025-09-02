<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ApiMonitoringService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApiMonitoringController extends Controller
{
    protected ApiMonitoringService $monitoringService;
    
    public function __construct(ApiMonitoringService $monitoringService)
    {
        $this->monitoringService = $monitoringService;
    }
    
    /**
     * Get API usage statistics
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getUsageStats(Request $request): JsonResponse
    {
        $days = $request->query('days', 7);
        $stats = $this->monitoringService->getUsageStatistics($days);
        
        return response()->json([
            'success' => true,
            'data' => $stats,
            'period' => "{$days} days",
            'generated_at' => now()->toISOString()
        ]);
    }
    
    /**
     * Get popular endpoints
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getPopularEndpoints(Request $request): JsonResponse
    {
        $limit = $request->query('limit', 10);
        $days = $request->query('days', 7);
        
        $endpoints = $this->monitoringService->getPopularEndpoints($limit, $days);
        
        return response()->json([
            'success' => true,
            'data' => $endpoints,
            'limit' => $limit,
            'period' => "{$days} days",
            'generated_at' => now()->toISOString()
        ]);
    }
    
    /**
     * Get API health metrics
     *
     * @return JsonResponse
     */
    public function getHealthMetrics(): JsonResponse
    {
        $metrics = $this->monitoringService->getHealthMetrics();
        
        return response()->json([
            'success' => true,
            'data' => $metrics,
            'generated_at' => now()->toISOString()
        ]);
    }
    
    /**
     * Get deprecation warnings and migration info
     *
     * @return JsonResponse
     */
    public function getDeprecationInfo(): JsonResponse
    {
        $deprecations = [];
        
        foreach (['v1', 'v2'] as $version) {
            $info = $this->monitoringService->getDeprecationInfo($version);
            if ($info) {
                $deprecations[$version] = $info;
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $deprecations,
            'generated_at' => now()->toISOString()
        ]);
    }
    
    /**
     * Get version comparison metrics
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getVersionComparison(Request $request): JsonResponse
    {
        $days = $request->query('days', 30);
        $stats = $this->monitoringService->getUsageStatistics($days);
        
        $comparison = [
            'total_requests' => $stats['total_requests'],
            'version_breakdown' => $stats['version_breakdown'],
            'migration_progress' => [
                'v1_usage_percentage' => $stats['total_requests'] > 0 
                    ? round((($stats['version_breakdown']['v1'] ?? 0) / $stats['total_requests']) * 100, 2) 
                    : 0,
                'v2_usage_percentage' => $stats['total_requests'] > 0 
                    ? round((($stats['version_breakdown']['v2'] ?? 0) / $stats['total_requests']) * 100, 2) 
                    : 0,
                'migration_status' => $this->getMigrationStatus($stats)
            ],
            'recommendations' => $this->getRecommendations($stats)
        ];
        
        return response()->json([
            'success' => true,
            'data' => $comparison,
            'period' => "{$days} days",
            'generated_at' => now()->toISOString()
        ]);
    }
    
    /**
     * Get migration status based on usage statistics
     *
     * @param array $stats
     * @return string
     */
    protected function getMigrationStatus(array $stats): string
    {
        $v1Usage = $stats['version_breakdown']['v1'] ?? 0;
        $v2Usage = $stats['version_breakdown']['v2'] ?? 0;
        $total = $v1Usage + $v2Usage;
        
        if ($total === 0) {
            return 'no_usage';
        }
        
        $v1Percentage = ($v1Usage / $total) * 100;
        
        if ($v1Percentage === 0) {
            return 'migration_complete';
        } elseif ($v1Percentage < 10) {
            return 'migration_nearly_complete';
        } elseif ($v1Percentage < 50) {
            return 'migration_in_progress';
        } else {
            return 'migration_needed';
        }
    }
    
    /**
     * Get recommendations based on usage patterns
     *
     * @param array $stats
     * @return array
     */
    protected function getRecommendations(array $stats): array
    {
        $recommendations = [];
        
        $v1Usage = $stats['version_breakdown']['v1'] ?? 0;
        $total = $stats['total_requests'];
        
        if ($total > 0) {
            $v1Percentage = ($v1Usage / $total) * 100;
            
            if ($v1Percentage > 50) {
                $recommendations[] = [
                    'type' => 'urgent',
                    'message' => 'High v1 API usage detected. Plan migration to v2 before sunset date.',
                    'action' => 'Review migration guide and update API clients'
                ];
            } elseif ($v1Percentage > 10) {
                $recommendations[] = [
                    'type' => 'warning',
                    'message' => 'Some clients still using deprecated v1 API.',
                    'action' => 'Contact remaining v1 clients for migration assistance'
                ];
            } elseif ($v1Percentage > 0) {
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'Migration nearly complete. Few v1 requests remaining.',
                    'action' => 'Identify and assist final v1 clients'
                ];
            } else {
                $recommendations[] = [
                    'type' => 'success',
                    'message' => 'All clients successfully migrated to v2.',
                    'action' => 'Consider v1 sunset timeline'
                ];
            }
        }
        
        return $recommendations;
    }
}