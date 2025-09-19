<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Showtime;
use App\Models\Movie;
use App\Models\Theater;
use App\Services\SeatLockingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

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
        try {
            $showtime = Showtime::with(['movie', 'theater'])->findOrFail($id);
            
            // Check if Redis extension is loaded
            $redisAvailable = extension_loaded('redis');
            
            if ($redisAvailable) {
                // Get seat status from Redis with error handling
                $seatLockingService = app(SeatLockingService::class);
                $lockStatus = null;
                
                try {
                    $lockStatus = $seatLockingService->getSeatStatus($showtime->id);
                } catch (Exception $e) {
                    // Log the error but continue with base seat map
                    \Log::warning('Failed to get seat status from Redis', [
                        'error' => $e->getMessage(),
                        'showtime_id' => $showtime->id
                    ]);
                }
                
                // Generate base seat map
                $baseSeatMap = $this->generateSeatMap($showtime);
                
                // Merge with lock status if available
                if ($lockStatus && $lockStatus['success']) {
                    $lockedSeats = collect($lockStatus['seat_status']['locked'] ?? []);
                    $occupiedSeats = collect($lockStatus['seat_status']['occupied'] ?? []);
                    
                    foreach ($baseSeatMap as &$seat) {
                        $seatCode = $seat['seat'];
                        
                        // Check if seat is occupied (booked)
                        if ($occupiedSeats->contains('seat', $seatCode)) {
                            $seat['status'] = 'occupied';
                            continue;
                        }
                        
                        // Check if seat is locked by someone
                        $lockInfo = $lockedSeats->firstWhere('seat', $seatCode);
                        if ($lockInfo) {
                            $seat['status'] = 'locked';
                            $seat['locked_by'] = $lockInfo['user_id'];
                            $seat['locked_at'] = $lockInfo['locked_at'] ?? now()->toISOString();
                            $seat['expires_at'] = $lockInfo['expires_at'] ?? now()->addMinutes(15)->toISOString();
                            
                            // If current user owns the lock, mark as selected
                            if (Auth::id() && $lockInfo['user_id'] === Auth::id()) {
                                $seat['status'] = 'selected';
                            }
                        }
                    }
                }
            } else {
                // Redis not available, generate base seat map only
                \Log::warning('Redis extension not loaded, using fallback seat map generation');
                $baseSeatMap = $this->generateSeatMap($showtime);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'showtime' => $showtime,
                    'seat_map' => $baseSeatMap,
                    'lock_statistics' => $lockStatus['seat_status'] ?? null
                ],
                'message' => 'Seat map retrieved successfully'
            ]);
        } catch (Exception $e) {
            \Log::error('Failed to retrieve seat map', [
                'error' => $e->getMessage(),
                'showtime_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve seat map'
            ], 500);
        }
    }

    /**
     * Lock seats for a user
     */
    public function lockSeats(Request $request, $id, SeatLockingService $seatLockingService)
    {
        $validated = $request->validate([
            'seats' => 'required|array|min:1|max:10',
            'seats.*' => 'required|string|regex:/^[A-Z]\d+$/'
        ]);

        $showtime = Showtime::findOrFail($id);
        $userId = Auth::id();
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required for seat locking'
            ], 401);
        }

        try {
            $result = $seatLockingService->lockSeats(
                $validated['seats'],
                $showtime->id,
                $userId
            );

            $statusCode = $result['success'] ? 200 : 409;
            
            return response()->json($result, $statusCode);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Seat locking service temporarily unavailable'
            ], 503);
        }
    }

    /**
     * Unlock seats for a user
     */
    public function unlockSeats(Request $request, $id, SeatLockingService $seatLockingService)
    {
        $validated = $request->validate([
            'seats' => 'required|array|min:1',
            'seats.*' => 'required|string|regex:/^[A-Z]\d+$/'
        ]);

        $showtime = Showtime::findOrFail($id);
        $userId = Auth::id();
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required for seat unlocking'
            ], 401);
        }

        $success = $seatLockingService->unlockSeats(
            $validated['seats'],
            $showtime->id,
            $userId
        );

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Seats unlocked successfully' : 'Failed to unlock seats'
        ]);
    }

    /**
     * Extend lock duration for user's seats
     */
    public function extendLock(Request $request, $id, SeatLockingService $seatLockingService)
    {
        $validated = $request->validate([
            'seats' => 'required|array|min:1',
            'seats.*' => 'required|string|regex:/^[A-Z]\d+$/'
        ]);

        $showtime = Showtime::findOrFail($id);
        $userId = Auth::id();
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required for lock extension'
            ], 401);
        }

        $result = $seatLockingService->extendLock(
            $validated['seats'],
            $showtime->id,
            $userId
        );

        return response()->json($result);
    }

    /**
     * Get real-time seat status
     */
    public function seatStatus($id)
    {
        try {
            $showtime = Showtime::with(['movie', 'theater'])->findOrFail($id);
            
            // Check if Redis extension is loaded
            $redisAvailable = extension_loaded('redis');
            
            if ($redisAvailable) {
                // Get seat status from Redis with error handling
                $seatLockingService = app(SeatLockingService::class);
                $lockStatus = null;
                
                try {
                    $lockStatus = $seatLockingService->getSeatStatus($showtime->id);
                } catch (Exception $e) {
                    // Log the error but continue with base seat map
                    \Log::warning('Failed to get seat status from Redis in seatStatus endpoint', [
                        'error' => $e->getMessage(),
                        'showtime_id' => $showtime->id
                    ]);
                }
                
                // Generate base seat map
                $baseSeatMap = $this->generateSeatMap($showtime);
                
                // Merge with lock status if available
                if ($lockStatus && $lockStatus['success']) {
                    $lockedSeats = collect($lockStatus['seat_status']['locked'] ?? []);
                    
                    foreach ($baseSeatMap as &$seat) {
                        $lockInfo = $lockedSeats->firstWhere('seat', $seat['seat']);
                        if ($lockInfo) {
                            $seat['status'] = 'locked';
                            $seat['locked_by'] = $lockInfo['user_id'];
                            $seat['locked_at'] = $lockInfo['locked_at'] ?? now()->toISOString();
                            $seat['expires_at'] = $lockInfo['expires_at'] ?? now()->addMinutes(15)->toISOString();
                            
                            // If current user owns the lock, mark as selected
                            if (Auth::id() && $lockInfo['user_id'] === Auth::id()) {
                                $seat['status'] = 'selected';
                            }
                        }
                    }
                }
            } else {
                // Redis not available, generate base seat map only
                \Log::warning('Redis extension not loaded in seatStatus endpoint, using fallback seat map generation');
                $baseSeatMap = $this->generateSeatMap($showtime);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'showtime' => $showtime,
                    'seat_map' => $baseSeatMap ?? $this->generateSeatMap($showtime),
                    'lock_statistics' => $lockStatus['seat_status'] ?? null
                ],
                'message' => 'Seat status retrieved successfully'
            ]);
        } catch (Exception $e) {
            \Log::error('Failed to retrieve seat status in seatStatus endpoint', [
                'error' => $e->getMessage(),
                'showtime_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve seat status'
            ], 500);
        }
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
        // Use actual theater configuration
        $theater = $showtime->theater;
        $prices = is_string($showtime->prices) ? json_decode($showtime->prices, true) : $showtime->prices;
        
        // Get all bookings for this showtime to determine occupied seats
        $bookings = $showtime->bookings()->where('booking_status', 'completed')->get();
        $occupiedSeats = [];
        
        foreach ($bookings as $booking) {
            $seats = is_string($booking->seats) ? json_decode($booking->seats, true) : $booking->seats;
            if (is_array($seats)) {
                foreach ($seats as $seat) {
                    if (is_array($seat) && isset($seat['seat'])) {
                        $occupiedSeats[] = $seat['seat'];
                    } elseif (is_string($seat)) {
                        $occupiedSeats[] = $seat;
                    }
                }
            }
        }
        
        if (!$theater || !$theater->seat_configuration) {
            // Fallback to dummy seat map if no configuration
            $rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            $seats = [];
            
            foreach ($rows as $row) {
                for ($i = 1; $i <= 10; $i++) {
                    $seatNumber = $row . $i;
                    $seats[] = [
                        'seat' => $seatNumber,
                        'status' => in_array($seatNumber, $occupiedSeats) ? 'occupied' : 'available',
                        'type' => 'gold',
                        'price' => $prices['gold'] ?? 100000
                    ];
                }
            }
            
            return $seats;
        }
        
        // Generate seat map based on theater configuration with unified layout
        $seatConfig = is_string($theater->seat_configuration) ? 
                      json_decode($theater->seat_configuration, true) : 
                      $theater->seat_configuration;
        
        $seats = [];
        
        // Calculate total rows and columns for unified layout
        $maxCols = 0;
        $totalRows = 0;
        
        // Get max columns and total rows needed
        foreach ($seatConfig as $section => $config) {
            $maxCols = max($maxCols, $config['cols'] ?? 10);
            $totalRows += $config['rows'] ?? 5;
        }
        
        // Create unified seat layout
        $currentRow = 0;
        $rowPrefixes = range('A', chr(ord('A') + $totalRows - 1));
        
        // Process sections in the order: box (top center), platinum, gold
        $sectionOrder = ['box', 'platinum', 'gold'];
        
        foreach ($sectionOrder as $section) {
            if (!isset($seatConfig[$section])) continue;
            
            $config = $seatConfig[$section];
            $sectionRows = $config['rows'] ?? 5;
            $sectionCols = $config['cols'] ?? 10;
            
            // Calculate offset to center the section
            $colOffset = intval(($maxCols - $sectionCols) / 2);
            
            for ($rowIdx = 0; $rowIdx < $sectionRows; $rowIdx++) {
                $rowChar = $rowPrefixes[$currentRow];
                
                for ($col = 1; $col <= $sectionCols; $col++) {
                    $seatNumber = $rowChar . ($col + $colOffset);
                    $seats[] = [
                        'seat' => $seatNumber,
                        'status' => in_array($seatNumber, $occupiedSeats) ? 'occupied' : 'available',
                        'type' => $section,
                        'price' => $config['price'] ?? ($prices[$section] ?? 100000)
                    ];
                }
                
                $currentRow++;
            }
        }
        
        return $seats;
    }
}
