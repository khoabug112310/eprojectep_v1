<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\NotificationService;
use App\Services\ETicketService;
use App\Services\QrCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use App\Mail\BookingConfirmationMail;
use App\Jobs\SendBookingReminderJob;
use Carbon\Carbon;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $notificationService;
    protected $user;
    protected $booking;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock mail and queue
        Mail::fake();
        Queue::fake();

        // Create test data
        $this->createTestData();

        // Create service with mocked dependencies
        $eTicketService = $this->createMock(ETicketService::class);
        $qrCodeService = $this->createMock(QrCodeService::class);
        
        $this->notificationService = new NotificationService($eTicketService, $qrCodeService);
    }

    private function createTestData()
    {
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User'
        ]);

        $movie = Movie::factory()->create(['title' => 'Test Movie']);
        $theater = Theater::factory()->create(['name' => 'Test Theater']);
        
        $showtime = Showtime::factory()->create([
            'movie_id' => $movie->id,
            'theater_id' => $theater->id,
            'show_date' => Carbon::tomorrow()->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);

        $this->booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $showtime->id,
            'booking_code' => 'CB20250901001',
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CONFIRMED,
            'total_amount' => 240000
        ]);

        // Create associated payment
        Payment::factory()->create([
            'booking_id' => $this->booking->id,
            'status' => Payment::STATUS_COMPLETED
        ]);
    }

    /** @test */
    public function it_can_send_booking_confirmation_email()
    {
        // Arrange
        $eTicketData = [
            'qr_code' => [
                'qr_code_image_base64' => 'fake_base64_data',
                'qr_code_url' => 'http://example.com/qr.png'
            ]
        ];

        // Act
        $result = $this->notificationService->sendBookingConfirmation($this->booking, $eTicketData);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('Email xác nhận đã được gửi thành công', $result['message']);
        $this->assertArrayHasKey('booking_id', $result['data']);
        $this->assertEquals($this->booking->id, $result['data']['booking_id']);

        // Verify email was queued
        Mail::assertQueued(BookingConfirmationMail::class, function ($mail) {
            return $mail->booking->id === $this->booking->id;
        });

        // Verify confirmation timestamp was updated
        $this->booking->refresh();
        $this->assertNotNull($this->booking->confirmation_sent_at);
    }

    /** @test */
    public function it_handles_missing_user_email_gracefully()
    {
        // Arrange - create a new booking with user that has no email
        $userWithoutEmail = User::factory()->create(['email' => 'temp@example.com']);
        $userWithoutEmail->update(['email' => '']);
        $this->booking->update(['user_id' => $userWithoutEmail->id]);

        // Act
        $result = $this->notificationService->sendBookingConfirmation($this->booking);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('must have a valid user with email address', $result['message']);

        // Verify no email was sent
        Mail::assertNothingQueued();
    }

    /** @test */
    public function it_can_resend_booking_confirmation()
    {
        // Act
        $result = $this->notificationService->resendBookingConfirmation($this->booking);

        // Assert
        $this->assertTrue($result['success']);
        
        // Verify email was queued
        Mail::assertQueued(BookingConfirmationMail::class);
    }

    /** @test */
    public function it_rejects_resend_for_unpaid_booking()
    {
        // Arrange
        $this->booking->update(['payment_status' => Booking::PAYMENT_PENDING]);

        // Act
        $result = $this->notificationService->resendBookingConfirmation($this->booking);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Chỉ có thể gửi lại email cho booking đã thanh toán và xác nhận', $result['message']);

        // Verify no email was sent
        Mail::assertNothingQueued();
    }

    /** @test */
    public function it_schedules_show_reminder_for_future_shows()
    {
        // Arrange - showtime tomorrow at 19:00 (more than 2 hours from now)
        $this->booking->showtime->update([
            'show_date' => Carbon::tomorrow()->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);

        // Act
        $result = $this->notificationService->sendBookingConfirmation($this->booking);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertTrue($result['data']['reminder_scheduled']);

        // Verify reminder job was dispatched
        Queue::assertPushed(SendBookingReminderJob::class, function ($job) {
            return $job->booking->id === $this->booking->id;
        });
    }

    /** @test */
    public function it_does_not_schedule_reminder_for_past_shows()
    {
        // Arrange - showtime yesterday
        $this->booking->showtime->update([
            'show_date' => Carbon::yesterday()->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);

        // Act
        $result = $this->notificationService->sendBookingConfirmation($this->booking);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertFalse($result['data']['reminder_scheduled']);

        // Verify no reminder job was dispatched
        Queue::assertNotPushed(SendBookingReminderJob::class);
    }

    /** @test */
    public function it_can_get_notification_statistics()
    {
        // Arrange - set confirmation timestamp
        $this->booking->update(['confirmation_sent_at' => now()]);

        // Act
        $result = $this->notificationService->getNotificationStats();

        // Assert
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('confirmations_sent', $result['data']);
        $this->assertArrayHasKey('total_bookings', $result['data']);
        $this->assertArrayHasKey('success_rate', $result['data']);
        $this->assertEquals(1, $result['data']['confirmations_sent']);
        $this->assertEquals(1, $result['data']['total_bookings']);
        $this->assertEquals(100, $result['data']['success_rate']);
    }

    /** @test */
    public function it_can_send_show_reminder()
    {
        // Act
        $result = $this->notificationService->sendShowReminder($this->booking);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('Nhắc nhở xem phim đã được gửi', $result['message']);
        $this->assertArrayHasKey('show_time', $result['data']);
    }

    /** @test */
    public function it_handles_bulk_notifications()
    {
        // Arrange
        $user2 = User::factory()->create(['email' => 'user2@example.com']);
        $userIds = [$this->user->id, $user2->id];

        // Act
        $result = $this->notificationService->sendBulkNotification(
            $userIds,
            'Test Subject',
            'Test message content',
            []
        );

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals(2, $result['data']['success_count']);
        $this->assertEquals(0, $result['data']['failure_count']);
    }
}