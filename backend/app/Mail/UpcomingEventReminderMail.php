<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UpcomingEventReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public string $recipientName,
        public string $eventName,
        public string $eventStartTime,
        public string $roomName,
        public string $ticketUuid,
        public int $ticketId,
        public bool $canCancel,
        public string $cancelDeadline
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Campus Event Hub] Nhắc hẹn sự kiện sắp diễn ra: {$this->eventName}"
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.upcoming_event_reminder',
            with: [
                'recipientName' => $this->recipientName,
                'eventName' => $this->eventName,
                'eventStartTime' => $this->eventStartTime,
                'roomName' => $this->roomName,
                'ticketUuid' => $this->ticketUuid,
                'ticketId' => $this->ticketId,
                'canCancel' => $this->canCancel,
                'cancelDeadline' => $this->cancelDeadline,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
