<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventApprovedMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $recipientName,
        public string $eventTitle,
        public string $startTimeLabel,
        public string $roomLabel,
        public string $approvalModeLabel = 'Phòng Công tác Sinh viên (P.CTSV)'
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "[Campus Event Hub] Sự kiện đã được phê duyệt: {$this->eventTitle}");
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.event_approved',
            with: [
                'recipientName' => $this->recipientName,
                'eventTitle' => $this->eventTitle,
                'startTimeLabel' => $this->startTimeLabel,
                'roomLabel' => $this->roomLabel,
                'approvalModeLabel' => $this->approvalModeLabel,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
