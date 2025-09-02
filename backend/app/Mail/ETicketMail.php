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

class ETicketMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $booking;
    public $eTicketData;

    /**
     * Create a new message instance.
     */
    public function __construct(Booking $booking, array $eTicketData)
    {
        $this->booking = $booking->load(['showtime.movie', 'showtime.theater', 'user']);
        $this->eTicketData = $eTicketData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vé điện tử CineBook - ' . $this->booking->booking_code,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.eticket',
            with: [
                'booking' => $this->booking,
                'eTicketData' => $this->eTicketData,
                'movie' => $this->booking->showtime->movie,
                'theater' => $this->booking->showtime->theater,
                'showtime' => $this->booking->showtime,
                'customer' => $this->booking->user,
                'ticketData' => $this->eTicketData['ticket_data'] ?? [],
                'qrCodeUrl' => $this->eTicketData['qr_code']['qr_code_url'] ?? null,
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

        // Attach QR code
        if (isset($this->eTicketData['qr_code']['qr_code_path'])) {
            $qrPath = $this->eTicketData['qr_code']['qr_code_path'];
            if (Storage::disk('public')->exists($qrPath)) {
                $attachments[] = Attachment::fromStorageDisk('public', $qrPath)
                    ->as('ticket-qr-code.png')
                    ->withMime('image/png');
            }
        }

        // Attach HTML ticket
        if (isset($this->eTicketData['pdf_ticket']['file_path'])) {
            $ticketPath = $this->eTicketData['pdf_ticket']['file_path'];
            if (Storage::disk('public')->exists($ticketPath)) {
                $attachments[] = Attachment::fromStorageDisk('public', $ticketPath)
                    ->as('eticket-' . $this->booking->booking_code . '.html')
                    ->withMime('text/html');
            }
        }

        return $attachments;
    }
}
