<?php

namespace App\Jobs;

use App\Models\DatPhong;
use App\Models\NhatKyKiemDuyet;
use App\Models\SuKien;
use App\Models\User;
use App\Services\FallbackCheckOutService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class TransitionEventLifecycleJob implements ShouldQueue
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
     * @return array{auto_rejected: int, published: int, happening: int, completed: int, fallback_opened: int}
     */
    public function handle(
        NotificationService $notificationService,
        FallbackCheckOutService $fallbackService
    ): array {
        $now = $this->simulatedNow ?? now();

        $stats = [
            'auto_rejected' => 0,
            'published' => 0,
            'happening' => 0,
            'completed' => 0,
            'fallback_opened' => 0,
        ];

        // 1. Auto-reject expired proposals still pending at event start time (UC-SYS-01.Task 4)
        $stats['auto_rejected'] = $this->rejectExpiredProposals($now, $notificationService);

        // 2. APPROVED -> PUBLISHED when NOW >= ngay_cong_bo
        $stats['published'] = $this->transitionApprovedToPublished($now);

        // 3. PUBLISHED -> HAPPENING when NOW >= thoi_gian_bat_dau
        $stats['happening'] = $this->transitionPublishedToHappening($now);

        // 4. Trigger fallback check-out if organizer forgot to open check-out at event end
        $stats['fallback_opened'] = $fallbackService->run();

        // 5. HAPPENING -> COMPLETED when NOW >= thoi_gian_ket_thuc + 15 minutes
        $stats['completed'] = $this->transitionHappeningToCompleted($now);

        Log::info('Event lifecycle transition run completed', [
            'timestamp' => $now->toDateTimeString(),
            'stats' => $stats,
        ]);

        return $stats;
    }

    /**
     * Auto-reject pending proposals that reached start time (UC-SYS-01.Task 4).
     */
    protected function rejectExpiredProposals(Carbon $now, NotificationService $notificationService): int
    {
        $rejectedCount = 0;

        $expiredProposals = SuKien::query()
            ->whereIn('trang_thai', ['PENDING_FACULTY', 'PENDING_ADMIN'])
            ->where('thoi_gian_bat_dau', '<=', $now)
            ->orderBy('ma_su_kien')
            ->get();

        foreach ($expiredProposals as $candidate) {
            try {
                $didReject = DB::transaction(function () use ($candidate, $now, $notificationService): bool {
                    // Lock DatPhong first per lock hierarchy
                    $bookings = DatPhong::query()
                        ->where('ma_su_kien', $candidate->ma_su_kien)
                        ->where('trang_thai', 'PENDING')
                        ->lockForUpdate()
                        ->get();

                    // Lock SuKien
                    $event = SuKien::query()
                        ->whereKey($candidate->ma_su_kien)
                        ->lockForUpdate()
                        ->first();

                    if (! $event || ! in_array($event->trang_thai, ['PENDING_FACULTY', 'PENDING_ADMIN'], true)) {
                        return false;
                    }

                    if ($event->thoi_gian_bat_dau->gt($now)) {
                        return false;
                    }

                    $prevStatus = $event->trang_thai;

                    // Release room bookings
                    foreach ($bookings as $booking) {
                        $booking->update([
                            'trang_thai' => 'CANCELLED',
                            'han_giu_cho_tam' => null,
                        ]);
                    }

                    // Update event to REJECTED
                    $event->update([
                        'trang_thai' => 'REJECTED',
                    ]);

                    // Write immutable audit log
                    NhatKyKiemDuyet::create([
                        'ma_su_kien' => $event->ma_su_kien,
                        'nguoi_thuc_hien' => null, // NULL = System background worker
                        'hanh_dong' => 'AUTO_REJECT_EXPIRED',
                        'trang_thai_truoc' => $prevStatus,
                        'trang_thai_sau' => 'REJECTED',
                        'ly_do' => 'Hệ thống: Quá thời hạn phê duyệt trước giờ bắt đầu',
                    ]);

                    // Notify active members of host organization
                    $hostUserIds = User::query()
                        ->where('ma_don_vi_to_chuc', $event->ma_don_vi_to_chuc)
                        ->where('hoat_dong', 1)
                        ->pluck('ma_tai_khoan');

                    foreach ($hostUserIds as $userId) {
                        try {
                            $notificationService->sendNotification(
                                userId: (int) $userId,
                                title: 'Đề xuất sự kiện bị từ chối tự động',
                                content: "Sự kiện \"{$event->ten_su_kien}\" đã tự động bị từ chối do quá thời hạn phê duyệt trước giờ bắt đầu.",
                                type: 'KET_QUA_KIEM_DUYET',
                                link: '/events/'.$event->ma_su_kien
                            );
                        } catch (Throwable $notifError) {
                            Log::warning("Could not send auto-reject notification to user #{$userId}: ".$notifError->getMessage());
                        }
                    }

                    return true;
                });

                $rejectedCount += (int) $didReject;
            } catch (Throwable $e) {
                Log::error("Failed to auto-reject expired event #{$candidate->ma_su_kien}: ".$e->getMessage());
            }
        }

        return $rejectedCount;
    }

    /**
     * APPROVED -> PUBLISHED when NOW >= ngay_cong_bo.
     * Sequentially handles late-running scheduler catch-up.
     */
    protected function transitionApprovedToPublished(Carbon $now): int
    {
        $count = 0;

        $approvedEvents = SuKien::query()
            ->where('trang_thai', 'APPROVED')
            ->where('ngay_cong_bo', '<=', $now)
            ->orderBy('ma_su_kien')
            ->get();

        foreach ($approvedEvents as $candidate) {
            try {
                $didTransition = DB::transaction(function () use ($candidate, $now): bool {
                    $event = SuKien::query()
                        ->whereKey($candidate->ma_su_kien)
                        ->lockForUpdate()
                        ->first();

                    if (! $event || $event->trang_thai !== 'APPROVED') {
                        return false;
                    }

                    if ($event->ngay_cong_bo->gt($now)) {
                        return false;
                    }

                    // Multi-step catchup if scheduler was significantly delayed
                    $isPastEndBuffer = $now->gte($event->thoi_gian_ket_thuc->copy()->addMinutes(15));
                    $isPastStart = $now->gte($event->thoi_gian_bat_dau);

                    if ($isPastEndBuffer) {
                        $event->update([
                            'trang_thai' => 'COMPLETED',
                            'cong_check_in_mo' => false,
                            'cong_check_out_mo' => false,
                        ]);
                    } elseif ($isPastStart) {
                        $event->update([
                            'trang_thai' => 'HAPPENING',
                        ]);
                    } else {
                        $event->update([
                            'trang_thai' => 'PUBLISHED',
                        ]);
                    }

                    return true;
                });

                $count += (int) $didTransition;
            } catch (Throwable $e) {
                Log::error("Failed to publish approved event #{$candidate->ma_su_kien}: ".$e->getMessage());
            }
        }

        return $count;
    }

    /**
     * PUBLISHED -> HAPPENING when NOW >= thoi_gian_bat_dau.
     * Sequentially handles late-running scheduler catch-up.
     */
    protected function transitionPublishedToHappening(Carbon $now): int
    {
        $count = 0;

        $publishedEvents = SuKien::query()
            ->where('trang_thai', 'PUBLISHED')
            ->where('thoi_gian_bat_dau', '<=', $now)
            ->orderBy('ma_su_kien')
            ->get();

        foreach ($publishedEvents as $candidate) {
            try {
                $didTransition = DB::transaction(function () use ($candidate, $now): bool {
                    $event = SuKien::query()
                        ->whereKey($candidate->ma_su_kien)
                        ->lockForUpdate()
                        ->first();

                    if (! $event || $event->trang_thai !== 'PUBLISHED') {
                        return false;
                    }

                    if ($event->thoi_gian_bat_dau->gt($now)) {
                        return false;
                    }

                    $isPastEndBuffer = $now->gte($event->thoi_gian_ket_thuc->copy()->addMinutes(15));

                    if ($isPastEndBuffer) {
                        $event->update([
                            'trang_thai' => 'COMPLETED',
                            'cong_check_in_mo' => false,
                            'cong_check_out_mo' => false,
                        ]);
                    } else {
                        $event->update([
                            'trang_thai' => 'HAPPENING',
                        ]);
                    }

                    return true;
                });

                $count += (int) $didTransition;
            } catch (Throwable $e) {
                Log::error("Failed to transition event #{$candidate->ma_su_kien} to HAPPENING: ".$e->getMessage());
            }
        }

        return $count;
    }

    /**
     * HAPPENING -> COMPLETED when NOW >= thoi_gian_ket_thuc + 15 minutes.
     * Safely closes both check-in and check-out gates.
     */
    protected function transitionHappeningToCompleted(Carbon $now): int
    {
        $count = 0;

        $bufferThreshold = $now->copy()->subMinutes(15);

        $happeningEvents = SuKien::query()
            ->where('trang_thai', 'HAPPENING')
            ->where('thoi_gian_ket_thuc', '<=', $bufferThreshold)
            ->orderBy('ma_su_kien')
            ->get();

        foreach ($happeningEvents as $candidate) {
            try {
                $didTransition = DB::transaction(function () use ($candidate, $now): bool {
                    $event = SuKien::query()
                        ->whereKey($candidate->ma_su_kien)
                        ->lockForUpdate()
                        ->first();

                    if (! $event || $event->trang_thai !== 'HAPPENING') {
                        return false;
                    }

                    $endWithBuffer = $event->thoi_gian_ket_thuc->copy()->addMinutes(15);
                    if ($endWithBuffer->gt($now)) {
                        return false;
                    }

                    $event->update([
                        'trang_thai' => 'COMPLETED',
                        'cong_check_in_mo' => false,
                        'cong_check_out_mo' => false,
                    ]);

                    return true;
                });

                $count += (int) $didTransition;
            } catch (Throwable $e) {
                Log::error("Failed to complete happening event #{$candidate->ma_su_kien}: ".$e->getMessage());
            }
        }

        return $count;
    }
}
