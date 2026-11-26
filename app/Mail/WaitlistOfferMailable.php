<?php

namespace App\Mail;

use App\Models\HangDoiWaitlist;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WaitlistOfferMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $recipientName;

    public string $eventName;

    public string $eventStartTime;

    public string $roomName;

    public string $offerDeadline;

    public int $minutesRemaining;

    public string $waitlistUrl;

    public function __construct(HangDoiWaitlist $entry, SuKien $event, User $user, Carbon $deadline, int $minutesRemaining)
    {
        $event->loadMissing('phongHoiTruong');
        $room = $event->phongHoiTruong;
        $start = $event->thoi_gian_bat_dau
            ? Carbon::parse($event->thoi_gian_bat_dau)->setTimezone('Asia/Ho_Chi_Minh')
            : null;
        $campusLabel = match ($room?->co_so instanceof \BackedEnum ? $room->co_so->value : ($room?->co_so ?? 'CoSo1')) {
            'CoSo2' => 'Cơ sở 2 (Dĩ An)',
            default => 'Cơ sở 1 (Thủ Đức)',
        };

        $this->recipientName = (string) ($user->ho_ten ?: 'Sinh viên');
        $this->eventName = (string) ($event->ten_su_kien ?: 'Sự kiện UIT');
        $this->eventStartTime = $start ? $start->format('H:i d/m/Y') : 'Đang cập nhật';
        $this->roomName = trim(($room?->ten_phong ?? 'Hội trường').' · '.$campusLabel);
        $this->offerDeadline = $deadline->copy()->setTimezone('Asia/Ho_Chi_Minh')->format('H:i d/m/Y');
        $this->minutesRemaining = max(1, $minutesRemaining);

        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $this->waitlistUrl = "{$frontendUrl}/student/tickets";
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Khẩn - Còn {$this->minutesRemaining} phút] Suất nhận vé ưu tiên: {$this->eventName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.waitlist_offer',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
