<?php

namespace App\Services;

use App\Models\DangKy;
use App\Models\SuKien;
use Carbon\CarbonInterface;

class AttendanceScoringService
{
    public function score(SuKien $event, DangKy $ticket, CarbonInterface $checkOut): array
    {
        $eventStart = $event->thoi_gian_bat_dau->getTimestamp();
        $eventEnd = ($event->thoi_gian_ket_thuc_thuc_te ?: $event->thoi_gian_ket_thuc)->getTimestamp();
        $checkIn = $ticket->thoi_gian_check_in->getTimestamp();
        $checkOutTime = $checkOut->getTimestamp();
        $effectiveStart = max($checkIn, $eventStart);
        $effectiveEnd = min($checkOutTime, $eventEnd);
        $attendedSeconds = max(0, $effectiveEnd - $effectiveStart);
        $eventSeconds = max(1, $eventEnd - $eventStart);
        $ratio = min(1, $attendedSeconds / $eventSeconds);
        $full = $ratio >= 0.6;
        $partial = ! $full && $ratio >= 0.3;

        return [
            'tham_gia_tron_ven' => $full,
            'tham_gia_mot_phan' => $partial,
            'ti_le_drl' => $full ? 1.0 : ($partial ? 0.5 : 0.0),
            'thoi_luong_tham_du_phut' => intdiv($attendedSeconds, 60),
        ];
    }
}
