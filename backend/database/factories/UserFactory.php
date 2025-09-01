<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $prefixes = ['03', '05', '07', '08', '09'];
        $prefix = $prefixes[array_rand($prefixes)];
        $phone = $prefix . str_pad(random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);
        
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => $phone,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'date_of_birth' => fake()->optional()->dateTimeBetween('-60 years', '-18 years')?->format('Y-m-d'),
            'preferred_city' => fake()->optional()->randomElement(['Ho Chi Minh City', 'Ha Noi', 'Da Nang', 'Can Tho']),
            'preferred_language' => 'vi',
            'role' => 'user',
            'status' => 'active',
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
