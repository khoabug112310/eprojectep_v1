<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Rule;

class SecureFileUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin users can upload files
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'poster' => [
                'required',
                'file',
                File::image()
                    ->max(5 * 1024) // 5MB max
                    ->dimensions(
                        Rule::dimensions()
                            ->minWidth(100)
                            ->minHeight(100)
                            ->maxWidth(5000)
                            ->maxHeight(5000)
                    ),
            ],
            'alt_text' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'poster.required' => 'Vui lòng chọn file để upload.',
            'poster.file' => 'File upload không hợp lệ.',
            'poster.image' => 'File phải là hình ảnh (JPEG, PNG, GIF, WebP, SVG).',
            'poster.max' => 'Kích thước file không được vượt quá 5MB.',
            'poster.dimensions.min_width' => 'Chiều rộng hình ảnh tối thiểu là 100px.',
            'poster.dimensions.min_height' => 'Chiều cao hình ảnh tối thiểu là 100px.',
            'poster.dimensions.max_width' => 'Chiều rộng hình ảnh tối đa là 5000px.',
            'poster.dimensions.max_height' => 'Chiều cao hình ảnh tối đa là 5000px.',
            'alt_text.max' => 'Mô tả alt text không được vượt quá 255 ký tự.',
            'description.max' => 'Mô tả không được vượt quá 1000 ký tự.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'poster' => 'file poster',
            'alt_text' => 'mô tả alt text',
            'description' => 'mô tả'
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->hasFile('poster')) {
                $file = $this->file('poster');
                
                // Additional security checks
                $this->performSecurityChecks($file, $validator);
            }
        });
    }

    /**
     * Perform additional security checks on the uploaded file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param \Illuminate\Validation\Validator $validator
     */
    protected function performSecurityChecks($file, $validator): void
    {
        // Check file extension against allowed list
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, $allowedExtensions)) {
            $validator->errors()->add('poster', 'Định dạng file không được hỗ trợ. Chỉ chấp nhận: ' . implode(', ', $allowedExtensions));
        }

        // Check MIME type
        $allowedMimeTypes = [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];
        
        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            $validator->errors()->add('poster', 'Loại file không được hỗ trợ.');
        }

        // Check for suspicious filenames
        $filename = $file->getClientOriginalName();
        if ($this->hasSuspiciousFilename($filename)) {
            $validator->errors()->add('poster', 'Tên file chứa ký tự không an toàn.');
        }

        // Check file content for basic security
        if ($this->hasExecutableContent($file)) {
            $validator->errors()->add('poster', 'File chứa nội dung nguy hiểm.');
        }
    }

    /**
     * Check if filename has suspicious patterns
     *
     * @param string $filename
     * @return bool
     */
    protected function hasSuspiciousFilename(string $filename): bool
    {
        $suspiciousPatterns = [
            '/\.php/i',
            '/\.asp/i',
            '/\.jsp/i',
            '/\.htaccess/i',
            '/\.\./i',
            '/^\./',
            '/[<>:"|\?\*]/',
            '/\x00/'
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $filename)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if file contains executable content
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return bool
     */
    protected function hasExecutableContent($file): bool
    {
        try {
            $content = file_get_contents($file->getPathname());
            if ($content === false) {
                return false;
            }

            $dangerousPatterns = [
                '/<\?php/i',
                '/<%/i',
                '/<script/i',
                '/javascript:/i',
                '/vbscript:/i',
                '/onload=/i',
                '/onerror=/i'
            ];

            foreach ($dangerousPatterns as $pattern) {
                if (preg_match($pattern, $content)) {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            // If we can't read the file, treat it as suspicious
            return true;
        }
    }
}