<?php

namespace App\Jobs;

use App\Mail\UpcomingEventReminderMail;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendUpcomingEventReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ?Carbon $simulatedNow = null
    ) {}

    /**
     * Execute the job.
     *
     * @return array{eligible_tickets: int, reminders_sent: int}
     */
    public function handle(NotificationService $notificationService): array
    {
        $now = $this->simulatedNow ?? now();
        $windowEnd = $now->copy()->addHours(24);

        $results = [
            'eligible_tickets' => 0,
            'reminders_sent' => 0,
        ];

        // 1. Fetch all PUBLISHED events starting within the next 24-hour sliding window
        $publishedEventIds = SuKien::query()
            ->where('trang_thai', 'PUBLISHED')
            ->where('thoi_gian_bat_dau', '>', $now)
            ->where('thoi_gian_bat_dau', '<=', $windowEnd)
            ->pluck('ma_su_kien');

        if ($publishedEventIds->isEmpty()) {
            return $results;
        }

        // 2. Fetch all tickets for these events that have not yet received a reminder
        $candidates = DangKy::query()
            ->whereIn('ma_su_kien', $publishedEventIds)
            ->where('trang_thai', 'DaDangKy')
            ->where('da_gui_nhac_nho', false)
            ->with(['suKien.phongHoiTruong', 'taiKhoan'])
            ->get();

        $results['eligible_tickets'] = $candidates->count();

        foreach ($candidates as $ticket) {
            $event = $ticket->suKien;
            if (! $event || $event->trang_thai !== 'PUBLISHED') {
                continue;
            }

            // 3. Concurrency protection: Atomic conditional update
            // Prevents multiple parallel workers or scheduler runs from duplicating reminders
            $affected = DangKy::query()
                ->where('ma_dang_ky', $ticket->ma_dang_ky)
                ->where('da_gui_nhac_nho', false)
                ->where('trang_thai', 'DaDangKy')
                ->update(['da_gui_nhac_nho' => true]);

            if ($affected === 0) {
                // Another concurrent worker claimed and processed this ticket
                continue;
            }

            $user = $ticket->taiKhoan;
            $roomName = $event->phongHoiTruong ? $event->phongHoiTruong->ten_phong : 'Hội trường trường';
            $eventStartFormatted = $event->thoi_gian_bat_dau->format('H:i d/m/Y');

            // 4. Calculate cancellation deadline (T-4h)
            $deadline = $event->thoi_gian_bat_dau->copy()->subHours(4);
            $canCancel = $now->lt($deadline);
            $deadlineFormatted = $deadline->format('H:i d/m/Y');

            // 5. Create In-App Notification (UC-NOTIF-01)
            $notifTitle = "Nhắc hẹn: {$event->ten_su_kien} sắp diễn ra";
            $notifContent = "Sự kiện \"{$event->ten_su_kien}\" sẽ diễn ra lúc {$eventStartFormatted} tại {$roomName}."
                .($canCancel
                    ? " Hạn chót hủy vé là {$deadlineFormatted} (T-4h)."
                    : ' Đã qua thời hạn cho phép tự hủy vé (T-4h), vui lòng tham dự đúng giờ.');

            try {
                $notificationService->sendNotification(
                    userId: (int) $ticket->ma_tai_khoan,
                    title: $notifTitle,
                    content: $notifContent,
                    type: 'NHAC_HEN',
                    link: '/tickets/'.$ticket->ma_dang_ky
                );
            } catch (Throwable $notifEx) {
                Log::warning("Could not create in-app reminder notification for user #{$ticket->ma_tai_khoan}: ".$notifEx->getMessage());
            }

            // 6. Queue Email Reminder
            if ($user && ! empty($user->email)) {
                try {
                    Mail::to($user->email)->queue(new UpcomingEventReminderMail(
                        recipientName: $user->ho_ten ?? 'Sinh viên',
                        eventName: $event->ten_su_kien,
                        eventStartTime: $eventStartFormatted,
                        roomName: $roomName,
                        ticketUuid: $ticket->ma_ve_uuid,
                        ticketId: (int) $ticket->ma_dang_ky,
                        canCancel: $canCancel,
                        cancelDeadline: $deadlineFormatted
                    ));
                } catch (Throwable $mailEx) {
                    Log::warning("Failed to queue reminder email for ticket #{$ticket->ma_dang_ky}: ".$mailEx->getMessage());
                }
            }

            $results['reminders_sent']++;
        }

        Log::info('Upcoming event reminders job completed', [
            'timestamp' => $now->toDateTimeString(),
            'results' => $results,
        ]);

        return $results;
    }
}
