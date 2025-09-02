<?php

namespace App\Services;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use ReflectionClass;
use ReflectionMethod;

class ApiDocumentationService
{
    protected array $openApiSpec = [];
    
    /**
     * Generate OpenAPI specification for all API endpoints
     *
     * @return array
     */
    public function generateOpenApiSpec(): array
    {
        $this->initializeBaseSpec();
        $this->scanRoutes();
        $this->addSchemas();
        $this->addSecurityDefinitions();
        
        return $this->openApiSpec;
    }
    
    /**
     * Initialize base OpenAPI specification structure
     */
    protected function initializeBaseSpec(): void
    {
        $this->openApiSpec = [
            'openapi' => '3.0.0',
            'info' => [
                'title' => 'CineBook API',
                'description' => 'Cinema booking system API with comprehensive movie management, booking, and payment functionality',
                'version' => '2.0.0',
                'contact' => [
                    'name' => 'CineBook API Support',
                    'email' => 'api@cinebook.com',
                    'url' => 'https://docs.cinebook.com'
                ],
                'license' => [
                    'name' => 'MIT',
                    'url' => 'https://opensource.org/licenses/MIT'
                ]
            ],
            'servers' => [
                [
                    'url' => config('app.url') . '/api/v1',
                    'description' => 'API Version 1 (Deprecated)'
                ],
                [
                    'url' => config('app.url') . '/api/v2',
                    'description' => 'API Version 2 (Current)'
                ]
            ],
            'paths' => [],
            'components' => [
                'schemas' => [],
                'securitySchemes' => [],
                'parameters' => [],
                'responses' => []
            ],
            'tags' => $this->getApiTags()
        ];
    }
    
    /**
     * Get API tags for organization
     *
     * @return array
     */
    protected function getApiTags(): array
    {
        return [
            [
                'name' => 'Authentication',
                'description' => 'User authentication and authorization endpoints'
            ],
            [
                'name' => 'Movies',
                'description' => 'Movie catalog and information management'
            ],
            [
                'name' => 'Theaters',
                'description' => 'Theater and venue management'
            ],
            [
                'name' => 'Showtimes',
                'description' => 'Movie scheduling and seat management'
            ],
            [
                'name' => 'Bookings',
                'description' => 'Ticket booking and reservation system'
            ],
            [
                'name' => 'Payments',
                'description' => 'Payment processing and financial transactions'
            ],
            [
                'name' => 'Reviews',
                'description' => 'Movie reviews and ratings'
            ],
            [
                'name' => 'Admin',
                'description' => 'Administrative functions and reporting'
            ],
            [
                'name' => 'Health',
                'description' => 'System health and monitoring endpoints'
            ]
        ];
    }
    
    /**
     * Scan all API routes and generate documentation
     */
    protected function scanRoutes(): void
    {
        $routes = Route::getRoutes();
        
        foreach ($routes as $route) {
            $uri = $route->uri();
            
            // Only process API routes
            if (!str_starts_with($uri, 'api/')) {
                continue;
            }
            
            $methods = $route->methods();
            $action = $route->getAction();
            
            // Skip non-controller actions
            if (!isset($action['controller'])) {
                continue;
            }
            
            foreach ($methods as $method) {
                if (in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])) {
                    $this->processRoute($route, $method);
                }
            }
        }
    }
    
    /**
     * Process individual route and add to specification
     *
     * @param mixed $route
     * @param string $method
     */
    protected function processRoute($route, string $method): void
    {
        $uri = '/' . $route->uri();
        $action = $route->getAction();
        
        // Convert Laravel route parameters to OpenAPI format
        $path = preg_replace('/\{([^}]+)\}/', '{$1}', $uri);
        
        // Extract controller and method
        [$controllerClass, $controllerMethod] = explode('@', $action['controller']);
        
        // Generate path documentation
        $pathDoc = $this->generatePathDocumentation($controllerClass, $controllerMethod, $method, $route);
        
        if (!isset($this->openApiSpec['paths'][$path])) {
            $this->openApiSpec['paths'][$path] = [];
        }
        
        $this->openApiSpec['paths'][$path][strtolower($method)] = $pathDoc;
    }
    
    /**
     * Generate documentation for a specific path
     *
     * @param string $controllerClass
     * @param string $controllerMethod
     * @param string $httpMethod
     * @param mixed $route
     * @return array
     */
    protected function generatePathDocumentation(string $controllerClass, string $controllerMethod, string $httpMethod, $route): array
    {
        $doc = [
            'summary' => $this->generateSummary($controllerMethod, $httpMethod),
            'description' => $this->generateDescription($controllerClass, $controllerMethod),
            'tags' => [$this->getTagFromController($controllerClass)],
            'parameters' => $this->extractParameters($route),
            'responses' => $this->generateResponses($httpMethod)
        ];
        
        // Add request body for POST/PUT/PATCH methods
        if (in_array($httpMethod, ['POST', 'PUT', 'PATCH'])) {
            $doc['requestBody'] = $this->generateRequestBody($controllerClass, $controllerMethod);
        }
        
        // Add security requirements if needed
        if ($this->requiresAuthentication($route)) {
            $doc['security'] = [['bearerAuth' => []]];
        }
        
        return $doc;
    }
    
    /**
     * Generate summary for endpoint
     *
     * @param string $method
     * @param string $httpMethod
     * @return string
     */
    protected function generateSummary(string $method, string $httpMethod): string
    {
        $summaries = [
            'index' => 'List resources',
            'store' => 'Create new resource',
            'show' => 'Get resource details',
            'update' => 'Update resource',
            'destroy' => 'Delete resource',
            'login' => 'User login',
            'register' => 'User registration',
            'logout' => 'User logout'
        ];
        
        return $summaries[$method] ?? ucfirst($httpMethod) . ' ' . $method;
    }
    
    /**
     * Generate description using reflection
     *
     * @param string $controllerClass
     * @param string $method
     * @return string
     */
    protected function generateDescription(string $controllerClass, string $method): string
    {
        try {
            $reflection = new ReflectionClass($controllerClass);
            $methodReflection = $reflection->getMethod($method);
            $docComment = $methodReflection->getDocComment();
            
            if ($docComment) {
                // Extract description from docblock
                preg_match('/\*\s+(.+)/', $docComment, $matches);
                if (isset($matches[1])) {
                    return trim($matches[1]);
                }
            }
        } catch (\Exception $e) {
            // Ignore reflection errors
        }
        
        return "Endpoint for {$method} operation";
    }
    
    /**
     * Get tag from controller class name
     *
     * @param string $controllerClass
     * @return string
     */
    protected function getTagFromController(string $controllerClass): string
    {
        $className = class_basename($controllerClass);
        $tag = str_replace('Controller', '', $className);
        
        $tagMapping = [
            'Auth' => 'Authentication',
            'Movie' => 'Movies',
            'Theater' => 'Theaters',
            'Showtime' => 'Showtimes',
            'Booking' => 'Bookings',
            'Review' => 'Reviews',
            'Health' => 'Health',
            'Report' => 'Admin',
            'User' => 'Admin'
        ];
        
        return $tagMapping[$tag] ?? $tag;
    }
    
    /**
     * Extract parameters from route
     *
     * @param mixed $route
     * @return array
     */
    protected function extractParameters($route): array
    {
        $parameters = [];
        $uri = $route->uri();
        
        // Extract path parameters
        preg_match_all('/\{([^}]+)\}/', $uri, $matches);
        
        foreach ($matches[1] as $param) {
            $parameters[] = [
                'name' => $param,
                'in' => 'path',
                'required' => true,
                'schema' => [
                    'type' => $this->getParameterType($param)
                ],
                'description' => $this->getParameterDescription($param)
            ];
        }
        
        // Add common query parameters
        if (str_contains($uri, '/index') || str_contains($uri, 'GET')) {
            $parameters = array_merge($parameters, $this->getCommonQueryParameters());
        }
        
        return $parameters;
    }
    
    /**
     * Get parameter type based on name
     *
     * @param string $param
     * @return string
     */
    protected function getParameterType(string $param): string
    {
        if ($param === 'id' || str_ends_with($param, '_id')) {
            return 'integer';
        }
        
        return 'string';
    }
    
    /**
     * Get parameter description
     *
     * @param string $param
     * @return string
     */
    protected function getParameterDescription(string $param): string
    {
        $descriptions = [
            'id' => 'Resource identifier',
            'movie_id' => 'Movie identifier',
            'theater_id' => 'Theater identifier',
            'showtime_id' => 'Showtime identifier',
            'booking_id' => 'Booking identifier',
            'user_id' => 'User identifier'
        ];
        
        return $descriptions[$param] ?? "The {$param} parameter";
    }
    
    /**
     * Get common query parameters
     *
     * @return array
     */
    protected function getCommonQueryParameters(): array
    {
        return [
            [
                'name' => 'page',
                'in' => 'query',
                'required' => false,
                'schema' => ['type' => 'integer', 'minimum' => 1, 'default' => 1],
                'description' => 'Page number for pagination'
            ],
            [
                'name' => 'per_page',
                'in' => 'query',
                'required' => false,
                'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 15],
                'description' => 'Number of items per page'
            ],
            [
                'name' => 'sort',
                'in' => 'query',
                'required' => false,
                'schema' => ['type' => 'string'],
                'description' => 'Sort field'
            ],
            [
                'name' => 'order',
                'in' => 'query',
                'required' => false,
                'schema' => ['type' => 'string', 'enum' => ['asc', 'desc'], 'default' => 'asc'],
                'description' => 'Sort order'
            ]
        ];
    }
    
    /**
     * Generate responses for endpoint
     *
     * @param string $httpMethod
     * @return array
     */
    protected function generateResponses(string $httpMethod): array
    {
        $responses = [
            '200' => [
                'description' => 'Successful response',
                'content' => [
                    'application/json' => [
                        'schema' => ['$ref' => '#/components/schemas/SuccessResponse']
                    ]
                ]
            ],
            '400' => [
                'description' => 'Bad request',
                'content' => [
                    'application/json' => [
                        'schema' => ['$ref' => '#/components/schemas/ErrorResponse']
                    ]
                ]
            ],
            '401' => [
                'description' => 'Unauthorized',
                'content' => [
                    'application/json' => [
                        'schema' => ['$ref' => '#/components/schemas/ErrorResponse']
                    ]
                ]
            ],
            '500' => [
                'description' => 'Internal server error',
                'content' => [
                    'application/json' => [
                        'schema' => ['$ref' => '#/components/schemas/ErrorResponse']
                    ]
                ]
            ]
        ];
        
        // Add method-specific responses
        if ($httpMethod === 'POST') {
            $responses['201'] = [
                'description' => 'Resource created successfully',
                'content' => [
                    'application/json' => [
                        'schema' => ['$ref' => '#/components/schemas/SuccessResponse']
                    ]
                ]
            ];
        }
        
        if ($httpMethod === 'DELETE') {
            $responses['204'] = [
                'description' => 'Resource deleted successfully'
            ];
        }
        
        return $responses;
    }
    
    /**
     * Generate request body for POST/PUT/PATCH methods
     *
     * @param string $controllerClass
     * @param string $method
     * @return array
     */
    protected function generateRequestBody(string $controllerClass, string $method): array
    {
        return [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => $this->getRequestBodyProperties($controllerClass, $method)
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Get request body properties based on controller and method
     *
     * @param string $controllerClass
     * @param string $method
     * @return array
     */
    protected function getRequestBodyProperties(string $controllerClass, string $method): array
    {
        $className = class_basename($controllerClass);
        
        // Define request schemas for different controllers
        $schemas = [
            'AuthController' => [
                'login' => [
                    'email' => ['type' => 'string', 'format' => 'email'],
                    'password' => ['type' => 'string', 'minLength' => 8]
                ],
                'register' => [
                    'name' => ['type' => 'string', 'maxLength' => 255],
                    'email' => ['type' => 'string', 'format' => 'email'],
                    'phone' => ['type' => 'string'],
                    'password' => ['type' => 'string', 'minLength' => 8],
                    'password_confirmation' => ['type' => 'string']
                ]
            ],
            'BookingController' => [
                'store' => [
                    'showtime_id' => ['type' => 'integer'],
                    'seats' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'seat' => ['type' => 'string'],
                                'type' => ['type' => 'string']
                            ]
                        ]
                    ],
                    'customer_info' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'email' => ['type' => 'string', 'format' => 'email'],
                            'phone' => ['type' => 'string']
                        ]
                    ]
                ]
            ]
        ];
        
        return $schemas[$className][$method] ?? [];
    }
    
    /**
     * Check if route requires authentication
     *
     * @param mixed $route
     * @return bool
     */
    protected function requiresAuthentication($route): bool
    {
        $middleware = $route->middleware();
        return in_array('auth:sanctum', $middleware) || in_array('auth', $middleware);
    }
    
    /**
     * Add schema definitions to OpenAPI spec
     */
    protected function addSchemas(): void
    {
        $this->openApiSpec['components']['schemas'] = [
            'SuccessResponse' => [
                'type' => 'object',
                'properties' => [
                    'success' => ['type' => 'boolean', 'example' => true],
                    'message' => ['type' => 'string', 'example' => 'Success'],
                    'data' => ['type' => 'object']
                ]
            ],
            'ErrorResponse' => [
                'type' => 'object',
                'properties' => [
                    'success' => ['type' => 'boolean', 'example' => false],
                    'message' => ['type' => 'string', 'example' => 'Error occurred'],
                    'errors' => ['type' => 'object']
                ]
            ],
            'PaginatedResponse' => [
                'type' => 'object',
                'properties' => [
                    'success' => ['type' => 'boolean'],
                    'data' => ['type' => 'array', 'items' => ['type' => 'object']],
                    'pagination' => [
                        'type' => 'object',
                        'properties' => [
                            'current_page' => ['type' => 'integer'],
                            'per_page' => ['type' => 'integer'],
                            'total' => ['type' => 'integer'],
                            'last_page' => ['type' => 'integer']
                        ]
                    ]
                ]
            ],
            'Movie' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'title' => ['type' => 'string'],
                    'synopsis' => ['type' => 'string'],
                    'duration' => ['type' => 'integer'],
                    'genre' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'language' => ['type' => 'string'],
                    'release_date' => ['type' => 'string', 'format' => 'date'],
                    'poster_url' => ['type' => 'string'],
                    'average_rating' => ['type' => 'number', 'format' => 'float']
                ]
            ],
            'Booking' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'booking_code' => ['type' => 'string'],
                    'user_id' => ['type' => 'integer'],
                    'showtime_id' => ['type' => 'integer'],
                    'seats' => ['type' => 'array'],
                    'total_amount' => ['type' => 'number', 'format' => 'float'],
                    'payment_status' => ['type' => 'string', 'enum' => ['pending', 'completed', 'failed', 'refunded']],
                    'booking_status' => ['type' => 'string', 'enum' => ['confirmed', 'cancelled', 'used']]
                ]
            ]
        ];
    }
    
    /**
     * Add security definitions
     */
    protected function addSecurityDefinitions(): void
    {
        $this->openApiSpec['components']['securitySchemes'] = [
            'bearerAuth' => [
                'type' => 'http',
                'scheme' => 'bearer',
                'bearerFormat' => 'JWT',
                'description' => 'Laravel Sanctum token authentication'
            ],
            'apiKey' => [
                'type' => 'apiKey',
                'in' => 'header',
                'name' => 'X-API-Key',
                'description' => 'API key for external integrations'
            ]
        ];
    }
    
    /**
     * Save OpenAPI specification to file
     *
     * @param string $format
     * @return string
     */
    public function saveSpecification(string $format = 'json'): string
    {
        $spec = $this->generateOpenApiSpec();
        $filename = storage_path("api-docs/openapi.{$format}");
        
        // Ensure directory exists
        $directory = dirname($filename);
        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }
        
        if ($format === 'yaml') {
            $content = yaml_emit($spec);
        } else {
            $content = json_encode($spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        }
        
        File::put($filename, $content);
        
        Log::info('API documentation generated', [
            'format' => $format,
            'file' => $filename,
            'endpoints_count' => count($spec['paths'])
        ]);
        
        return $filename;
    }
}