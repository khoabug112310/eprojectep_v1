<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    /** @use HasFactory<\Database\Factories\BookingFactory> */
    use HasFactory;

    protected $fillable = [
        'booking_code', 'user_id', 'showtime_id', 'seats', 'total_amount',
        'payment_method', 'payment_status', 'booking_status', 'booked_at'
    ];

    protected $casts = [
        'seats' => 'array',
        'booked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function showtime()
    {
        return $this->belongsTo(Showtime::class);
    }
}
