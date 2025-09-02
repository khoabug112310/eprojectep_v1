<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\User;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard()
    {
        try {
            // Tổng quan
            $totalMovies = Movie::count();
            $totalTheaters = Theater::count();
            $totalUsers = User::count();
            $totalBookings = Booking::count();

            // Doanh thu
            $totalRevenue = Booking::where('payment_status', 'paid')->sum('total_amount');
            $monthlyRevenue = Booking::where('payment_status', 'paid')
                ->whereMonth('created_at', now()->month)
                ->sum('total_amount');

            // Phim phổ biến
            $popularMovies = Movie::withCount('bookings')
                ->orderBy('bookings_count', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'bookings_count']);

            // Đặt vé theo tháng
            $monthlyBookings = Booking::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
                ->whereYear('created_at', now()->year)
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // Rạp bận nhất
            $busyTheaters = Theater::withCount(['showtimes as total_showtimes'])
                ->orderBy('total_showtimes', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'total_showtimes']);

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_movies' => $totalMovies,
                        'total_theaters' => $totalTheaters,
                        'total_users' => $totalUsers,
                        'total_bookings' => $totalBookings,
                    ],
                    'revenue' => [
                        'total' => $totalRevenue,
                        'monthly' => $monthlyRevenue,
                    ],
                    'popular_movies' => $popularMovies,
                    'monthly_bookings' => $monthlyBookings,
                    'busy_theaters' => $busyTheaters,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function revenue(Request $request)
    {
        try {
            $period = $request->get('period', 'month'); // day, week, month, year
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $query = Booking::where('payment_status', 'paid');

            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            } else {
                switch ($period) {
                    case 'day':
                        $query->whereDate('created_at', now());
                        break;
                    case 'week':
                        $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                        break;
                    case 'month':
                        $query->whereMonth('created_at', now()->month);
                        break;
                    case 'year':
                        $query->whereYear('created_at', now()->year);
                        break;
                }
            }

            $revenue = $query->sum('total_amount');
            $bookings = $query->count();
            $averageTicket = $bookings > 0 ? $revenue / $bookings : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'revenue' => $revenue,
                    'bookings' => $bookings,
                    'average_ticket' => $averageTicket,
                    'period' => $period,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching revenue data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function bookings(Request $request)
    {
        try {
            $status = $request->get('status');
            $movieId = $request->get('movie_id');
            $theaterId = $request->get('theater_id');

            $query = Booking::with(['user', 'showtime.movie', 'showtime.theater']);

            if ($status) {
                $query->where('booking_status', $status);
            }

            if ($movieId) {
                $query->whereHas('showtime', function ($q) use ($movieId) {
                    $q->where('movie_id', $movieId);
                });
            }

            if ($theaterId) {
                $query->whereHas('showtime', function ($q) use ($theaterId) {
                    $q->where('theater_id', $theaterId);
                });
            }

            $bookings = $query->orderBy('created_at', 'desc')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $bookings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching bookings data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function movies()
    {
        try {
            $movies = Movie::withCount(['bookings', 'reviews'])
                ->withAvg('reviews', 'rating')
                ->orderBy('bookings_count', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $movies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching movies data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function users()
    {
        try {
            $users = User::withCount('bookings')
                ->orderBy('bookings_count', 'desc')
                ->get(['id', 'name', 'email', 'created_at', 'bookings_count']);

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching users data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment analytics
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function paymentAnalytics(Request $request)
    {
        try {
            $period = $request->get('period', 'month');
            $dateFrom = $request->get('date_from', now()->subDays(30));
            $dateTo = $request->get('date_to', now());

            // Payment success rate trends
            $successRateTrends = Payment::selectRaw('
                    DATE(created_at) as date,
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as successful_payments,
                    ROUND((SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as success_rate
                ')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Payment method performance
            $methodPerformance = Payment::selectRaw('
                    payment_method,
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as successful_payments,
                    SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as total_revenue,
                    ROUND((SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as success_rate
                ')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('amount', '>', 0)
                ->groupBy('payment_method')
                ->get();

            // Failed payment analysis
            $failureAnalysis = Payment::selectRaw('
                    failure_reason,
                    COUNT(*) as count,
                    ROUND((COUNT(*) / (SELECT COUNT(*) FROM payments WHERE status = "failed" AND created_at BETWEEN ? AND ?)) * 100, 2) as percentage
                ', [$dateFrom, $dateTo])
                ->where('status', 'failed')
                ->whereNotNull('failure_reason')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('failure_reason')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            // Revenue vs Refunds
            $revenueAnalysis = [
                'total_revenue' => Payment::where('status', 'completed')
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->where('amount', '>', 0)
                    ->sum('amount'),
                'total_refunds' => abs(Payment::where('status', 'refunded')
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->where('amount', '<', 0)
                    ->sum('amount')),
                'net_revenue' => Payment::whereBetween('created_at', [$dateFrom, $dateTo])
                    ->where('status', 'completed')
                    ->sum('amount')
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom,
                        'to' => $dateTo
                    ],
                    'success_rate_trends' => $successRateTrends,
                    'method_performance' => $methodPerformance,
                    'failure_analysis' => $failureAnalysis,
                    'revenue_analysis' => $revenueAnalysis
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching payment analytics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ticket analytics
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function ticketAnalytics(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->subDays(30));
            $dateTo = $request->get('date_to', now());

            // E-ticket generation analytics
            $ticketStats = Booking::selectRaw('
                    DATE(created_at) as date,
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN ticket_data IS NOT NULL THEN 1 ELSE 0 END) as tickets_generated,
                    SUM(CASE WHEN qr_code IS NOT NULL THEN 1 ELSE 0 END) as qr_codes_generated,
                    ROUND((SUM(CASE WHEN ticket_data IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as generation_rate
                ')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Ticket delivery method stats
            $deliveryStats = Booking::selectRaw('
                    COUNT(*) as total_with_tickets,
                    SUM(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 ELSE 0 END) as email_sent,
                    SUM(CASE WHEN qr_code IS NOT NULL THEN 1 ELSE 0 END) as with_qr_code
                ')
                ->whereNotNull('ticket_data')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom,
                        'to' => $dateTo
                    ],
                    'daily_stats' => $ticketStats,
                    'delivery_stats' => $deliveryStats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching ticket analytics: ' . $e->getMessage()
            ], 500);
        }
    }
} 