<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponseTrait;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class ApiErrorHandler
{
    use ApiResponseTrait;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);
            
            // Ensure API responses have consistent format
            if ($request->is('api/*') && $response instanceof JsonResponse) {
                $data = $response->getData(true);
                
                // If response doesn't have 'success' field, standardize it
                if (!isset($data['success'])) {
                    $statusCode = $response->getStatusCode();
                    
                    if ($statusCode >= 200 && $statusCode < 300) {
                        $standardizedData = [
                            'success' => true,
                            'data' => $data,
                            'message' => 'Success'
                        ];
                    } else {
                        $standardizedData = [
                            'success' => false,
                            'message' => $data['message'] ?? 'An error occurred',
                            'errors' => $data['errors'] ?? null
                        ];
                    }
                    
                    $response->setData($standardizedData);
                }
            }
            
            return $response;
            
        } catch (Throwable $exception) {
            // Handle any uncaught exceptions for API routes
            if ($request->is('api/*')) {
                $handled = $this->handleApiException($exception);
                
                if ($handled) {
                    return $handled;
                }
                
                return $this->serverErrorResponse($exception);
            }
            
            // Re-throw for non-API routes
            throw $exception;
        }
    }
}