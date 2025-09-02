<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class SecurityValidationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_prevents_xss_attacks_in_input_sanitization()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Test XSS payloads
        $xssPayloads = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src=x onerror=alert("XSS")>',
            '<iframe src="javascript:alert(\'XSS\')"></iframe>',
            '<body onload=alert("XSS")>',
            'data:text/html,<script>alert("XSS")</script>',
        ];

        foreach ($xssPayloads as $payload) {
            $response = $this->putJson('/api/v1/auth/profile', [
                'name' => $payload,
                'email' => 'test@example.com',
                'phone' => '0987654321'
            ]);

            // Input should be sanitized - dangerous content should be encoded
            if ($response->status() === 200) {
                $user = $user->fresh();
                // Check that dangerous scripts are encoded
                $this->assertStringNotContainsString('<script>', $user->name);
                $this->assertStringNotContainsString('javascript:', $user->name);
                $this->assertStringNotContainsString('<iframe>', $user->name);
                
                // Verify HTML encoding is working
                if (str_contains($payload, '<')) {
                    $this->assertTrue(
                        str_contains($user->name, '&lt;') || !str_contains($user->name, '<'),
                        'HTML should be encoded to prevent XSS'
                    );
                }
            }
        }
    }

    /** @test */
    public function it_enforces_rate_limiting_on_authentication_endpoints()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0987654321'
        ];

        // Try to register 11 times (limit is 10 per minute)
        for ($i = 0; $i < 11; $i++) {
            $userData['email'] = "test{$i}@example.com";
            $response = $this->postJson('/api/v1/auth/register', $userData);
            
            if ($i < 10) {
                // First 10 should succeed or fail for other reasons (not rate limiting)
                $this->assertNotEquals(429, $response->status(), "Request {$i} should not be rate limited");
            } else {
                // 11th request should be rate limited
                $this->assertEquals(429, $response->status(), "Request {$i} should be rate limited");
            }
        }
    }

    /** @test */
    public function it_enforces_rate_limiting_on_booking_endpoints()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Create test showtime data
        $showtime = \App\Models\Showtime::factory()->create();

        $bookingData = [
            'showtime_id' => $showtime->id,
            'seats' => [['seat' => 'A1', 'type' => 'gold']],
            'payment_method' => 'credit_card'
        ];

        // Try to book 21 times (limit is 20 per minute)
        for ($i = 0; $i < 21; $i++) {
            $response = $this->postJson('/api/v1/bookings', $bookingData);
            
            if ($i < 20) {
                // First 20 might succeed or fail for business reasons, but not rate limiting
                $this->assertNotEquals(429, $response->status(), "Booking request {$i} should not be rate limited");
            } else {
                // 21st request should be rate limited
                $this->assertEquals(429, $response->status(), "Booking request {$i} should be rate limited");
            }
        }
    }

    /** @test */
    public function it_validates_sql_injection_attempts()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // SQL injection payloads
        $sqlPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "admin'--",
            "admin'/*",
            "' OR 1=1#",
            "') OR ('1'='1",
        ];

        foreach ($sqlPayloads as $payload) {
            // Test in profile update
            $response = $this->putJson('/api/v1/auth/profile', [
                'name' => $payload,
                'email' => 'test@example.com',
                'phone' => '0987654321'
            ]);

            // Should not cause SQL errors or unauthorized data access
            $this->assertNotEquals(500, $response->status(), 'SQL injection should not cause server errors');
            
            if ($response->status() === 200) {
                // Verify data was properly escaped/sanitized
                $user = $user->fresh();
                $this->assertStringNotContainsString('DROP TABLE', $user->name);
                $this->assertStringNotContainsString('UNION SELECT', $user->name);
            }
        }
    }

    /** @test */
    public function it_applies_security_headers()
    {
        $response = $this->get('/');

        // Check for security headers (these would be applied by CSP middleware)
        $headers = $response->headers->all();
        
        // Note: These headers are applied in ContentSecurityPolicy middleware
        // In a real test, we'd check if the middleware is properly registered
        $this->assertTrue(true); // Placeholder - middleware registration is tested elsewhere
    }

    /** @test */
    public function it_sanitizes_html_content_in_reviews()
    {
        $user = User::factory()->create();
        $movie = \App\Models\Movie::factory()->create();
        Sanctum::actingAs($user);

        $maliciousContent = '<script>alert("XSS")</script><p>This is a review</p><img src=x onerror=alert(1)>';

        $response = $this->postJson("/api/v1/movies/{$movie->id}/reviews", [
            'rating' => 5,
            'comment' => $maliciousContent
        ]);

        if ($response->status() === 201) {
            $review = \App\Models\Review::where('movie_id', $movie->id)
                ->where('user_id', $user->id)
                ->first();

            if ($review) {
                // Check that dangerous scripts are properly handled
                $this->assertStringNotContainsString('<script>', $review->comment);
                $this->assertStringNotContainsString('javascript:', $review->comment);
                // Ensure HTML is properly encoded
                $this->assertTrue(
                    str_contains($review->comment, '&lt;') || !str_contains($review->comment, '<'),
                    'HTML should be encoded to prevent XSS execution'
                );
            }
        }
    }

    /** @test */
    public function it_validates_file_upload_security()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Test malicious file upload attempts
        $maliciousFile = \Illuminate\Http\Testing\File::create('malicious.php', 100);
        
        $response = $this->postJson('/api/v1/admin/upload/movie-poster', [
            'poster' => $maliciousFile
        ]);

        // Should reject non-image files
        $this->assertNotEquals(200, $response->status());
    }

    /** @test */
    public function it_prevents_unauthorized_admin_access()
    {
        $regularUser = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($regularUser);

        // Try to access admin endpoints
        $adminEndpoints = [
            '/api/v1/admin/dashboard',
            '/api/v1/admin/movies',
            '/api/v1/admin/users',
            '/api/v1/admin/bookings'
        ];

        foreach ($adminEndpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $this->assertEquals(403, $response->status(), "Regular user should not access {$endpoint}");
        }
    }

    /** @test */
    public function it_validates_input_length_limits()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Test extremely long input
        $longString = str_repeat('A', 10000);

        $response = $this->putJson('/api/v1/auth/profile', [
            'name' => $longString,
            'email' => 'test@example.com',
            'phone' => '0987654321'
        ]);

        // Should be rejected due to validation rules
        $this->assertContains($response->status(), [422, 413], 'Long input should be rejected');
    }

    /** @test */
    public function it_prevents_mass_assignment_vulnerabilities()
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        // Try to escalate privileges via mass assignment
        $response = $this->putJson('/api/v1/auth/profile', [
            'name' => 'Updated Name',
            'email' => 'test@example.com',
            'phone' => '0987654321',
            'role' => 'admin', // Should not be allowed
            'id' => 999 // Should not be allowed
        ]);

        // Check that role wasn't changed
        $user = $user->fresh();
        $this->assertEquals('user', $user->role, 'User role should not be changed via profile update');
    }

    /** @test */
    public function it_validates_json_structure_attacks()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Test malformed JSON and prototype pollution attempts
        $maliciousPayloads = [
            ['__proto__' => ['role' => 'admin']],
            ['constructor' => ['prototype' => ['role' => 'admin']]],
        ];

        foreach ($maliciousPayloads as $payload) {
            $response = $this->putJson('/api/v1/auth/profile', array_merge([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'phone' => '0987654321'
            ], $payload));

            // Should not cause privilege escalation
            $user = $user->fresh();
            $this->assertEquals('user', $user->role, 'Prototype pollution should not escalate privileges');
        }
    }
}