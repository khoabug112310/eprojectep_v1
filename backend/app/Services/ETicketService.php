<?php

namespace App\Services;

use App\Models\Booking;
use App\Services\QrCodeService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;

class ETicketService
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Generate complete e-ticket for a booking
     *
     * @param Booking $booking
     * @param array $options
     * @return array
     */
    public function generateETicket(Booking $booking, array $options = []): array
    {
        try {
            // Load necessary relationships
            $booking->load(['showtime.movie', 'showtime.theater', 'user', 'payment']);

            // Validate booking status
            if (!$this->isBookingEligibleForTicket($booking)) {
                return [
                    'success' => false,
                    'message' => 'Booking is not eligible for e-ticket generation'
                ];
            }

            // Generate ticket data
            $ticketData = $this->buildTicketData($booking);

            // Generate QR code
            $qrResult = $this->generateTicketQr($booking, $ticketData);
            if (!$qrResult['success']) {
                Log::warning('QR code generation failed for ticket', [
                    'booking_id' => $booking->id,
                    'error' => $qrResult['message']
                ]);
            }

            // Generate PDF ticket (placeholder for now)
            $pdfResult = $this->generateTicketPdf($booking, $ticketData, $qrResult);

            // Update booking with ticket information
            $updateData = [
                'ticket_data' => $ticketData,
            ];

            if ($qrResult['success']) {
                $updateData['qr_code'] = $qrResult['data']['qr_code_path'];
            }

            $booking->update($updateData);

            return [
                'success' => true,
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'ticket_data' => $ticketData,
                    'qr_code' => $qrResult['success'] ? $qrResult['data'] : null,
                    'pdf_ticket' => $pdfResult['success'] ? $pdfResult['data'] : null,
                    'download_urls' => $this->getDownloadUrls($booking, $qrResult, $pdfResult),
                ],
                'message' => 'E-ticket generated successfully'
            ];

        } catch (Exception $e) {
            Log::error('E-ticket generation failed', [
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

    /**
     * Check if booking is eligible for e-ticket generation
     *
     * @param Booking $booking
     * @return bool
     */
    public function isBookingEligibleForTicket(Booking $booking): bool
    {
        return $booking->isPaid() && 
               in_array($booking->booking_status, [Booking::STATUS_CONFIRMED, Booking::STATUS_COMPLETED]);
    }

    /**
     * Build comprehensive ticket data
     *
     * @param Booking $booking
     * @return array
     */
    private function buildTicketData(Booking $booking): array
    {
        $showtime = $booking->showtime;
        $movie = $showtime->movie;
        $theater = $showtime->theater;
        $user = $booking->user;

        return [
            // Booking Information
            'booking_code' => $booking->booking_code,
            'booking_date' => $booking->created_at->format('Y-m-d H:i:s'),
            'booking_status' => $booking->booking_status,
            'payment_status' => $booking->payment_status,

            // Movie Information
            'movie' => [
                'id' => $movie->id,
                'title' => $movie->title,
                'duration' => $movie->duration,
                'genre' => $movie->genre,
                'age_rating' => $movie->age_rating,
                'poster_url' => $movie->poster_url,
                'language' => $movie->language,
            ],

            // Theater Information
            'theater' => [
                'id' => $theater->id,
                'name' => $theater->name,
                'address' => $theater->address,
                'city' => $theater->city,
            ],

            // Showtime Information
            'showtime' => [
                'id' => $showtime->id,
                'show_date' => $showtime->show_date,
                'show_time' => $showtime->show_time,
                'show_datetime' => Carbon::createFromFormat('Y-m-d H:i:s', $showtime->show_date . ' ' . $showtime->show_time)->format('Y-m-d H:i:s'),
            ],

            // Seat Information
            'seats' => [
                'details' => $booking->seats,
                'count' => count($booking->seats),
                'seat_numbers' => collect($booking->seats)->pluck('seat')->toArray(),
                'seat_types' => collect($booking->seats)->pluck('type')->unique()->toArray(),
            ],

            // Customer Information
            'customer' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],

            // Payment Information
            'payment' => [
                'total_amount' => $booking->total_amount,
                'payment_method' => $booking->payment_method,
                'formatted_amount' => number_format($booking->total_amount, 0, '.', ',') . ' VND',
                'payment_date' => $booking->payment?->processed_at?->format('Y-m-d H:i:s'),
            ],

            // Ticket Metadata
            'ticket_info' => [
                'generated_at' => now()->toISOString(),
                'ticket_type' => 'digital',
                'valid_until' => Carbon::createFromFormat('Y-m-d H:i:s', $showtime->show_date . ' ' . $showtime->show_time)->addHours(2)->toISOString(),
                'terms' => 'This ticket is valid only for the specified showtime. Please arrive 30 minutes before showtime.',
            ],
        ];
    }

    /**
     * Generate QR code for ticket
     *
     * @param Booking $booking
     * @param array $ticketData
     * @return array
     */
    private function generateTicketQr(Booking $booking, array $ticketData): array
    {
        $qrData = [
            'booking_code' => $booking->booking_code,
            'customer_name' => $ticketData['customer']['name'],
            'movie_title' => $ticketData['movie']['title'],
            'theater_name' => $ticketData['theater']['name'],
            'show_datetime' => $ticketData['showtime']['show_datetime'],
            'seats' => $ticketData['seats']['seat_numbers'],
            'total_amount' => $ticketData['payment']['total_amount'],
        ];

        return $this->qrCodeService->generateTicketQrCode(
            $booking->booking_code,
            $qrData
        );
    }

    /**
     * Generate PDF ticket (placeholder implementation)
     *
     * @param Booking $booking
     * @param array $ticketData
     * @param array $qrResult
     * @return array
     */
    private function generateTicketPdf(Booking $booking, array $ticketData, array $qrResult): array
    {
        try {
            // For now, we'll generate a simple HTML representation
            // In the future, this could use libraries like TCPDF or DomPDF
            
            $htmlContent = $this->generateTicketHtml($ticketData, $qrResult);
            
            // Save HTML version
            $fileName = 'tickets/ticket_' . $booking->booking_code . '_' . now()->format('YmdHis') . '.html';
            Storage::disk('public')->put($fileName, $htmlContent);

            return [
                'success' => true,
                'data' => [
                    'file_path' => $fileName,
                    'file_url' => Storage::disk('public')->url($fileName),
                    'html_content' => $htmlContent,
                    'type' => 'html'
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'PDF generation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate HTML representation of ticket
     *
     * @param array $ticketData
     * @param array $qrResult
     * @return string
     */
    private function generateTicketHtml(array $ticketData, array $qrResult): string
    {
        $qrCodeBase64 = $qrResult['success'] ? $qrResult['data']['qr_code_image_base64'] : '';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>E-Ticket - {$ticketData['booking_code']}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .ticket-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                .ticket-section { margin-bottom: 15px; }
                .ticket-section h3 { margin: 0 0 10px 0; color: #333; }
                .ticket-info { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .qr-code { text-align: center; margin: 20px 0; }
                .qr-code img { max-width: 200px; }
                .seats { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class='ticket-header'>
                <h1>🎬 CINEBOOK E-TICKET</h1>
                <h2>Booking Code: {$ticketData['booking_code']}</h2>
            </div>

            <div class='ticket-section'>
                <h3>🎭 Movie Information</h3>
                <div class='ticket-info'><span><strong>Title:</strong></span><span>{$ticketData['movie']['title']}</span></div>
                <div class='ticket-info'><span><strong>Genre:</strong></span><span>" . (is_array($ticketData['movie']['genre']) ? implode(', ', $ticketData['movie']['genre']) : $ticketData['movie']['genre']) . "</span></div>
                <div class='ticket-info'><span><strong>Duration:</strong></span><span>{$ticketData['movie']['duration']} minutes</span></div>
                <div class='ticket-info'><span><strong>Age Rating:</strong></span><span>{$ticketData['movie']['age_rating']}</span></div>
            </div>

            <div class='ticket-section'>
                <h3>🏢 Theater & Showtime</h3>
                <div class='ticket-info'><span><strong>Theater:</strong></span><span>{$ticketData['theater']['name']}</span></div>
                <div class='ticket-info'><span><strong>Address:</strong></span><span>{$ticketData['theater']['address']}</span></div>
                <div class='ticket-info'><span><strong>Date:</strong></span><span>{$ticketData['showtime']['show_date']}</span></div>
                <div class='ticket-info'><span><strong>Time:</strong></span><span>{$ticketData['showtime']['show_time']}</span></div>
            </div>

            <div class='ticket-section'>
                <h3>🪑 Seat Information</h3>
                <div class='seats'>
                    <div class='ticket-info'><span><strong>Seats:</strong></span><span>" . (is_array($ticketData['seats']['seat_numbers']) ? implode(', ', $ticketData['seats']['seat_numbers']) : '') . "</span></div>
                    <div class='ticket-info'><span><strong>Seat Count:</strong></span><span>{$ticketData['seats']['count']}</span></div>
                    <div class='ticket-info'><span><strong>Seat Types:</strong></span><span>" . (is_array($ticketData['seats']['seat_types']) ? implode(', ', $ticketData['seats']['seat_types']) : '') . "</span></div>
                </div>
            </div>

            <div class='ticket-section'>
                <h3>👤 Customer Information</h3>
                <div class='ticket-info'><span><strong>Name:</strong></span><span>{$ticketData['customer']['name']}</span></div>
                <div class='ticket-info'><span><strong>Email:</strong></span><span>{$ticketData['customer']['email']}</span></div>
            </div>

            <div class='ticket-section'>
                <h3>💰 Payment Information</h3>
                <div class='ticket-info'><span><strong>Total Amount:</strong></span><span>{$ticketData['payment']['formatted_amount']}</span></div>
                <div class='ticket-info'><span><strong>Payment Method:</strong></span><span>{$ticketData['payment']['payment_method']}</span></div>
                <div class='ticket-info'><span><strong>Payment Status:</strong></span><span>{$ticketData['payment_status']}</span></div>
            </div>

            " . ($qrCodeBase64 ? "
            <div class='qr-code'>
                <h3>📱 QR Code</h3>
                <img src='data:image/png;base64,{$qrCodeBase64}' alt='Ticket QR Code'>
                <p><small>Scan this QR code at the theater for verification</small></p>
            </div>
            " : "") . "

            <div class='footer'>
                <p><strong>Important:</strong> {$ticketData['ticket_info']['terms']}</p>
                <p>Generated on: {$ticketData['ticket_info']['generated_at']}</p>
                <p>Valid until: {$ticketData['ticket_info']['valid_until']}</p>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Get download URLs for ticket files
     *
     * @param Booking $booking
     * @param array $qrResult
     * @param array $pdfResult
     * @return array
     */
    private function getDownloadUrls(Booking $booking, array $qrResult, array $pdfResult): array
    {
        $urls = [];

        if ($qrResult['success']) {
            $urls['qr_code'] = $qrResult['data']['qr_code_url'] ?? null;
        }

        if ($pdfResult['success']) {
            $urls['ticket'] = $pdfResult['data']['file_url'] ?? null;
        }

        return $urls;
    }

    /**
     * Verify ticket using QR code data
     *
     * @param string $qrData
     * @return array
     */
    public function verifyTicket(string $qrData): array
    {
        try {
            // First verify the QR code format
            $qrVerification = $this->qrCodeService->verifyQrCodeData($qrData);
            
            if (!$qrVerification['success']) {
                return $qrVerification;
            }

            $decodedData = $qrVerification['data'];

            // Check if it's a cinema ticket
            if ($decodedData['type'] !== 'cinema_ticket') {
                return [
                    'success' => false,
                    'message' => 'Not a valid cinema ticket QR code'
                ];
            }

            // Find the booking
            $booking = Booking::where('booking_code', $decodedData['booking_code'])
                            ->with(['showtime.movie', 'showtime.theater', 'user'])
                            ->first();

            if (!$booking) {
                return [
                    'success' => false,
                    'message' => 'Booking not found'
                ];
            }

            // Verify booking status
            if (!$this->isTicketValid($booking)) {
                return [
                    'success' => false,
                    'message' => 'Ticket is not valid',
                    'reason' => $this->getTicketInvalidReason($booking)
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'booking' => $booking,
                    'ticket_data' => $booking->ticket_data,
                    'verification_time' => now()->toISOString(),
                    'status' => 'valid'
                ],
                'message' => 'Ticket verified successfully'
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Ticket verification failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if ticket is currently valid
     *
     * @param Booking $booking
     * @return bool
     */
    public function isTicketValid(Booking $booking): bool
    {
        // Check payment status
        if (!$booking->isPaid()) {
            return false;
        }

        // Check booking status
        if (!in_array($booking->booking_status, [Booking::STATUS_CONFIRMED, Booking::STATUS_COMPLETED])) {
            return false;
        }

        // Check if showtime is in the future (allow up to 2 hours after showtime)
        $showDateTime = Carbon::createFromFormat('Y-m-d H:i:s', $booking->showtime->show_date . ' ' . $booking->showtime->show_time);
        $validUntil = $showDateTime->copy()->addHours(2);
        
        return now()->lte($validUntil);
    }

    /**
     * Get reason why ticket is invalid
     *
     * @param Booking $booking
     * @return string
     */
    private function getTicketInvalidReason(Booking $booking): string
    {
        if (!$booking->isPaid()) {
            return 'Payment not completed';
        }

        if ($booking->booking_status === Booking::STATUS_CANCELLED) {
            return 'Booking has been cancelled';
        }

        if ($booking->booking_status === Booking::STATUS_FAILED) {
            return 'Booking failed';
        }

        $showDateTime = Carbon::createFromFormat('Y-m-d H:i:s', $booking->showtime->show_date . ' ' . $booking->showtime->show_time);
        $validUntil = $showDateTime->copy()->addHours(2);
        
        if (now()->gt($validUntil)) {
            return 'Ticket has expired';
        }

        return 'Unknown reason';
    }

    /**
     * Regenerate e-ticket for a booking
     *
     * @param Booking $booking
     * @return array
     */
    public function regenerateETicket(Booking $booking): array
    {
        // Delete old QR code file if exists
        if ($booking->qr_code) {
            $this->qrCodeService->deleteQrCodeFile($booking->qr_code);
        }

        // Generate new e-ticket
        return $this->generateETicket($booking);
    }

    /**
     * Get ticket display data for frontend
     *
     * @param Booking $booking
     * @return array
     */
    public function getTicketDisplayData(Booking $booking): array
    {
        if (!$booking->ticket_data) {
            return [
                'success' => false,
                'message' => 'E-ticket not generated yet'
            ];
        }

        $qrCodeUrl = null;
        if ($booking->qr_code) {
            $qrCodeUrl = $this->qrCodeService->getQrCodeUrl($booking->qr_code);
        }

        return [
            'success' => true,
            'data' => [
                'booking_code' => $booking->booking_code,
                'ticket_data' => $booking->ticket_data,
                'qr_code_url' => $qrCodeUrl,
                'is_valid' => $this->isTicketValid($booking),
                'validation_message' => $this->isTicketValid($booking) ? 'Valid' : $this->getTicketInvalidReason($booking),
            ]
        ];
    }
}