<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Services\QrCodeService;
use App\Services\ETicketService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Exception;

class PaymentService
{
    protected $qrCodeService;
    protected $eTicketService;
    protected $notificationService;

    public function __construct(
        QrCodeService $qrCodeService, 
        ETicketService $eTicketService,
        NotificationService $notificationService
    ) {
        $this->qrCodeService = $qrCodeService;
        $this->eTicketService = $eTicketService;
        $this->notificationService = $notificationService;
    }
    /**
     * Process payment for a booking
     *
     * @param Booking $booking
     * @param array $paymentData
     * @return array
     * @throws Exception
     */
    public function processPayment(Booking $booking, array $paymentData): array
    {
        try {
            DB::beginTransaction();

            // Validate payment data
            $this->validatePaymentData($paymentData, $booking);

            // Create payment record
            $payment = $this->createPayment($booking, $paymentData);

            // Process dummy payment
            $paymentResult = $this->processDummyPayment($payment, $paymentData);

            if ($paymentResult['success']) {
                // Mark payment as completed
                $payment->markAsCompleted();
                
                // Update booking status
                $booking->update([
                    'payment_status' => Booking::PAYMENT_COMPLETED,
                    'booking_status' => Booking::STATUS_CONFIRMED
                ]);

                // Generate e-ticket using ETicketService
                $eTicketResult = $this->generateETicket($booking);

                // Send booking confirmation email
                $notificationResult = $this->notificationService->sendBookingConfirmation(
                    $booking, 
                    $eTicketResult['success'] ? $eTicketResult['data'] : null
                );

                DB::commit();

                Log::info('Payment processed successfully', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'user_id' => $booking->user_id,
                    'notification_sent' => $notificationResult['success'] ?? false
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment processed successfully',
                    'data' => [
                        'payment' => $payment->load('booking'),
                        'booking' => $booking->fresh(),
                        'transaction_id' => $payment->transaction_id,
                        'eticket' => $eTicketResult['success'] ? $eTicketResult['data'] : null,
                        'notification' => $notificationResult ?? null
                    ]
                ];
            } else {
                // Mark payment as failed
                $payment->markAsFailed($paymentResult['reason'] ?? 'Payment processing failed');
                
                $booking->update([
                    'payment_status' => Booking::PAYMENT_FAILED,
                    'booking_status' => Booking::STATUS_FAILED
                ]);

                DB::commit();

                return [
                    'success' => false,
                    'message' => $paymentResult['reason'] ?? 'Payment processing failed',
                    'data' => [
                        'payment' => $payment->fresh(),
                        'booking' => $booking->fresh()
                    ]
                ];
            }

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Payment processing failed', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new Exception('Payment processing failed: ' . $e->getMessage());
        }
    }

    /**
     * Validate payment data
     *
     * @param array $paymentData
     * @param Booking $booking
     * @throws ValidationException
     */
    private function validatePaymentData(array $paymentData, Booking $booking): void
    {
        // Validate payment method
        if (!in_array($paymentData['payment_method'], ['credit_card', 'debit_card', 'bank_transfer'])) {
            throw ValidationException::withMessages([
                'payment_method' => 'Invalid payment method'
            ]);
        }

        // Validate amount matches booking total
        if (isset($paymentData['amount']) && $paymentData['amount'] != $booking->total_amount) {
            throw ValidationException::withMessages([
                'amount' => 'Payment amount does not match booking total'
            ]);
        }

        // Validate card details for card payments
        if (in_array($paymentData['payment_method'], ['credit_card', 'debit_card'])) {
            $this->validateCardDetails($paymentData['card_details'] ?? []);
        }

        // Check if booking is already paid
        if ($booking->isPaid()) {
            throw ValidationException::withMessages([
                'booking' => 'This booking has already been paid'
            ]);
        }

        // Check if booking belongs to authenticated user (will be validated in controller)
    }

    /**
     * Validate credit card details (dummy validation)
     *
     * @param array $cardDetails
     * @throws ValidationException
     */
    private function validateCardDetails(array $cardDetails): void
    {
        $errors = [];

        // Validate card number (basic Luhn algorithm check)
        $cardNumber = preg_replace('/\s+/', '', $cardDetails['card_number'] ?? '');
        if (!$this->isValidCardNumber($cardNumber)) {
            $errors['card_number'] = 'Invalid card number';
        }

        // Validate expiry date
        $expiryMonth = $cardDetails['expiry_month'] ?? '';
        $expiryYear = $cardDetails['expiry_year'] ?? '';
        
        if (!$this->isValidExpiryDate($expiryMonth, $expiryYear)) {
            $errors['expiry'] = 'Invalid or expired card';
        }

        // Validate CVV
        $cvv = $cardDetails['cvv'] ?? '';
        if (!preg_match('/^\d{3,4}$/', $cvv)) {
            $errors['cvv'] = 'Invalid CVV';
        }

        // Validate card holder name
        $cardHolder = trim($cardDetails['card_holder'] ?? '');
        if (strlen($cardHolder) < 2) {
            $errors['card_holder'] = 'Card holder name is required';
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Validate card number using Luhn algorithm
     *
     * @param string $cardNumber
     * @return bool
     */
    private function isValidCardNumber(string $cardNumber): bool
    {
        if (!preg_match('/^\d{13,19}$/', $cardNumber)) {
            return false;
        }

        $sum = 0;
        $alternate = false;
        
        for ($i = strlen($cardNumber) - 1; $i >= 0; $i--) {
            $digit = intval($cardNumber[$i]);
            
            if ($alternate) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit = ($digit % 10) + 1;
                }
            }
            
            $sum += $digit;
            $alternate = !$alternate;
        }
        
        return ($sum % 10) === 0;
    }

    /**
     * Validate expiry date
     *
     * @param string $month
     * @param string $year
     * @return bool
     */
    private function isValidExpiryDate(string $month, string $year): bool
    {
        if (!preg_match('/^(0[1-9]|1[0-2])$/', $month) || !preg_match('/^\d{4}$/', $year)) {
            return false;
        }

        $expiryDate = \DateTime::createFromFormat('Y-m-t', $year . '-' . $month);
        $now = new \DateTime();
        
        return $expiryDate && $expiryDate >= $now;
    }

    /**
     * Create payment record
     *
     * @param Booking $booking
     * @param array $paymentData
     * @return Payment
     */
    private function createPayment(Booking $booking, array $paymentData): Payment
    {
        return Payment::create([
            'booking_id' => $booking->id,
            'payment_method' => $paymentData['payment_method'],
            'amount' => $booking->total_amount,
            'currency' => 'VND',
            'status' => Payment::STATUS_PROCESSING,
            'transaction_id' => $this->generateTransactionId(),
        ]);
    }

    /**
     * Process dummy payment (simulates real payment gateway)
     *
     * @param Payment $payment
     * @param array $paymentData
     * @return array
     */
    private function processDummyPayment(Payment $payment, array $paymentData): array
    {
        // Simulate payment processing delay
        usleep(500000); // 0.5 seconds

        // Simulate different payment scenarios
        $cardNumber = preg_replace('/\s+/', '', $paymentData['card_details']['card_number'] ?? '');
        
        // Specific test card numbers for different scenarios
        switch ($cardNumber) {
            case '4000000000000002': // Declined card
                return [
                    'success' => false,
                    'reason' => 'Card declined by issuer',
                    'gateway_response' => [
                        'status' => 'declined',
                        'decline_code' => 'card_declined',
                        'message' => 'Your card was declined.'
                    ]
                ];
                
            case '4000000000000119': // Processing error
                return [
                    'success' => false,
                    'reason' => 'Processing error occurred',
                    'gateway_response' => [
                        'status' => 'error',
                        'error_code' => 'processing_error',
                        'message' => 'A processing error occurred. Please try again.'
                    ]
                ];
                
            case '4000000000000341': // Insufficient funds
                return [
                    'success' => false,
                    'reason' => 'Insufficient funds',
                    'gateway_response' => [
                        'status' => 'declined',
                        'decline_code' => 'insufficient_funds',
                        'message' => 'Your card has insufficient funds.'
                    ]
                ];
                
            default: // Success for all other cards
                $gatewayResponse = [
                    'status' => 'succeeded',
                    'transaction_id' => $payment->transaction_id,
                    'processed_at' => now()->toISOString(),
                    'gateway' => 'dummy_gateway',
                    'authorization_code' => strtoupper(substr(md5($payment->transaction_id), 0, 6))
                ];
                
                $payment->update([
                    'gateway_response' => $gatewayResponse
                ]);
                
                return [
                    'success' => true,
                    'gateway_response' => $gatewayResponse
                ];
        }
    }

    /**
     * Generate unique transaction ID
     *
     * @return string
     */
    private function generateTransactionId(): string
    {
        return 'TXN_' . date('YmdHis') . '_' . strtoupper(substr(uniqid(), -6));
    }

    /**
     * Process refund for a payment
     *
     * @param Payment $payment
     * @param float|null $amount
     * @return array
     */
    public function processRefund(Payment $payment, ?float $amount = null): array
    {
        try {
            if (!$payment->isSuccessful()) {
                throw new Exception('Cannot refund a payment that was not successful');
            }

            $refundAmount = $amount ?? $payment->amount;
            
            if ($refundAmount > $payment->amount) {
                throw new Exception('Refund amount cannot exceed original payment amount');
            }

            DB::beginTransaction();

            // Create refund record (as a negative payment)
            $refund = Payment::create([
                'booking_id' => $payment->booking_id,
                'payment_method' => $payment->payment_method,
                'amount' => -$refundAmount,
                'currency' => $payment->currency,
                'status' => Payment::STATUS_COMPLETED,
                'transaction_id' => $this->generateTransactionId(),
                'gateway_response' => [
                    'status' => 'refunded',
                    'original_transaction_id' => $payment->transaction_id,
                    'refund_amount' => $refundAmount,
                    'refunded_at' => now()->toISOString()
                ]
            ]);

            // Update original payment status
            $payment->update(['status' => Payment::STATUS_REFUNDED]);

            // Update booking status
            $payment->booking->update([
                'payment_status' => Booking::PAYMENT_REFUNDED,
                'booking_status' => Booking::STATUS_CANCELLED
            ]);

            DB::commit();

            Log::info('Refund processed successfully', [
                'original_payment_id' => $payment->id,
                'refund_payment_id' => $refund->id,
                'refund_amount' => $refundAmount
            ]);

            return [
                'success' => true,
                'message' => 'Refund processed successfully',
                'data' => [
                    'refund' => $refund,
                    'original_payment' => $payment->fresh()
                ]
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('Refund processing failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get payment statistics
     *
     * @param array $filters
     * @return array
     */
    public function getPaymentStatistics(array $filters = []): array
    {
        $query = Payment::query();

        // Apply filters
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $payments = $query->get();

        return [
            'total_payments' => $payments->count(),
            'successful_payments' => $payments->where('status', Payment::STATUS_COMPLETED)->count(),
            'failed_payments' => $payments->where('status', Payment::STATUS_FAILED)->count(),
            'pending_payments' => $payments->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_PROCESSING])->count(),
            'total_amount' => $payments->where('status', Payment::STATUS_COMPLETED)->sum('amount'),
            'average_amount' => $payments->where('status', Payment::STATUS_COMPLETED)->avg('amount'),
            'success_rate' => $payments->count() > 0 ? round(($payments->where('status', Payment::STATUS_COMPLETED)->count() / $payments->count()) * 100, 2) : 0
        ];
    }

    /**
     * Generate e-ticket using ETicketService
     *
     * @param Booking $booking
     * @return array
     */
    private function generateETicket(Booking $booking): array
    {
        try {
            Log::info('Starting e-ticket generation', ['booking_id' => $booking->id]);
            
            $result = $this->eTicketService->generateETicket($booking);
            
            if ($result['success']) {
                Log::info('E-ticket generated successfully', [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code
                ]);
            } else {
                Log::warning('E-ticket generation failed', [
                    'booking_id' => $booking->id,
                    'error' => $result['message']
                ]);
            }
            
            return $result;
            
        } catch (Exception $e) {
            Log::error('E-ticket generation exception', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'E-ticket generation failed: ' . $e->getMessage()
            ];
        }
    }
}