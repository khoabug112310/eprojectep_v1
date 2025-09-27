<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class BookingConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $booking;
    public $eTicketData;

    /**
     * Create a new message instance.
     */
    public function __construct(Booking $booking, array $eTicketData = null)
    {
        $this->booking = $booking->load(['showtime.movie', 'showtime.theater', 'user', 'payment']);
        $this->eTicketData = $eTicketData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Booking Confirmation - ' . $this->booking->booking_code,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-confirmation',
            with: [
                'booking' => $this->booking,
                'eTicketData' => $this->eTicketData,
                'movie' => $this->booking->showtime->movie,
                'theater' => $this->booking->showtime->theater,
                'showtime' => $this->booking->showtime,
                'customer' => $this->booking->user,
                'payment' => $this->booking->payment,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        // Attach QR code if available
        if ($this->booking->qr_code && Storage::disk('public')->exists($this->booking->qr_code)) {
            $attachments[] = Attachment::fromStorageDisk('public', $this->booking->qr_code)
                ->as('qr-code.png')
                ->withMime('image/png');
        }

        // Attach PDF ticket if available from e-ticket data
        if ($this->eTicketData && isset($this->eTicketData['pdf_ticket']['file_path'])) {
            $filePath = $this->eTicketData['pdf_ticket']['file_path'];
            if (Storage::disk('public')->exists($filePath)) {
                $attachments[] = Attachment::fromStorageDisk('public', $filePath)
                    ->as('eticket-' . $this->booking->booking_code . '.pdf')
                    ->withMime('application/pdf');
            }
        }

        return $attachments;
    }
}