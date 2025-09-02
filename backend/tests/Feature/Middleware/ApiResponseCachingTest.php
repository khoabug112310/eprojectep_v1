<?php

namespace Tests\Feature\Middleware;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use App\Models\Movie;
use App\Models\User;

class ApiResponseCachingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Clear any existing cache
        try {
            Redis::flushdb();
        } catch (\Exception $e) {
            // Redis not available in test environment
        }
    }

    /** @test */
    public function it_caches_movie_list_responses()
    {
        // Create test movies
        Movie::factory()->count(3)->create(['status' => 'active']);

        // Make first request
        $response1 = $this->getJson('/api/v1/movies');
        $response1->assertStatus(200);
        
        // Verify cache miss header
        $this->assertEquals('MISS', $response1->headers->get('X-Cache'));

        // Make second request (should be from cache)
        $response2 = $this->getJson('/api/v1/movies');
        $response2->assertStatus(200);
        
        // Verify cache hit header if Redis is available
        if ($this->isRedisAvailable()) {
            $this->assertEquals('HIT', $response2->headers->get('X-Cache'));
        }
    }

    /** @test */
    public function it_does_not_cache_auth_endpoints()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);

        // Should not have cache headers
        $this->assertNull($response->headers->get('X-Cache'));
    }

    /** @test */
    public function it_does_not_cache_post_requests()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/v1/admin/movies', [
            'title' => 'Test Movie',
            'synopsis' => 'Test synopsis',
            'duration' => 120,
            'genre' => ['Action'],
            'language' => 'English',
            'age_rating' => 'PG-13',
            'release_date' => '2024-01-01',
            'director' => 'Test Director',
            'cast' => [['name' => 'Test Actor', 'role' => 'Lead']]
        ]);

        // Should not have cache headers for POST requests
        $this->assertNull($response->headers->get('X-Cache'));
    }

    /** @test */
    public function it_does_not_cache_error_responses()
    {
        $response = $this->getJson('/api/v1/movies/999999');
        $response->assertStatus(404);

        // Should not have cache headers for error responses
        $this->assertNull($response->headers->get('X-Cache'));
    }

    /** @test */
    public function it_adds_appropriate_cache_headers()
    {
        Movie::factory()->create(['status' => 'active']);

        $response = $this->getJson('/api/v1/movies');
        $response->assertStatus(200);

        // Check for cache-related headers
        $this->assertNotNull($response->headers->get('X-Cache'));
        $this->assertNotNull($response->headers->get('Cache-Control'));
        $this->assertNotNull($response->headers->get('ETag'));
        $this->assertNotNull($response->headers->get('Last-Modified'));
    }

    /** @test */
    public function it_varies_cache_by_api_version()
    {
        Movie::factory()->count(2)->create(['status' => 'active']);

        // Request v1 API
        $v1Response = $this->getJson('/api/v1/movies');
        $v1Response->assertStatus(200);

        // Request v2 API
        $v2Response = $this->getJson('/api/v2/movies');
        $v2Response->assertStatus(200);

        // Both should be cache misses initially
        $this->assertEquals('MISS', $v1Response->headers->get('X-Cache'));
        $this->assertEquals('MISS', $v2Response->headers->get('X-Cache'));
    }

    /** @test */
    public function it_does_not_cache_authenticated_private_endpoints()
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/v1/user/bookings');
        
        // Should not cache private user data
        $this->assertNull($response->headers->get('X-Cache'));
    }

    /** @test */
    public function it_handles_admin_caching_endpoints()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum');

        // Test cache statistics endpoint
        $response = $this->getJson('/api/v1/admin/caching/statistics');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'total_keys',
                'by_tag',
                'by_endpoint_type',
                'memory_usage',
                'hit_rate'
            ]
        ]);

        // Test cache health endpoint
        $response = $this->getJson('/api/v1/admin/caching/health');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'redis_connected',
                'total_keys',
                'memory_usage'
            ]
        ]);
    }

    /** @test */
    public function admin_can_invalidate_cache_by_tags()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/v1/admin/caching/invalidate-tags', [
            'tags' => ['movies', 'public_data']
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'keys_invalidated'
            ],
            'message'
        ]);
    }

    /** @test */
    public function admin_can_clear_all_cache()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/v1/admin/caching/clear-all');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'keys_cleared'
            ],
            'message'
        ]);
    }

    /** @test */
    public function admin_can_warmup_cache()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/v1/admin/caching/warmup', [
            'endpoints' => ['/api/v1/movies', '/api/v1/theaters']
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'message'
        ]);
    }

    /** @test */
    public function non_admin_cannot_access_cache_management()
    {
        $user = User::factory()->create(['role' => 'user']);
        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/v1/admin/caching/statistics');
        $response->assertStatus(403);

        $response = $this->postJson('/api/v1/admin/caching/clear-all');
        $response->assertStatus(403);
    }

    /** @test */
    public function cache_debug_headers_present_in_debug_mode()
    {
        config(['app.debug' => true]);
        
        Movie::factory()->create(['status' => 'active']);

        $response = $this->getJson('/api/v1/movies');
        $response->assertStatus(200);

        // Should have debug header when debug mode is on
        $debugHeader = $response->headers->get('X-Cache-Debug');
        $this->assertNotNull($debugHeader);
        
        $debugData = json_decode($debugHeader, true);
        $this->assertArrayHasKey('from_cache', $debugData);
        $this->assertArrayHasKey('timestamp', $debugData);
        $this->assertArrayHasKey('endpoint', $debugData);
    }

    /** @test */
    public function cache_respects_content_type_restrictions()
    {
        // Create a route that returns non-JSON content
        $response = $this->get('/api/docs/openapi.yaml');
        
        // Should not have cache headers for non-JSON responses
        if ($response->isSuccessful()) {
            $contentType = $response->headers->get('Content-Type');
            if (!str_contains($contentType, 'application/json')) {
                $this->assertNull($response->headers->get('X-Cache'));
            }
        }
    }

    /**
     * Check if Redis is available for testing
     */
    private function isRedisAvailable(): bool
    {
        try {
            Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}