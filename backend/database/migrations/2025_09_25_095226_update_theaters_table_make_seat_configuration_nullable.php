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
        Schema::table('theaters', function (Blueprint $table) {
            $table->json('seat_configuration')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('theaters', function (Blueprint $table) {
            $table->json('seat_configuration')->nullable(false)->change();
        });
    }
};