<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Theater;
use Illuminate\Http\Request;

class TheaterController extends Controller
{
    public function index(Request $request)
    {
        $query = Theater::query();

        // Filter by city
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $theaters = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $theaters
        ]);
    }

    public function show($id)
    {
        $theater = Theater::with(['showtimes' => function ($query) {
            $query->where('show_date', '>=', now()->toDateString());
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $theater
        ]);
    }

    // Admin methods
    public function adminIndex(Request $request)
    {
        $query = Theater::query();

        // Search by name or city
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('city', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $theaters = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $theaters
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'total_seats' => 'required|integer|min:1',
            'seat_configuration' => 'nullable|string',
            'facilities' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        // Convert facilities string to array
        if (isset($validated['facilities'])) {
            $validated['facilities'] = explode(',', $validated['facilities']);
        }

        $theater = Theater::create($validated);

        return response()->json([
            'success' => true,
            'data' => $theater,
            'message' => 'Tạo rạp chiếu phim thành công'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $theater = Theater::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'city' => 'sometimes|string|max:100',
            'total_seats' => 'sometimes|integer|min:1',
            'seat_configuration' => 'nullable|string',
            'facilities' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        // Convert facilities string to array
        if (isset($validated['facilities'])) {
            $validated['facilities'] = explode(',', $validated['facilities']);
        }

        $theater->update($validated);

        return response()->json([
            'success' => true,
            'data' => $theater,
            'message' => 'Cập nhật rạp chiếu phim thành công'
        ]);
    }

    public function destroy($id)
    {
        $theater = Theater::findOrFail($id);
        $theater->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa rạp chiếu phim thành công'
        ]);
    }
}
