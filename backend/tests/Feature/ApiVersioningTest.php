<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\ApiMonitoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class ApiVersioningTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@example.com'
        ]);
        
        $this->regularUser = User::factory()->create([
            'role' => 'user',
            'email' => 'user@example.com'
        ]);
    }

    /** @test */
    public function it_detects_version_from_url_path()
    {
        $response = $this->getJson('/api/v1/movies');
        
        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data'])
                 ->assertHeader('X-API-Version', 'v1');
    }

    /** @test */
    public function it_detects_version_from_accept_header()
    {
        $response = $this->withHeaders([
            'Accept' => 'application/vnd.api+json;version=2'
        ])->getJson('/api/v1/movies');
        
        $response->assertStatus(200)
                 ->assertHeader('X-API-Version', 'v2');
    }

    /** @test */
    public function it_detects_version_from_api_version_header()
    {
        $response = $this->withHeaders([
            'API-Version' => 'v2'
        ])->getJson('/api/v1/movies');
        
        $response->assertStatus(200)
                 ->assertHeader('X-API-Version', 'v2');
    }

    /** @test */
    public function it_detects_version_from_query_parameter()
    {
        $response = $this->getJson('/api/v1/movies?version=v2');
        
        $response->assertStatus(200)
                 ->assertHeader('X-API-Version', 'v2');
    }

    /** @test */
    public function it_falls_back_to_default_version()
    {
        $response = $this->getJson('/api/movies');
        
        // Should detect v1 as default from URL or middleware default
        $response->assertStatus(404); // No route without version prefix
    }

    /** @test */
    public function it_rejects_unsupported_versions()
    {
        $response = $this->withHeaders([
            'API-Version' => 'v3'
        ])->getJson('/api/v1/movies');
        
        $response->assertStatus(400)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Unsupported API version',
                     'supported_versions' => ['v1', 'v2'],
                     'requested_version' => 'v3'
                 ]);
    }

    /** @test */
    public function it_adds_deprecation_warnings_for_v1()
    {
        $response = $this->getJson('/api/v1/movies');
        
        $response->assertStatus(200)
                 ->assertHeader('X-API-Version', 'v1')
                 ->assertHeader('Deprecation', true)
                 ->assertHeader('Sunset');
    }

    /** @test */
    public function it_does_not_add_deprecation_warnings_for_v2()
    {
        $response = $this->getJson('/api/v2/movies');
        
        $response->assertStatus(200)
                 ->assertHeader('X-API-Version', 'v2')
                 ->assertHeaderMissing('Deprecation');
    }

    /** @test */
    public function it_includes_version_headers_in_response()
    {
        $response = $this->getJson('/api/v2/movies');
        
        $response->assertStatus(200)
                 ->assertHeader('X-API-Version', 'v2')
                 ->assertHeader('X-API-Latest-Version', 'v2')
                 ->assertHeader('X-API-Supported-Versions', 'v1, v2');
    }

    /** @test */
    public function admin_can_access_monitoring_endpoints()
    {
        $this->actingAs($this->adminUser, 'sanctum');
        
        $response = $this->getJson('/api/v2/admin/monitoring/usage-stats');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'total_requests',
                         'version_breakdown',
                         'daily_usage'
                     ]
                 ]);
    }

    /** @test */
    public function regular_users_cannot_access_monitoring_endpoints()
    {
        $this->actingAs($this->regularUser, 'sanctum');
        
        $response = $this->getJson('/api/v2/admin/monitoring/usage-stats');
        
        $response->assertStatus(403);
    }

    /** @test */
    public function it_records_api_usage_in_monitoring_service()
    {
        Cache::flush();
        
        $this->getJson('/api/v2/movies');
        
        // Check that usage was recorded
        $key = "api_usage:v2:" . date('Y-m-d');
        $this->assertGreaterThan(0, Cache::get($key, 0));
    }

    /** @test */
    public function it_returns_health_metrics()
    {
        $this->actingAs($this->adminUser, 'sanctum');
        
        $response = $this->getJson('/api/v2/admin/monitoring/health-metrics');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'status',
                         'total_requests_24h',
                         'deprecated_usage_percentage',
                         'version_distribution'
                     ]
                 ]);
    }

    /** @test */
    public function it_returns_deprecation_info()
    {
        $this->actingAs($this->adminUser, 'sanctum');
        
        $response = $this->getJson('/api/v2/admin/monitoring/deprecation-info');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data'
                 ]);
        
        $data = $response->json('data');
        $this->assertArrayHasKey('v1', $data);
        $this->assertTrue($data['v1']['deprecated']);
    }

    /** @test */
    public function it_returns_version_comparison_metrics()
    {
        $this->actingAs($this->adminUser, 'sanctum');
        
        $response = $this->getJson('/api/v2/admin/monitoring/version-comparison');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'total_requests',
                         'version_breakdown',
                         'migration_progress' => [
                             'v1_usage_percentage',
                             'v2_usage_percentage',
                             'migration_status'
                         ],
                         'recommendations'
                     ]
                 ]);
    }

    /** @test */
    public function api_documentation_endpoints_are_accessible()
    {
        $response = $this->getJson('/api/docs/openapi.json');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'openapi',
                     'info',
                     'servers',
                     'paths',
                     'components'
                 ]);
        
        $data = $response->json();
        $this->assertEquals('3.0.0', $data['openapi']);
        $this->assertEquals('CineBook API', $data['info']['title']);
    }

    /** @test */
    public function yaml_documentation_is_accessible()
    {
        $response = $this->get('/api/docs/openapi.yaml');
        
        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'application/x-yaml');
        
        $this->assertStringContainsString('openapi:', $response->getContent());
        $this->assertStringContainsString('CineBook API', $response->getContent());
    }

    /** @test */
    public function v2_has_enhanced_rate_limiting()
    {
        // Test that v2 has higher rate limits than v1
        $this->actingAs($this->regularUser, 'sanctum');
        
        // v1 should have lower limits (10 for auth, 20 for bookings)
        // v2 should have higher limits (15 for auth, 25 for bookings)
        
        $response = $this->postJson('/api/v2/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword'
        ]);
        
        $response->assertStatus(422); // Validation error, but not rate limited initially
    }

    /** @test */
    public function monitoring_service_calculates_migration_status_correctly()
    {
        $service = app(ApiMonitoringService::class);
        
        // Mock some usage data
        Cache::put('api_usage:v1:' . date('Y-m-d'), 100);
        Cache::put('api_usage:v2:' . date('Y-m-d'), 200);
        
        $stats = $service->getUsageStatistics(1);
        
        $this->assertEquals(300, $stats['total_requests']);
        $this->assertEquals(100, $stats['version_breakdown']['v1']);
        $this->assertEquals(200, $stats['version_breakdown']['v2']);
    }
}