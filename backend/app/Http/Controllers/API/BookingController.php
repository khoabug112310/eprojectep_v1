<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Showtime;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index()
    {
        //
    }

    public function userBookings(Request $request)
    {
        $user = $request->user();
        
        $query = $user->bookings()->with(['showtime.movie', 'showtime.theater']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('booking_status', $request->status);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $bookings = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $bookings,
            'message' => 'Lấy lịch sử đặt vé thành công'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'showtime_id' => 'required|exists:showtimes,id',
            'seats' => 'required|array|min:1',
            'seats.*.seat' => 'required|string',
            'seats.*.type' => 'required|in:gold,platinum,box',
            'payment_method' => 'nullable|string'
        ]);

        // Get showtime to calculate prices
        $showtime = Showtime::findOrFail($validated['showtime_id']);
        $prices = is_string($showtime->prices) ? json_decode($showtime->prices, true) : $showtime->prices;
        
        // Calculate total amount based on seat types
        $totalAmount = 0;
        foreach ($validated['seats'] as $seat) {
            $seatType = $seat['type'];
            $totalAmount += $prices[$seatType] ?? 100000;
        }

        // Dummy transactional create (chưa trừ ghế thực tế)
        $booking = DB::transaction(function () use ($validated, $request, $totalAmount) {
            // Generate proper booking code format: CB + YYYYMMDD + 3-digit sequence
            $date = now()->format('Ymd');
            $sequence = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            $code = 'CB' . $date . $sequence;
            
            return Booking::create([
                'booking_code' => $code,
                'user_id' => $request->user()->id,
                'showtime_id' => $validated['showtime_id'],
                'seats' => $validated['seats'],
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'] ?? 'credit_card',
                'payment_status' => 'completed',
                'booking_status' => 'confirmed',
                'booked_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $booking,
            'message' => 'Đặt vé thành công'
        ]);
    }

    public function show(string $id)
    {
        $booking = Booking::with(['showtime.movie', 'showtime.theater'])->findOrFail($id);
        
        // Check if user owns this booking or is admin
        if ($booking->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Không có quyền xem booking này'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
            'message' => 'Lấy thông tin booking thành công'
        ]);
    }

    public function cancel(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        
        // Check if user owns this booking or is admin
        if ($booking->user_id !== auth()->id() && auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Không có quyền hủy booking này'
            ], 403);
        }

        // Check if booking can be cancelled
        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'Booking này không thể hủy'
            ], 400);
        }

        $booking->update([
            'booking_status' => 'cancelled'
        ]);

        return response()->json([
            'success' => true,
            'data' => $booking->fresh(),
            'message' => 'Hủy booking thành công'
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Booking::with(['user', 'showtime.movie', 'showtime.theater']);

        // Search by booking code or user name
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('booking_code', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function ($userQuery) use ($request) {
                      $userQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('booking_status', $request->status);
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $bookings = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $bookings,
            'message' => 'Lấy danh sách booking admin thành công'
        ]);
    }

    public function update(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);

        $validated = $request->validate([
            'booking_status' => 'sometimes|in:confirmed,cancelled,completed',
            'payment_status' => 'sometimes|in:pending,completed,failed',
        ]);

        $booking->update($validated);

        return response()->json([
            'success' => true,
            'data' => $booking,
            'message' => 'Cập nhật booking thành công'
        ]);
    }

    public function destroy(string $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa booking thành công'
        ]);
    }
}
