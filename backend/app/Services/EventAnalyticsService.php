<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\SuKien;
use App\Models\SuKienDongToChuc;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EventAnalyticsService
{
    /**
     * Dashboard phân tích chỉ số hiệu quả sự kiện dành cho Ban tổ chức (UC-REP-01).
     *
     * @return array<string, mixed>
     */
    public function getOrganizerAnalytics(User $user, int $eventId): array
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        $this->authorizeOrganizerOrAdmin($user, $event);

        // 1. Query aggregated KPI from View v_event_analytics
        $analytics = DB::table('v_event_analytics')->where('ma_su_kien', $eventId)->first();

        $tongVeDangKy = $analytics ? (int) $analytics->so_ve_da_dat : DB::table('dang_ky')->where('ma_su_kien', $eventId)->where('trang_thai', '<>', 'DaHuy')->count();
        $soLuongCheckIn = $analytics ? (int) $analytics->so_luot_check_in : DB::table('dang_ky')->where('ma_su_kien', $eventId)->where('da_check_in', 1)->count();
        $soLuongCheckOut = $analytics ? (int) $analytics->so_luot_check_out : DB::table('dang_ky')->where('ma_su_kien', $eventId)->where('da_check_out', 1)->count();

        $khongGioiHanSlot = (bool) $event->khong_gioi_han_slot;
        $soLuongToiDa = $khongGioiHanSlot ? null : ($event->so_luong_toi_da ? (int) $event->so_luong_toi_da : null);

        // Tỷ lệ lấp đầy
        $tyLeLapDayPct = null;
        if (! $khongGioiHanSlot && $soLuongToiDa && $soLuongToiDa > 0) {
            $tyLeLapDayPct = round(($tongVeDangKy / $soLuongToiDa) * 100, 2);
        }

        // Tỷ lệ show-up
        $tyLeShowUpPct = $tongVeDangKy > 0 ? round(($soLuongCheckIn / $tongVeDangKy) * 100, 2) : 0.0;

        // No-show (chỉ tính đối với sự kiện giới hạn slot)
        $soLuongNoShow = null;
        $tyLeNoShowPct = null;
        if (! $khongGioiHanSlot) {
            $soLuongNoShow = $analytics ? (int) $analytics->so_luot_no_show : DB::table('dang_ky')->where('ma_su_kien', $eventId)->where('vi_pham_no_show', 1)->count();
            if ($soLuongNoShow === 0 && $event->trang_thai === 'COMPLETED') {
                $soLuongNoShow = max(0, $tongVeDangKy - $soLuongCheckIn);
            }
            $tyLeNoShowPct = $tongVeDangKy > 0 ? round(($soLuongNoShow / $tongVeDangKy) * 100, 2) : 0.0;
        }

        // Ratings
        $diemNoiDungTb = $analytics && $analytics->diem_noi_dung_tb !== null ? (float) $analytics->diem_noi_dung_tb : null;
        $diemDienGiaTb = $analytics && $analytics->diem_dien_gia_tb !== null ? (float) $analytics->diem_dien_gia_tb : null;
        $diemToChucTb = $analytics && $analytics->diem_to_chuc_tb !== null ? (float) $analytics->diem_to_chuc_tb : null;

        // 2. Query faculty distribution
        $facultyRows = DB::table('dang_ky as dk')
            ->join('tai_khoan as tk', 'tk.ma_tai_khoan', '=', 'dk.ma_tai_khoan')
            ->leftJoin('don_vi_to_chuc as dv', 'dv.ma_don_vi_to_chuc', '=', 'tk.ma_khoa')
            ->where('dk.ma_su_kien', $eventId)
            ->where('dk.trang_thai', '<>', 'DaHuy')
            ->select(
                'tk.ma_khoa',
                DB::raw("COALESCE(dv.ten_don_vi, tk.khoa, 'Chưa xác định') as ten_khoa"),
                DB::raw('COUNT(dk.ma_dang_ky) as so_luong_dang_ky'),
                DB::raw('COUNT(CASE WHEN dk.da_check_in = 1 THEN 1 END) as so_luong_tham_du')
            )
            ->groupBy('tk.ma_khoa', DB::raw("COALESCE(dv.ten_don_vi, tk.khoa, 'Chưa xác định')"))
            ->orderByDesc('so_luong_dang_ky')
            ->get();

        $phanBoTheoKhoa = $facultyRows->map(function ($row) {
            return [
                'ma_khoa' => $row->ma_khoa ? (int) $row->ma_khoa : null,
                'ten_khoa' => (string) $row->ten_khoa,
                'so_luong_dang_ky' => (int) $row->so_luong_dang_ky,
                'so_luong_tham_du' => (int) $row->so_luong_tham_du,
            ];
        })->values()->all();

        // 3. Query check-in / check-out time buckets (15-min intervals)
        $timeBuckets = $this->calculateTimeBuckets($eventId);

        return [
            'ma_su_kien' => (int) $event->ma_su_kien,
            'khong_gioi_han_slot' => $khongGioiHanSlot,
            'so_luong_toi_da' => $soLuongToiDa,
            'tong_ve_dang_ky' => $tongVeDangKy,
            'so_luong_check_in' => $soLuongCheckIn,
            'so_luong_check_out' => $soLuongCheckOut,
            'ty_le_lap_day_pct' => $tyLeLapDayPct,
            'ty_le_show_up_pct' => $tyLeShowUpPct,
            'so_luong_no_show' => $soLuongNoShow,
            'ty_le_no_show_pct' => $tyLeNoShowPct,
            'diem_noi_dung_tb' => $diemNoiDungTb,
            'diem_dien_gia_tb' => $diemDienGiaTb,
            'diem_to_chuc_tb' => $diemToChucTb,
            'phan_bo_theo_khoa' => $phanBoTheoKhoa,
            'luu_luong_theo_khung_gio' => $timeBuckets,
        ];
    }

    /**
     * Compute 15-minute time slot histogram for check-in and check-out.
     *
     * @return array<int, array{khung_gio: string, so_luot_check_in: int, so_luot_check_out: int}>
     */
    protected function calculateTimeBuckets(int $eventId): array
    {
        $records = DB::table('dang_ky')
            ->where('ma_su_kien', $eventId)
            ->where(function ($q) {
                $q->whereNotNull('thoi_gian_check_in')
                    ->orWhereNotNull('thoi_gian_check_out');
            })
            ->select(['thoi_gian_check_in', 'thoi_gian_check_out'])
            ->get();

        $buckets = [];

        foreach ($records as $r) {
            if ($r->thoi_gian_check_in) {
                $time = Carbon::parse($r->thoi_gian_check_in)->setTimezone('+07:00');
                $key = $this->format15mBucket($time);
                if (! isset($buckets[$key])) {
                    $buckets[$key] = ['khung_gio' => $key, 'so_luot_check_in' => 0, 'so_luot_check_out' => 0, 'sort' => $time->timestamp];
                }
                $buckets[$key]['so_luot_check_in']++;
            }

            if ($r->thoi_gian_check_out) {
                $time = Carbon::parse($r->thoi_gian_check_out)->setTimezone('+07:00');
                $key = $this->format15mBucket($time);
                if (! isset($buckets[$key])) {
                    $buckets[$key] = ['khung_gio' => $key, 'so_luot_check_in' => 0, 'so_luot_check_out' => 0, 'sort' => $time->timestamp];
                }
                $buckets[$key]['so_luot_check_out']++;
            }
        }

        // Sort by timestamp
        uasort($buckets, fn ($a, $b) => $a['sort'] <=> $b['sort']);

        return array_values(array_map(function ($item) {
            return [
                'khung_gio' => $item['khung_gio'],
                'so_luot_check_in' => $item['so_luot_check_in'],
                'so_luot_check_out' => $item['so_luot_check_out'],
            ];
        }, $buckets));
    }

    /**
     * Format a timestamp into "HH:MM - HH:MM" 15-minute slot.
     */
    protected function format15mBucket(Carbon $time): string
    {
        $minute = $time->minute;
        $bucketStartMin = (int) (floor($minute / 15) * 15);
        $start = $time->copy()->setMinute($bucketStartMin)->setSecond(0);
        $end = $start->copy()->addMinutes(15);

        return $start->format('H:i').' - '.$end->format('H:i');
    }

    /**
     * Kiểm tra quyền Host A, Co-host đã đồng ý, hoặc Admin.
     */
    protected function authorizeOrganizerOrAdmin(User $user, SuKien $event): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isToChuc()) {
            $userUnitId = (int) $user->ma_don_vi_to_chuc;
            $hostUnitId = (int) $event->ma_don_vi_to_chuc;

            // Host A
            if ($userUnitId > 0 && $userUnitId === $hostUnitId) {
                return;
            }

            // Confirmed Co-host
            $isConfirmedCohost = SuKienDongToChuc::where('ma_su_kien', $event->ma_su_kien)
                ->where('ma_don_vi_to_chuc', $userUnitId)
                ->where('trang_thai_xac_nhan', 'DONG_Y')
                ->exists();

            if ($isConfirmedCohost) {
                return;
            }
        }

        throw new BusinessException(
            'FORBIDDEN',
            'Bạn không có quyền xem dữ liệu phân tích của sự kiện này.',
            null,
            403
        );
    }
}
