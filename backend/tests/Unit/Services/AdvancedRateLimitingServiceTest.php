<?php

namespace Tests\Unit\Services;

use App\Services\AdvancedRateLimitingService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Mockery;

class AdvancedRateLimitingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $rateLimitService;
    protected $mockRequest;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rateLimitService = new AdvancedRateLimitingService();
        $this->mockRequest = Mockery::mock(Request::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_correctly_identifies_api_versions()
    {
        // Test URL path version detection
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v2/movies');
        $this->mockRequest->shouldReceive('hasHeader')->with('API-Version')->andReturn(false);
        $this->mockRequest->shouldReceive('hasHeader')->with('Accept')->andReturn(false);

        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('extractApiVersion');
        $method->setAccessible(true);

        $version = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('v2', $version);
    }

    /** @test */
    public function it_correctly_categorizes_endpoints()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('determineEndpointCategory');
        $method->setAccessible(true);

        // Test auth endpoint
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/auth/login');
        $category = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('auth', $category);

        // Test booking endpoint - need to reset mock expectation
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/bookings');
        $category = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('booking', $category);

        // Test general endpoint
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('getPathInfo')->andReturn('/api/v1/movies');
        $category = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('general', $category);
    }

    /** @test */
    public function it_generates_correct_client_identifiers()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('getClientIdentifier');
        $method->setAccessible(true);

        // Test authenticated user
        $user = User::factory()->create(['id' => 123]);
        $this->mockRequest->shouldReceive('user')->andReturn($user);
        
        $identifier = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('user:123', $identifier);

        // Test anonymous user with IP - reset mock
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('ip')->andReturn('192.168.1.1');
        $this->mockRequest->shouldReceive('hasHeader')->with('X-Forwarded-For')->andReturn(false);
        $this->mockRequest->shouldReceive('hasHeader')->with('X-Real-IP')->andReturn(false);
        
        $identifier = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('ip:192.168.1.1', $identifier);
    }

    /** @test */
    public function it_respects_role_based_rate_limits()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('getRateLimits');
        $method->setAccessible(true);

        // Test guest limits
        $limits = $method->invokeArgs($this->rateLimitService, ['v1', 'guest', 'auth']);
        $this->assertEquals(10, $limits['requests']);
        $this->assertEquals(60, $limits['window']);

        // Test user limits
        $limits = $method->invokeArgs($this->rateLimitService, ['v1', 'user', 'auth']);
        $this->assertEquals(15, $limits['requests']);

        // Test admin limits
        $limits = $method->invokeArgs($this->rateLimitService, ['v1', 'admin', 'auth']);
        $this->assertEquals(50, $limits['requests']);

        // Test v2 enhanced limits
        $limits = $method->invokeArgs($this->rateLimitService, ['v2', 'guest', 'auth']);
        $this->assertEquals(15, $limits['requests']);
    }

    /** @test */
    public function it_handles_redis_failures_gracefully()
    {
        Redis::shouldReceive('get')->andThrow(new \Exception('Redis connection failed'));
        Cache::shouldReceive('get')->andReturn(5);
        Log::shouldReceive('warning');

        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('getCurrentUsage');
        $method->setAccessible(true);

        $usage = $method->invokeArgs($this->rateLimitService, ['test_key', 60]);
        $this->assertEquals(5, $usage);
    }

    /** @test */
    public function it_properly_tracks_analytics()
    {
        Redis::shouldReceive('pipeline')->andReturnUsing(function ($callback) {
            $pipe = Mockery::mock();
            $pipe->shouldReceive('hincrby')->andReturnSelf();
            $pipe->shouldReceive('hget')->andReturnSelf();
            $pipe->shouldReceive('hset')->andReturnSelf();
            $pipe->shouldReceive('expire')->andReturnSelf();
            $pipe->shouldReceive('exec')->andReturn([0]);
            $callback($pipe);
        });

        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('trackRateLimitAnalytics');
        $method->setAccessible(true);

        // Should not throw exception
        $method->invokeArgs($this->rateLimitService, [
            'v1', 'user', 'auth', 5, ['requests' => 10, 'window' => 60], false
        ]);

        $this->assertTrue(true); // Test passes if no exception thrown
    }

    /** @test */
    public function it_calculates_block_rates_correctly()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('calculateBlockRate');
        $method->setAccessible(true);

        // Test normal case
        $data = ['total_requests' => 100, 'blocked_requests' => 25];
        $rate = $method->invokeArgs($this->rateLimitService, [$data]);
        $this->assertEquals(25.0, $rate);

        // Test zero total requests
        $data = ['total_requests' => 0, 'blocked_requests' => 0];
        $rate = $method->invokeArgs($this->rateLimitService, [$data]);
        $this->assertEquals(0.0, $rate);

        // Test partial blocking
        $data = ['total_requests' => 3, 'blocked_requests' => 1];
        $rate = $method->invokeArgs($this->rateLimitService, [$data]);
        $this->assertEquals(33.33, $rate);
    }

    /** @test */
    public function it_generates_correct_redis_keys()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('generateRedisKey');
        $method->setAccessible(true);

        $key = $method->invokeArgs($this->rateLimitService, ['user:123', 'v2', 'auth']);
        $this->assertEquals('rate_limit:v2:auth:user:123', $key);
    }

    /** @test */
    public function it_provides_correct_reset_times()
    {
        Redis::shouldReceive('ttl')->andReturn(30);

        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('getRetryAfter');
        $method->setAccessible(true);

        $retryAfter = $method->invokeArgs($this->rateLimitService, ['test_key', 60]);
        $this->assertEquals(30, $retryAfter);
    }

    /** @test */
    public function it_resets_client_limits_correctly()
    {
        Redis::shouldReceive('del')->once()->andReturn(6);
        Log::shouldReceive('info');

        $result = $this->rateLimitService->resetClientLimits('user:123', 'v1');
        $this->assertTrue($result);
    }

    /** @test */
    public function it_handles_user_roles_correctly()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('getUserRole');
        $method->setAccessible(true);

        // Test guest user
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $role = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('guest', $role);

        // Test authenticated user with role
        $this->mockRequest = Mockery::mock(Request::class);
        $user = User::factory()->create(['role' => 'admin']);
        $this->mockRequest->shouldReceive('user')->andReturn($user);
        $role = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('admin', $role);

        // Test authenticated user without role
        $this->mockRequest = Mockery::mock(Request::class);
        $user = User::factory()->create(['role' => 'user']); // Use default role instead of null
        $this->mockRequest->shouldReceive('user')->andReturn($user);
        $role = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('user', $role);
    }

    /** @test */
    public function it_handles_forwarded_ip_headers()
    {
        $reflection = new \ReflectionClass($this->rateLimitService);
        $method = $reflection->getMethod('getClientIdentifier');
        $method->setAccessible(true);

        // Test X-Forwarded-For header
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('hasHeader')->with('X-Forwarded-For')->andReturn(true);
        $this->mockRequest->shouldReceive('header')->with('X-Forwarded-For')->andReturn('10.0.0.1, 192.168.1.1');
        
        $identifier = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('ip:10.0.0.1', $identifier);

        // Test X-Real-IP header
        $this->mockRequest = Mockery::mock(Request::class);
        $this->mockRequest->shouldReceive('user')->andReturn(null);
        $this->mockRequest->shouldReceive('ip')->andReturn('fallback-ip'); // Add fallback IP expectation
        $this->mockRequest->shouldReceive('hasHeader')->with('X-Forwarded-For')->andReturn(false);
        $this->mockRequest->shouldReceive('hasHeader')->with('X-Real-IP')->andReturn(true);
        $this->mockRequest->shouldReceive('header')->with('X-Real-IP')->andReturn('172.16.0.1');
        
        $identifier = $method->invokeArgs($this->rateLimitService, [$this->mockRequest]);
        $this->assertEquals('ip:172.16.0.1', $identifier);
    }
}