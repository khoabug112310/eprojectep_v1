<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get all input data
        $input = $request->all();
        
        // Sanitize the input recursively
        $sanitizedInput = $this->sanitizeData($input);
        
        // Replace the request input with sanitized data
        $request->replace($sanitizedInput);
        
        return $next($request);
    }

    /**
     * Recursively sanitize data
     */
    private function sanitizeData($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->sanitizeData($value);
            }
        } elseif (is_string($data)) {
            $data = $this->sanitizeString($data);
        }
        
        return $data;
    }

    /**
     * Sanitize individual string values
     */
    private function sanitizeString(string $value): string
    {
        // Remove null bytes
        $value = str_replace(chr(0), '', $value);
        
        // First, strip dangerous SQL keywords
        $sqlPatterns = [
            '/\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE)\s+(TABLE|DATABASE|USER)\b/i',
            '/\bUNION\s+(ALL\s+)?SELECT\b/i',
            '/\b(OR|AND)\s+[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+[\'"]?/i',
            '/-{2,}/', // SQL comments
            '/\/\*.*?\*\//s', // Block comments
        ];
        
        foreach ($sqlPatterns as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }
        
        // Remove dangerous JavaScript patterns before HTML encoding
        $jsPatterns = [
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
            '/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/mi',
            '/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/mi',
            '/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/mi',
            '/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/mi',
            '/javascript:/i',
            '/vbscript:/i',
            '/data:/i',
        ];
        
        foreach ($jsPatterns as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }
        
        // Remove all event handlers completely
        $value = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '', $value);
        
        // Convert remaining HTML to entities
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        
        // Trim whitespace
        $value = trim($value);
        
        return $value;
    }
}