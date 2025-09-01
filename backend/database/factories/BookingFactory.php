<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Showtime;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_code' => 'CB' . now()->format('Ymd') . str_pad($this->faker->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'user_id' => User::query()->inRandomOrder()->value('id') ?? User::factory(),
            'showtime_id' => Showtime::query()->inRandomOrder()->value('id') ?? Showtime::factory(),
            'seats' => json_encode([
                ['seat' => 'A1', 'type' => 'gold', 'price' => 120000],
                ['seat' => 'A2', 'type' => 'gold', 'price' => 120000]
            ]),
            'total_amount' => 240000,
            'payment_method' => $this->faker->randomElement(['credit_card', 'bank_transfer', 'cash']),
            'payment_status' => $this->faker->randomElement(['pending', 'completed', 'failed', 'refunded']),
            'booking_status' => $this->faker->randomElement(['confirmed', 'cancelled', 'used']),
            'booked_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
