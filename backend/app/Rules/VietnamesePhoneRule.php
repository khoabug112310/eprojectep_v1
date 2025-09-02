<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VietnamesePhoneRule implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Vietnamese phone number validation
        // Supports formats: +84xxxxxxxxx, 84xxxxxxxxx, 0xxxxxxxxxx
        // Valid prefixes: 03, 05, 07, 08, 09 followed by 8 digits
        if (!preg_match('/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/', $value)) {
            $fail('Số điện thoại không đúng định dạng Việt Nam.');
        }
    }
}