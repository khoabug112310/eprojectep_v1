<?php

namespace Tests\Traits;

use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;
use App\Models\Booking;
use App\Models\Review;

trait CreatesTestData
{
    /**
     * Create test user
     */
    protected function createUser(array $attributes = []): User
    {
        // Generate unique email to avoid conflicts in tests
        $defaultAttributes = [
            'email' => 'user' . uniqid() . '@test.com'
        ];
        
        return User::factory()->create(array_merge($defaultAttributes, $attributes));
    }

    /**
     * Create test admin
     */
    protected function createAdmin(array $attributes = []): User
    {
        return User::factory()->create(array_merge(['role' => 'admin'], $attributes));
    }

    /**
     * Create test movie
     */
    protected function createMovie(array $attributes = []): Movie
    {
        return Movie::factory()->create($attributes);
    }

    /**
     * Create test theater
     */
    protected function createTheater(array $attributes = []): Theater
    {
        return Theater::factory()->create($attributes);
    }

    /**
     * Create test showtime
     */
    protected function createShowtime(array $attributes = []): Showtime
    {
        if (!isset($attributes['movie_id'])) {
            $attributes['movie_id'] = $this->createMovie()->id;
        }
        
        if (!isset($attributes['theater_id'])) {
            $attributes['theater_id'] = $this->createTheater()->id;
        }

        return Showtime::factory()->create($attributes);
    }

    /**
     * Create test booking
     */
    protected function createBooking(array $attributes = []): Booking
    {
        if (!isset($attributes['user_id'])) {
            $attributes['user_id'] = $this->createUser()->id;
        }
        
        if (!isset($attributes['showtime_id'])) {
            $attributes['showtime_id'] = $this->createShowtime()->id;
        }

        return Booking::factory()->create($attributes);
    }

    /**
     * Create test review
     */
    protected function createReview(array $attributes = []): Review
    {
        if (!isset($attributes['user_id'])) {
            $attributes['user_id'] = $this->createUser()->id;
        }
        
        if (!isset($attributes['movie_id'])) {
            $attributes['movie_id'] = $this->createMovie()->id;
        }

        return Review::factory()->create($attributes);
    }

    /**
     * Create complete booking flow test data
     */
    protected function createBookingFlow(): array
    {
        $user = $this->createUser();
        $movie = $this->createMovie();
        $theater = $this->createTheater();
        $showtime = $this->createShowtime([
            'movie_id' => $movie->id,
            'theater_id' => $theater->id,
            'show_date' => now()->addDays(1)->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);

        return [
            'user' => $user,
            'movie' => $movie,
            'theater' => $theater,
            'showtime' => $showtime
        ];
    }

    /**
     * Create test booking data
     */
    protected function getBookingData(Showtime $showtime): array
    {
        return [
            'showtime_id' => $showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A2', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];
    }
}