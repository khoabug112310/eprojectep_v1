<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;

class QrCodeService
{
    /**
     * Generate QR code for booking/e-ticket
     *
     * @param string $bookingCode
     * @param array $ticketData
     * @return array
     */
    public function generateTicketQrCode(string $bookingCode, array $ticketData = []): array
    {
        try {
            // Create QR code data structure
            $qrData = [
                'booking_code' => $bookingCode,
                'type' => 'cinema_ticket',
                'generated_at' => now()->toISOString(),
                'verification_url' => config('app.url') . '/api/v1/tickets/verify/' . $bookingCode,
            ];

            // Add additional ticket data if provided
            if (!empty($ticketData)) {
                $qrData = array_merge($qrData, $ticketData);
            }

            // Convert to JSON string for QR code
            $qrCodeData = json_encode($qrData);

            // Generate QR code as PNG (base64)
            $qrCodeImage = QrCode::format('png')
                ->size(300)
                ->errorCorrection('M')
                ->margin(2)
                ->generate($qrCodeData);

            // Generate unique filename
            $fileName = 'qr_codes/ticket_' . $bookingCode . '_' . Str::random(8) . '.png';

            // Save QR code to storage (public disk)
            Storage::disk('public')->put($fileName, $qrCodeImage);

            // Get public URL
            $qrCodeUrl = Storage::disk('public')->url($fileName);

            return [
                'success' => true,
                'data' => [
                    'qr_code_data' => $qrCodeData,
                    'qr_code_image_base64' => base64_encode($qrCodeImage),
                    'qr_code_url' => $qrCodeUrl,
                    'qr_code_path' => $fileName,
                    'verification_data' => $qrData
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to generate QR code: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate simple QR code with custom data
     *
     * @param string $data
     * @param array $options
     * @return array
     */
    public function generateQrCode(string $data, array $options = []): array
    {
        try {
            // Default options
            $defaultOptions = [
                'format' => 'png',
                'size' => 200,
                'errorCorrection' => 'M',
                'margin' => 2,
                'save_to_storage' => false
            ];

            $options = array_merge($defaultOptions, $options);

            // Generate QR code
            $qrCode = QrCode::format($options['format'])
                ->size($options['size'])
                ->errorCorrection($options['errorCorrection'])
                ->margin($options['margin'])
                ->generate($data);

            $result = [
                'success' => true,
                'data' => [
                    'qr_code_data' => $data,
                    'qr_code_image_base64' => base64_encode($qrCode)
                ]
            ];

            // Save to storage if requested
            if ($options['save_to_storage']) {
                $fileName = 'qr_codes/custom_' . Str::random(12) . '.' . $options['format'];
                Storage::disk('public')->put($fileName, $qrCode);
                
                $result['data']['qr_code_url'] = Storage::disk('public')->url($fileName);
                $result['data']['qr_code_path'] = $fileName;
            }

            return $result;

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to generate QR code: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify QR code data (decode and validate)
     *
     * @param string $qrCodeData
     * @return array
     */
    public function verifyQrCodeData(string $qrCodeData): array
    {
        try {
            // Try to decode JSON data
            $decodedData = json_decode($qrCodeData, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return [
                    'success' => false,
                    'message' => 'Invalid QR code format'
                ];
            }

            // Validate required fields for ticket QR codes
            if (isset($decodedData['type']) && $decodedData['type'] === 'cinema_ticket') {
                $requiredFields = ['booking_code', 'generated_at', 'verification_url'];
                
                foreach ($requiredFields as $field) {
                    if (!isset($decodedData[$field])) {
                        return [
                            'success' => false,
                            'message' => "Missing required field: {$field}"
                        ];
                    }
                }
            }

            return [
                'success' => true,
                'data' => $decodedData,
                'message' => 'QR code verified successfully'
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'QR code verification failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create SVG QR code (for better scalability)
     *
     * @param string $data
     * @param int $size
     * @return string
     */
    public function generateSvgQrCode(string $data, int $size = 200): string
    {
        return QrCode::format('svg')
            ->size($size)
            ->errorCorrection('M')
            ->margin(0)
            ->generate($data);
    }

    /**
     * Delete QR code file from storage
     *
     * @param string $filePath
     * @return bool
     */
    public function deleteQrCodeFile(string $filePath): bool
    {
        try {
            if (Storage::disk('public')->exists($filePath)) {
                return Storage::disk('public')->delete($filePath);
            }
            return true; // File doesn't exist, consider as deleted
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get QR code file URL
     *
     * @param string $filePath
     * @return string|null
     */
    public function getQrCodeUrl(string $filePath): ?string
    {
        try {
            if (Storage::disk('public')->exists($filePath)) {
                return Storage::disk('public')->url($filePath);
            }
            return null;
        } catch (Exception $e) {
            return null;
        }
    }
}