<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update showtime dates to be within the next 7 days
        $showtimes = DB::table('showtimes')->get();
        
        $dates = [
            date('Y-m-d'), // Today
            date('Y-m-d', strtotime('+1 day')),
            date('Y-m-d', strtotime('+2 days')),
            date('Y-m-d', strtotime('+3 days')),
            date('Y-m-d', strtotime('+4 days')),
            date('Y-m-d', strtotime('+5 days')),
            date('Y-m-d', strtotime('+6 days')),
        ];
        
        foreach ($showtimes as $index => $showtime) {
            $dateIndex = $index % count($dates);
            DB::table('showtimes')
                ->where('id', $showtime->id)
                ->update(['show_date' => $dates[$dateIndex]]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be reversed easily
    }
};