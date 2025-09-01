<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\Feature\ApiTestCase;
use Tests\Traits\CreatesTestData;
use Illuminate\Support\Facades\Hash;

class AuthControllerTest extends ApiTestCase
{
    use CreatesTestData;

    /** @test */
    public function it_can_register_a_new_user()
    {
        $uniqueId = uniqid();
        $userData = [
            'name' => 'Test User',
            'email' => "test{$uniqueId}@example.com",
            'phone' => '012345' . substr($uniqueId, -4),
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $this->assertApiResponse($response, 201);
        $this->assertArrayHasKey('token', $response->json('data'));
        $this->assertArrayHasKey('user', $response->json('data'));
        
        $this->assertDatabaseHas('users', [
            'email' => $userData['email'],
            'phone' => $userData['phone']
        ]);
    }

    /** @test */
    public function it_validates_registration_data()
    {
        $invalidData = [
            'name' => '',
            'email' => 'invalid-email',
            'phone' => '123', // Too short
            'password' => '123' // Too short
        ];

        $response = $this->postJson('/api/v1/auth/register', $invalidData);

        $this->assertApiError($response, 422, true);
        $this->assertArrayHasKey('errors', $response->json());
    }

    /** @test */
    public function it_prevents_duplicate_email_registration()
    {
        $existingUser = $this->createUser(['email' => 'test@example.com']);

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0987654321',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $this->assertApiError($response, 422, true);
    }

    /** @test */
    public function it_can_login_with_valid_credentials()
    {
        $user = $this->createUser([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'password123'
        ];

        $response = $this->postJson('/api/v1/auth/login', $loginData);

        $this->assertApiResponse($response);
        $this->assertArrayHasKey('token', $response->json('data'));
        $this->assertArrayHasKey('user', $response->json('data'));
        $this->assertEquals($user->id, $response->json('data.user.id'));
    }

    /** @test */
    public function it_rejects_invalid_login_credentials()
    {
        $user = $this->createUser([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'wrongpassword'
        ];

        $response = $this->postJson('/api/v1/auth/login', $loginData);

        $this->assertApiError($response, 422, true);
    }

    /** @test */
    public function it_can_logout_authenticated_user()
    {
        $user = $this->createUser();
        $headers = $this->authenticateUser($user);

        $response = $this->postJson('/api/v1/auth/logout', [], $headers);

        $this->assertApiResponse($response);
        $this->assertEquals('Đăng xuất thành công', $response->json('message'));
    }

    /** @test */
    public function it_requires_authentication_for_logout()
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $this->assertApiError($response, 401);
    }

    /** @test */
    public function it_can_get_authenticated_user_profile()
    {
        $user = $this->createUser();
        $headers = $this->authenticateUser($user);

        $response = $this->getJson('/api/v1/auth/me', $headers);

        $this->assertApiResponse($response);
        $this->assertEquals($user->id, $response->json('data.id'));
        $this->assertEquals($user->email, $response->json('data.email'));
    }

    /** @test */
    public function it_can_update_user_profile()
    {
        $user = $this->createUser();
        $headers = $this->authenticateUser($user);

        $updateData = [
            'name' => 'Updated Name',
            'phone' => '0987654321',
            'preferred_city' => 'Ha Noi'
        ];

        $response = $this->putJson('/api/v1/auth/profile', $updateData, $headers);

        $this->assertApiResponse($response);
        $this->assertEquals('Updated Name', $response->json('data.name'));
        $this->assertEquals('0987654321', $response->json('data.phone'));
        $this->assertEquals('Ha Noi', $response->json('data.preferred_city'));
    }

    /** @test */
    public function it_can_change_password()
    {
        $user = $this->createUser([
            'password' => Hash::make('oldpassword')
        ]);
        $headers = $this->authenticateUser($user);

        $passwordData = [
            'current_password' => 'oldpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ];

        $response = $this->putJson('/api/v1/auth/change-password', $passwordData, $headers);

        $this->assertApiResponse($response);
        
        // Verify old password no longer works
        $loginData = [
            'email' => $user->email,
            'password' => 'oldpassword'
        ];
        $loginResponse = $this->postJson('/api/v1/auth/login', $loginData);
        $this->assertApiError($loginResponse, 422);

        // Verify new password works
        $loginData['password'] = 'newpassword123';
        $newLoginResponse = $this->postJson('/api/v1/auth/login', $loginData);
        $this->assertApiResponse($newLoginResponse);
    }

    /** @test */
    public function it_validates_current_password_when_changing()
    {
        $user = $this->createUser([
            'password' => Hash::make('oldpassword')
        ]);
        $headers = $this->authenticateUser($user);

        $passwordData = [
            'current_password' => 'wrongpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ];

        $response = $this->putJson('/api/v1/auth/change-password', $passwordData, $headers);

        $this->assertApiError($response, 422, true);
    }

    /** @test */
    public function it_can_initiate_forgot_password()
    {
        $user = $this->createUser(['email' => 'test@example.com']);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'test@example.com'
        ]);

        $this->assertApiResponse($response);
        $this->assertStringContainsString('reset', $response->json('message'));
    }

    /** @test */
    public function it_handles_forgot_password_for_non_existent_email()
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nonexistent@example.com'
        ]);

        $this->assertApiError($response, 422, true);
    }
}