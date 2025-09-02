<?php

namespace App\Http\Middleware;

use App\Services\AdvancedRateLimitingService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class AdvancedRateLimit
{
    protected $rateLimitService;

    public function __construct(AdvancedRateLimitingService $rateLimitService)
    {
        $this->rateLimitService = $rateLimitService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $category = null): Response
    {
        // Skip rate limiting for health checks and documentation
        if ($this->shouldSkipRateLimit($request)) {
            return $next($request);
        }

        try {
            $limitResult = $this->rateLimitService->shouldLimit($request);
            
            // Add rate limit headers to response
            $response = $next($request);
            
            $this->addRateLimitHeaders($response, $limitResult);
            
            // Check if rate limit exceeded
            if ($limitResult['should_limit']) {
                return $this->rateLimitExceededResponse($limitResult);
            }
            
            return $response;
            
        } catch (\Exception $e) {
            Log::error('Rate limiting middleware error', [
                'error' => $e->getMessage(),
                'request_path' => $request->getPathInfo(),
                'request_method' => $request->getMethod()
            ]);
            
            // Continue without rate limiting if service fails
            return $next($request);
        }
    }

    /**
     * Check if request should skip rate limiting
     */
    private function shouldSkipRateLimit(Request $request): bool
    {
        $skipPaths = [
            '/api/health',
            '/api/docs/openapi.json',
            '/api/docs/openapi.yaml',
        ];

        $path = $request->getPathInfo();
        
        foreach ($skipPaths as $skipPath) {
            if (str_starts_with($path, $skipPath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Add rate limit headers to response
     */
    private function addRateLimitHeaders($response, array $limitResult): void
    {
        $headers = [
            'X-RateLimit-Limit' => $limitResult['limit'],
            'X-RateLimit-Remaining' => max(0, $limitResult['limit'] - $limitResult['current_usage']),
            'X-RateLimit-Reset' => $limitResult['reset_time'],
            'X-RateLimit-Window' => $limitResult['window'],
        ];

        foreach ($headers as $header => $value) {
            $response->headers->set($header, $value);
        }
    }

    /**
     * Return rate limit exceeded response
     */
    private function rateLimitExceededResponse(array $limitResult): Response
    {
        $response = response()->json([
            'success' => false,
            'message' => 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
            'error_code' => 'RATE_LIMIT_EXCEEDED',
            'details' => [
                'limit' => $limitResult['limit'],
                'window' => $limitResult['window'],
                'retry_after' => $limitResult['retry_after'],
                'reset_time' => $limitResult['reset_time'],
            ]
        ], 429);

        // Add rate limit headers
        $headers = [
            'X-RateLimit-Limit' => $limitResult['limit'],
            'X-RateLimit-Remaining' => 0,
            'X-RateLimit-Reset' => $limitResult['reset_time'],
            'X-RateLimit-Window' => $limitResult['window'],
            'Retry-After' => $limitResult['retry_after'],
        ];

        foreach ($headers as $header => $value) {
            $response->headers->set($header, $value);
        }

        return $response;
    }
}