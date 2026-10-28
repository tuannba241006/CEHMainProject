<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationOtpMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $hoTen
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Campus Event Hub] Mã OTP xác thực đăng ký tài khoản',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.registration_otp',
            with: [
                'otp' => $this->otp,
                'hoTen' => $this->hoTen,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
