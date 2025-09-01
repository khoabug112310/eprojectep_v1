<?php

namespace Tests\Helpers;

class TestHelper
{
    /**
     * Generate random Vietnamese phone number
     */
    public static function vietnamesePhoneNumber(): string
    {
        $prefixes = ['03', '05', '07', '08', '09'];
        $prefix = $prefixes[array_rand($prefixes)];
        $suffix = str_pad(random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);
        
        return $prefix . $suffix;
    }

    /**
     * Generate random booking code
     */
    public static function bookingCode(): string
    {
        return 'CB' . date('Ymd') . str_pad(random_int(1, 999), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get valid movie genres
     */
    public static function movieGenres(): array
    {
        return [
            'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
            'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
            'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
            'Thriller', 'War', 'Western'
        ];
    }

    /**
     * Get valid age ratings
     */
    public static function ageRatings(): array
    {
        return ['G', 'PG', 'PG-13', 'R', 'NC-17'];
    }

    /**
     * Get valid seat types
     */
    public static function seatTypes(): array
    {
        return ['gold', 'platinum', 'box'];
    }

    /**
     * Generate seat configuration for theater
     */
    public static function seatConfiguration(): array
    {
        return [
            'gold' => random_int(80, 120),
            'platinum' => random_int(50, 80),
            'box' => random_int(10, 30)
        ];
    }

    /**
     * Generate pricing for showtime
     */
    public static function showtimePricing(): array
    {
        return [
            'gold' => random_int(100000, 150000),
            'platinum' => random_int(150000, 200000),
            'box' => random_int(200000, 300000)
        ];
    }

    /**
     * Get valid theater facilities
     */
    public static function theaterFacilities(): array
    {
        $facilities = ['3D', 'IMAX', 'Dolby Atmos', 'DTS:X', '4K Projection', 'Reclining Seats'];
        $count = random_int(1, 3);
        
        return array_slice(array_unique(array_rand(array_flip($facilities), $count)), 0, $count);
    }

    /**
     * Generate available seats array
     */
    public static function availableSeats(int $totalSeats = 100): array
    {
        $seats = [];
        $rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        $seatsPerRow = ceil($totalSeats / count($rows));
        
        foreach ($rows as $row) {
            for ($i = 1; $i <= $seatsPerRow; $i++) {
                $seats[] = $row . $i;
            }
        }
        
        // Remove some random seats to simulate occupied seats
        $occupiedCount = random_int(0, intval($totalSeats * 0.3));
        $occupiedSeats = array_rand(array_flip($seats), $occupiedCount);
        
        if ($occupiedCount === 1) {
            $occupiedSeats = [$occupiedSeats];
        }
        
        return array_values(array_diff($seats, $occupiedSeats));
    }

    /**
     * Create test file upload
     */
    public static function createTestImage(string $name = 'test-image.jpg'): \Illuminate\Http\UploadedFile
    {
        return \Illuminate\Http\UploadedFile::fake()->image($name, 300, 450);
    }

    /**
     * Assert array contains specific keys
     */
    public static function assertArrayContainsKeys(array $array, array $keys): void
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $array)) {
                throw new \PHPUnit\Framework\AssertionFailedError("Array does not contain key: {$key}");
            }
        }
    }

    /**
     * Get future date string
     */
    public static function futureDate(int $days = 1): string
    {
        return now()->addDays($days)->format('Y-m-d');
    }

    /**
     * Get past date string
     */
    public static function pastDate(int $days = 1): string
    {
        return now()->subDays($days)->format('Y-m-d');
    }
}