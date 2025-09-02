<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QrCodeController extends Controller
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Test QR code generation
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function testGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data' => 'required|string|max:1000',
            'type' => 'sometimes|in:simple,ticket',
            'booking_code' => 'required_if:type,ticket|string',
            'size' => 'sometimes|integer|min:50|max:500'
        ]);

        try {
            if (($validated['type'] ?? 'simple') === 'ticket') {
                $result = $this->qrCodeService->generateTicketQrCode(
                    $validated['booking_code'],
                    ['custom_data' => $validated['data']]
                );
            } else {
                $result = $this->qrCodeService->generateQrCode(
                    $validated['data'],
                    [
                        'size' => $validated['size'] ?? 200,
                        'save_to_storage' => true
                    ]
                );
            }

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'message' => 'QR code generated successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QR code generation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify QR code data
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_data' => 'required|string'
        ]);

        $result = $this->qrCodeService->verifyQrCodeData($validated['qr_data']);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'message' => $result['message']
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
    }
}