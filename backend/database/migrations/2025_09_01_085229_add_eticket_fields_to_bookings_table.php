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
        Schema::table('bookings', function (Blueprint $table) {
            $table->json('ticket_data')->nullable()->after('booked_at');
            $table->string('qr_code', 255)->nullable()->after('ticket_data');
            $table->timestamp('confirmation_sent_at')->nullable()->after('qr_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['ticket_data', 'qr_code', 'confirmation_sent_at']);
        });
    }
};
