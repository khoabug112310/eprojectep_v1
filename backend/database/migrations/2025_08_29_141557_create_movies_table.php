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
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('synopsis');
            $table->integer('duration');
            $table->json('genre');
            $table->string('language', 50);
            $table->string('age_rating', 10)->nullable();
            $table->date('release_date');
            $table->string('poster_url', 500)->nullable();
            $table->string('trailer_url', 500)->nullable();
            $table->json('cast')->nullable();
            $table->string('director')->nullable();
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->enum('status', ['active', 'inactive', 'coming_soon'])->default('active');
            $table->timestamps();

            $table->index(['status', 'release_date']);
            $table->index('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
