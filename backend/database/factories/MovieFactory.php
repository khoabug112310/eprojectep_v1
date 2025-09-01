<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Movie>
 */
class MovieFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = $this->faker->unique()->sentence(3);
        
        // Use working placeholder URLs instead of faker image URLs
        $placeholderUrls = [
            'https://picsum.photos/500/750?random=1',
            'https://picsum.photos/500/750?random=2',
            'https://picsum.photos/500/750?random=3',
            'https://picsum.photos/500/750?random=4',
            'https://picsum.photos/500/750?random=5',
            'https://picsum.photos/500/750?random=6',
            'https://picsum.photos/500/750?random=7',
            'https://picsum.photos/500/750?random=8',
            'https://picsum.photos/500/750?random=9',
            'https://picsum.photos/500/750?random=10'
        ];
        
        return [
            'title' => $title,
            // Don't set slug here - let the model generate it
            'synopsis' => $this->faker->paragraph(3),
            'duration' => $this->faker->numberBetween(90, 180),
            'genre' => json_encode($this->faker->randomElements(['Action','Drama','Comedy','Sci-Fi','Horror'], $this->faker->numberBetween(1,3))),
            'language' => $this->faker->randomElement(['Vietnamese','English','Korean','Japanese']),
            'age_rating' => $this->faker->randomElement(['G','PG','PG-13','R']),
            'release_date' => $this->faker->dateTimeBetween('-1 year', '+3 months'),
            'poster_url' => $this->faker->randomElement($placeholderUrls),
            'trailer_url' => 'https://www.youtube.com/watch?v=' . Str::random(8),
            'cast' => json_encode([
                ['name' => $this->faker->name(), 'role' => 'Lead'],
                ['name' => $this->faker->name(), 'role' => 'Support']
            ]),
            'director' => $this->faker->name(),
            // Default values for rating
            'average_rating' => 0.00,
            'total_reviews' => 0,
            'status' => 'active',
        ];
    }
}
