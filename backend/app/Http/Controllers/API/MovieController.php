<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Http\Requests\SecureFileUploadRequest;
use App\Services\FileUploadSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MovieController extends Controller
{
    public function index(Request $request)
    {
        $query = Movie::query();

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Filter by genre
        if ($request->filled('genre')) {
            // Handle both string and JSON array genres
            $genre = $request->genre;
            $query->where(function ($q) use ($genre) {
                $q->where('genre', 'like', '%' . $genre . '%')
                  ->orWhereRaw("JSON_CONTAINS(genre, '\"$genre\"')");
            });
        }

        // Filter by showtime (morning, afternoon, evening, night)
        if ($request->filled('showtime')) {
            $showtime = $request->showtime;
            // Join with showtimes table to filter by actual showtimes
            $query->whereHas('showtimes', function ($q) use ($showtime) {
                switch ($showtime) {
                    case 'morning':
                        $q->whereBetween('show_time', ['09:00:00', '11:59:59']);
                        break;
                    case 'afternoon':
                        $q->whereBetween('show_time', ['12:00:00', '16:59:59']);
                        break;
                    case 'evening':
                        $q->whereBetween('show_time', ['17:00:00', '20:59:59']);
                        break;
                    case 'night':
                        $q->where(function ($subQ) {
                            $subQ->whereBetween('show_time', ['21:00:00', '23:59:59'])
                                 ->orWhereBetween('show_time', ['00:00:00', '08:59:59']);
                        });
                        break;
                }
            });
        }

        // Filter by status (now-showing, coming-soon)
        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'now-showing') {
                $query->where('status', 'active')
                      ->where('release_date', '<=', now());
            } elseif ($status === 'coming-soon') {
                $query->where(function ($q) {
                    $q->where('status', 'coming_soon')
                      ->orWhere('release_date', '>', now());
                });
            }
        }

        // Sort
        $sortBy = $request->get('sort_by', 'title');
        $sortOrder = $request->get('sort_order', 'asc');
        
        switch ($sortBy) {
            case 'rating':
                $query->orderBy('average_rating', 'desc');
                break;
            case 'release_date':
                $query->orderBy('release_date', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            default:
                $query->orderBy($sortBy, $sortOrder);
        }

        $movies = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $movies
        ]);
    }

    public function show($id)
    {
        $movie = Movie::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $movie
        ]);
    }

    public function showtimes($id)
    {
        $movie = Movie::findOrFail($id);
        $showtimes = $movie->showtimes()->with('theater')->get();
        
        return response()->json([
            'success' => true,
            'data' => $showtimes
        ]);
    }

    public function reviews($id)
    {
        $movie = Movie::findOrFail($id);
        $reviews = $movie->reviews()->paginate(10);
        
        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    // Admin methods
    public function adminIndex(Request $request)
    {
        $query = Movie::query();

        // Search by title or director
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('director', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by genre
        if ($request->filled('genre')) {
            $query->where('genre', $request->genre);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $movies = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $movies
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'synopsis' => 'required|string',
            'duration' => 'required|integer|min:1',
            'genre' => 'required|string',
            'language' => 'required|string|max:50',
            'age_rating' => 'nullable|string|max:10',
            'release_date' => 'required|date',
            'poster_url' => 'nullable|string',
            'trailer_url' => 'nullable|string',
            'director' => 'nullable|string',
            'cast' => 'nullable|string',
            'status' => 'required|in:active,inactive,coming_soon',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(4);
        $validated['genre'] = explode(',', $validated['genre']);
        $validated['cast'] = $validated['cast'] ? explode(',', $validated['cast']) : null;

        $movie = Movie::create($validated);

        return response()->json([
            'success' => true,
            'data' => $movie,
            'message' => 'Tạo phim thành công'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $movie = Movie::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'synopsis' => 'sometimes|string',
            'duration' => 'sometimes|integer|min:1',
            'genre' => 'sometimes|string',
            'language' => 'sometimes|string|max:50',
            'age_rating' => 'nullable|string|max:10',
            'release_date' => 'sometimes|date',
            'poster_url' => 'nullable|string',
            'trailer_url' => 'nullable|string',
            'director' => 'nullable|string',
            'cast' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive,coming_soon',
        ]);

        if (isset($validated['genre'])) {
            $validated['genre'] = explode(',', $validated['genre']);
        }

        if (isset($validated['cast'])) {
            $validated['cast'] = $validated['cast'] ? explode(',', $validated['cast']) : null;
        }

        $movie->update($validated);

        return response()->json([
            'success' => true,
            'data' => $movie,
            'message' => 'Cập nhật phim thành công'
        ]);
    }

    public function destroy($id)
    {
        $movie = Movie::findOrFail($id);
        $movie->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa phim thành công'
        ]);
    }
}