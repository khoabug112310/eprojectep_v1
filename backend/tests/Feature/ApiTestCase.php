<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed the database with test data
        $this->artisan('db:seed');
    }

    /**
     * Create authenticated user and return auth headers
     */
    protected function authenticateUser($user = null): array
    {
        if (!$user) {
            $user = \App\Models\User::factory()->create();
        }

        $token = $user->createToken('test-token')->plainTextToken;

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Create authenticated admin and return auth headers
     */
    protected function authenticateAdmin($admin = null): array
    {
        if (!$admin) {
            $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        }

        $token = $admin->createToken('test-token')->plainTextToken;

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Get default API headers
     */
    protected function getApiHeaders(): array
    {
        return [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Assert API response structure
     */
    protected function assertApiResponse($response, $expectedStatus = 200, $hasData = true): void
    {
        $response->assertStatus($expectedStatus)
                ->assertJsonStructure([
                    'success',
                    $hasData ? 'data' : null
                ])
                ->assertJson([
                    'success' => true
                ]);
    }

    /**
     * Assert API error response
     */
    protected function assertApiError($response, $expectedStatus = 422, $hasErrors = false): void
    {
        $response->assertStatus($expectedStatus)
                ->assertJsonStructure([
                    'success'
                ])
                ->assertJson([
                    'success' => false
                ]);
    }

    /**
     * Assert pagination structure
     */
    protected function assertPaginatedResponse($response): void
    {
        $response->assertJsonStructure([
            'success',
            'data' => [
                'data',
                'current_page',
                'last_page',
                'per_page',
                'total'
            ]
        ]);
    }
}