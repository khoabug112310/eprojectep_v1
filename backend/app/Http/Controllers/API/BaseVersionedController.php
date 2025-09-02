<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponseTrait;

abstract class BaseVersionedController extends Controller
{
    use ApiResponseTrait;
    
    /**
     * Get the current API version from request
     *
     * @param Request $request
     * @return string
     */
    protected function getApiVersion(Request $request): string
    {
        return $request->attributes->get('api_version', 'v1');
    }
    
    /**
     * Check if request is for a specific version or higher
     *
     * @param Request $request
     * @param string $minVersion
     * @return bool
     */
    protected function isVersionOrHigher(Request $request, string $minVersion): bool
    {
        $currentVersion = $this->getApiVersion($request);
        return version_compare($currentVersion, $minVersion, '>=');
    }
    
    /**
     * Transform response based on API version
     *
     * @param array $data
     * @param Request $request
     * @return array
     */
    protected function transformResponse(array $data, Request $request): array
    {
        $version = $this->getApiVersion($request);
        
        switch ($version) {
            case 'v1':
                return $this->transformToV1($data, $request);
            case 'v2':
                return $this->transformToV2($data, $request);
            default:
                return $data;
        }
    }
    
    /**
     * Transform data for API v1 compatibility
     *
     * @param array $data
     * @param Request $request
     * @return array
     */
    protected function transformToV1(array $data, Request $request): array
    {
        // V1 compatibility transformations
        if (isset($data['data'])) {
            $transformedData = $this->applyV1Transformations($data['data']);
            $data['data'] = $transformedData;
        }
        
        return $data;
    }
    
    /**
     * Transform data for API v2
     *
     * @param array $data
     * @param Request $request
     * @return array
     */
    protected function transformToV2(array $data, Request $request): array
    {
        // V2 enhancements and new fields
        if (isset($data['data'])) {
            $transformedData = $this->applyV2Enhancements($data['data']);
            $data['data'] = $transformedData;
        }
        
        // Add version-specific metadata
        $data['meta'] = array_merge($data['meta'] ?? [], [
            'api_version' => 'v2',
            'response_time' => microtime(true) - LARAVEL_START,
            'generated_at' => now()->toISOString()
        ]);
        
        return $data;
    }
    
    /**
     * Apply V1 backward compatibility transformations
     *
     * @param mixed $data
     * @return mixed
     */
    protected function applyV1Transformations($data)
    {
        if (is_array($data)) {
            // Handle array of items
            if (isset($data[0]) && is_array($data[0])) {
                return array_map([$this, 'applyV1ItemTransformations'], $data);
            } else {
                return $this->applyV1ItemTransformations($data);
            }
        }
        
        return $data;
    }
    
    /**
     * Apply V1 transformations to a single item
     *
     * @param array $item
     * @return array
     */
    protected function applyV1ItemTransformations(array $item): array
    {
        // Common V1 transformations
        
        // 1. Remove V2+ fields that didn't exist in V1
        $v2OnlyFields = ['created_by', 'updated_by', 'metadata', 'extended_info'];
        foreach ($v2OnlyFields as $field) {
            unset($item[$field]);
        }
        
        // 2. Rename fields for V1 compatibility
        $fieldMappings = [
            'total_amount' => 'amount', // V1 used 'amount', V2 uses 'total_amount'
            'seat_configuration' => 'seats', // V1 used 'seats', V2 uses 'seat_configuration'
            'created_at' => 'created_date', // V1 used different date format
        ];
        
        foreach ($fieldMappings as $newField => $oldField) {
            if (isset($item[$newField])) {
                $item[$oldField] = $item[$newField];
                unset($item[$newField]);
            }
        }
        
        // 3. Transform date formats for V1
        $dateFields = ['created_date', 'updated_date', 'show_date'];
        foreach ($dateFields as $field) {
            if (isset($item[$field])) {
                $item[$field] = $this->formatDateForV1($item[$field]);
            }
        }
        
        // 4. Transform nested objects for V1
        if (isset($item['seats']) && is_array($item['seats'])) {
            $item['seats'] = $this->transformSeatsForV1($item['seats']);
        }
        
        return $item;
    }
    
    /**
     * Apply V2 enhancements
     *
     * @param mixed $data
     * @return mixed
     */
    protected function applyV2Enhancements($data)
    {
        if (is_array($data)) {
            // Handle array of items
            if (isset($data[0]) && is_array($data[0])) {
                return array_map([$this, 'applyV2ItemEnhancements'], $data);
            } else {
                return $this->applyV2ItemEnhancements($data);
            }
        }
        
        return $data;
    }
    
    /**
     * Apply V2 enhancements to a single item
     *
     * @param array $item
     * @return array
     */
    protected function applyV2ItemEnhancements(array $item): array
    {
        // V2 enhancements
        
        // 1. Add enhanced metadata
        if (isset($item['id'])) {
            $item['links'] = [
                'self' => request()->url() . '/' . $item['id'],
                'related' => $this->generateRelatedLinks($item)
            ];
        }
        
        // 2. Add computed fields
        $item['computed_fields'] = $this->addComputedFields($item);
        
        // 3. Enhanced date handling with timezone info
        $dateFields = ['created_at', 'updated_at', 'show_date'];
        foreach ($dateFields as $field) {
            if (isset($item[$field])) {
                $item[$field] = $this->formatDateForV2($item[$field]);
            }
        }
        
        return $item;
    }
    
    /**
     * Format date for V1 compatibility (simple format)
     *
     * @param string $date
     * @return string
     */
    protected function formatDateForV1(string $date): string
    {
        try {
            return \Carbon\Carbon::parse($date)->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return $date;
        }
    }
    
    /**
     * Format date for V2 (ISO 8601 with timezone)
     *
     * @param string $date
     * @return string
     */
    protected function formatDateForV2(string $date): string
    {
        try {
            return \Carbon\Carbon::parse($date)->toISOString();
        } catch (\Exception $e) {
            return $date;
        }
    }
    
    /**
     * Transform seats data for V1 compatibility
     *
     * @param array $seats
     * @return array
     */
    protected function transformSeatsForV1(array $seats): array
    {
        // V1 expected simpler seat structure
        if (isset($seats[0]['seat_code'])) {
            return array_map(function ($seat) {
                return [
                    'seat' => $seat['seat_code'] ?? $seat['seat'],
                    'price' => $seat['price'] ?? 0,
                    'type' => $seat['seat_type'] ?? $seat['type'] ?? 'standard'
                ];
            }, $seats);
        }
        
        return $seats;
    }
    
    /**
     * Generate related resource links for V2
     *
     * @param array $item
     * @return array
     */
    protected function generateRelatedLinks(array $item): array
    {
        $links = [];
        
        // Add common related links based on item type
        if (isset($item['movie_id'])) {
            $links['movie'] = url("/api/v2/movies/{$item['movie_id']}");
        }
        
        if (isset($item['theater_id'])) {
            $links['theater'] = url("/api/v2/theaters/{$item['theater_id']}");
        }
        
        if (isset($item['user_id'])) {
            $links['user'] = url("/api/v2/users/{$item['user_id']}");
        }
        
        return $links;
    }
    
    /**
     * Add computed fields for V2
     *
     * @param array $item
     * @return array
     */
    protected function addComputedFields(array $item): array
    {
        $computed = [];
        
        // Add common computed fields
        if (isset($item['created_at'])) {
            $computed['age_in_days'] = now()->diffInDays(\Carbon\Carbon::parse($item['created_at']));
        }
        
        if (isset($item['total_amount']) && isset($item['seats'])) {
            $computed['average_seat_price'] = count($item['seats']) > 0 
                ? $item['total_amount'] / count($item['seats']) 
                : 0;
        }
        
        return $computed;
    }
    
    /**
     * Create versioned response with appropriate transformations
     *
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     * @param Request $request
     * @return JsonResponse
     */
    protected function versionedResponse($data, string $message = 'Success', int $statusCode = 200, ?Request $request = null): JsonResponse
    {
        $request = $request ?? request();
        
        $responseData = [
            'success' => $statusCode < 400,
            'message' => $message,
            'data' => $data
        ];
        
        // Apply version-specific transformations
        $responseData = $this->transformResponse($responseData, $request);
        
        // Add deprecation warning if applicable
        $deprecation = $request->attributes->get('api_deprecation');
        if ($deprecation) {
            $responseData['deprecation_warning'] = $deprecation;
        }
        
        return response()->json($responseData, $statusCode);
    }
    
    /**
     * Handle method not supported in specific version
     *
     * @param Request $request
     * @param string $minVersion
     * @return JsonResponse
     */
    protected function methodNotSupportedInVersion(Request $request, string $minVersion): JsonResponse
    {
        $currentVersion = $this->getApiVersion($request);
        
        return $this->errorResponse(
            "This endpoint is not available in API version {$currentVersion}. Please use version {$minVersion} or higher.",
            null,
            410
        );
    }
    
    /**
     * Handle deprecated endpoint
     *
     * @param Request $request
     * @param string $replacementEndpoint
     * @return JsonResponse
     */
    protected function deprecatedEndpoint(Request $request, string $replacementEndpoint): JsonResponse
    {
        return $this->errorResponse(
            "This endpoint is deprecated. Please use {$replacementEndpoint} instead.",
            [
                'deprecated' => true,
                'replacement' => $replacementEndpoint,
                'sunset_date' => '2025-12-31'
            ],
            410
        );
    }
}