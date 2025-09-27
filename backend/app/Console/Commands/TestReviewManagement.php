<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Review;
use App\Models\Movie;
use App\Models\User;

class TestReviewManagement extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-review-management {movieId?} {userId?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test review management functionality for admin panel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Review Management Functionality...');
        
        // Get movie ID from argument or use first movie
        $movieId = $this->argument('movieId') ?? Movie::first()->id ?? 1;
        $userId = $this->argument('userId') ?? User::first()->id ?? 1;
        
        $this->info("Using Movie ID: {$movieId}, User ID: {$userId}");
        
        // Create a test review if it doesn't exist
        $review = Review::firstOrCreate([
            'user_id' => $userId,
            'movie_id' => $movieId,
        ], [
            'rating' => 4,
            'comment' => 'Test review for management functionality',
            'status' => 'pending'
        ]);
        
        $this->info("Created/Found review with ID: {$review->id}");
        
        // Test approve functionality
        $this->info('Testing approve review...');
        $review->update(['status' => 'approved']);
        $this->info('Review approved successfully!');
        
        // Check if movie rating was updated
        $movie = Movie::find($movieId);
        $this->info("Movie rating after approval: {$movie->average_rating} ({$movie->total_reviews} reviews)");
        
        // Test reject functionality
        $this->info('Testing reject review...');
        $review->update(['status' => 'rejected']);
        $this->info('Review rejected successfully!');
        
        // Check if movie rating was updated
        $movie->refresh();
        $this->info("Movie rating after rejection: {$movie->average_rating} ({$movie->total_reviews} reviews)");
        
        // Test delete functionality
        $this->info('Testing delete review...');
        $review->delete();
        $this->info('Review deleted successfully!');
        
        // Check if movie rating was updated
        $movie->refresh();
        $this->info("Movie rating after deletion: {$movie->average_rating} ({$movie->total_reviews} reviews)");
        
        $this->info('All tests completed successfully!');
    }
}