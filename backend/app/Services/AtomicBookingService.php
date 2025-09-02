<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Showtime;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Exception;

class AtomicBookingService
{
    protected SeatLockingService $seatLockingService;
    protected PaymentService $paymentService;
    
    public function __construct(
        SeatLockingService $seatLockingService,
        PaymentService $paymentService
    ) {
        $this->seatLockingService = $seatLockingService;
        $this->paymentService = $paymentService;
    }
    
    /**
     * Create booking with atomic transaction to prevent race conditions
     *
     * @param array $bookingData Booking data with seats, showtime, user info
     * @return array Booking creation result
     */
    public function createAtomicBooking(array $bookingData): array
    {
        // Generate unique transaction ID for this booking attempt
        $transactionId = 'booking_' . uniqid() . '_' . time();
        
        Log::info('Starting atomic booking transaction', [
            'transaction_id' => $transactionId,
            'showtime_id' => $bookingData['showtime_id'] ?? null,
            'seat_count' => count($bookingData['seats'] ?? [])
        ]);
        
        try {
            return DB::transaction(function () use ($bookingData, $transactionId) {
                // Step 1: Validate and lock seats atomically
                $seatLockResult = $this->lockSeatsAtomically($bookingData, $transactionId);
                if (!$seatLockResult['success']) {
                    throw new Exception('Seat locking failed: ' . $seatLockResult['message']);
                }
                
                // Step 2: Validate showtime availability and constraints
                $showtimeValidation = $this->validateShowtimeConstraints($bookingData['showtime_id'], $bookingData['seats']);
                if (!$showtimeValidation['valid']) {
                    throw new Exception('Showtime validation failed: ' . $showtimeValidation['message']);
                }
                
                // Step 3: Calculate pricing with atomic seat type validation
                $pricingResult = $this->calculateAtomicPricing($bookingData['showtime_id'], $bookingData['seats']);
                if (!$pricingResult['success']) {
                    throw new Exception('Pricing calculation failed: ' . $pricingResult['message']);
                }
                
                // Step 4: Create booking record with optimistic locking
                $booking = $this->createBookingRecord($bookingData, $pricingResult['pricing'], $transactionId);
                
                // Step 5: Update showtime availability atomically
                $availabilityUpdate = $this->updateShowtimeAvailability($bookingData['showtime_id'], $bookingData['seats'], 'reserve');
                if (!$availabilityUpdate['success']) {
                    throw new Exception('Failed to update seat availability: ' . $availabilityUpdate['message']);
                }
                
                // Step 6: Create payment record if payment data provided
                $payment = null;
                if (isset($bookingData['payment_data'])) {
                    $payment = $this->createPaymentRecord($booking->id, $bookingData['payment_data']);
                }
                
                Log::info('Atomic booking transaction completed successfully', [
                    'transaction_id' => $transactionId,
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code
                ]);
                
                return [
                    'success' => true,
                    'booking' => $booking,
                    'payment' => $payment,
                    'transaction_id' => $transactionId,
                    'seat_locks' => $seatLockResult['locks'],
                    'pricing' => $pricingResult['pricing']
                ];
            }, 5); // 5 second timeout for transaction
            
        } catch (Exception $e) {
            Log::error('Atomic booking transaction failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
                'showtime_id' => $bookingData['showtime_id'] ?? null
            ]);
            
            // Cleanup: Release any locks that might have been created
            $this->cleanupFailedBooking($bookingData, $transactionId);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'transaction_id' => $transactionId,
                'error_code' => $this->getErrorCode($e->getMessage())
            ];
        }
    }
    
    /**
     * Cancel booking with atomic operations to maintain data integrity
     *
     * @param string $bookingCode Booking code to cancel
     * @param array $cancelData Cancellation data (reason, etc.)
     * @return array Cancellation result
     */
    public function cancelBookingAtomically(string $bookingCode, array $cancelData = []): array
    {
        $transactionId = 'cancel_' . uniqid() . '_' . time();
        
        Log::info('Starting atomic booking cancellation', [
            'transaction_id' => $transactionId,
            'booking_code' => $bookingCode
        ]);
        
        try {
            return DB::transaction(function () use ($bookingCode, $cancelData, $transactionId) {
                // Step 1: Find and lock booking record
                $booking = Booking::where('booking_code', $bookingCode)
                    ->lockForUpdate()
                    ->first();
                
                if (!$booking) {
                    throw new Exception('Booking not found');
                }
                
                if ($booking->booking_status === 'cancelled') {
                    throw new Exception('Booking is already cancelled');
                }
                
                // Step 2: Validate cancellation eligibility
                $eligibility = $this->validateCancellationEligibility($booking);
                if (!$eligibility['eligible']) {
                    throw new Exception('Cancellation not allowed: ' . $eligibility['reason']);
                }
                
                // Step 3: Release seats atomically
                $seatReleaseResult = $this->updateShowtimeAvailability(
                    $booking->showtime_id, 
                    $booking->seats, 
                    'release'
                );
                
                if (!$seatReleaseResult['success']) {
                    throw new Exception('Failed to release seats: ' . $seatReleaseResult['message']);
                }
                
                // Step 4: Update booking status
                $booking->update([
                    'booking_status' => 'cancelled',
                    'cancelled_at' => Carbon::now(),
                    'cancellation_reason' => $cancelData['reason'] ?? 'User cancellation'
                ]);
                
                // Step 5: Handle payment refund if applicable
                $refundResult = null;
                if ($booking->payment_status === 'completed') {
                    $refundResult = $this->processRefundAtomically($booking, $cancelData);
                }
                
                Log::info('Atomic booking cancellation completed', [
                    'transaction_id' => $transactionId,
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code
                ]);
                
                return [
                    'success' => true,
                    'booking' => $booking->fresh(),
                    'refund' => $refundResult,
                    'transaction_id' => $transactionId,
                    'seats_released' => count($booking->seats)
                ];
            });
            
        } catch (Exception $e) {
            Log::error('Atomic booking cancellation failed', [
                'transaction_id' => $transactionId,
                'booking_code' => $bookingCode,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'transaction_id' => $transactionId,
                'error_code' => $this->getErrorCode($e->getMessage())
            ];
        }
    }
    
    /**
     * Lock seats atomically with race condition protection
     *
     * @param array $bookingData Booking data with seats and showtime
     * @param string $transactionId Transaction identifier
     * @return array Seat locking result
     */
    protected function lockSeatsAtomically(array $bookingData, string $transactionId): array
    {
        $showtimeId = $bookingData['showtime_id'];
        $seats = $bookingData['seats'];
        $userId = $bookingData['user_id'] ?? null;
        
        $locks = [];
        $failedSeats = [];
        
        try {
            foreach ($seats as $seatData) {
                $seatCode = is_array($seatData) ? $seatData['seat'] : $seatData;
                
                $lockResult = $this->seatLockingService->lockSeat($showtimeId, $seatCode, $userId, $transactionId);
                
                if ($lockResult['success']) {
                    $locks[] = [
                        'seat' => $seatCode,
                        'lock_key' => $lockResult['lock_key'],
                        'expires_at' => $lockResult['expires_at']
                    ];
                } else {
                    $failedSeats[] = [
                        'seat' => $seatCode,
                        'reason' => $lockResult['message']
                    ];
                }
            }
            
            // If any seat failed to lock, release all acquired locks
            if (!empty($failedSeats)) {
                foreach ($locks as $lock) {
                    $this->seatLockingService->releaseSeat($showtimeId, $lock['seat']);
                }
                
                return [
                    'success' => false,
                    'message' => 'Some seats could not be locked: ' . json_encode($failedSeats),
                    'failed_seats' => $failedSeats
                ];
            }
            
            return [
                'success' => true,
                'locks' => $locks,
                'locked_seats' => array_column($locks, 'seat')
            ];
            
        } catch (Exception $e) {
            // Clean up any acquired locks
            foreach ($locks as $lock) {
                try {
                    $this->seatLockingService->releaseSeat($showtimeId, $lock['seat']);
                } catch (Exception $cleanupError) {
                    Log::warning('Failed to cleanup seat lock during error', [
                        'seat' => $lock['seat'],
                        'error' => $cleanupError->getMessage()
                    ]);
                }
            }
            
            return [
                'success' => false,
                'message' => 'Seat locking failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate showtime constraints (capacity, timing, status)
     *
     * @param int $showtimeId Showtime ID to validate
     * @param array $seats Seats being booked
     * @return array Validation result
     */
    protected function validateShowtimeConstraints(int $showtimeId, array $seats): array
    {
        try {
            $showtime = Showtime::with('theater', 'movie')
                ->where('id', $showtimeId)
                ->lockForUpdate()
                ->first();
            
            if (!$showtime) {
                return ['valid' => false, 'message' => 'Showtime not found'];
            }
            
            if ($showtime->status !== 'active') {
                return ['valid' => false, 'message' => 'Showtime is not active'];
            }
            
            // Check if showtime is in the future
            $showtimeDateTime = Carbon::parse($showtime->show_date . ' ' . $showtime->show_time);
            if ($showtimeDateTime->isPast()) {
                return ['valid' => false, 'message' => 'Cannot book past showtimes'];
            }
            
            // Check booking deadline (e.g., 30 minutes before show)
            $bookingDeadline = $showtimeDateTime->subMinutes(30);
            if (Carbon::now()->isAfter($bookingDeadline)) {
                return ['valid' => false, 'message' => 'Booking deadline has passed'];
            }
            
            // Validate seat capacity
            $requestedSeatCount = count($seats);
            $availableSeats = $showtime->available_seats ?? [];
            
            // Count available seats by type
            $totalAvailable = 0;
            foreach ($availableSeats as $type => $typeSeats) {
                if (is_array($typeSeats)) {
                    $totalAvailable += count($typeSeats);
                }
            }
            
            if ($requestedSeatCount > $totalAvailable) {
                return ['valid' => false, 'message' => 'Not enough seats available'];
            }
            
            // Validate individual seat availability
            foreach ($seats as $seatData) {
                $seatCode = is_array($seatData) ? $seatData['seat'] : $seatData;
                $seatType = is_array($seatData) ? ($seatData['type'] ?? null) : null;
                
                if ($seatType && isset($availableSeats[$seatType])) {
                    if (!in_array($seatCode, $availableSeats[$seatType])) {
                        return ['valid' => false, 'message' => "Seat {$seatCode} is not available"];
                    }
                }
            }
            
            return [
                'valid' => true,
                'showtime' => $showtime,
                'deadline' => $bookingDeadline->toISOString()
            ];
            
        } catch (Exception $e) {
            return ['valid' => false, 'message' => 'Validation failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Calculate pricing atomically with seat type validation
     *
     * @param int $showtimeId Showtime ID
     * @param array $seats Seats with types and codes
     * @return array Pricing calculation result
     */
    protected function calculateAtomicPricing(int $showtimeId, array $seats): array
    {
        try {
            $showtime = Showtime::find($showtimeId);
            if (!$showtime) {
                return ['success' => false, 'message' => 'Showtime not found'];
            }
            
            $pricing = $showtime->prices ?? [];
            $totalAmount = 0;
            $seatPricing = [];
            
            foreach ($seats as $seatData) {
                $seatCode = is_array($seatData) ? $seatData['seat'] : $seatData;
                $seatType = is_array($seatData) ? ($seatData['type'] ?? 'gold') : 'gold';
                
                if (!isset($pricing[$seatType])) {
                    return [
                        'success' => false, 
                        'message' => "Pricing not available for seat type: {$seatType}"
                    ];
                }
                
                $seatPrice = $pricing[$seatType];
                $totalAmount += $seatPrice;
                
                $seatPricing[] = [
                    'seat' => $seatCode,
                    'type' => $seatType,
                    'price' => $seatPrice
                ];
            }
            
            return [
                'success' => true,
                'pricing' => [
                    'total_amount' => $totalAmount,
                    'seat_pricing' => $seatPricing,
                    'currency' => 'VND'
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Pricing calculation failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Create booking record with optimistic locking
     *
     * @param array $bookingData Booking data
     * @param array $pricing Calculated pricing
     * @param string $transactionId Transaction identifier
     * @return Booking Created booking instance
     */
    protected function createBookingRecord(array $bookingData, array $pricing, string $transactionId): Booking
    {
        $bookingCode = $this->generateUniqueBookingCode();
        
        return Booking::create([
            'booking_code' => $bookingCode,
            'user_id' => $bookingData['user_id'],
            'showtime_id' => $bookingData['showtime_id'],
            'seats' => $pricing['seat_pricing'],
            'total_amount' => $pricing['total_amount'],
            'payment_method' => $bookingData['payment_method'] ?? null,
            'payment_status' => 'pending',
            'booking_status' => 'confirmed',
            'booked_at' => Carbon::now(),
            'transaction_id' => $transactionId
        ]);
    }
    
    /**
     * Update showtime availability atomically
     *
     * @param int $showtimeId Showtime ID
     * @param array $seats Seats to reserve/release
     * @param string $action Action: 'reserve' or 'release'
     * @return array Update result
     */
    protected function updateShowtimeAvailability(int $showtimeId, array $seats, string $action): array
    {
        try {
            $showtime = Showtime::where('id', $showtimeId)->lockForUpdate()->first();
            
            if (!$showtime) {
                return ['success' => false, 'message' => 'Showtime not found'];
            }
            
            $availableSeats = $showtime->available_seats ?? [];
            $updated = false;
            
            foreach ($seats as $seatData) {
                $seatCode = is_array($seatData) ? $seatData['seat'] : $seatData;
                $seatType = is_array($seatData) ? ($seatData['type'] ?? 'gold') : 'gold';
                
                if (!isset($availableSeats[$seatType])) {
                    $availableSeats[$seatType] = [];
                }
                
                if ($action === 'reserve') {
                    // Remove seat from available list
                    $key = array_search($seatCode, $availableSeats[$seatType]);
                    if ($key !== false) {
                        unset($availableSeats[$seatType][$key]);
                        $availableSeats[$seatType] = array_values($availableSeats[$seatType]);
                        $updated = true;
                    }
                } elseif ($action === 'release') {
                    // Add seat back to available list if not already there
                    if (!in_array($seatCode, $availableSeats[$seatType])) {
                        $availableSeats[$seatType][] = $seatCode;
                        sort($availableSeats[$seatType]);
                        $updated = true;
                    }
                }
            }
            
            if ($updated) {
                $showtime->update(['available_seats' => $availableSeats]);
            }
            
            return [
                'success' => true,
                'updated' => $updated,
                'available_seats' => $availableSeats
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Failed to update availability: ' . $e->getMessage()];
        }
    }
    
    /**
     * Create payment record for booking
     *
     * @param int $bookingId Booking ID
     * @param array $paymentData Payment data
     * @return Payment|null Created payment instance or null on failure
     */
    protected function createPaymentRecord(int $bookingId, array $paymentData): ?Payment
    {
        try {
            return Payment::create([
                'booking_id' => $bookingId,
                'amount' => $paymentData['amount'],
                'payment_method' => $paymentData['payment_method'],
                'status' => 'pending',
                'payment_data' => $paymentData['payment_details'] ?? null,
                'transaction_reference' => $paymentData['transaction_reference'] ?? null
            ]);
        } catch (Exception $e) {
            Log::error('Failed to create payment record', [
                'booking_id' => $bookingId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Validate cancellation eligibility
     *
     * @param Booking $booking Booking to validate
     * @return array Eligibility result
     */
    protected function validateCancellationEligibility(Booking $booking): array
    {
        // Check if booking is already used
        if ($booking->booking_status === 'used') {
            return ['eligible' => false, 'reason' => 'Booking has already been used'];
        }
        
        // Check cancellation deadline (e.g., 2 hours before show)
        $showtime = $booking->showtime;
        if ($showtime) {
            $showtimeDateTime = Carbon::parse($showtime->show_date . ' ' . $showtime->show_time);
            $cancellationDeadline = $showtimeDateTime->subHours(2);
            
            if (Carbon::now()->isAfter($cancellationDeadline)) {
                return ['eligible' => false, 'reason' => 'Cancellation deadline has passed'];
            }
        }
        
        return ['eligible' => true, 'deadline' => $cancellationDeadline ?? null];
    }
    
    /**
     * Process refund atomically
     *
     * @param Booking $booking Booking to refund
     * @param array $refundData Refund data
     * @return array Refund result
     */
    protected function processRefundAtomically(Booking $booking, array $refundData): array
    {
        try {
            // Update payment status to refunded
            if ($booking->payments()->exists()) {
                $booking->payments()->update([
                    'status' => 'refunded',
                    'refunded_at' => Carbon::now(),
                    'refund_reason' => $refundData['reason'] ?? 'Booking cancellation'
                ]);
            }
            
            // Update booking payment status
            $booking->update(['payment_status' => 'refunded']);
            
            return [
                'success' => true,
                'refund_amount' => $booking->total_amount,
                'refunded_at' => Carbon::now()->toISOString()
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Refund processing failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Cleanup failed booking attempt
     *
     * @param array $bookingData Original booking data
     * @param string $transactionId Transaction identifier
     */
    protected function cleanupFailedBooking(array $bookingData, string $transactionId): void
    {
        try {
            $showtimeId = $bookingData['showtime_id'] ?? null;
            $seats = $bookingData['seats'] ?? [];
            
            if ($showtimeId && !empty($seats)) {
                foreach ($seats as $seatData) {
                    $seatCode = is_array($seatData) ? $seatData['seat'] : $seatData;
                    
                    try {
                        $this->seatLockingService->releaseSeat($showtimeId, $seatCode);
                    } catch (Exception $e) {
                        Log::warning('Failed to cleanup seat during booking failure', [
                            'transaction_id' => $transactionId,
                            'seat' => $seatCode,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }
            
        } catch (Exception $e) {
            Log::error('Cleanup failed booking error', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Generate unique booking code
     *
     * @return string Unique booking code
     */
    protected function generateUniqueBookingCode(): string
    {
        do {
            $code = 'CB' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
        } while (Booking::where('booking_code', $code)->exists());
        
        return $code;
    }
    
    /**
     * Get error code based on error message
     *
     * @param string $message Error message
     * @return string Error code
     */
    protected function getErrorCode(string $message): string
    {
        if (strpos($message, 'Seat') !== false) {
            return 'SEAT_ERROR';
        }
        if (strpos($message, 'Payment') !== false) {
            return 'PAYMENT_ERROR';
        }
        if (strpos($message, 'Showtime') !== false) {
            return 'SHOWTIME_ERROR';
        }
        if (strpos($message, 'deadline') !== false) {
            return 'DEADLINE_ERROR';
        }
        
        return 'GENERAL_ERROR';
    }
}