<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\ApiMonitoringService;

class ApiVersioning
{
    protected ApiMonitoringService $monitoringService;
    
    public function __construct(ApiMonitoringService $monitoringService)
    {
        $this->monitoringService = $monitoringService;
    }
    /**
     * Supported API versions
     */
    const SUPPORTED_VERSIONS = ['v1', 'v2'];
    const DEFAULT_VERSION = 'v1';
    const CURRENT_VERSION = 'v2';
    
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $version = $this->determineApiVersion($request);
        
        // Validate version
        if (!in_array($version, self::SUPPORTED_VERSIONS)) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported API version',
                'supported_versions' => self::SUPPORTED_VERSIONS,
                'requested_version' => $version
            ], 400);
        }
        
        // Set version in request for controllers to use
        $request->attributes->set('api_version', $version);
        
        // Add version deprecation warnings
        $this->addDeprecationWarnings($request, $version);
        
        // Log API version usage for analytics
        $this->logVersionUsage($request, $version);
        
        $response = $next($request);
        
        // Add version headers to response
        $this->addVersionHeaders($response, $version);
        
        return $response;
    }
    
    /**
     * Determine API version from request
     *
     * @param Request $request
     * @return string
     */
    protected function determineApiVersion(Request $request): string
    {
        // 1. Check URL path version (highest priority)
        if (preg_match('/\/api\/(v\d+)\//', $request->getPathInfo(), $matches)) {
            return $matches[1];
        }
        
        // 2. Check Accept header version
        $acceptHeader = $request->header('Accept');
        if (preg_match('/application\/vnd\.cinebook\.(v\d+)\+json/', $acceptHeader, $matches)) {
            return $matches[1];
        }
        
        // 3. Check custom API-Version header
        $versionHeader = $request->header('API-Version');
        if ($versionHeader && in_array($versionHeader, self::SUPPORTED_VERSIONS)) {
            return $versionHeader;
        }
        
        // 4. Check query parameter
        $versionParam = $request->query('api_version');
        if ($versionParam && in_array($versionParam, self::SUPPORTED_VERSIONS)) {
            return $versionParam;
        }
        
        // 5. Fall back to default version
        return self::DEFAULT_VERSION;
    }
    
    /**
     * Add deprecation warnings for old versions
     *
     * @param Request $request
     * @param string $version
     */
    protected function addDeprecationWarnings(Request $request, string $version): void
    {
        $deprecationInfo = $this->getDeprecationInfo($version);
        
        if ($deprecationInfo) {
            $request->attributes->set('api_deprecation', $deprecationInfo);
            
            Log::info('Deprecated API version accessed', [
                'version' => $version,
                'endpoint' => $request->getPathInfo(),
                'user_agent' => $request->userAgent(),
                'ip' => $request->ip(),
                'deprecation_info' => $deprecationInfo
            ]);
        }
    }
    
    /**
     * Get deprecation information for version
     *
     * @param string $version
     * @return array|null
     */
    protected function getDeprecationInfo(string $version): ?array
    {
        $deprecations = [
            'v1' => [
                'deprecated' => true,
                'sunset_date' => '2025-12-31',
                'migration_guide' => '/docs/api/v1-to-v2-migration',
                'message' => 'API v1 is deprecated. Please migrate to v2 before 2025-12-31.'
            ]
        ];
        
        return $deprecations[$version] ?? null;
    }
    
    /**
     * Log API version usage for analytics
     *
     * @param Request $request
     * @param string $version
     */
    protected function logVersionUsage(Request $request, string $version): void
    {
        $context = [
            'version' => $version,
            'endpoint' => $request->getPathInfo(),
            'method' => $request->getMethod(),
            'user_id' => $request->user()?->id,
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
            'timestamp' => now()->toISOString()
        ];
        
        // Record usage in monitoring service
        $this->monitoringService->recordVersionUsage($version, $request->getPathInfo(), $context);
        
        // Log deprecated usage separately
        $deprecationInfo = $this->getDeprecationInfo($version);
        if ($deprecationInfo && $deprecationInfo['deprecated']) {
            $this->monitoringService->logDeprecatedUsage($version, $request->getPathInfo(), $context);
        }
        
        // Log version usage for monitoring and analytics
        Log::channel('api-analytics')->info('API version usage', $context);
    }
    
    /**
     * Add version-related headers to response
     *
     * @param mixed $response
     * @param string $version
     */
    protected function addVersionHeaders($response, string $version): void
    {
        if (method_exists($response, 'header')) {
            // Add current API version
            $response->header('X-API-Version', $version);
            
            // Add latest available version
            $response->header('X-API-Latest-Version', self::CURRENT_VERSION);
            
            // Add supported versions
            $response->header('X-API-Supported-Versions', implode(', ', self::SUPPORTED_VERSIONS));
            
            // Add deprecation warning if applicable
            $deprecationInfo = $this->getDeprecationInfo($version);
            if ($deprecationInfo && $deprecationInfo['deprecated']) {
                $response->header('Deprecation', true);
                $response->header('Sunset', $deprecationInfo['sunset_date']);
                $response->header('Link', '<' . $deprecationInfo['migration_guide'] . '>; rel="migration-guide"');
            }
        }
    }
}