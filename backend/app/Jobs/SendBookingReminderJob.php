<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class SendBookingReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $booking;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     *
     * @param Booking $booking
     */
    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    /**
     * Execute the job.
     *
     * @param NotificationService $notificationService
     * @return void
     */
    public function handle(NotificationService $notificationService): void
    {
        try {
            // Load fresh booking data to ensure it's still valid
            $booking = Booking::with(['showtime.movie', 'showtime.theater', 'user', 'payment'])
                ->find($this->booking->id);

            if (!$booking) {
                Log::warning('Booking not found for reminder job', [
                    'booking_id' => $this->booking->id
                ]);
                return;
            }

            // Check if booking is still valid for reminder
            if (!$booking->isPaid() || $booking->booking_status !== 'confirmed') {
                Log::info('Booking no longer valid for reminder', [
                    'booking_id' => $booking->id,
                    'payment_status' => $booking->payment_status,
                    'booking_status' => $booking->booking_status
                ]);
                return;
            }

            // Send reminder
            $result = $notificationService->sendShowReminder($booking);

            if ($result['success']) {
                Log::info('Booking reminder sent successfully', [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code
                ]);
            } else {
                Log::error('Failed to send booking reminder', [
                    'booking_id' => $booking->id,
                    'error' => $result['message']
                ]);

                // Re-throw exception to trigger retry
                throw new Exception($result['message']);
            }

        } catch (Exception $e) {
            Log::error('Error in SendBookingReminderJob', [
                'booking_id' => $this->booking->id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param Exception $exception
     * @return void
     */
    public function failed(Exception $exception): void
    {
        Log::error('SendBookingReminderJob failed permanently', [
            'booking_id' => $this->booking->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // TODO: You might want to notify admins about failed reminders
        // or implement a fallback notification mechanism
    }

    /**
     * Calculate the number of seconds to wait before retrying the job.
     *
     * @return array
     */
    public function backoff(): array
    {
        return [60, 300, 900]; // Retry after 1 min, 5 min, 15 min
    }
}