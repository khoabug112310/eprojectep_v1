<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Theater>
 */
class TheaterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company() . ' Cinema',
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->randomElement(['Hanoi','Ho Chi Minh','Da Nang']),
            'total_seats' => 250,
            'seat_configuration' => json_encode([ 'gold' => 120, 'platinum' => 100, 'box' => 30 ]),
            'facilities' => json_encode($this->faker->randomElements(['3D','IMAX','Dolby Atmos'], 2)),
            'status' => 'active',
        ];
    }
}
