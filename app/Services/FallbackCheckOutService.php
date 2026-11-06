<?php

namespace App\Services;

use App\Models\NhatKyKiemDuyet;
use App\Models\SuKien;
use Illuminate\Support\Facades\DB;

class FallbackCheckOutService
{
    public function run(): int
    {
        $opened = 0;

        SuKien::query()
            ->where('trang_thai', 'HAPPENING')
            ->where('cong_check_out_mo', false)
            ->whereNull('thoi_gian_ket_thuc_thuc_te')
            ->where('thoi_gian_ket_thuc', '<=', now())
            ->orderBy('ma_su_kien')
            ->chunkById(100, function ($events) use (&$opened): void {
                foreach ($events as $candidate) {
                    $didOpen = DB::transaction(function () use ($candidate): bool {
                        $event = SuKien::query()
                            ->whereKey($candidate->ma_su_kien)
                            ->lockForUpdate()
                            ->first();

                        if (
                            ! $event
                            || $event->trang_thai !== 'HAPPENING'
                            || $event->cong_check_out_mo
                            || $event->thoi_gian_ket_thuc_thuc_te !== null
                            || $event->thoi_gian_ket_thuc->isFuture()
                        ) {
                            return false;
                        }

                        $event->update([
                            'cong_check_out_mo' => true,
                            'thoi_gian_ket_thuc_thuc_te' => $event->thoi_gian_ket_thuc,
                        ]);
                        NhatKyKiemDuyet::create([
                            'ma_su_kien' => $event->ma_su_kien,
                            'nguoi_thuc_hien' => null,
                            'hanh_dong' => 'AUTO_OPEN_CHECKOUT',
                            'trang_thai_truoc' => $event->trang_thai,
                            'trang_thai_sau' => $event->trang_thai,
                            'ly_do' => 'Hệ thống tự động mở cổng Check-out khi đến giờ kết thúc kế hoạch.',
                        ]);

                        return true;
                    });

                    $opened += (int) $didOpen;
                }
            }, 'ma_su_kien');

        return $opened;
    }
}
