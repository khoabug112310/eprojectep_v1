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
            // Add transaction tracking fields for atomic operations
            $table->string('transaction_id', 100)->nullable()->after('booking_status');
            $table->timestamp('cancelled_at')->nullable()->after('booked_at');
            $table->string('cancellation_reason')->nullable()->after('cancelled_at');
            
            // Add indexes for performance
            $table->index('transaction_id');
            $table->index(['booking_status', 'cancelled_at']);
        });

        Schema::table('payments', function (Blueprint $table) {
            // Add refund tracking fields
            $table->timestamp('refunded_at')->nullable()->after('created_at');
            $table->string('refund_reason')->nullable()->after('refunded_at');
            $table->string('transaction_reference', 100)->nullable()->after('refund_reason');
            
            // Add indexes for performance
            $table->index(['status', 'refunded_at']);
            $table->index('transaction_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['transaction_id']);
            $table->dropIndex(['booking_status', 'cancelled_at']);
            
            $table->dropColumn(['transaction_id', 'cancelled_at', 'cancellation_reason']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['status', 'refunded_at']);
            $table->dropIndex(['transaction_reference']);
            
            $table->dropColumn(['refunded_at', 'refund_reason', 'transaction_reference']);
        });
    }
};