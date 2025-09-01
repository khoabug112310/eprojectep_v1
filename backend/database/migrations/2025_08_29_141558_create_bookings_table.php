<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code', 20)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('showtime_id')->constrained('showtimes')->cascadeOnDelete();
            $table->json('seats');
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_method', 50)->nullable();
            $table->enum('payment_status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->enum('booking_status', ['confirmed', 'cancelled', 'used'])->default('confirmed');
            $table->timestamp('booked_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'booking_status']);
            $table->index(['showtime_id', 'booking_status']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
