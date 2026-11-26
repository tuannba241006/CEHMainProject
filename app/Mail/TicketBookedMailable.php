<?php

namespace App\Mail;

use App\Models\DangKy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketBookedMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $recipientName;

    public string $mssv;

    public string $eventName;

    public string $eventStartTime;

    public string $eventEndTime;

    public string $roomName;

    public string $ticketUuid;

    public string $hmacSignature;

    public string $payloadQr;

    public string $cancelDeadline;

    public string $ticketsUrl;

    public function __construct(DangKy $ticket, User $user)
    {
        $ticket->loadMissing(['suKien.phongHoiTruong']);
        $event = $ticket->suKien;
        $room = $event?->phongHoiTruong;

        $start = $event?->thoi_gian_bat_dau
            ? Carbon::parse($event->thoi_gian_bat_dau)->setTimezone('Asia/Ho_Chi_Minh')
            : null;
        $end = $event?->thoi_gian_ket_thuc
            ? Carbon::parse($event->thoi_gian_ket_thuc)->setTimezone('Asia/Ho_Chi_Minh')
            : null;

        $campusLabel = match ($room?->co_so instanceof \BackedEnum ? $room->co_so->value : ($room?->co_so ?? 'CoSo1')) {
            'CoSo2' => 'Cơ sở 2 (Dĩ An)',
            default => 'Cơ sở 1 (Thủ Đức)',
        };

        $this->recipientName = (string) ($user->ho_ten ?: 'Sinh viên');
        $this->mssv = (string) ($user->mssv ?: '');
        $this->eventName = (string) ($event?->ten_su_kien ?: 'Sự kiện UIT');
        $this->eventStartTime = $start ? $start->format('H:i d/m/Y') : 'Đang cập nhật';
        $this->eventEndTime = $end ? $end->format('H:i d/m/Y') : 'Đang cập nhật';
        $this->roomName = trim(($room?->ten_phong ?? 'Hội trường').' · '.$campusLabel);
        $this->ticketUuid = (string) $ticket->ma_ve_uuid;
        $this->hmacSignature = (string) $ticket->chu_ky_hmac;
        $this->payloadQr = sprintf(
            'CEH1.%s.%d.%d.%s',
            $ticket->ma_ve_uuid,
            (int) $ticket->ma_tai_khoan,
            (int) $ticket->ma_su_kien,
            $ticket->chu_ky_hmac
        );
        $this->cancelDeadline = $start ? $start->copy()->subHours(4)->format('H:i d/m/Y') : 'Trước 4 giờ';

        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $this->ticketsUrl = "{$frontendUrl}/student/tickets";
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Campus Event Hub] Vé điện tử & Mã QR: {$this->eventName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket_booked',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
