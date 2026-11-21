<?php

namespace App\Jobs;

use App\Models\DatPhong;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ExpireSoftHoldJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(AuditLogService $auditLogService, NotificationService $notificationService): void
    {
        $now = now();
        $bookingIds = DatPhong::query()
            ->where('trang_thai', 'PENDING')
            ->where(function ($query) use ($now) {
                $query->where('han_giu_cho_tam', '<=', $now)
                    ->orWhereHas('suKien', fn ($event) => $event
                        ->where('trang_thai', 'WAITING_COHOST_CONFIRM')
                        ->where('thoi_gian_bat_dau', '<=', $now));
            })
            ->orderBy('ma_phong')
            ->orderBy('ma_dat_phong')
            ->pluck('ma_dat_phong');

        foreach ($bookingIds as $bookingId) {
            DB::transaction(function () use ($bookingId, $now, $auditLogService, $notificationService) {
                $snapshot = DatPhong::query()->find($bookingId);
                if (! $snapshot) {
                    return;
                }

                // Global order for event proposal resources: phong_hoi_truong -> dat_phong -> su_kien.
                $room = PhongHoiTruong::query()
                    ->where('ma_phong', $snapshot->ma_phong)
                    ->lockForUpdate()
                    ->first();
                $booking = DatPhong::query()->whereKey($bookingId)->lockForUpdate()->first();
                if (! $room || ! $booking || $booking->trang_thai !== 'PENDING') {
                    return;
                }

                $event = SuKien::query()
                    ->where('ma_su_kien', $booking->ma_su_kien)
                    ->lockForUpdate()
                    ->first();
                if (! $event || $event->trang_thai !== 'WAITING_COHOST_CONFIRM') {
                    return;
                }

                $deadlinePassed = $booking->han_giu_cho_tam && $booking->han_giu_cho_tam->lte($now);
                $eventStarted = $event->thoi_gian_bat_dau->lte($now);
                if (! $deadlinePassed && ! $eventStarted) {
                    return;
                }

                $booking->trang_thai = 'CANCELLED';
                $booking->save();

                $previousStatus = $event->trang_thai;
                $event->trang_thai = 'COHOST_REJECTED';
                $event->save();

                $auditLogService->logAudit(
                    action: 'EXPIRE_COHOST_HOLD',
                    eventId: (int) $event->ma_su_kien,
                    prevStatus: $previousStatus,
                    nextStatus: 'COHOST_REJECTED',
                    actorUserId: null
                );

                User::query()
                    ->where('ma_don_vi_to_chuc', $event->ma_don_vi_to_chuc)
                    ->where('loai_tai_khoan', 'ToChuc')
                    ->where('hoat_dong', true)
                    ->get()
                    ->each(fn (User $host) => $notificationService->sendNotification(
                        (int) $host->ma_tai_khoan,
                        'Đề xuất sự kiện hết hạn giữ chỗ',
                        "Đề xuất sự kiện '{$event->ten_su_kien}' đã hết hạn đồng thuận đồng tổ chức; phòng đã được giải phóng.",
                        'KET_QUA_KIEM_DUYET',
                        '/organizer/events'
                    ));
            });
        }
    }
}
