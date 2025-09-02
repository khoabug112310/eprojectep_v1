<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class FileUploadSecurityService
{
    /**
     * Allowed MIME types for images
     */
    const ALLOWED_IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    /**
     * Allowed file extensions
     */
    const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'
    ];

    /**
     * Maximum file size in bytes (5MB)
     */
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Known malicious file signatures
     */
    const MALICIOUS_SIGNATURES = [
        '<?php',
        '<%',
        '<script',
        'javascript:',
        'data:text/html',
        'vbscript:',
        'onload=',
        'onerror=',
        'eval(',
        'expression('
    ];

    /**
     * Validate and secure an uploaded file
     *
     * @param UploadedFile $file
     * @param string $type
     * @return array
     */
    public function validateAndSecureFile(UploadedFile $file, string $type = 'poster'): array
    {
        $validationResults = [
            'valid' => false,
            'errors' => [],
            'warnings' => [],
            'file_info' => []
        ];

        try {
            // Step 1: Basic file validation
            $basicValidation = $this->performBasicValidation($file);
            if (!$basicValidation['valid']) {
                $validationResults['errors'] = array_merge($validationResults['errors'], $basicValidation['errors']);
                return $validationResults;
            }

            // Step 2: MIME type validation
            $mimeValidation = $this->validateMimeType($file);
            if (!$mimeValidation['valid']) {
                $validationResults['errors'] = array_merge($validationResults['errors'], $mimeValidation['errors']);
                return $validationResults;
            }

            // Step 3: File signature validation
            $signatureValidation = $this->validateFileSignature($file);
            if (!$signatureValidation['valid']) {
                $validationResults['errors'] = array_merge($validationResults['errors'], $signatureValidation['errors']);
                return $validationResults;
            }

            // Step 4: Content scanning for malicious code
            $contentValidation = $this->scanFileContent($file);
            if (!$contentValidation['valid']) {
                $validationResults['errors'] = array_merge($validationResults['errors'], $contentValidation['errors']);
                return $validationResults;
            }

            // Step 5: Image-specific validation
            if (str_starts_with($file->getMimeType(), 'image/')) {
                $imageValidation = $this->validateImageFile($file);
                if (!$imageValidation['valid']) {
                    $validationResults['errors'] = array_merge($validationResults['errors'], $imageValidation['errors']);
                    return $validationResults;
                }
                $validationResults['warnings'] = array_merge($validationResults['warnings'], $imageValidation['warnings']);
            }

            // Step 6: Generate secure filename and path
            $secureFile = $this->generateSecureFilename($file, $type);
            
            $validationResults['valid'] = true;
            $validationResults['file_info'] = [
                'original_name' => $file->getClientOriginalName(),
                'secure_name' => $secureFile['filename'],
                'secure_path' => $secureFile['path'],
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'extension' => $file->getClientOriginalExtension(),
                'hash' => $secureFile['hash']
            ];

            Log::info('File upload validation successful', [
                'original_name' => $file->getClientOriginalName(),
                'secure_name' => $secureFile['filename'],
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);

            return $validationResults;

        } catch (\Exception $e) {
            Log::error('File validation error', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
                'trace' => $e->getTraceAsString()
            ]);

            $validationResults['errors'][] = 'File validation failed due to system error';
            return $validationResults;
        }
    }

    /**
     * Perform basic file validation
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function performBasicValidation(UploadedFile $file): array
    {
        $errors = [];

        // Check if file is valid
        if (!$file->isValid()) {
            $errors[] = 'File upload failed or corrupted';
        }

        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors[] = 'File size exceeds maximum allowed size (5MB)';
        }

        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            $errors[] = 'File extension not allowed. Allowed: ' . implode(', ', self::ALLOWED_EXTENSIONS);
        }

        // Check for suspicious filenames
        $filename = $file->getClientOriginalName();
        if ($this->hasSuspiciousFilename($filename)) {
            $errors[] = 'Filename contains suspicious patterns';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate MIME type
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function validateMimeType(UploadedFile $file): array
    {
        $errors = [];
        $mimeType = $file->getMimeType();

        if (!in_array($mimeType, self::ALLOWED_IMAGE_TYPES)) {
            $errors[] = 'MIME type not allowed. Detected: ' . $mimeType;
        }

        // Cross-check MIME type with file extension
        $extension = strtolower($file->getClientOriginalExtension());
        $expectedMimes = $this->getExpectedMimeTypes($extension);
        
        if (!empty($expectedMimes) && !in_array($mimeType, $expectedMimes)) {
            $errors[] = 'MIME type does not match file extension';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate file signature (magic bytes)
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function validateFileSignature(UploadedFile $file): array
    {
        $errors = [];

        try {
            $fileHandle = fopen($file->getPathname(), 'rb');
            if (!$fileHandle) {
                $errors[] = 'Cannot read file for signature validation';
                return ['valid' => false, 'errors' => $errors];
            }

            $header = fread($fileHandle, 32);
            fclose($fileHandle);

            $expectedSignatures = $this->getExpectedFileSignatures($file->getClientOriginalExtension());
            
            if (!empty($expectedSignatures)) {
                $signatureMatch = false;
                foreach ($expectedSignatures as $signature) {
                    if (str_starts_with($header, $signature)) {
                        $signatureMatch = true;
                        break;
                    }
                }

                if (!$signatureMatch) {
                    $errors[] = 'File signature does not match expected format';
                }
            }

        } catch (\Exception $e) {
            $errors[] = 'Failed to validate file signature';
            Log::warning('File signature validation failed', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Scan file content for malicious code
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function scanFileContent(UploadedFile $file): array
    {
        $errors = [];

        try {
            $content = file_get_contents($file->getPathname());
            
            if ($content === false) {
                $errors[] = 'Cannot read file content for security scanning';
                return ['valid' => false, 'errors' => $errors];
            }

            // Convert to lowercase for case-insensitive scanning
            $contentLower = strtolower($content);

            // Check for malicious signatures
            foreach (self::MALICIOUS_SIGNATURES as $signature) {
                if (str_contains($contentLower, strtolower($signature))) {
                    $errors[] = 'File contains potentially malicious content';
                    Log::warning('Malicious content detected in file upload', [
                        'file' => $file->getClientOriginalName(),
                        'signature' => $signature
                    ]);
                    break;
                }
            }

            // Additional checks for SVG files
            if ($file->getMimeType() === 'image/svg+xml') {
                $svgValidation = $this->validateSvgContent($content);
                if (!$svgValidation['valid']) {
                    $errors = array_merge($errors, $svgValidation['errors']);
                }
            }

        } catch (\Exception $e) {
            $errors[] = 'Failed to scan file content';
            Log::warning('File content scanning failed', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate image file specific properties
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function validateImageFile(UploadedFile $file): array
    {
        $errors = [];
        $warnings = [];

        try {
            $imageInfo = getimagesize($file->getPathname());
            
            if ($imageInfo === false) {
                $errors[] = 'File is not a valid image';
                return ['valid' => false, 'errors' => $errors, 'warnings' => []];
            }

            [$width, $height, $type] = $imageInfo;

            // Check image dimensions
            if ($width < 100 || $height < 100) {
                $warnings[] = 'Image resolution is very low (minimum recommended: 100x100)';
            }

            if ($width > 5000 || $height > 5000) {
                $warnings[] = 'Image resolution is very high (may impact performance)';
            }

            // Check aspect ratio for posters (recommended 2:3)
            if ($height > 0) {
                $aspectRatio = $width / $height;
                if ($aspectRatio < 0.5 || $aspectRatio > 1.5) {
                    $warnings[] = 'Image aspect ratio may not be suitable for movie posters';
                }
            }

            // Validate image type matches MIME type
            $expectedTypes = [
                'image/jpeg' => [IMAGETYPE_JPEG],
                'image/png' => [IMAGETYPE_PNG],
                'image/gif' => [IMAGETYPE_GIF],
                'image/webp' => [IMAGETYPE_WEBP]
            ];

            $mimeType = $file->getMimeType();
            if (isset($expectedTypes[$mimeType]) && !in_array($type, $expectedTypes[$mimeType])) {
                $errors[] = 'Image type does not match MIME type';
            }

        } catch (\Exception $e) {
            $errors[] = 'Failed to validate image properties';
            Log::warning('Image validation failed', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }

    /**
     * Validate SVG content for security issues
     *
     * @param string $content
     * @return array
     */
    protected function validateSvgContent(string $content): array
    {
        $errors = [];

        // Dangerous SVG elements and attributes
        $dangerousPatterns = [
            '/<script[\s>]/i',
            '/javascript:/i',
            '/data:text\/html/i',
            '/onload\s*=/i',
            '/onerror\s*=/i',
            '/onclick\s*=/i',
            '/onmouseover\s*=/i',
            '/<object[\s>]/i',
            '/<embed[\s>]/i',
            '/<iframe[\s>]/i',
            '/<form[\s>]/i',
            '/xlink:href\s*=\s*["\']javascript:/i'
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                $errors[] = 'SVG file contains potentially dangerous elements';
                break;
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Generate secure filename and path
     *
     * @param UploadedFile $file
     * @param string $type
     * @return array
     */
    protected function generateSecureFilename(UploadedFile $file, string $type): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $hash = hash('sha256', $file->getContent() . time());
        $shortHash = substr($hash, 0, 16);
        
        $filename = $type . '_' . $shortHash . '.' . $extension;
        $directory = $type . 's/' . Carbon::now()->format('Y/m');
        $path = $directory . '/' . $filename;

        return [
            'filename' => $filename,
            'directory' => $directory,
            'path' => $path,
            'hash' => $hash
        ];
    }

    /**
     * Check for suspicious filename patterns
     *
     * @param string $filename
     * @return bool
     */
    protected function hasSuspiciousFilename(string $filename): bool
    {
        $suspiciousPatterns = [
            '/\.php$/i',
            '/\.asp$/i', 
            '/\.jsp$/i',
            '/\.htaccess/i',
            '/\.config/i',
            '/web\.config/i',
            '/\.\./',
            '/^\./',
            '/\x00/',
            '/[<>:"|\?\*]/',
            '/\.php\./i'
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $filename)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get expected MIME types for file extension
     *
     * @param string $extension
     * @return array
     */
    protected function getExpectedMimeTypes(string $extension): array
    {
        $mimeMap = [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'webp' => ['image/webp'],
            'svg' => ['image/svg+xml']
        ];

        return $mimeMap[strtolower($extension)] ?? [];
    }

    /**
     * Get expected file signatures for extension
     *
     * @param string $extension
     * @return array
     */
    protected function getExpectedFileSignatures(string $extension): array
    {
        $signatures = [
            'jpg' => ["\xFF\xD8\xFF"],
            'jpeg' => ["\xFF\xD8\xFF"],
            'png' => ["\x89PNG\r\n\x1A\n"],
            'gif' => ["GIF87a", "GIF89a"],
            'webp' => ["RIFF"],
            'svg' => ["<?xml", "<svg"]
        ];

        return $signatures[strtolower($extension)] ?? [];
    }

    /**
     * Sanitize and process uploaded file
     *
     * @param UploadedFile $file
     * @param string $type
     * @return array
     */
    public function processSecureUpload(UploadedFile $file, string $type = 'poster'): array
    {
        // First validate the file
        $validation = $this->validateAndSecureFile($file, $type);
        
        if (!$validation['valid']) {
            return [
                'success' => false,
                'message' => 'File validation failed',
                'errors' => $validation['errors']
            ];
        }

        try {
            $fileInfo = $validation['file_info'];
            $securePath = $fileInfo['secure_path'];
            
            // Store the file securely
            $storedPath = $file->storeAs('public', $securePath);
            
            if (!$storedPath) {
                return [
                    'success' => false,
                    'message' => 'Failed to store file',
                    'errors' => ['File storage failed']
                ];
            }

            $url = Storage::url($storedPath);

            // Log successful upload
            Log::info('Secure file upload completed', [
                'original_name' => $fileInfo['original_name'],
                'secure_name' => $fileInfo['secure_name'],
                'path' => $securePath,
                'size' => $fileInfo['size'],
                'hash' => $fileInfo['hash']
            ]);

            return [
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => [
                    'url' => $url,
                    'filename' => $fileInfo['secure_name'],
                    'path' => $securePath,
                    'original_name' => $fileInfo['original_name'],
                    'size' => $fileInfo['size'],
                    'hash' => $fileInfo['hash']
                ],
                'warnings' => $validation['warnings']
            ];

        } catch (\Exception $e) {
            Log::error('Secure file upload failed', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'File upload failed',
                'errors' => ['System error during file upload']
            ];
        }
    }
}