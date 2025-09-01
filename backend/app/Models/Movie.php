<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Movie extends Model
{
    /** @use HasFactory<\Database\Factories\MovieFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'synopsis',
        'duration',
        'genre',
        'language',
        'age_rating',
        'poster_url',
        'trailer_url',
        'cast',
        'director',
        'release_date',
        'average_rating',
        'total_reviews',
        'status',
    ];

    protected $casts = [
        'release_date' => 'date',
        'average_rating' => 'float',
        'total_reviews' => 'integer',
        'genre' => 'array',
        'cast' => 'array',
    ];

    // Relationships
    public function showtimes()
    {
        return $this->hasMany(Showtime::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function bookings()
    {
        return $this->hasManyThrough(Booking::class, Showtime::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByGenre($query, $genre)
    {
        return $query->whereJsonContains('genre', $genre);
    }

    public function scopeByLanguage($query, $language)
    {
        return $query->where('language', $language);
    }

    public function scopeNowShowing($query)
    {
        return $query->where('status', 'active')
                    ->where('release_date', '<=', now()->toDateString());
    }

    public function scopeComingSoon($query)
    {
        return $query->where('status', 'coming_soon')
                    ->where('release_date', '>', now());
    }

    // Accessors
    public function getFormattedDurationAttribute()
    {
        $hours = floor($this->duration / 60);
        $minutes = $this->duration % 60;
        return $hours > 0 ? "{$hours}h {$minutes}m" : "{$minutes}m";
    }

    // Boot method for auto-generating slugs
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($movie) {
            if (empty($movie->slug)) {
                $baseSlug = Str::slug($movie->title);
                $movie->slug = $baseSlug;
                
                // Ensure uniqueness
                $counter = 1;
                while (static::where('slug', $movie->slug)->exists()) {
                    $movie->slug = $baseSlug . '-' . strtolower(Str::random(4));
                    $counter++;
                }
            }
        });
    }
}
