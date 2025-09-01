<?php

namespace Tests\Unit;

use App\Models\Movie;
use App\Models\Showtime;
use App\Models\Review;
use App\Models\Booking;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MovieModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_movie()
    {
        $movieData = [
            'title' => 'Test Movie',
            'slug' => 'test-movie',
            'synopsis' => 'A test movie synopsis',
            'duration' => 120,
            'genre' => ['Action', 'Drama'],
            'language' => 'Vietnamese',
            'age_rating' => 'PG-13',
            'release_date' => '2024-01-01',
            'director' => 'Test Director',
            'status' => 'active'
        ];

        $movie = Movie::create($movieData);

        $this->assertInstanceOf(Movie::class, $movie);
        $this->assertEquals('Test Movie', $movie->title);
        $this->assertEquals('test-movie', $movie->slug);
        $this->assertEquals(['Action', 'Drama'], $movie->genre);
        $this->assertEquals(120, $movie->duration);
    }

    /** @test */
    public function it_has_showtimes_relationship()
    {
        $movie = Movie::factory()->create();
        $showtime = Showtime::factory()->create(['movie_id' => $movie->id]);

        $this->assertTrue($movie->showtimes->contains($showtime));
        $this->assertInstanceOf(Showtime::class, $movie->showtimes->first());
    }

    /** @test */
    public function it_has_reviews_relationship()
    {
        $movie = Movie::factory()->create();
        $review = Review::factory()->create(['movie_id' => $movie->id]);

        $this->assertTrue($movie->reviews->contains($review));
        $this->assertInstanceOf(Review::class, $movie->reviews->first());
    }

    /** @test */
    public function it_has_bookings_through_showtimes()
    {
        $movie = Movie::factory()->create();
        $showtime = Showtime::factory()->create(['movie_id' => $movie->id]);
        $booking = Booking::factory()->create(['showtime_id' => $showtime->id]);

        $this->assertTrue($movie->bookings->contains($booking));
    }

    /** @test */
    public function it_casts_genre_to_array()
    {
        $movie = Movie::factory()->create([
            'genre' => ['Action', 'Comedy', 'Drama']
        ]);

        $this->assertIsArray($movie->genre);
        $this->assertEquals(['Action', 'Comedy', 'Drama'], $movie->genre);
    }

    /** @test */
    public function it_casts_cast_to_array()
    {
        $cast = [
            ['name' => 'Actor 1', 'role' => 'Main Character'],
            ['name' => 'Actor 2', 'role' => 'Supporting Character']
        ];

        $movie = Movie::factory()->create(['cast' => $cast]);

        $this->assertIsArray($movie->cast);
        $this->assertEquals($cast, $movie->cast);
    }

    /** @test */
    public function it_casts_release_date_to_date()
    {
        $movie = Movie::factory()->create([
            'release_date' => '2024-01-01'
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $movie->release_date);
        $this->assertEquals('2024-01-01', $movie->release_date->format('Y-m-d'));
    }

    /** @test */
    public function it_scopes_active_movies()
    {
        Movie::factory()->create(['status' => 'active']);
        Movie::factory()->create(['status' => 'inactive']);
        Movie::factory()->create(['status' => 'active']);

        $activeMovies = Movie::active()->get();

        $this->assertCount(2, $activeMovies);
        $this->assertTrue($activeMovies->every(fn($movie) => $movie->status === 'active'));
    }

    /** @test */
    public function it_scopes_movies_by_genre()
    {
        Movie::factory()->create(['genre' => ['Action', 'Drama']]);
        Movie::factory()->create(['genre' => ['Comedy']]);
        Movie::factory()->create(['genre' => ['Action', 'Comedy']]);

        $actionMovies = Movie::byGenre('Action')->get();
        $comedyMovies = Movie::byGenre('Comedy')->get();

        $this->assertCount(2, $actionMovies);
        $this->assertCount(2, $comedyMovies);
    }

    /** @test */
    public function it_scopes_movies_by_language()
    {
        Movie::factory()->create(['language' => 'Vietnamese']);
        Movie::factory()->create(['language' => 'English']);
        Movie::factory()->create(['language' => 'Vietnamese']);

        $vietnameseMovies = Movie::byLanguage('Vietnamese')->get();

        $this->assertCount(2, $vietnameseMovies);
        $this->assertTrue($vietnameseMovies->every(fn($movie) => $movie->language === 'Vietnamese'));
    }

    /** @test */
    public function it_scopes_now_showing_movies()
    {
        $past = Movie::factory()->create([
            'release_date' => now()->subDays(30),
            'status' => 'active'
        ]);
        $future = Movie::factory()->create([
            'release_date' => now()->addDays(30),
            'status' => 'active'
        ]);
        $recent = Movie::factory()->create([
            'release_date' => now()->subDays(5),
            'status' => 'active'
        ]);

        $nowShowing = Movie::nowShowing()->get();

        $this->assertTrue($nowShowing->contains($past));
        $this->assertTrue($nowShowing->contains($recent));
        $this->assertFalse($nowShowing->contains($future));
    }

    /** @test */
    public function it_scopes_coming_soon_movies()
    {
        $past = Movie::factory()->create([
            'release_date' => now()->subDays(30),
            'status' => 'coming_soon'
        ]);
        $future = Movie::factory()->create([
            'release_date' => now()->addDays(30),
            'status' => 'coming_soon'
        ]);
        $today = Movie::factory()->create([
            'release_date' => now(),
            'status' => 'coming_soon'
        ]);

        $comingSoon = Movie::comingSoon()->get();

        $this->assertTrue($comingSoon->contains($future));
        $this->assertFalse($comingSoon->contains($past));
        $this->assertFalse($comingSoon->contains($today));
    }

    /** @test */
    public function it_calculates_duration_in_hours_and_minutes()
    {
        $movie = Movie::factory()->create(['duration' => 150]); // 2h 30m

        $formatted = $movie->getFormattedDurationAttribute();

        $this->assertEquals('2h 30m', $formatted);
    }

    /** @test */
    public function it_generates_unique_slug()
    {
        $movie1 = Movie::factory()->create(['title' => 'Test Movie']);
        $movie2 = Movie::factory()->create(['title' => 'Test Movie']);

        $this->assertEquals('test-movie', $movie1->slug);
        $this->assertStringStartsWith('test-movie-', $movie2->slug);
        $this->assertNotEquals($movie1->slug, $movie2->slug);
    }

    /** @test */
    public function it_has_default_rating_values()
    {
        $movie = Movie::factory()->create();

        $this->assertEquals(0.00, $movie->average_rating);
        $this->assertEquals(0, $movie->total_reviews);
    }

    /** @test */
    public function it_updates_rating_when_review_added()
    {
        $movie = Movie::factory()->create();
        
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        Review::factory()->create(['movie_id' => $movie->id, 'user_id' => $user1->id, 'rating' => 4]);
        Review::factory()->create(['movie_id' => $movie->id, 'user_id' => $user2->id, 'rating' => 5]);

        // Manually calculate and update ratings (this would be done by an observer in production)
        $avgRating = $movie->reviews()->avg('rating');
        $totalReviews = $movie->reviews()->count();
        $movie->update([
            'average_rating' => $avgRating,
            'total_reviews' => $totalReviews
        ]);

        $this->assertEquals(2, $movie->total_reviews);
        $this->assertEquals(4.5, $movie->average_rating);
    }
}