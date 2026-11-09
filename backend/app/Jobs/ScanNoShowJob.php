<?php

namespace App\Jobs;

use App\Mail\NoShowWarningMail;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\ThongKeSuKienNgay;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ScanNoShowJob implements ShouldQueue
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
     * @return array{events_scanned: int, tickets_marked: int, unorganized_events_alerted: int}
     */
    public function handle(NotificationService $notificationService): array
    {
        $now = $this->simulatedNow ?? now();
        $twoHoursAgo = $now->copy()->subHours(2);

        $results = [
            'events_scanned' => 0,
            'tickets_marked' => 0,
            'unorganized_events_alerted' => 0,
        ];

        // 1. Fetch COMPLETED, limited-slot events where planned end time is at least 2 hours ago
        $events = SuKien::query()
            ->where('trang_thai', 'COMPLETED')
            ->where('khong_gioi_han_slot', false)
            ->where('thoi_gian_ket_thuc', '<=', $twoHoursAgo)
            ->orderBy('ma_su_kien')
            ->get();

        foreach ($events as $event) {
            $results['events_scanned']++;

            // 2. Safety filter: Verify proof of actual check-in reception activity
            // (thoi_gian_mo_cong_check_in IS NOT NULL OR at least 1 ticket has da_check_in = 1)
            $hadGateOpened = $event->thoi_gian_mo_cong_check_in !== null;
            $hadAnyCheckIn = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('da_check_in', true)
                ->exists();

            if (! $hadGateOpened && ! $hadAnyCheckIn) {
                // Organizer forgot to open check-in or failed to organize check-in.
                // STRICT SAFETY POLICY: Never penalize students when there is no proof of organizer reception.
                $wasAlerted = $this->alertAdminMissingReception($event, $notificationService);
                if ($wasAlerted) {
                    $results['unorganized_events_alerted']++;
                }

                continue;
            }

            // 3. Find candidates: registered, not checked in, not yet marked no-show, not flagged for fraud
            $unattendedTickets = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('trang_thai', 'DaDangKy')
                ->where('da_check_in', false)
                ->where('vi_pham_no_show', false)
                ->where('nghi_van_gian_lan', false)
                ->with('taiKhoan')
                ->get();

            $eventMarkedCount = 0;

            foreach ($unattendedTickets as $candidate) {
                try {
                    $marked = DB::transaction(function () use ($candidate, $event, $notificationService): bool {
                        // Lock ticket row
                        $ticket = DangKy::query()
                            ->whereKey($candidate->ma_dang_ky)
                            ->where('trang_thai', 'DaDangKy')
                            ->where('da_check_in', false)
                            ->where('vi_pham_no_show', false)
                            ->where('nghi_van_gian_lan', false)
                            ->lockForUpdate()
                            ->first();

                        if (! $ticket) {
                            return false;
                        }

                        // Mark No-show
                        $ticket->update([
                            'vi_pham_no_show' => true,
                        ]);

                        // Send In-App Notification (UC-NOTIF-01 / UC-SYS-01)
                        $notificationService->sendNotification(
                            userId: (int) $ticket->ma_tai_khoan,
                            title: 'Cảnh báo vi phạm vắng mặt (No-show)',
                            content: "Bạn đã không tham gia sự kiện \"{$event->ten_su_kien}\" mà không hủy vé trước thời hạn T-4h. Vi phạm này có thể ảnh hưởng đến điểm rèn luyện.",
                            type: 'CANH_BAO_NO_SHOW',
                            link: '/tickets/'.$ticket->ma_dang_ky
                        );

                        // Queue No-show Warning Email
                        $user = $ticket->taiKhoan;
                        if ($user && ! empty($user->email)) {
                            try {
                                Mail::to($user->email)->queue(new NoShowWarningMail(
                                    recipientName: $user->ho_ten ?? 'Sinh viên',
                                    eventName: $event->ten_su_kien,
                                    eventStartTime: $event->thoi_gian_bat_dau->format('H:i d/m/Y'),
                                    ticketUuid: $ticket->ma_ve_uuid
                                ));
                            } catch (Throwable $mailEx) {
                                Log::warning("Failed to queue NoShowWarningMail for ticket #{$ticket->ma_dang_ky}: ".$mailEx->getMessage());
                            }
                        }

                        return true;
                    });

                    if ($marked) {
                        $eventMarkedCount++;
                        $results['tickets_marked']++;
                    }
                } catch (Throwable $e) {
                    Log::error("Failed to mark No-show for ticket #{$candidate->ma_dang_ky}: ".$e->getMessage());
                }
            }

            // 4. Real-time statistical reconciliation if daily stats row already exists
            if ($eventMarkedCount > 0) {
                try {
                    $totalNoShow = DangKy::query()
                        ->where('ma_su_kien', $event->ma_su_kien)
                        ->where('vi_pham_no_show', true)
                        ->count();

                    ThongKeSuKienNgay::query()
                        ->where('ma_su_kien', $event->ma_su_kien)
                        ->update([
                            'tong_luot_no_show' => $totalNoShow,
                            'thoi_gian_cap_nhat' => now(),
                        ]);
                } catch (Throwable $statEx) {
                    Log::warning("Could not reconcile stats for event #{$event->ma_su_kien}: ".$statEx->getMessage());
                }
            }
        }

        Log::info('Safe No-show scanner run completed', [
            'timestamp' => $now->toDateTimeString(),
            'results' => $results,
        ]);

        return $results;
    }

    /**
     * Alert Admins when an event has completed without any check-in activity.
     * Prevents spamming alerts on repeated scanner runs.
     */
    protected function alertAdminMissingReception(SuKien $event, NotificationService $notificationService): bool
    {
        $alertTitle = 'Cảnh báo sự kiện thiếu dữ liệu điểm danh';
        $alertKeyword = "Mã sự kiện: #{$event->ma_su_kien}";

        // Idempotency: Check if an alert for this event has already been created
        $alreadyAlerted = ThongBao::query()
            ->where('loai_thong_bao', 'HE_THONG')
            ->where('tieu_de', $alertTitle)
            ->where('noi_dung', 'like', "%{$alertKeyword}%")
            ->exists();

        if ($alreadyAlerted) {
            return false;
        }

        $adminIds = User::query()
            ->where('loai_tai_khoan', 'Admin')
            ->where('hoat_dong', 1)
            ->pluck('ma_tai_khoan');

        $content = "Sự kiện \"{$event->ten_su_kien}\" ({$alertKeyword}) đã hoàn thành nhưng Ban tổ chức không ghi nhận lượt mở cổng điểm danh hoặc không có lượt check-in nào. Hệ thống tạm dừng áp dụng No-show tự động để quản trị viên đối soát thủ công.";

        foreach ($adminIds as $adminId) {
            try {
                $notificationService->sendNotification(
                    userId: (int) $adminId,
                    title: $alertTitle,
                    content: $content,
                    type: 'HE_THONG',
                    link: '/admin/events/'.$event->ma_su_kien
                );
            } catch (Throwable $e) {
                Log::warning("Could not send admin alert to user #{$adminId}: ".$e->getMessage());
            }
        }

        return true;
    }
}
