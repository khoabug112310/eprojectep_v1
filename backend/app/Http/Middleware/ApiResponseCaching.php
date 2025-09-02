<?php

namespace App\Http\Middleware;

use App\Services\ApiResponseCachingService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ApiResponseCaching
{
    protected $cachingService;

    public function __construct(ApiResponseCachingService $cachingService)
    {
        $this->cachingService = $cachingService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check for cached response
        $cachedResponse = $this->cachingService->getCachedResponse($request);
        
        if ($cachedResponse) {
            $response = new Response(
                $cachedResponse['content'],
                $cachedResponse['status_code'],
                $cachedResponse['headers']
            );
            
            // Add cache headers
            $this->addCacheHeaders($response, $cachedResponse, true);
            
            return $response;
        }

        // Process request normally
        $response = $next($request);
        
        // Cache the response if applicable
        if ($response instanceof Response) {
            $this->cachingService->cacheResponse($request, $response);
            
            // Add cache headers
            $this->addCacheHeaders($response, null, false);
        }
        
        return $response;
    }

    /**
     * Add cache-related headers to response
     */
    private function addCacheHeaders(Response $response, ?array $cachedData, bool $fromCache): void
    {
        if ($fromCache && $cachedData) {
            // Headers for cached responses
            $response->headers->set('X-Cache', 'HIT');
            $response->headers->set('X-Cache-Age', time() - $cachedData['cached_at']);
            $response->headers->set('X-Cache-TTL', $cachedData['expires_at'] - time());
            
            // Set appropriate cache-control headers
            $maxAge = $cachedData['expires_at'] - time();
            $response->headers->set('Cache-Control', "public, max-age={$maxAge}");
            
            // Set expires header
            $response->headers->set('Expires', Carbon::createFromTimestamp($cachedData['expires_at'])->toRfc2822String());
            
            // Add ETag for cache validation
            $etag = md5($cachedData['content']);
            $response->headers->set('ETag', $etag);
            
        } else {
            // Headers for fresh responses
            $response->headers->set('X-Cache', 'MISS');
            $response->headers->set('X-Cache-Age', 0);
            
            // Set cache-control based on content type
            if ($this->shouldSetCacheHeaders($response)) {
                $response->headers->set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300');
                $response->headers->set('Vary', 'Accept, Authorization, X-API-Version');
                
                // Set Last-Modified header
                $response->headers->set('Last-Modified', Carbon::now()->toRfc2822String());
                
                // Generate ETag
                $etag = md5($response->getContent());
                $response->headers->set('ETag', $etag);
            }
        }
        
        // Add custom headers for debugging
        if (config('app.debug')) {
            $response->headers->set('X-Cache-Debug', json_encode([
                'from_cache' => $fromCache,
                'timestamp' => time(),
                'endpoint' => request()->getPathInfo(),
            ]));
        }
    }

    /**
     * Determine if cache headers should be set
     */
    private function shouldSetCacheHeaders(Response $response): bool
    {
        // Don't set cache headers for error responses
        if ($response->getStatusCode() >= 400) {
            return false;
        }
        
        // Don't set cache headers for non-JSON responses
        $contentType = $response->headers->get('Content-Type', '');
        if (!str_contains($contentType, 'application/json')) {
            return false;
        }
        
        return true;
    }
}