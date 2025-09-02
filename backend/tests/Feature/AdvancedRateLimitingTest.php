<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use App\Services\AdvancedRateLimitingService;
use Laravel\Sanctum\Sanctum;

class AdvancedRateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Clear any existing rate limit data
        try {
            Redis::flushdb();
        } catch (\Exception $e) {
            // Redis not available, use cache
            Cache::flush();
        }
    }

    /** @test */
    public function it_applies_different_rate_limits_for_different_api_versions()
    {
        // Test v1 guest limits (10 requests for auth)
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
            
            // Should not be rate limited yet
            $this->assertNotEquals(429, $response->status(), "Request {$i} should not be rate limited");
        }

        // 11th request should be rate limited for v1
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);
        $this->assertEquals(429, $response->status());

        // v2 should have higher limits (15 requests for auth)
        for ($i = 0; $i < 15; $i++) {
            $response = $this->postJson('/api/v2/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
            
            $this->assertNotEquals(429, $response->status(), "v2 request {$i} should not be rate limited");
        }

        // 16th request should be rate limited for v2
        $response = $this->postJson('/api/v2/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);
        $this->assertEquals(429, $response->status());
    }

    /** @test */
    public function it_applies_role_based_rate_limits()
    {
        // Test guest user limits
        $this->testRateLimitForRole(null, 'v1', '/api/v1/auth/login', 10);

        // Test regular user limits
        $user = User::factory()->create(['role' => 'user']);
        $this->testRateLimitForRole($user, 'v1', '/api/v1/auth/login', 15);

        // Test admin user limits
        $admin = User::factory()->create(['role' => 'admin']);
        $this->testRateLimitForRole($admin, 'v1', '/api/v1/auth/login', 50);
    }

    /** @test */
    public function it_categorizes_endpoints_correctly()
    {
        // Auth endpoints should have auth category limits
        $this->testEndpointCategory('/api/v1/auth/login', 10);
        $this->testEndpointCategory('/api/v1/auth/register', 10);

        // Booking endpoints should have booking category limits (20 for guest)
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->testEndpointCategory('/api/v1/bookings', 20);
        
        // General endpoints should have general category limits (100 for guest)
        $this->testEndpointCategory('/api/v1/movies', 100);
    }

    /** @test */
    public function it_includes_proper_rate_limit_headers()
    {
        $response = $this->getJson('/api/v1/movies');
        
        $response->assertHeader('X-RateLimit-Limit');
        $response->assertHeader('X-RateLimit-Remaining');
        $response->assertHeader('X-RateLimit-Reset');
        $response->assertHeader('X-RateLimit-Window');
    }

    /** @test */
    public function it_returns_proper_rate_limit_exceeded_response()
    {
        // Exceed the rate limit
        for ($i = 0; $i <= 10; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
        }

        $response->assertStatus(429);
        $response->assertJson([
            'success' => false,
            'message' => 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
            'error_code' => 'RATE_LIMIT_EXCEEDED'
        ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'error_code',
            'details' => [
                'limit',
                'window',
                'retry_after',
                'reset_time'
            ]
        ]);

        $response->assertHeader('Retry-After');
    }

    /** @test */
    public function it_skips_rate_limiting_for_health_endpoints()
    {
        // Health endpoints should not be rate limited
        for ($i = 0; $i < 200; $i++) {
            $response = $this->getJson('/api/health');
            $this->assertNotEquals(429, $response->status());
        }
    }

    /** @test */
    public function it_provides_client_status_endpoint()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/rate-limiting/status');
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'identifier',
                'version',
                'role',
                'categories' => [
                    'auth' => [
                        'current_usage',
                        'limit',
                        'window',
                        'remaining',
                        'reset_time',
                        'percentage_used'
                    ],
                    'booking',
                    'general'
                ]
            ]
        ]);
    }

    /** @test */
    public function admin_can_access_rate_limiting_analytics()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/rate-limiting/analytics');
        $response->assertStatus(200);

        $response = $this->getJson('/api/v1/admin/rate-limiting/configuration');
        $response->assertStatus(200);

        $response = $this->getJson('/api/v1/admin/rate-limiting/health');
        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_reset_client_rate_limits()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/rate-limiting/reset', [
            'identifier' => 'user:123',
            'version' => 'v1'
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Đã reset rate limits thành công'
        ]);
    }

    /** @test */
    public function non_admin_cannot_access_rate_limiting_management()
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/rate-limiting/analytics');
        $response->assertStatus(403);

        $response = $this->postJson('/api/v1/admin/rate-limiting/reset', [
            'identifier' => 'user:123'
        ]);
        $response->assertStatus(403);
    }

    /** @test */
    public function it_handles_redis_failures_gracefully()
    {
        // Mock Redis failure by using an invalid Redis connection
        config(['database.redis.default.host' => 'invalid-host']);

        // Requests should still work, falling back to cache
        $response = $this->getJson('/api/v1/movies');
        $this->assertNotEquals(429, $response->status());
    }

    /** @test */
    public function it_distinguishes_between_authenticated_and_anonymous_users()
    {
        $user = User::factory()->create();

        // Make requests as anonymous user
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
        }

        // Should be rate limited
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);
        $this->assertEquals(429, $response->status());

        // Now act as authenticated user - should have separate limits
        Sanctum::actingAs($user);
        
        for ($i = 0; $i < 15; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
            $this->assertNotEquals(429, $response->status(), "Authenticated user request {$i} should not be rate limited");
        }
    }

    /** @test */
    public function it_tracks_analytics_correctly()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Generate some traffic
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
        }

        // Exceed rate limit to generate blocked requests
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
        }

        Sanctum::actingAs($admin);
        $response = $this->getJson('/api/v1/admin/rate-limiting/analytics');
        
        $response->assertStatus(200);
        
        // Should have analytics data
        $data = $response->json('data.analytics');
        $summary = $response->json('data.summary');
        
        $this->assertNotEmpty($data);
        $this->assertArrayHasKey('total_requests', $summary);
        $this->assertArrayHasKey('total_blocked', $summary);
        $this->assertTrue($summary['total_requests'] > 0);
    }

    /**
     * Helper method to test rate limits for specific roles
     */
    private function testRateLimitForRole($user, string $version, string $endpoint, int $expectedLimit): void
    {
        if ($user) {
            Sanctum::actingAs($user);
        }

        // Clear any existing rate limits for this test
        try {
            Redis::flushdb();
        } catch (\Exception $e) {
            Cache::flush();
        }

        // Make requests up to the limit
        for ($i = 0; $i < $expectedLimit; $i++) {
            $response = $this->postJson($endpoint, [
                'email' => 'test@example.com',
                'password' => 'password'
            ]);
            
            $this->assertNotEquals(429, $response->status(), 
                "Request {$i} for role " . ($user ? $user->role : 'guest') . " should not be rate limited");
        }

        // Next request should be rate limited
        $response = $this->postJson($endpoint, [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);
        
        $this->assertEquals(429, $response->status(), 
            "Request beyond limit for role " . ($user ? $user->role : 'guest') . " should be rate limited");
    }

    /**
     * Helper method to test endpoint categories
     */
    private function testEndpointCategory(string $endpoint, int $expectedLimit): void
    {
        // Clear rate limits
        try {
            Redis::flushdb();
        } catch (\Exception $e) {
            Cache::flush();
        }

        $requestData = str_contains($endpoint, 'login') 
            ? ['email' => 'test@example.com', 'password' => 'password']
            : [];

        $method = str_contains($endpoint, 'bookings') ? 'postJson' : 'getJson';

        // Make requests up to expected limit
        for ($i = 0; $i < $expectedLimit; $i++) {
            if ($method === 'postJson') {
                $response = $this->postJson($endpoint, $requestData);
            } else {
                $response = $this->getJson($endpoint);
            }
            
            $this->assertNotEquals(429, $response->status(), 
                "Request {$i} for endpoint {$endpoint} should not be rate limited");
        }

        // Next request should be rate limited
        if ($method === 'postJson') {
            $response = $this->postJson($endpoint, $requestData);
        } else {
            $response = $this->getJson($endpoint);
        }
        
        $this->assertEquals(429, $response->status(), 
            "Request beyond limit for endpoint {$endpoint} should be rate limited");
    }
}