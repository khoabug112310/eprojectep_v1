<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Booking;
use App\Models\User;
use App\Models\Showtime;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Str;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $showtimes = Showtime::all();
        
        if ($users->isEmpty() || $showtimes->isEmpty()) {
            $this->command->warn('No users or showtimes found. Skipping booking seeder.');
            return;
        }
        
        // Create 50 sample bookings
        $bookings = [];
        $bookingCodes = [];
        
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            $showtime = $showtimes->random();
            
            // Generate unique booking code
            do {
                $bookingCode = 'BK' . date('Y') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            } while (in_array($bookingCode, $bookingCodes));
            
            $bookingCodes[] = $bookingCode;
            
            // Generate random seats based on showtime's seat configuration
            $availableSeats = $showtime->available_seats;
            
            // If available_seats is a JSON string, decode it
            if (is_string($availableSeats)) {
                $availableSeats = json_decode($availableSeats, true);
            }
            
            // Fallback to default seats if not properly set
            if (!is_array($availableSeats) || empty($availableSeats)) {
                $availableSeats = [
                    'gold' => ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5'],
                    'platinum' => ['P1', 'P2', 'P3', 'P4', 'P5'],
                    'box' => ['VIP1', 'VIP2', 'VIP3', 'VIP4']
                ];
            }
            
            $seatTypes = array_keys($availableSeats);
            $selectedSeatType = $seatTypes[array_rand($seatTypes)];
            $typeSeats = $availableSeats[$selectedSeatType];
            
            // Select 1-4 seats
            $seatCount = rand(1, min(4, count($typeSeats)));
            $selectedSeats = array_slice($typeSeats, 0, $seatCount);
            
            // Calculate prices
            $prices = $showtime->prices;
            
            // If prices is a JSON string, decode it
            if (is_string($prices)) {
                $prices = json_decode($prices, true);
            }
            
            // Fallback to default prices if not properly set
            if (!is_array($prices) || empty($prices)) {
                $prices = [
                    'gold' => 120000,
                    'platinum' => 150000,
                    'box' => 200000
                ];
            }
            
            $seatPrice = $prices[$selectedSeatType] ?? 120000;
            $totalAmount = $seatPrice * $seatCount;
            
            // Format seats for database
            $seats = [];
            foreach ($selectedSeats as $seat) {
                $seats[] = [
                    'seat' => $seat,
                    'type' => $selectedSeatType,
                    'price' => $seatPrice
                ];
            }
            
            // Random booking status and date
            $statuses = ['confirmed', 'cancelled', 'used'];
            $status = $statuses[array_rand($statuses)];
            
            // Create booking date within last 30 days
            $bookedAt = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23));
            
            $bookingData = [
                'booking_code' => $bookingCode,
                'user_id' => $user->id,
                'showtime_id' => $showtime->id,
                'seats' => json_encode($seats),
                'total_amount' => $totalAmount,
                'payment_method' => 'credit_card',
                'payment_status' => $status === 'cancelled' ? 'failed' : 'completed',
                'booking_status' => $status,
                'booked_at' => $bookedAt,
                'created_at' => $bookedAt,
                'updated_at' => $bookedAt,
            ];
            
            $bookings[] = $bookingData;
        }
        
        // Insert all bookings
        foreach ($bookings as $bookingData) {
            $booking = Booking::create($bookingData);
            
            // Create payment record for each booking
            Payment::create([
                'booking_id' => $booking->id,
                'payment_method' => $booking->payment_method,
                'amount' => $booking->total_amount,
                'currency' => 'VND',
                'status' => $booking->payment_status,
                'transaction_id' => 'TXN_' . $booking->booking_code . '_' . strtoupper(Str::random(6)),
                'gateway_response' => $booking->payment_status === 'completed' ? [
                    'status' => 'succeeded',
                    'authorization_code' => strtoupper(Str::random(6)),
                    'processed_at' => $booking->booked_at->format('c')
                ] : null,
                'processed_at' => $booking->payment_status === 'completed' ? $booking->booked_at : null,
                'created_at' => $booking->booked_at,
                'updated_at' => $booking->booked_at,
            ]);
        }
        
        $this->command->info('Created ' . count($bookings) . ' sample bookings with payments.');
    }
}
