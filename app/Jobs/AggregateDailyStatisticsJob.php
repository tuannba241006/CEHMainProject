<?php

namespace App\Jobs;

use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\ThongKeSuKienNgay;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AggregateDailyStatisticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ?string $targetDate = null,
        public int $reconcileDays = 1
    ) {}

    /**
     * Execute the job.
     *
     * @return array{aggregated_dates: array<string, int>, total_records_upserted: int}
     */
    public function handle(): array
    {
        $baseDate = $this->targetDate !== null
            ? Carbon::parse($this->targetDate)->startOfDay()
            : now()->subDay()->startOfDay();

        $datesToProcess = [];
        for ($i = 0; $i < max(1, $this->reconcileDays); $i++) {
            $datesToProcess[] = $baseDate->copy()->subDays($i);
        }

        $summary = [
            'aggregated_dates' => [],
            'total_records_upserted' => 0,
        ];

        foreach ($datesToProcess as $date) {
            $dateString = $date->toDateString();
            $upsertedCount = $this->aggregateForDate($date);

            $summary['aggregated_dates'][$dateString] = $upsertedCount;
            $summary['total_records_upserted'] += $upsertedCount;
        }

        Log::info('Daily statistics aggregation completed', $summary);

        return $summary;
    }

    /**
     * Aggregate statistics for a specific target date.
     */
    protected function aggregateForDate(Carbon $date): int
    {
        $dateString = $date->toDateString();

        // 1. Identify all events that took place or completed on the target date
        $events = SuKien::query()
            ->where(function ($query) use ($dateString) {
                $query->whereDate('thoi_gian_bat_dau', $dateString)
                    ->orWhereDate('thoi_gian_ket_thuc', $dateString)
                    ->orWhere(function ($completed) use ($dateString) {
                        $completed->where('trang_thai', 'COMPLETED')
                            ->whereDate('thoi_gian_cap_nhat', $dateString);
                    });
            })
            ->orderBy('ma_su_kien')
            ->get();

        $upserted = 0;

        foreach ($events as $event) {
            // Metric: tong_ve_phat_hanh (null if unlimited)
            $tongVePhatHanh = $event->khong_gioi_han_slot ? null : $event->so_luong_toi_da;

            // Metric: tong_ve_dang_ky (valid non-cancelled tickets)
            $tongVeDangKy = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('trang_thai', '!=', 'DaHuy')
                ->count();

            // Metric: tong_luot_tham_du (checked in)
            $tongLuotThamDu = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('da_check_in', true)
                ->count();

            // Metric: tong_luot_check_out (checked out)
            $tongLuotCheckOut = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('da_check_out', true)
                ->count();

            // Metric: tong_luot_no_show (flagged as no-show)
            $tongLuotNoShow = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('vi_pham_no_show', true)
                ->count();

            // Metric: so_phut_chay_ve (minutes from announcement to sold out)
            $soPhutChayVe = null;
            if ($event->thoi_diem_het_ve !== null && $event->ngay_cong_bo !== null) {
                $minutes = (int) $event->ngay_cong_bo->diffInMinutes($event->thoi_diem_het_ve, false);
                $soPhutChayVe = max(0, $minutes);
            }

            // Metric: diem_hai_long_trung_binh (average feedback satisfaction score)
            $avgFeedback = DB::table('danh_gia_feedback')
                ->where('ma_su_kien', $event->ma_su_kien)
                ->selectRaw('ROUND(AVG((diem_noi_dung + diem_dien_gia + diem_to_chuc) / 3.0), 2) as avg_score')
                ->value('avg_score');

            $diemHaiLong = $avgFeedback !== null ? (float) $avgFeedback : null;

            // Idempotent Upsert into thong_ke_su_kien_ngay
            ThongKeSuKienNgay::updateOrCreate(
                [
                    'ngay_thong_ke' => $dateString,
                    'ma_su_kien' => $event->ma_su_kien,
                ],
                [
                    'tong_ve_phat_hanh' => $tongVePhatHanh,
                    'tong_ve_dang_ky' => $tongVeDangKy,
                    'tong_luot_tham_du' => $tongLuotThamDu,
                    'tong_luot_check_out' => $tongLuotCheckOut,
                    'tong_luot_no_show' => $tongLuotNoShow,
                    'so_phut_chay_ve' => $soPhutChayVe,
                    'diem_hai_long_trung_binh' => $diemHaiLong,
                    'thoi_gian_cap_nhat' => now(),
                ]
            );

            $upserted++;
        }

        return $upserted;
    }
}
