<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

abstract class BaseApiController extends Controller
{
    use ApiResponseTrait;
    
    /**
     * Execute an API action with error handling
     *
     * @param callable $action
     * @return JsonResponse
     */
    protected function executeApiAction(callable $action): JsonResponse
    {
        try {
            return $action();
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors(), 'Dữ liệu không hợp lệ');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Không tìm thấy dữ liệu');
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            return $this->unauthorizedResponse('Chưa xác thực');
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->forbiddenResponse('Không có quyền truy cập');
        } catch (\Exception $e) {
            Log::error('API Error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'request' => request()->all(),
                'url' => request()->fullUrl(),
                'method' => request()->method(),
                'user_id' => auth()->id(),
            ]);
            
            $message = config('app.debug') ? $e->getMessage() : 'Đã xảy ra lỗi';
            return $this->errorResponse($message, null, 500);
        }
    }
    
    /**
     * Log API access for monitoring
     *
     * @param string $action
     * @param array $data
     */
    protected function logApiAccess(string $action, array $data = []): void
    {
        Log::info('API Access', [
            'controller' => get_class($this),
            'action' => $action,
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'data' => $data,
            'timestamp' => now()->toISOString()
        ]);
    }
    
    /**
     * Common validation rules for pagination
     */
    protected function getPaginationRules(): array
    {
        return [
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
        ];
    }

    /**
     * Common validation rules for date ranges
     */
    protected function getDateRangeRules(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date|after_or_equal:date_from',
        ];
    }

    /**
     * Common validation rules for search
     */
    protected function getSearchRules(): array
    {
        return [
            'search' => 'string|max:255',
            'sort_by' => 'string|max:50',
            'sort_direction' => 'in:asc,desc',
        ];
    }

    /**
     * Get paginated results with standard format
     */
    protected function getPaginatedResults($query, $perPage = 15)
    {
        $perPage = request()->input('per_page', $perPage);
        $perPage = min($perPage, 100); // Maximum 100 items per page
        
        return $query->paginate($perPage);
    }

    /**
     * Apply search filters to query
     */
    protected function applySearch($query, array $searchableFields, string $searchTerm = null)
    {
        if (!$searchTerm) {
            $searchTerm = request()->input('search');
        }

        if ($searchTerm && !empty($searchableFields)) {
            $query->where(function ($q) use ($searchableFields, $searchTerm) {
                foreach ($searchableFields as $field) {
                    $q->orWhere($field, 'like', '%' . $searchTerm . '%');
                }
            });
        }

        return $query;
    }

    /**
     * Apply sorting to query
     */
    protected function applySorting($query, array $allowedSortFields = [], string $defaultSort = 'created_at')
    {
        $sortBy = request()->input('sort_by', $defaultSort);
        $sortDirection = request()->input('sort_direction', 'desc');

        if (empty($allowedSortFields) || in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy($defaultSort, 'desc');
        }

        return $query;
    }

    /**
     * Apply date range filter to query
     */
    protected function applyDateRange($query, string $dateField = 'created_at')
    {
        if (request()->filled('date_from')) {
            $query->whereDate($dateField, '>=', request()->input('date_from'));
        }

        if (request()->filled('date_to')) {
            $query->whereDate($dateField, '<=', request()->input('date_to'));
        }

        return $query;
    }
}