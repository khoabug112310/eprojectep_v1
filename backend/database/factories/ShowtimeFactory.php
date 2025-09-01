<?php

namespace Database\Factories;

use App\Models\Movie;
use App\Models\Theater;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Showtime>
 */
class ShowtimeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $date = $this->faker->dateTimeBetween('now', '+7 days');
        return [
            'movie_id' => Movie::query()->inRandomOrder()->value('id') ?? Movie::factory(),
            'theater_id' => Theater::query()->inRandomOrder()->value('id') ?? Theater::factory(),
            'show_date' => $date->format('Y-m-d'),
            'show_time' => $this->faker->randomElement(['10:00','13:00','16:00','19:00','21:00']),
            'prices' => json_encode([ 'gold' => 120000, 'platinum' => 150000, 'box' => 200000 ]),
            'available_seats' => json_encode([ 'gold' => [], 'platinum' => [], 'box' => [] ]),
            'status' => 'active',
        ];
    }
}
