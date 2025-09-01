<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Theater extends Model
{
    /** @use HasFactory<\Database\Factories\TheaterFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'city',
        'total_seats',
        'facilities',
        'status',
    ];

    protected $casts = [
        'facilities' => 'array',
    ];

    public function showtimes()
    {
        return $this->hasMany(Showtime::class);
    }
}
