<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Showtime;
use App\Models\Movie;
use App\Models\Theater;
use Carbon\Carbon;

class ShowtimeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $movies = Movie::all();
        $theaters = Theater::all();
        
        // Define time slots for different periods
        $timeSlots = [
            'morning' => ['09:00:00', '10:30:00'],
            'afternoon' => ['13:00:00', '14:30:00', '16:00:00'],
            'evening' => ['18:30:00', '20:00:00', '21:30:00'],
            'late' => ['23:00:00']
        ];
        
        // Generate showtimes for the next 14 days
        for ($day = 0; $day < 14; $day++) {
            $date = Carbon::now()->addDays($day)->format('Y-m-d');
            
            foreach ($theaters as $theater) {
                // Each theater shows 3-5 different movies per day
                $dailyMovies = $movies->shuffle()->take(rand(3, 5));
                
                foreach ($dailyMovies as $movie) {
                    // Number of showtimes per movie per day (2-4)
                    $showtimesCount = rand(2, 4);
                    
                    // Get available time slots for this movie
                    $availableSlots = collect($timeSlots)->flatten()->shuffle()->take($showtimesCount);
                    
                    foreach ($availableSlots as $time) {
                        // Generate seat pricing based on theater location and time
                        $pricing = $this->generatePricing($theater, $time, $day);
                        
                        // Generate available seats
                        $availableSeats = $this->generateAvailableSeats($theater);
                        
                        Showtime::create([
                            'movie_id' => $movie->id,
                            'theater_id' => $theater->id,
                            'show_date' => $date,
                            'show_time' => $time,
                            'prices' => json_encode($pricing),
                            'available_seats' => json_encode($availableSeats),
                            'status' => 'active',
                        ]);
                    }
                }
            }
        }
    }
    
    /**
     * Generate dynamic pricing based on theater, time, and day
     */
    private function generatePricing($theater, $time, $dayOffset)
    {
        // Base prices from theater configuration
        $seatConfig = $theater->seat_configuration;
        $basePrices = [
            'gold' => $seatConfig['gold']['price'] ?? 80000,
            'platinum' => $seatConfig['platinum']['price'] ?? 110000,
            'box' => $seatConfig['box']['price'] ?? 140000,
        ];
        
        // Weekend pricing (Saturday & Sunday)
        $isWeekend = Carbon::now()->addDays($dayOffset)->isWeekend();
        $weekendMultiplier = $isWeekend ? 1.2 : 1.0;
        
        // Time-based pricing
        $timeMultiplier = 1.0;
        $hour = (int) substr($time, 0, 2);
        
        if ($hour >= 18) { // Evening shows
            $timeMultiplier = 1.1;
        } elseif ($hour >= 21) { // Late shows
            $timeMultiplier = 1.15;
        } elseif ($hour < 12) { // Morning shows
            $timeMultiplier = 0.9;
        }
        
        // City-based pricing
        $cityMultiplier = 1.0;
        switch ($theater->city) {
            case 'TP.HCM':
            case 'Hà Nội':
                $cityMultiplier = 1.1;
                break;
            case 'Đà Nẵng':
                $cityMultiplier = 1.05;
                break;
            default:
                $cityMultiplier = 0.95;
        }
        
        // Apply all multipliers
        $finalPrices = [];
        foreach ($basePrices as $seatType => $basePrice) {
            $finalPrice = $basePrice * $weekendMultiplier * $timeMultiplier * $cityMultiplier;
            $finalPrices[$seatType] = (int) round($finalPrice / 1000) * 1000; // Round to nearest 1000
        }
        
        return $finalPrices;
    }
    
    /**
     * Generate available seats with some random occupancy
     */
    private function generateAvailableSeats($theater)
    {
        $seatConfig = $theater->seat_configuration;
        $availableSeats = [
            'gold' => [],
            'platinum' => [],
            'box' => []
        ];
        
        // Generate seats for each type
        foreach (['gold', 'platinum', 'box'] as $seatType) {
            $rows = $seatConfig[$seatType]['rows'] ?? 8;
            $cols = $seatConfig[$seatType]['cols'] ?? 12;
            
            // Generate all possible seats
            $allSeats = [];
            for ($row = 1; $row <= $rows; $row++) {
                $rowLetter = chr(64 + $row); // A, B, C, etc.
                for ($col = 1; $col <= $cols; $col++) {
                    $allSeats[] = $rowLetter . $col;
                }
            }
            
            // Randomly occupy 10-40% of seats
            $occupancyRate = rand(10, 40) / 100;
            $occupiedCount = (int) (count($allSeats) * $occupancyRate);
            $occupiedSeats = array_rand(array_flip($allSeats), $occupiedCount);
            
            // Available seats are all seats minus occupied ones
            $availableSeats[$seatType] = array_values(array_diff($allSeats, (array) $occupiedSeats));
        }
        
        return $availableSeats;
    }
}
