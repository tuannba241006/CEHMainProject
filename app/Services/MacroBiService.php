<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class MacroBiService
{
    /**
     * Build the university dashboard from the daily summary table and analytics view.
     *
     * @return array<string, mixed>
     */
    public function getMacroDashboard(?string $fromDate = null, ?string $toDate = null): array
    {
        $endDate = $toDate !== null ? Carbon::parse($toDate)->toDateString() : Carbon::yesterday()->toDateString();
        $startDate = $fromDate !== null
            ? Carbon::parse($fromDate)->toDateString()
            : Carbon::parse($endDate)->subDays(89)->toDateString();

        $eventStats = DB::table('thong_ke_su_kien_ngay')
            ->whereBetween('ngay_thong_ke', [$startDate, $endDate])
            ->select('ma_su_kien')
            ->selectRaw('SUM(tong_ve_dang_ky) AS tong_ve_dang_ky')
            ->selectRaw('SUM(tong_luot_tham_du) AS tong_luot_tham_du')
            ->selectRaw('SUM(tong_luot_no_show) AS tong_luot_no_show')
            ->groupBy('ma_su_kien');

        $summary = DB::query()
            ->fromSub(clone $eventStats, 'daily')
            ->join('v_event_analytics as analytics', 'analytics.ma_su_kien', '=', 'daily.ma_su_kien')
            ->selectRaw('COUNT(*) AS tong_so_su_kien')
            ->selectRaw('COALESCE(SUM(daily.tong_luot_tham_du), 0) AS tong_luot_sinh_vien_tham_gia')
            ->selectRaw('COALESCE(SUM(daily.tong_ve_dang_ky), 0) AS tong_ve_dang_ky')
            ->selectRaw('COALESCE(SUM(CASE WHEN analytics.khong_gioi_han_slot = 0 THEN daily.tong_ve_dang_ky ELSE 0 END), 0) AS tong_ve_gioi_han')
            ->selectRaw('COALESCE(SUM(CASE WHEN analytics.khong_gioi_han_slot = 0 THEN daily.tong_luot_no_show ELSE 0 END), 0) AS tong_no_show_gioi_han')
            ->first();

        $totalCheckIns = (int) $summary->tong_luot_sinh_vien_tham_gia;
        $totalTickets = (int) $summary->tong_ve_dang_ky;
        $limitedTickets = (int) $summary->tong_ve_gioi_han;
        $limitedNoShows = (int) $summary->tong_no_show_gioi_han;
        $eventIds = (clone $eventStats)->select('ma_su_kien');

        return [
            'tu_ngay' => $startDate,
            'den_ngay' => $endDate,
            'tong_so_su_kien' => (int) $summary->tong_so_su_kien,
            'tong_luot_sinh_vien_tham_gia' => $totalCheckIns,
            'ty_le_show_up_toan_truong_pct' => $totalTickets > 0 ? round($totalCheckIns * 100 / $totalTickets, 2) : 0.0,
            'ty_le_no_show_toan_truong_pct' => $limitedTickets > 0 ? round($limitedNoShows * 100 / $limitedTickets, 2) : 0.0,
            'toc_do_chay_ve_phut_tb' => $this->averageSelloutMinutes($eventIds),
            'su_kien_theo_chuyen_de' => $this->eventsByTopic($eventStats),
            'su_kien_theo_cap_don_vi' => $this->eventsByOrganizationLevel($eventIds),
            'cong_suat_su_dung_phong' => $this->roomUtilization($eventIds),
            'top_don_vi_hoat_dong_tich_cuc' => $this->topOrganizations($eventIds),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{items: array<int, object>, current_page: int, last_page: int, per_page: int, total: int}
     */
    public function getNoShowViolations(array $filters): array
    {
        $query = DB::table('dang_ky as registration')
            ->join('tai_khoan as student', 'student.ma_tai_khoan', '=', 'registration.ma_tai_khoan')
            ->leftJoin('don_vi_to_chuc as faculty', 'faculty.ma_don_vi_to_chuc', '=', 'student.ma_khoa')
            ->join('su_kien as event', 'event.ma_su_kien', '=', 'registration.ma_su_kien')
            ->where('registration.vi_pham_no_show', 1)
            ->where('student.loai_tai_khoan', 'SinhVien')
            ->when(isset($filters['tu_ngay']), fn (Builder $q) => $q->whereDate('event.thoi_gian_bat_dau', '>=', $filters['tu_ngay']))
            ->when(isset($filters['den_ngay']), fn (Builder $q) => $q->whereDate('event.thoi_gian_bat_dau', '<=', $filters['den_ngay']))
            ->when(isset($filters['ma_khoa']), fn (Builder $q) => $q->where('student.ma_khoa', $filters['ma_khoa']))
            ->when(isset($filters['q']), function (Builder $q) use ($filters): void {
                $term = '%'.$filters['q'].'%';
                $q->where(function (Builder $search) use ($term): void {
                    $search->where('student.mssv', 'like', $term)
                        ->orWhere('student.ho_ten', 'like', $term);
                });
            })
            ->select([
                'student.ma_tai_khoan',
                'student.mssv',
                'student.ho_ten',
                'student.ma_khoa',
                'student.khoa as ten_khoa',
                'faculty.ten_don_vi as ten_khoa_chuan',
            ])
            ->selectRaw('COUNT(registration.ma_dang_ky) AS so_lan_vi_pham')
            ->groupBy(
                'student.ma_tai_khoan',
                'student.mssv',
                'student.ho_ten',
                'student.ma_khoa',
                'student.khoa',
                'faculty.ten_don_vi'
            )
            ->havingRaw('COUNT(registration.ma_dang_ky) >= ?', [(int) ($filters['so_lan_toi_thieu'] ?? 3)])
            ->orderByDesc('so_lan_vi_pham')
            ->orderBy('student.mssv');

        $page = $query->paginate(
            (int) ($filters['limit'] ?? 20),
            ['*'],
            'page',
            (int) ($filters['page'] ?? 1)
        );

        $items = collect($page->items())->map(function (object $record): object {
            $record->khoa = $record->ten_khoa_chuan ?: ($record->ten_khoa ?: 'Chưa xác định');

            return $record;
        })->all();

        return [
            'items' => $items,
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
        ];
    }

    private function averageSelloutMinutes(Builder $eventIds): ?float
    {
        $average = DB::table('v_event_analytics')
            ->whereIn('v_event_analytics.ma_su_kien', clone $eventIds)
            ->whereNotNull('so_phut_chay_ve')
            ->avg('so_phut_chay_ve');

        return $average !== null ? round((float) $average, 2) : null;
    }

    /** @return array<int, array{ten_chuyen_de: string, so_su_kien: int, tong_luot_tham_du: int}> */
    private function eventsByTopic(Builder $eventStats): array
    {
        return DB::query()
            ->fromSub(clone $eventStats, 'daily')
            ->join('v_event_analytics as analytics', 'analytics.ma_su_kien', '=', 'daily.ma_su_kien')
            ->select('analytics.ten_chuyen_de')
            ->selectRaw('COUNT(DISTINCT analytics.ma_su_kien) AS so_su_kien')
            ->selectRaw('SUM(daily.tong_luot_tham_du) AS tong_luot_tham_du')
            ->groupBy('analytics.ten_chuyen_de')
            ->orderBy('analytics.ten_chuyen_de')
            ->get()
            ->map(fn (object $row): array => [
                'ten_chuyen_de' => (string) $row->ten_chuyen_de,
                'so_su_kien' => (int) $row->so_su_kien,
                'tong_luot_tham_du' => (int) $row->tong_luot_tham_du,
            ])->all();
    }

    /** @return array<int, array{loai_don_vi: string, so_su_kien: int}> */
    private function eventsByOrganizationLevel(Builder $eventIds): array
    {
        return DB::table('v_event_analytics as analytics')
            ->join('su_kien as event', 'event.ma_su_kien', '=', 'analytics.ma_su_kien')
            ->join('don_vi_to_chuc as organization', 'organization.ma_don_vi_to_chuc', '=', 'event.ma_don_vi_to_chuc')
            ->whereIn('analytics.ma_su_kien', clone $eventIds)
            ->select('organization.loai_don_vi')
            ->selectRaw('COUNT(DISTINCT analytics.ma_su_kien) AS so_su_kien')
            ->groupBy('organization.loai_don_vi')
            ->orderBy('organization.loai_don_vi')
            ->get()
            ->map(fn (object $row): array => [
                'loai_don_vi' => (string) $row->loai_don_vi,
                'so_su_kien' => (int) $row->so_su_kien,
            ])->all();
    }

    /** @return array<int, array{ma_phong: int, ten_phong: string, so_su_kien_to_chuc: int, ty_le_lap_day_tb_pct: float}> */
    private function roomUtilization(Builder $eventIds): array
    {
        return DB::table('v_event_analytics')
            ->join('su_kien as event', 'event.ma_su_kien', '=', 'v_event_analytics.ma_su_kien')
            ->whereIn('v_event_analytics.ma_su_kien', clone $eventIds)
            ->select('event.ma_phong', 'v_event_analytics.ten_phong')
            ->selectRaw('COUNT(DISTINCT v_event_analytics.ma_su_kien) AS so_su_kien_to_chuc')
            ->selectRaw('AVG(v_event_analytics.ti_le_lap_day_pct) AS ty_le_lap_day_tb_pct')
            ->groupBy('event.ma_phong', 'v_event_analytics.ten_phong')
            ->orderBy('event.ma_phong')
            ->get()
            ->map(fn (object $row): array => [
                'ma_phong' => (int) $row->ma_phong,
                'ten_phong' => (string) $row->ten_phong,
                'so_su_kien_to_chuc' => (int) $row->so_su_kien_to_chuc,
                'ty_le_lap_day_tb_pct' => (float) ($row->ty_le_lap_day_tb_pct ?? 0),
            ])->all();
    }

    /** @return array<int, array{ma_don_vi_to_chuc: int, ten_don_vi: string, so_su_kien: int, diem_hai_long_tb: ?float}> */
    private function topOrganizations(Builder $eventIds): array
    {
        return DB::table('v_event_analytics as analytics')
            ->join('su_kien as event', 'event.ma_su_kien', '=', 'analytics.ma_su_kien')
            ->join('don_vi_to_chuc as organization', 'organization.ma_don_vi_to_chuc', '=', 'event.ma_don_vi_to_chuc')
            ->whereIn('analytics.ma_su_kien', clone $eventIds)
            ->select('organization.ma_don_vi_to_chuc', 'organization.ten_don_vi')
            ->selectRaw('COUNT(DISTINCT analytics.ma_su_kien) AS so_su_kien')
            ->selectRaw('AVG((analytics.diem_noi_dung_tb + analytics.diem_dien_gia_tb + analytics.diem_to_chuc_tb) / 3) AS diem_hai_long_tb')
            ->groupBy('organization.ma_don_vi_to_chuc', 'organization.ten_don_vi')
            ->orderByDesc('so_su_kien')
            ->limit(10)
            ->get()
            ->map(fn (object $row): array => [
                'ma_don_vi_to_chuc' => (int) $row->ma_don_vi_to_chuc,
                'ten_don_vi' => (string) $row->ten_don_vi,
                'so_su_kien' => (int) $row->so_su_kien,
                'diem_hai_long_tb' => $row->diem_hai_long_tb !== null ? round((float) $row->diem_hai_long_tb, 2) : null,
            ])->all();
    }
}
