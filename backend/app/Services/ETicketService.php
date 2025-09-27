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

            // Generate PDF ticket
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

        // Handle different time formats more robustly
        $showDateTimeString = $showtime->show_date . ' ' . $showtime->show_time;
        
        // Try to parse the datetime with multiple approaches
        $showDateTime = null;
        
        try {
            // First, try to parse with Carbon's flexible parser
            $showDateTime = Carbon::parse($showDateTimeString);
        } catch (Exception $e) {
            // If that fails, try to create from components
            try {
                $date = Carbon::parse($showtime->show_date);
                $timeParts = explode(':', $showtime->show_time);
                
                if (count($timeParts) >= 2) {
                    $hour = (int)$timeParts[0];
                    $minute = (int)$timeParts[1];
                    $second = count($timeParts) > 2 ? (int)$timeParts[2] : 0;
                    
                    $showDateTime = $date->setTime($hour, $minute, $second);
                } else {
                    // Fallback to just the date
                    $showDateTime = $date;
                }
            } catch (Exception $e2) {
                // If all else fails, use current time as fallback
                $showDateTime = now();
                Log::warning('Could not parse showtime, using current time as fallback', [
                    'showtime_string' => $showDateTimeString,
                    'booking_id' => $booking->id
                ]);
            }
        }

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
                'show_datetime' => $showDateTime->format('Y-m-d H:i:s'),
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
                'valid_until' => $showDateTime->copy()->addHours(2)->toISOString(),
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
     * Generate PDF ticket
     *
     * @param Booking $booking
     * @param array $ticketData
     * @param array $qrResult
     * @return array
     */
    private function generateTicketPdf(Booking $booking, array $ticketData, array $qrResult): array
    {
        try {
            // Generate HTML content first
            $htmlContent = $this->generateTicketHtml($ticketData, $qrResult);
            
            // Try to generate PDF using DomPDF if available
            if (class_exists('\Barryvdh\DomPDF\Facade\Pdf')) {
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($htmlContent)
                         ->setPaper('A4')
                         ->setOptions([
                             'defaultFont' => 'sans-serif',
                             'isRemoteEnabled' => true
                         ]);
                
                // Generate file name
                $fileName = 'tickets/ticket_' . $booking->booking_code . '_' . now()->format('YmdHis') . '.pdf';
                
                // Save PDF to storage
                Storage::disk('public')->put($fileName, $pdf->output());

                return [
                    'success' => true,
                    'data' => [
                        'file_path' => $fileName,
                        'file_url' => Storage::disk('public')->url($fileName),
                        'type' => 'pdf'
                    ]
                ];
            } else {
                // Fallback to HTML if DomPDF is not available
                $fileName = 'tickets/ticket_' . $booking->booking_code . '_' . now()->format('YmdHis') . '.html';
                Storage::disk('public')->put($fileName, $htmlContent);

                return [
                    'success' => true,
                    'data' => [
                        'file_path' => $fileName,
                        'file_url' => Storage::disk('public')->url($fileName),
                        'type' => 'html'
                    ]
                ];
            }

        } catch (Exception $e) {
            Log::error('PDF generation failed', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
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
        
        // Calculate showtime with end time based on movie duration
        $showtimeDisplay = $ticketData['showtime']['show_time'];
        if (isset($ticketData['movie']['duration'])) {
            try {
                // Parse the show time
                $timeParts = explode(':', $ticketData['showtime']['show_time']);
                if (count($timeParts) >= 2) {
                    $hours = (int)$timeParts[0];
                    $minutes = (int)$timeParts[1];
                    $startTime = new \DateTime();
                    $startTime->setTime($hours, $minutes, 0);
                    
                    // Calculate end time by adding movie duration (in minutes)
                    $endTime = clone $startTime;
                    $endTime->modify('+' . $ticketData['movie']['duration'] . ' minutes');
                    
                    // Format times
                    $showtimeDisplay = $startTime->format('H:i') . ' - ' . $endTime->format('H:i');
                }
            } catch (Exception $e) {
                // Fallback to just showing the start time if calculation fails
                $showtimeDisplay = $ticketData['showtime']['show_time'];
            }
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>E-Ticket - {$ticketData['booking_code']}</title>
            <style>
                body { 
                    font-family: 'Arial, sans-serif';
                    max-width: 533px;
                    margin: 0 auto;
                    padding: 13px;
                    background-color: #fff;
                    color: #000;
                }
                .ticket-header { 
                    text-align: center; 
                    border-bottom: 2px solid #ffc107;
                    padding-bottom: 13px;
                    margin-bottom: 13px;
                }
                .ticket-header h1 {
                    color: #E50914;
                    margin: 0;
                    font-size: 24px;
                }
                .ticket-header h2 {
                    color: #333;
                    margin: 7px 0;
                    font-size: 20px;
                }
                .ticket-header p {
                    font-size: 12px;
                    font-weight: bold;
                    margin: 0;
                }
                .ticket-section {
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 13px;
                    margin-bottom: 13px;
                }
                .ticket-section h3 {
                    color: #E50914;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 7px;
                    font-size: 16px;
                    margin-top: 0;
                }
                .ticket-info {
                    display: flex;
                    flex-wrap: wrap;
                    margin-bottom: 13px;
                }
                .movie-details, .booking-info {
                    flex: 1;
                    min-width: 200px;
                    padding-right: 13px;
                }
                .booking-info {
                    padding-right: 0;
                }
                .ticket-section p {
                    font-size: 11px;
                    margin: 5px 0;
                }
                .qr-section {
                    text-align: center;
                    margin-top: 7px;
                }
                .qr-section h3 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                .qr-container {
                    display: inline-block;
                    border: 2px solid #ffc107;
                    padding: 10px;
                    background-color: #fff;
                    border-radius: 5px;
                }
                .qr-container img {
                    max-width: 150px;
                    height: auto;
                }
                .qr-container p {
                    margin: 7px 0 0 0;
                    font-weight: bold;
                    font-size: 10px;
                }
                .booking-code {
                    margin-top: 7px;
                    font-size: 9px;
                    color: #666;
                }
                .important-info {
                    text-align: center;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                    border: 1px solid #dee2e6;
                }
                .important-info p {
                    margin: 0;
                    font-weight: bold;
                    font-size: 10px;
                }
                .important-info .secondary {
                    margin: 3px 0 0 0;
                    font-weight: normal;
                    font-size: 9px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 8px;
                    color: #666;
                }
                .footer p {
                    margin: 0;
                }
                .footer .contact {
                    margin: 3px 0 0 0;
                }
                .status-booked {
                    color: #28a745;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class='ticket-header'>
                <h1>🎬 CineBook</h1>
                <h2>E-Ticket</h2>
                <p>Booking Code: {$ticketData['booking_code']}</p>
            </div>

            <div class='ticket-section'>
                <div class='ticket-info'>
                    <div class='movie-details'>
                        <h3>Movie Details</h3>
                        <p><strong>Title:</strong> {$ticketData['movie']['title']}</p>
                        <p><strong>Theater:</strong> {$ticketData['theater']['name']}</p>
                        <p><strong>Date:</strong> " . date('d/m/Y', strtotime($ticketData['showtime']['show_date'])) . "</p>
                        <p><strong>Time:</strong> {$showtimeDisplay}</p>
                    </div>
                    
                    <div class='booking-info'>
                        <h3>Booking Information</h3>
                        <p><strong>Seats:</strong> " . (is_array($ticketData['seats']['seat_numbers']) ? implode(', ', $ticketData['seats']['seat_numbers']) : '') . "</p>
                        <p><strong>Total Amount:</strong> {$ticketData['payment']['formatted_amount']} VND</p>
                        <p><strong>Status:</strong> <span class='status-booked'>BOOKED</span></p>
                    </div>
                </div>

                " . ($qrCodeBase64 ? "
                <div class='qr-section'>
                    <h3>QR Code for Entry</h3>
                    <div class='qr-container'>
                        <img src='data:image/png;base64,{$qrCodeBase64}' alt='QR Code'>
                        <p>Scan at theater entrance</p>
                    </div>
                    <p class='booking-code'>Booking Code: {$ticketData['booking_code']}</p>
                </div>
                " : "") . "
            </div>

            <div class='important-info'>
                <p>Important: Please arrive at least 30 minutes before the showtime.</p>
                <p class='secondary'>Bring this e-ticket or have the booking code ready for entry.</p>
            </div>

            <div class='footer'>
                <p>Thank you for choosing CineBook!</p>
                <p class='contact'>support@cinebook.com | 1900-123-456</p>
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