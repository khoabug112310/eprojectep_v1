<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement([
            Payment::STATUS_PENDING,
            Payment::STATUS_PROCESSING,
            Payment::STATUS_COMPLETED,
            Payment::STATUS_FAILED
        ]);

        return [
            'booking_id' => Booking::factory(),
            'payment_method' => $this->faker->randomElement([
                Payment::METHOD_CREDIT_CARD,
                Payment::METHOD_DEBIT_CARD,
                Payment::METHOD_BANK_TRANSFER
            ]),
            'amount' => $this->faker->numberBetween(100000, 500000), // 100k to 500k VND
            'currency' => 'VND',
            'status' => $status,
            'transaction_id' => 'TXN_' . $this->faker->dateTime->format('YmdHis') . '_' . strtoupper($this->faker->lexify('??????')),
            'gateway_response' => $status === Payment::STATUS_COMPLETED ? [
                'status' => 'succeeded',
                'authorization_code' => strtoupper($this->faker->lexify('??????')),
                'processed_at' => $this->faker->dateTime->format('c')
            ] : null,
            'processed_at' => in_array($status, [Payment::STATUS_COMPLETED, Payment::STATUS_FAILED]) 
                ? $this->faker->dateTimeBetween('-1 month', 'now') 
                : null,
        ];
    }

    /**
     * Indicate that the payment is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Payment::STATUS_COMPLETED,
            'processed_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'gateway_response' => [
                'status' => 'succeeded',
                'authorization_code' => strtoupper($this->faker->lexify('??????')),
                'processed_at' => $this->faker->dateTime->format('c')
            ]
        ]);
    }

    /**
     * Indicate that the payment failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Payment::STATUS_FAILED,
            'processed_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'gateway_response' => [
                'status' => 'failed',
                'error_code' => $this->faker->randomElement(['card_declined', 'insufficient_funds', 'processing_error']),
                'error_message' => $this->faker->sentence()
            ]
        ]);
    }

    /**
     * Indicate that the payment is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Payment::STATUS_PENDING,
            'processed_at' => null,
            'gateway_response' => null
        ]);
    }

    /**
     * Set a specific amount.
     */
    public function amount(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'amount' => $amount
        ]);
    }

    /**
     * Set credit card payment method.
     */
    public function creditCard(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => Payment::METHOD_CREDIT_CARD
        ]);
    }
}