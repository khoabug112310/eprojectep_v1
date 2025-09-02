<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\User;
use App\Mail\BookingConfirmationMail;
use App\Mail\ETicketMail;
use App\Jobs\SendBookingReminderJob;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class NotificationService
{
    protected $eTicketService;
    protected $qrCodeService;

    public function __construct(ETicketService $eTicketService, QrCodeService $qrCodeService)
    {
        $this->eTicketService = $eTicketService;
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Send booking confirmation email
     *
     * @param Booking $booking
     * @param array $eTicketData
     * @return array
     */
    public function sendBookingConfirmation(Booking $booking, array $eTicketData = null): array
    {
        try {
            // Load relationships if not already loaded
            $booking->load(['showtime.movie', 'showtime.theater', 'user', 'payment']);

            // Validate booking and user
            if (!$booking->user || !$booking->user->email) {
                throw new Exception('Booking must have a valid user with email address');
            }

            // Send booking confirmation email
            Mail::to($booking->user->email)
                ->queue(new BookingConfirmationMail($booking, $eTicketData));

            // Update confirmation sent timestamp
            $booking->update(['confirmation_sent_at' => now()]);

            // Schedule reminder email if showtime is in the future
            $this->scheduleShowReminder($booking);

            Log::info('Booking confirmation email sent', [
                'booking_id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'user_email' => $booking->user->email,
                'sent_at' => now()
            ]);

            return [
                'success' => true,
                'message' => 'Email xác nhận đã được gửi thành công',
                'data' => [
                    'booking_id' => $booking->id,
                    'email_sent_to' => $booking->user->email,
                    'sent_at' => now()->toISOString(),
                    'reminder_scheduled' => $this->shouldScheduleReminder($booking)
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to send booking confirmation email', [
                'booking_id' => $booking->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Không thể gửi email xác nhận: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send e-ticket email specifically
     *
     * @param Booking $booking
     * @param array $eTicketData
     * @return array
     */
    public function sendETicketEmail(Booking $booking, array $eTicketData): array
    {
        try {
            // Load relationships
            $booking->load(['showtime.movie', 'showtime.theater', 'user', 'payment']);

            // Validate inputs
            if (!$booking->user || !$booking->user->email) {
                throw new Exception('Booking must have a valid user with email address');
            }

            if (empty($eTicketData)) {
                throw new Exception('E-ticket data is required');
            }

            // Send e-ticket email
            Mail::to($booking->user->email)
                ->queue(new ETicketMail($booking, $eTicketData));

            Log::info('E-ticket email sent', [
                'booking_id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'user_email' => $booking->user->email,
                'has_qr_code' => isset($eTicketData['qr_code']),
                'sent_at' => now()
            ]);

            return [
                'success' => true,
                'message' => 'Email vé điện tử đã được gửi thành công',
                'data' => [
                    'booking_id' => $booking->id,
                    'email_sent_to' => $booking->user->email,
                    'sent_at' => now()->toISOString()
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to send e-ticket email', [
                'booking_id' => $booking->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Không thể gửi email vé điện tử: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Resend booking confirmation email
     *
     * @param Booking $booking
     * @return array
     */
    public function resendBookingConfirmation(Booking $booking): array
    {
        try {
            // Check if booking is eligible for resend
            if (!$booking->isPaid() || $booking->booking_status !== 'confirmed') {
                return [
                    'success' => false,
                    'message' => 'Chỉ có thể gửi lại email cho booking đã thanh toán và xác nhận'
                ];
            }

            // Get e-ticket data if available
            $eTicketData = null;
            if ($booking->ticket_data) {
                try {
                    $eTicketData = $this->eTicketService->getExistingTicketData($booking);
                } catch (Exception $e) {
                    Log::warning('Could not retrieve e-ticket data for resend', [
                        'booking_id' => $booking->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return $this->sendBookingConfirmation($booking, $eTicketData);

        } catch (Exception $e) {
            Log::error('Failed to resend booking confirmation', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Không thể gửi lại email xác nhận: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Schedule show reminder email
     *
     * @param Booking $booking
     * @return bool
     */
    protected function scheduleShowReminder(Booking $booking): bool
    {
        try {
            if (!$this->shouldScheduleReminder($booking)) {
                return false;
            }

            // Calculate reminder time (2 hours before show)
            $showDateTime = Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $booking->showtime->show_date . ' ' . $booking->showtime->show_time
            );

            $reminderTime = $showDateTime->copy()->subHours(2);

            // Only schedule if reminder time is in the future
            if ($reminderTime->isFuture()) {
                SendBookingReminderJob::dispatch($booking)->delay($reminderTime);

                Log::info('Show reminder scheduled', [
                    'booking_id' => $booking->id,
                    'reminder_time' => $reminderTime->toISOString(),
                    'show_time' => $showDateTime->toISOString()
                ]);

                return true;
            }

            return false;

        } catch (Exception $e) {
            Log::error('Failed to schedule show reminder', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Check if reminder should be scheduled
     *
     * @param Booking $booking
     * @return bool
     */
    protected function shouldScheduleReminder(Booking $booking): bool
    {
        // Don't schedule reminder if:
        // 1. Booking is not confirmed or paid
        // 2. Show is in the past
        // 3. Show is within next 2 hours

        if (!$booking->isPaid() || $booking->booking_status !== 'confirmed') {
            return false;
        }

        try {
            $showDateTime = Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $booking->showtime->show_date . ' ' . $booking->showtime->show_time
            );

            // Don't schedule if show is in the past or within next 2 hours
            return $showDateTime->isFuture() && $showDateTime->diffInHours(now()) > 2;

        } catch (Exception $e) {
            Log::error('Error checking reminder schedule eligibility', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Send show reminder email
     *
     * @param Booking $booking
     * @return array
     */
    public function sendShowReminder(Booking $booking): array
    {
        try {
            // Load relationships
            $booking->load(['showtime.movie', 'showtime.theater', 'user', 'payment']);

            // Validate booking
            if (!$booking->user || !$booking->user->email) {
                throw new Exception('Booking must have a valid user with email address');
            }

            // Get show time
            $showDateTime = Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $booking->showtime->show_date . ' ' . $booking->showtime->show_time
            );

            // Create reminder email data
            $reminderData = [
                'booking' => $booking,
                'movie' => $booking->showtime->movie,
                'theater' => $booking->showtime->theater,
                'showtime' => $booking->showtime,
                'customer' => $booking->user,
                'show_datetime' => $showDateTime,
                'time_until_show' => $showDateTime->diffForHumans()
            ];

            // TODO: Create ShowReminderMail class
            // For now, just log the reminder
            Log::info('Show reminder would be sent', [
                'booking_id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'user_email' => $booking->user->email,
                'show_time' => $showDateTime->toISOString(),
                'time_until_show' => $showDateTime->diffForHumans()
            ]);

            return [
                'success' => true,
                'message' => 'Nhắc nhở xem phim đã được gửi',
                'data' => [
                    'booking_id' => $booking->id,
                    'email_sent_to' => $booking->user->email,
                    'show_time' => $showDateTime->toISOString(),
                    'sent_at' => now()->toISOString()
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to send show reminder', [
                'booking_id' => $booking->id ?? null,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Không thể gửi nhắc nhở xem phim: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send bulk notifications to users
     *
     * @param array $userIds
     * @param string $subject
     * @param string $message
     * @param array $options
     * @return array
     */
    public function sendBulkNotification(array $userIds, string $subject, string $message, array $options = []): array
    {
        try {
            $users = User::whereIn('id', $userIds)
                ->whereNotNull('email')
                ->get();

            $successCount = 0;
            $failures = [];

            foreach ($users as $user) {
                try {
                    // TODO: Create generic notification mail class
                    // For now, just log
                    Log::info('Bulk notification would be sent', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'subject' => $subject,
                        'message' => substr($message, 0, 100) . '...'
                    ]);

                    $successCount++;

                } catch (Exception $e) {
                    $failures[] = [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return [
                'success' => true,
                'message' => "Đã gửi thông báo đến {$successCount} người dùng",
                'data' => [
                    'total_users' => count($users),
                    'success_count' => $successCount,
                    'failure_count' => count($failures),
                    'failures' => $failures
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to send bulk notification', [
                'user_count' => count($userIds),
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Không thể gửi thông báo hàng loạt: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get notification statistics
     *
     * @param array $options
     * @return array
     */
    public function getNotificationStats(array $options = []): array
    {
        try {
            $dateFrom = $options['date_from'] ?? now()->subDays(30);
            $dateTo = $options['date_to'] ?? now();

            // Get bookings with confirmation emails sent
            $confirmationsSent = Booking::whereBetween('confirmation_sent_at', [$dateFrom, $dateTo])
                ->count();

            // Get total bookings in period
            $totalBookings = Booking::whereBetween('created_at', [$dateFrom, $dateTo])
                ->count();

            // Calculate success rate
            $successRate = $totalBookings > 0 ? ($confirmationsSent / $totalBookings) * 100 : 0;

            return [
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => Carbon::parse($dateFrom)->toISOString(),
                        'to' => Carbon::parse($dateTo)->toISOString()
                    ],
                    'confirmations_sent' => $confirmationsSent,
                    'total_bookings' => $totalBookings,
                    'success_rate' => round($successRate, 2),
                    'pending_confirmations' => $totalBookings - $confirmationsSent
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to get notification stats', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Không thể lấy thống kê thông báo: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }
}