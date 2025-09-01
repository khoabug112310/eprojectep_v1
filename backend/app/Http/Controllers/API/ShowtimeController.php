<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Showtime;
use App\Models\Movie;
use App\Models\Theater;
use Illuminate\Http\Request;

class ShowtimeController extends Controller
{
    public function index(Request $request)
    {
        $query = Showtime::with(['movie', 'theater']);

        // Filter by movie
        if ($request->filled('movie_id')) {
            $query->where('movie_id', $request->movie_id);
        }

        // Filter by theater
        if ($request->filled('theater_id')) {
            $query->where('theater_id', $request->theater_id);
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->where('show_date', $request->date);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $showtimes = $query->orderBy('show_date')->orderBy('show_time')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $showtimes
        ]);
    }

    public function show($id)
    {
        $showtime = Showtime::with(['movie', 'theater'])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $showtime
        ]);
    }

    public function seats($id)
    {
        $showtime = Showtime::with(['movie', 'theater'])->findOrFail($id);
        
        // Generate seat map (dummy data for now)
        $seatMap = $this->generateSeatMap($showtime);
        
        return response()->json([
            'success' => true,
            'data' => [
                'showtime' => $showtime,
                'seat_map' => $seatMap
            ],
            'message' => 'Lấy thông tin ghế thành công'
        ]);
    }

    public function lockSeats(Request $request, $id)
    {
        $request->validate([
            'seats' => 'required|array|min:1',
            'seats.*' => 'required|string'
        ]);

        // In a real application, you would lock seats in Redis or database
        // For now, just return success
        return response()->json([
            'success' => true,
            'message' => 'Đã khóa ghế thành công',
            'data' => [
                'locked_seats' => $request->seats,
                'expires_at' => now()->addMinutes(15)
            ]
        ]);
    }

    public function releaseSeats(Request $request, $id)
    {
        $request->validate([
            'seats' => 'required|array|min:1',
            'seats.*' => 'required|string'
        ]);

        // In a real application, you would release seats from Redis or database
        return response()->json([
            'success' => true,
            'message' => 'Đã giải phóng ghế thành công'
        ]);
    }

    // Admin methods
    public function adminIndex(Request $request)
    {
        $query = Showtime::with(['movie', 'theater']);

        // Search by movie title or theater name
        if ($request->filled('search')) {
            $query->whereHas('movie', function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%');
            })->orWhereHas('theater', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by movie
        if ($request->filled('movie_id')) {
            $query->where('movie_id', $request->movie_id);
        }

        // Filter by theater
        if ($request->filled('theater_id')) {
            $query->where('theater_id', $request->theater_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->where('show_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('show_date', '<=', $request->to_date);
        }

        $showtimes = $query->orderBy('show_date', 'desc')
                          ->orderBy('show_time')
                          ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $showtimes,
            'message' => 'Lấy danh sách lịch chiếu admin thành công'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'movie_id' => 'required|exists:movies,id',
            'theater_id' => 'required|exists:theaters,id',
            'show_date' => 'required|date|after_or_equal:today',
            'show_time' => 'required|date_format:H:i',
            'prices' => 'required|string', // JSON string of prices
            'status' => 'required|in:active,inactive,cancelled',
        ]);

        // Convert prices string to array
        $validated['prices'] = json_decode($validated['prices'], true);

        $showtime = Showtime::create($validated);

        return response()->json([
            'success' => true,
            'data' => $showtime->load(['movie', 'theater']),
            'message' => 'Tạo lịch chiếu thành công'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $showtime = Showtime::findOrFail($id);

        $validated = $request->validate([
            'movie_id' => 'sometimes|exists:movies,id',
            'theater_id' => 'sometimes|exists:theaters,id',
            'show_date' => 'sometimes|date',
            'show_time' => 'sometimes|date_format:H:i',
            'prices' => 'sometimes|string',
            'status' => 'sometimes|in:active,inactive,cancelled',
        ]);

        // Convert prices string to array if provided
        if (isset($validated['prices'])) {
            $validated['prices'] = json_decode($validated['prices'], true);
        }

        $showtime->update($validated);

        return response()->json([
            'success' => true,
            'data' => $showtime->load(['movie', 'theater']),
            'message' => 'Cập nhật lịch chiếu thành công'
        ]);
    }

    public function destroy($id)
    {
        $showtime = Showtime::findOrFail($id);
        $showtime->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa lịch chiếu thành công'
        ]);
    }

    private function generateSeatMap($showtime)
    {
        // Generate dummy seat map
        $rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        $seats = [];
        
        foreach ($rows as $row) {
            for ($i = 1; $i <= 10; $i++) {
                $seatNumber = $row . $i;
                $seats[] = [
                    'seat' => $seatNumber,
                    'status' => 'available', // available, occupied, locked
                    'type' => 'gold', // gold, platinum, box
                    'price' => 100000
                ];
            }
        }

        return $seats;
    }
}
