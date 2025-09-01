<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(Request $request, $movieId)
    {
        $movie = Movie::findOrFail($movieId);

        $validated = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Check if user already reviewed this movie
        $existingReview = Review::where('user_id', $request->user()->id)
            ->where('movie_id', $movieId)
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã đánh giá phim này rồi'
            ], 400);
        }

        $review = Review::create([
            'user_id' => $request->user()->id,
            'movie_id' => $movieId,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'status' => 'pending', // Default status, admin can approve/reject
        ]);

        // Update movie average rating
        $this->updateMovieRating($movie);

        return response()->json([
            'success' => true,
            'data' => $review,
            'message' => 'Đánh giá đã được gửi và đang chờ duyệt'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        // Check if user owns this review
        if ($review->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Không có quyền cập nhật đánh giá này'
            ], 403);
        }

        $validated = $request->validate([
            'rating' => 'sometimes|integer|between:1,5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validated);

        // Update movie average rating
        $this->updateMovieRating($review->movie);

        return response()->json([
            'success' => true,
            'data' => $review,
            'message' => 'Cập nhật đánh giá thành công'
        ]);
    }

    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        // Check if user owns this review or is admin
        if ($review->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Không có quyền xóa đánh giá này'
            ], 403);
        }

        $movie = $review->movie;
        $review->delete();

        // Update movie average rating
        $this->updateMovieRating($movie);

        return response()->json([
            'success' => true,
            'message' => 'Xóa đánh giá thành công'
        ]);
    }

    // Admin methods
    public function adminIndex(Request $request)
    {
        $query = Review::with(['user', 'movie']);

        // Search by user name or movie title
        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            })->orWhereHas('movie', function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by rating
        if ($request->filled('rating')) {
            $query->where('rating', $request->rating);
        }

        // Filter by movie
        if ($request->filled('movie_id')) {
            $query->where('movie_id', $request->movie_id);
        }

        $reviews = $query->orderBy('created_at', 'desc')
                        ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    public function approve($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['status' => 'approved']);

        // Update movie average rating
        $this->updateMovieRating($review->movie);

        return response()->json([
            'success' => true,
            'message' => 'Duyệt đánh giá thành công'
        ]);
    }

    public function reject($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['status' => 'rejected']);

        // Update movie average rating
        $this->updateMovieRating($review->movie);

        return response()->json([
            'success' => true,
            'message' => 'Từ chối đánh giá thành công'
        ]);
    }

    private function updateMovieRating($movie)
    {
        // Calculate new average rating from approved reviews only
        $approvedReviews = $movie->reviews()->where('status', 'approved');
        
        $averageRating = $approvedReviews->avg('rating') ?? 0;
        $totalReviews = $approvedReviews->count();

        $movie->update([
            'average_rating' => round($averageRating, 2),
            'total_reviews' => $totalReviews
        ]);
    }
}
