<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Showtime extends Model
{
    /** @use HasFactory<\Database\Factories\ShowtimeFactory> */
    use HasFactory;

    protected $fillable = [
        'movie_id', 'theater_id', 'show_date', 'show_time', 'prices', 'available_seats', 'status'
    ];

    protected $casts = [
        'show_date' => 'date',
        'show_time' => 'datetime:H:i',
        'prices' => 'array',
        'available_seats' => 'array',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function theater()
    {
        return $this->belongsTo(Theater::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
