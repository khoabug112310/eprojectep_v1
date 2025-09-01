<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Booking;
use App\Models\Review;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_user()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0123456789',
            'password' => bcrypt('password'),
            'role' => 'user'
        ];

        $user = User::create($userData);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('Test User', $user->name);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertEquals('0123456789', $user->phone);
        $this->assertEquals('user', $user->role);
    }

    /** @test */
    public function it_hides_password_in_array_representation()
    {
        $user = User::factory()->create();
        $userArray = $user->toArray();

        $this->assertArrayNotHasKey('password', $userArray);
    }

    /** @test */
    public function it_has_bookings_relationship()
    {
        $user = User::factory()->create();
        $booking = Booking::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->bookings->contains($booking));
        $this->assertInstanceOf(Booking::class, $user->bookings->first());
    }

    /** @test */
    public function it_has_reviews_relationship()
    {
        $user = User::factory()->create();
        $review = Review::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->reviews->contains($review));
        $this->assertInstanceOf(Review::class, $user->reviews->first());
    }

    /** @test */
    public function it_can_check_if_user_is_admin()
    {
        $user = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertFalse($user->isAdmin());
        $this->assertTrue($admin->isAdmin());
    }

    /** @test */
    public function it_scopes_admin_users()
    {
        User::factory()->create(['role' => 'user']);
        User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'admin']);

        $adminUsers = User::admin()->get();

        $this->assertCount(2, $adminUsers);
        $this->assertTrue($adminUsers->every(fn($user) => $user->role === 'admin'));
    }

    /** @test */
    public function it_scopes_regular_users()
    {
        User::factory()->create(['role' => 'user']);
        User::factory()->create(['role' => 'user']);
        User::factory()->create(['role' => 'admin']);

        $regularUsers = User::regular()->get();

        $this->assertCount(2, $regularUsers);
        $this->assertTrue($regularUsers->every(fn($user) => $user->role === 'user'));
    }

    /** @test */
    public function it_has_fillable_attributes()
    {
        $user = new User();
        $expectedFillable = [
            'name', 'email', 'phone', 'password', 'date_of_birth',
            'preferred_city', 'preferred_language', 'role', 'status'
        ];

        $this->assertEquals($expectedFillable, $user->getFillable());
    }

    /** @test */
    public function it_casts_date_of_birth_to_date()
    {
        $user = User::factory()->create([
            'date_of_birth' => '1990-01-01'
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $user->date_of_birth);
        $this->assertEquals('1990-01-01', $user->date_of_birth->format('Y-m-d'));
    }

    /** @test */
    public function it_has_default_values()
    {
        $user = User::factory()->create();

        $this->assertEquals('user', $user->role);
        $this->assertEquals('active', $user->status);
        $this->assertEquals('vi', $user->preferred_language);
    }

    /** @test */
    public function it_validates_unique_email()
    {
        User::factory()->create(['email' => 'test@example.com']);

        $this->expectException(\Illuminate\Database\QueryException::class);
        User::factory()->create(['email' => 'test@example.com']);
    }

    /** @test */
    public function it_validates_unique_phone()
    {
        User::factory()->create(['phone' => '0123456789']);

        $this->expectException(\Illuminate\Database\QueryException::class);
        User::factory()->create(['phone' => '0123456789']);
    }
}