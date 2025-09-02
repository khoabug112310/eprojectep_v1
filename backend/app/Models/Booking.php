<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    /** @use HasFactory<\Database\Factories\BookingFactory> */
    use HasFactory;

    protected $fillable = [
        'booking_code', 'user_id', 'showtime_id', 'seats', 'total_amount',
        'payment_method', 'payment_status', 'booking_status', 'booked_at',
        'ticket_data', 'qr_code', 'confirmation_sent_at'
    ];

    protected $casts = [
        'seats' => 'array',
        'ticket_data' => 'array',
        'booked_at' => 'datetime',
        'confirmation_sent_at' => 'datetime',
    ];

    // Booking statuses
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    // Payment statuses
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_COMPLETED = 'completed';
    const PAYMENT_FAILED = 'failed';
    const PAYMENT_REFUNDED = 'refunded';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function showtime(): BelongsTo
    {
        return $this->belongsTo(Showtime::class);
    }

    /**
     * Get the payment for this booking
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Get all payments for this booking (in case of refunds)
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Check if booking is confirmed
     */
    public function isConfirmed(): bool
    {
        return $this->booking_status === self::STATUS_CONFIRMED;
    }

    /**
     * Check if payment is completed
     */
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_COMPLETED;
    }

    /**
     * Generate unique booking code
     */
    public static function generateBookingCode(): string
    {
        do {
            $code = 'CB' . date('Ymd') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        } while (self::where('booking_code', $code)->exists());
        
        return $code;
    }

    /**
     * Get total seat count
     */
    public function getSeatCountAttribute(): int
    {
        return count($this->seats ?? []);
    }

    /**
     * Get formatted total amount
     */
    public function getFormattedTotalAttribute(): string
    {
        return number_format($this->total_amount, 0, '.', ',') . ' VND';
    }
}
