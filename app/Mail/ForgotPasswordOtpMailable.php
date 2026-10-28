<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ForgotPasswordOtpMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $hoTen
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Campus Event Hub] Mã OTP khôi phục mật khẩu',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.forgot_password_otp',
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
