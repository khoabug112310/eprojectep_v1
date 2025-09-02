<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Showtime;
use App\Services\PaymentService;
use App\Services\ETicketService;
use App\Services\NotificationService;
use App\Rules\VietnamesePhoneRule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Exception;

class BookingController extends Controller
{
    protected $paymentService;
    protected $eTicketService;

    public function __construct(PaymentService $paymentService, ETicketService $eTicketService)
    {
        $this->paymentService = $paymentService;
        $this->eTicketService = $eTicketService;
    }
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
            'payment_method' => 'nullable|string',
            'customer_info' => 'sometimes|array',
            'customer_info.name' => 'required_with:customer_info|string|min:2|max:255',
            'customer_info.email' => 'required_with:customer_info|email|max:255',
            'customer_info.phone' => ['required_with:customer_info', 'string', new VietnamesePhoneRule()],
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
        if ($booking->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
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
        if ($booking->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
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

    /**
     * Process payment for a booking
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function processPayment(Request $request, string $id)
    {
        try {
            $booking = Booking::findOrFail($id);
            
            // Check if user owns this booking
            if ($booking->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có quyền thanh toán booking này'
                ], 403);
            }

            // Check if booking is already paid
            if ($booking->isPaid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking này đã được thanh toán'
                ], 400);
            }

            // Validate payment data
            $validated = $request->validate([
                'payment_method' => 'required|in:credit_card,debit_card,bank_transfer',
                'customer_info' => 'sometimes|array',
                'customer_info.name' => 'required_with:customer_info|string|min:2|max:255',
                'customer_info.email' => 'required_with:customer_info|email|max:255',
                'customer_info.phone' => ['required_with:customer_info', 'string', new VietnamesePhoneRule()],
                'card_details' => 'required_if:payment_method,credit_card,debit_card|array',
                'card_details.card_number' => 'required_with:card_details|string|regex:/^[0-9]{13,19}$/',
                'card_details.card_holder' => 'required_with:card_details|string|min:2',
                'card_details.expiry_month' => 'required_with:card_details|numeric|between:1,12',
                'card_details.expiry_year' => 'required_with:card_details|numeric|min:' . date('Y'),
                'card_details.cvv' => 'required_with:card_details|string|regex:/^\d{3,4}$/',
            ]);

            // Add booking amount to payment data
            $validated['amount'] = $booking->total_amount;

            // Process payment through PaymentService
            $result = $this->paymentService->processPayment($booking, $validated);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'message' => 'Thanh toán thành công'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'data' => $result['data'],
                    'message' => $result['message']
                ], 422);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thanh toán không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi xử lý thanh toán: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment status for a booking
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPaymentStatus(string $id)
    {
        try {
            $booking = Booking::with(['payment'])->findOrFail($id);
            
            // Check if user owns this booking or is admin
            if ($booking->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có quyền xem trạng thái thanh toán này'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'payment_status' => $booking->payment_status,
                    'booking_status' => $booking->booking_status,
                    'total_amount' => $booking->total_amount,
                    'payment' => $booking->payment ? [
                        'id' => $booking->payment->id,
                        'status' => $booking->payment->status,
                        'payment_method' => $booking->payment->payment_method,
                        'transaction_id' => $booking->payment->transaction_id,
                        'processed_at' => $booking->payment->processed_at,
                    ] : null
                ],
                'message' => 'Lấy trạng thái thanh toán thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy trạng thái thanh toán'
            ], 500);
        }
    }

    /**
     * Get e-ticket data for a booking
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTicket(string $id)
    {
        try {
            $booking = Booking::with(['showtime.movie', 'showtime.theater', 'user'])->findOrFail($id);
            
            // Check if user owns this booking or is admin
            if ($booking->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có quyền xem vé này'
                ], 403);
            }

            // Use ETicketService to get display data
            $result = $this->eTicketService->getTicketDisplayData($booking);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'message' => 'Lấy thông tin vé thành công'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thông tin vé'
            ], 500);
        }
    }

    /**
     * Resend booking confirmation email
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendEmail(string $id)
    {
        try {
            $booking = Booking::with(['showtime.movie', 'showtime.theater', 'user'])->findOrFail($id);
            
            // Check if user owns this booking
            if ($booking->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có quyền gửi lại email cho booking này'
                ], 403);
            }

            // Check if booking is paid and confirmed
            if (!$booking->isPaid() || $booking->booking_status !== 'confirmed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể gửi lại email cho booking đã thanh toán và xác nhận'
                ], 400);
            }

            // Use NotificationService to resend confirmation
            $notificationService = app(\App\Services\NotificationService::class);
            $result = $notificationService->resendBookingConfirmation($booking);
            
            if ($result['success']) {
                return response()->json($result);
            } else {
                return response()->json($result, 400);
            }

        } catch (Exception $e) {
            Log::error('Error resending booking email', [
                'booking_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi gửi lại email'
            ], 500);
        }
    }

    /**
     * Generate or regenerate e-ticket for a booking
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateETicket(string $id)
    {
        try {
            $booking = Booking::with(['showtime.movie', 'showtime.theater', 'user'])->findOrFail($id);
            
            // Check if user owns this booking or is admin
            if ($booking->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có quyền tạo vé cho booking này'
                ], 403);
            }

            // Check if booking is eligible for e-ticket
            if (!$this->eTicketService->isBookingEligibleForTicket($booking)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking không đủ điều kiện tạo e-ticket'
                ], 400);
            }

            // Generate or regenerate e-ticket
            $result = $booking->ticket_data ? 
                $this->eTicketService->regenerateETicket($booking) : 
                $this->eTicketService->generateETicket($booking);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'message' => 'E-ticket đã được tạo thành công'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo e-ticket'
            ], 500);
        }
    }

    /**
     * Verify e-ticket using QR code data
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyTicket(Request $request)
    {
        try {
            $validated = $request->validate([
                'qr_data' => 'required|string'
            ]);

            $result = $this->eTicketService->verifyTicket($validated['qr_data']);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'booking' => $result['data']['booking'],
                        'verification_time' => $result['data']['verification_time'],
                        'status' => $result['data']['status']
                    ],
                    'message' => 'Vé đã được xác thực thành công'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu QR code không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xác thực vé'
            ], 500);
        }
    }

    // ==================== ADMIN PAYMENT MANAGEMENT ====================

    /**
     * Get all payments for admin
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminPayments(Request $request)
    {
        try {
            $query = Payment::with(['booking.user', 'booking.showtime.movie', 'booking.showtime.theater']);

            // Search by booking code or user name
            if ($request->filled('search')) {
                $query->whereHas('booking', function ($q) use ($request) {
                    $q->where('booking_code', 'like', '%' . $request->search . '%')
                      ->orWhereHas('user', function ($userQuery) use ($request) {
                          $userQuery->where('name', 'like', '%' . $request->search . '%')
                                    ->orWhere('email', 'like', '%' . $request->search . '%');
                      });
                });
            }

            // Filter by payment status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by payment method
            if ($request->filled('payment_method')) {
                $query->where('payment_method', $request->payment_method);
            }

            // Filter by date range
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            $payments = $query->orderBy('created_at', 'desc')
                             ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $payments,
                'message' => 'Lấy danh sách payments thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách payments'
            ], 500);
        }
    }

    /**
     * Get payment details for admin
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPaymentDetails(string $id)
    {
        try {
            $payment = Payment::with([
                'booking.user',
                'booking.showtime.movie',
                'booking.showtime.theater'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'payment' => $payment,
                    'booking_details' => $payment->booking,
                    'customer' => $payment->booking->user,
                    'movie' => $payment->booking->showtime->movie,
                    'theater' => $payment->booking->showtime->theater,
                    'showtime' => $payment->booking->showtime
                ],
                'message' => 'Lấy chi tiết payment thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết payment'
            ], 500);
        }
    }

    /**
     * Update payment status (admin only)
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePaymentStatus(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,processing,completed,failed,refunded',
                'reason' => 'nullable|string|max:500'
            ]);

            $payment = Payment::with('booking')->findOrFail($id);
            
            $oldStatus = $payment->status;
            $payment->update([
                'status' => $validated['status'],
                'failure_reason' => $validated['reason'] ?? null,
                'processed_at' => in_array($validated['status'], ['completed', 'failed', 'refunded']) ? now() : null
            ]);

            // Update booking status based on payment status
            if ($validated['status'] === 'completed') {
                $payment->booking->update([
                    'payment_status' => Booking::PAYMENT_COMPLETED,
                    'booking_status' => Booking::STATUS_CONFIRMED
                ]);
            } elseif ($validated['status'] === 'failed') {
                $payment->booking->update([
                    'payment_status' => Booking::PAYMENT_FAILED,
                    'booking_status' => Booking::STATUS_FAILED
                ]);
            } elseif ($validated['status'] === 'refunded') {
                $payment->booking->update([
                    'payment_status' => Booking::PAYMENT_REFUNDED,
                    'booking_status' => Booking::STATUS_CANCELLED
                ]);
            }

            Log::info('Payment status updated by admin', [
                'payment_id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'admin_id' => Auth::id(),
                'reason' => $validated['reason'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment->fresh(),
                'message' => 'Cập nhật trạng thái payment thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái payment'
            ], 500);
        }
    }

    /**
     * Process refund for a payment
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function processRefund(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                'refund_amount' => 'nullable|numeric|min:0',
                'reason' => 'required|string|max:500'
            ]);

            $payment = Payment::with('booking')->findOrFail($id);
            
            if ($payment->status !== Payment::STATUS_COMPLETED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể hoàn tiền cho payment đã hoàn thành'
                ], 400);
            }

            $refundAmount = $validated['refund_amount'] ?? $payment->amount;
            
            if ($refundAmount > $payment->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Số tiền hoàn không thể lớn hơn số tiền đã thanh toán'
                ], 400);
            }

            // Create refund payment record
            $refundPayment = Payment::create([
                'booking_id' => $payment->booking_id,
                'payment_method' => $payment->payment_method,
                'amount' => -$refundAmount, // Negative amount for refund
                'status' => Payment::STATUS_COMPLETED,
                'transaction_id' => 'REFUND_' . $payment->transaction_id . '_' . time(),
                'failure_reason' => 'REFUND: ' . $validated['reason'],
                'processed_at' => now()
            ]);

            // Update original payment status
            $payment->update([
                'status' => Payment::STATUS_REFUNDED,
                'failure_reason' => 'REFUNDED: ' . $validated['reason']
            ]);

            // Update booking status
            $payment->booking->update([
                'payment_status' => Booking::PAYMENT_REFUNDED,
                'booking_status' => Booking::STATUS_CANCELLED
            ]);

            Log::info('Refund processed by admin', [
                'original_payment_id' => $payment->id,
                'refund_payment_id' => $refundPayment->id,
                'booking_id' => $payment->booking_id,
                'refund_amount' => $refundAmount,
                'admin_id' => Auth::id(),
                'reason' => $validated['reason']
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'original_payment' => $payment->fresh(),
                    'refund_payment' => $refundPayment,
                    'booking' => $payment->booking->fresh()
                ],
                'message' => 'Hoàn tiền thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xử lý hoàn tiền'
            ], 500);
        }
    }

    /**
     * Get payment statistics for admin
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPaymentStats(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->subDays(30));
            $dateTo = $request->get('date_to', now());

            // Payment status distribution
            $statusStats = Payment::selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0) // Exclude refunds
                ->groupBy('status')
                ->get();

            // Payment method distribution
            $methodStats = Payment::selectRaw('payment_method, COUNT(*) as count, SUM(amount) as total_amount')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0)
                ->groupBy('payment_method')
                ->get();

            // Daily payment trends
            $dailyStats = Payment::selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(amount) as total_amount')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Failed payment reasons
            $failureStats = Payment::selectRaw('failure_reason, COUNT(*) as count')
                ->where('status', 'failed')
                ->whereNotNull('failure_reason')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('failure_reason')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            // Overall metrics
            $totalPayments = Payment::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0)
                ->count();
            
            $successfulPayments = Payment::where('status', 'completed')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0)
                ->count();
            
            $totalRevenue = Payment::where('status', 'completed')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->sum('amount');
            
            $totalRefunds = Payment::where('status', 'refunded')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '<', 0)
                ->sum('amount');

            $successRate = $totalPayments > 0 ? ($successfulPayments / $totalPayments) * 100 : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom,
                        'to' => $dateTo
                    ],
                    'overview' => [
                        'total_payments' => $totalPayments,
                        'successful_payments' => $successfulPayments,
                        'success_rate' => round($successRate, 2),
                        'total_revenue' => $totalRevenue,
                        'total_refunds' => abs($totalRefunds),
                        'average_transaction_value' => $successfulPayments > 0 ? $totalRevenue / $successfulPayments : 0
                    ],
                    'status_distribution' => $statusStats,
                    'method_distribution' => $methodStats,
                    'daily_trends' => $dailyStats,
                    'failure_reasons' => $failureStats
                ],
                'message' => 'Lấy thống kê payment thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê payment'
            ], 500);
        }
    }

    /**
     * Get all tickets for admin
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminTickets(Request $request)
    {
        try {
            $query = Booking::with(['user', 'showtime.movie', 'showtime.theater', 'payment'])
                ->whereNotNull('ticket_data');

            // Search by booking code or user name
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('booking_code', 'like', '%' . $request->search . '%')
                      ->orWhereHas('user', function ($userQuery) use ($request) {
                          $userQuery->where('name', 'like', '%' . $request->search . '%')
                                    ->orWhere('email', 'like', '%' . $request->search . '%');
                      });
                });
            }

            // Filter by ticket status
            if ($request->filled('has_qr')) {
                if ($request->has_qr === 'true') {
                    $query->whereNotNull('qr_code');
                } else {
                    $query->whereNull('qr_code');
                }
            }

            // Filter by date range
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            $tickets = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $tickets,
                'message' => 'Lấy danh sách tickets thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách tickets'
            ], 500);
        }
    }

    /**
     * Regenerate ticket for admin
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminRegenerateTicket(string $id)
    {
        try {
            $booking = Booking::with(['showtime.movie', 'showtime.theater', 'user'])->findOrFail($id);
            
            // Check if booking is eligible for e-ticket
            if (!$this->eTicketService->isBookingEligibleForTicket($booking)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking không đủ điều kiện tạo e-ticket'
                ], 400);
            }

            // Regenerate e-ticket
            $result = $this->eTicketService->regenerateETicket($booking);

            if ($result['success']) {
                Log::info('Admin regenerated e-ticket', [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'admin_id' => Auth::id()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'message' => 'Tạo lại e-ticket thành công'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo lại e-ticket'
            ], 500);
        }
    }

    /**
     * Get ticket statistics for admin
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTicketStats(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->subDays(30));
            $dateTo = $request->get('date_to', now());

            // Total bookings vs tickets generated
            $totalBookings = Booking::whereBetween('created_at', [$dateFrom, $dateTo])->count();
            $ticketsGenerated = Booking::whereNotNull('ticket_data')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->count();
            $ticketsWithQR = Booking::whereNotNull('qr_code')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->count();

            // Daily ticket generation trends
            $dailyTickets = Booking::selectRaw('DATE(created_at) as date, COUNT(*) as total_bookings, SUM(CASE WHEN ticket_data IS NOT NULL THEN 1 ELSE 0 END) as tickets_generated')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Ticket generation rate
            $generationRate = $totalBookings > 0 ? ($ticketsGenerated / $totalBookings) * 100 : 0;
            $qrGenerationRate = $totalBookings > 0 ? ($ticketsWithQR / $totalBookings) * 100 : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom,
                        'to' => $dateTo
                    ],
                    'overview' => [
                        'total_bookings' => $totalBookings,
                        'tickets_generated' => $ticketsGenerated,
                        'tickets_with_qr' => $ticketsWithQR,
                        'generation_rate' => round($generationRate, 2),
                        'qr_generation_rate' => round($qrGenerationRate, 2),
                        'missing_tickets' => $totalBookings - $ticketsGenerated
                    ],
                    'daily_trends' => $dailyTickets
                ],
                'message' => 'Lấy thống kê tickets thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê tickets'
            ], 500);
        }
    }
}
