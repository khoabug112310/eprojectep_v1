<?php

namespace Tests\Unit\Services;

use App\Services\ApiResponseCachingService;
use Tests\TestCase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Mockery;

class ApiResponseCachingServiceTest extends TestCase
{
    protected $cachingService;
    protected $mockRequest;
    protected $mockResponse;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cachingService = new ApiResponseCachingService();
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockResponse = Mockery::mock(Response::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_should_cache_get_requests_with_200_status()
    {
        $this->mockRequest->shouldReceive('isMethod')->with('GET')->andReturn(true);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        
        $this->mockResponse->shouldReceive('getStatusCode')->andReturn(200);

        $shouldCache = $this->cachingService->shouldCache($this->mockRequest, $this->mockResponse);
        $this->assertTrue($shouldCache);
    }

    /** @test */
    public function it_should_not_cache_non_get_requests()
    {
        $this->mockRequest->shouldReceive('isMethod')->with('GET')->andReturn(false);

        $shouldCache = $this->cachingService->shouldCache($this->mockRequest, $this->mockResponse);
        $this->assertFalse($shouldCache);
    }

    /** @test */
    public function it_should_not_cache_error_responses()
    {
        $this->mockRequest->shouldReceive('isMethod')->with('GET')->andReturn(true);
        $this->mockResponse->shouldReceive('getStatusCode')->andReturn(404);

        $shouldCache = $this->cachingService->shouldCache($this->mockRequest, $this->mockResponse);
        $this->assertFalse($shouldCache);
    }

    /** @test */
    public function it_should_not_cache_uncacheable_patterns()
    {
        $this->mockRequest->shouldReceive('isMethod')->with('GET')->andReturn(true);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/auth/login');
        $this->mockResponse->shouldReceive('getStatusCode')->andReturn(200);

        $shouldCache = $this->cachingService->shouldCache($this->mockRequest, $this->mockResponse);
        $this->assertFalse($shouldCache);
    }

    /** @test */
    public function it_correctly_determines_endpoint_types()
    {
        $reflection = new \ReflectionClass($this->cachingService);
        $method = $reflection->getMethod('getEndpointType');
        $method->setAccessible(true);

        // Test movies endpoint
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        $type = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('movies', $type);

        // Test theaters endpoint
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/theaters');
        $type = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('theaters', $type);

        // Test showtimes endpoint
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/showtimes');
        $type = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('showtimes', $type);

        // Test general endpoint
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/health');
        $type = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('general', $type);
    }

    /** @test */
    public function it_generates_correct_cache_keys()
    {
        $reflection = new \ReflectionClass($this->cachingService);
        $generateMethod = $reflection->getMethod('generateCacheKey');
        $generateMethod->setAccessible(true);
        
        $configMethod = $reflection->getMethod('getCacheConfig');
        $configMethod->setAccessible(true);
        
        $varyMethod = $reflection->getMethod('getVaryData');
        $varyMethod->setAccessible(true);

        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        $this->mockRequest->shouldReceive('getQueryString')->andReturn(null);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('query')->andReturn(null);
        $this->mockRequest->shouldReceive('route')->andReturn(null);

        $key = $generateMethod->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertIsString($key);
        $this->assertStringContainsString('api_cache:', $key);
    }

    /** @test */
    public function it_extracts_api_version_correctly()
    {
        $reflection = new \ReflectionClass($this->cachingService);
        $method = $reflection->getMethod('extractApiVersion');
        $method->setAccessible(true);

        // Test v1 endpoint
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        $version = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('v1', $version);

        // Test v2 endpoint
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v2/movies');
        $version = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('v2', $version);

        // Test default version
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/movies');
        $version = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertEquals('v1', $version);
    }

    /** @test */
    public function it_handles_redis_failures_gracefully()
    {
        $this->mockRequest->shouldReceive('isMethod')->with('GET')->andReturn(true);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        $this->mockRequest->shouldReceive('getQueryString')->andReturn(null);
        $this->mockResponse->shouldReceive('getStatusCode')->andReturn(200);
        
        Redis::shouldReceive('get')->andThrow(new \Exception('Redis connection failed'));
        Log::shouldReceive('warning');

        $cachedResponse = $this->cachingService->getCachedResponse($this->mockRequest);
        $this->assertNull($cachedResponse);
    }

    /** @test */
    public function it_invalidates_cache_by_tags_correctly()
    {
        Redis::shouldReceive('smembers')->with('cache_tag:movies')->andReturn(['key1', 'key2']);
        Redis::shouldReceive('del')->with(['key1', 'key2'])->andReturn(2);
        Redis::shouldReceive('del')->with('cache_tag:movies')->andReturn(1);
        Log::shouldReceive('info');

        $invalidated = $this->cachingService->invalidateByTags(['movies']);
        $this->assertEquals(2, $invalidated);
    }

    /** @test */
    public function it_returns_zero_when_no_keys_to_invalidate()
    {
        Redis::shouldReceive('smembers')->with('cache_tag:nonexistent')->andReturn([]);

        $invalidated = $this->cachingService->invalidateByTags(['nonexistent']);
        $this->assertEquals(0, $invalidated);
    }

    /** @test */
    public function it_invalidates_cache_by_event()
    {
        Redis::shouldReceive('smembers')->with('cache_tag:movies')->andReturn(['key1']);
        Redis::shouldReceive('smembers')->with('cache_tag:public_data')->andReturn(['key2']);
        Redis::shouldReceive('del')->with(['key1'])->andReturn(1);
        Redis::shouldReceive('del')->with('cache_tag:movies')->andReturn(1);
        Redis::shouldReceive('del')->with(['key2'])->andReturn(1);
        Redis::shouldReceive('del')->with('cache_tag:public_data')->andReturn(1);
        Log::shouldReceive('info')->times(2);

        $invalidated = $this->cachingService->invalidateByEvent('movie_updated');
        $this->assertEquals(2, $invalidated);
    }

    /** @test */
    public function it_gets_cache_statistics_with_error_handling()
    {
        // Mock Redis to throw an exception
        Redis::shouldReceive('keys')->andThrow(new \Exception('Redis error'));
        Log::shouldReceive('error');

        $stats = $this->cachingService->getCacheStats();
        
        $this->assertArrayHasKey('error', $stats);
        $this->assertEquals('Failed to retrieve cache statistics', $stats['error']);
    }

    /** @test */
    public function it_clears_cache_with_error_handling()
    {
        // Mock Redis to throw an exception
        Redis::shouldReceive('keys')->andThrow(new \Exception('Redis error'));
        Log::shouldReceive('error');

        $cleared = $this->cachingService->clearAllCache();
        $this->assertEquals(0, $cleared);
    }

    /** @test */
    public function it_determines_private_endpoints_correctly()
    {
        $reflection = new \ReflectionClass($this->cachingService);
        $method = $reflection->getMethod('isPrivateEndpoint');
        $method->setAccessible(true);

        // Test private endpoint
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/user/profile');
        $isPrivate = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertTrue($isPrivate);

        // Test public endpoint
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        $isPrivate = $method->invokeArgs($this->cachingService, [$this->mockRequest]);
        $this->assertFalse($isPrivate);
    }

    /** @test */
    public function it_filters_headers_correctly()
    {
        $reflection = new \ReflectionClass($this->cachingService);
        $method = $reflection->getMethod('filterHeaders');
        $method->setAccessible(true);

        $headers = [
            'Content-Type' => ['application/json'],
            'Authorization' => ['Bearer token'],
            'Cache-Control' => ['public, max-age=3600'],
            'X-Custom-Header' => ['custom value']
        ];

        $filtered = $method->invokeArgs($this->cachingService, [$headers]);
        
        $this->assertArrayHasKey('Content-Type', $filtered);
        $this->assertArrayHasKey('Cache-Control', $filtered);
        $this->assertArrayNotHasKey('Authorization', $filtered);
        $this->assertArrayNotHasKey('X-Custom-Header', $filtered);
    }

    /** @test */
    public function it_validates_cache_data_correctly()
    {
        $reflection = new \ReflectionClass($this->cachingService);
        $method = $reflection->getMethod('isCacheValid');
        $method->setAccessible(true);

        // Test valid cache
        $validCache = ['expires_at' => time() + 3600];
        $isValid = $method->invokeArgs($this->cachingService, [$validCache]);
        $this->assertTrue($isValid);

        // Test expired cache
        $expiredCache = ['expires_at' => time() - 3600];
        $isValid = $method->invokeArgs($this->cachingService, [$expiredCache]);
        $this->assertFalse($isValid);

        // Test malformed cache
        $malformedCache = ['invalid' => 'data'];
        $isValid = $method->invokeArgs($this->cachingService, [$malformedCache]);
        $this->assertFalse($isValid);
    }
}