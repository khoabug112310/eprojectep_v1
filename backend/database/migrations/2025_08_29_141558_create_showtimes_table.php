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
        Schema::create('showtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->foreignId('theater_id')->constrained('theaters')->cascadeOnDelete();
            $table->date('show_date');
            $table->time('show_time');
            $table->json('prices');
            $table->json('available_seats');
            $table->enum('status', ['active', 'cancelled', 'full'])->default('active');
            $table->timestamps();

            $table->index(['show_date', 'theater_id', 'movie_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('showtimes');
    }
};
