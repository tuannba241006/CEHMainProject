<?php

namespace Tests\Feature;

use App\Jobs\AggregateDailyStatisticsJob;
use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DanhGiaFeedback;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongKeSuKienNgay;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class DailyStatisticsAggregationTest extends TestCase
{
    use DatabaseTransactions;

    protected DonViToChuc $faculty;

    protected DonViToChuc $hostClub;

    protected User $studentA;

    protected User $studentB;

    protected User $studentC;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->faculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_STATS_TEST'],
            [
                'ten_don_vi' => 'Khoa Thống Kê Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->hostClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_STATS_TEST'],
            [
                'ten_don_vi' => 'CLB Thống Kê Test',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
            ]
        );

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_stats@uit.edu.vn'],
            [
                'ho_ten' => 'Nguyen Van Stats A',
                'mssv' => '21520101',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->studentB = User::firstOrCreate(
            ['email' => 'student_b_stats@uit.edu.vn'],
            [
                'ho_ten' => 'Tran Thi Stats B',
                'mssv' => '21520102',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->studentC = User::firstOrCreate(
            ['email' => 'student_c_stats@uit.edu.vn'],
            [
                'ho_ten' => 'Le Van Stats C',
                'mssv' => '21520103',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Stats Test'],
            ['mo_ta' => 'Chuyên đề test thống kê']
        );

        $this->room = PhongHoiTruong::firstOrCreate(
            ['ten_phong' => 'Hội trường Stats Test', 'co_so' => 'CoSo1'],
            [
                'suc_chua_toi_da' => 200,
                'trang_thiet_bi' => ['micro' => 2],
                'trang_thai' => 'KhaDung',
            ]
        );
    }

    protected function createEvent(array $attributes = []): SuKien
    {
        $yesterday = now()->subDay()->setTime(9, 0, 0);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện Thống Kê Test',
            'mo_ta' => 'Mô tả test thống kê hàng ngày',
            'ngay_cong_bo' => $yesterday->copy()->subDays(3),
            'thoi_gian_bat_dau' => $yesterday->copy(),
            'thoi_gian_ket_thuc' => $yesterday->copy()->addHours(3),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 97,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 4,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'COMPLETED',
            'cong_check_in_mo' => 0,
            'thoi_gian_mo_cong_check_in' => $yesterday->copy()->subMinutes(15),
            'cong_check_out_mo' => 0,
        ], $attributes));
    }

    protected function createTicket(SuKien $event, User $user, array $attributes = []): DangKy
    {
        return DangKy::create(array_merge([
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_ve_uuid' => (string) Str::uuid(),
            'chu_ky_hmac' => hash('sha256', 'ticket-signature'),
            'trang_thai' => 'DaDangKy',
            'thoi_gian_dang_ky' => $event->thoi_gian_bat_dau->copy()->subDay(),
            'da_check_in' => 0,
            'da_check_out' => 0,
            'nghi_van_gian_lan' => 0,
            'vi_pham_no_show' => 0,
            'da_gui_nhac_nho' => 0,
        ], $attributes));
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 6
     * Course: Metrics calculation accuracy
     * Expected: Computes accurate registration, attendance, checkout, noshow, and feedback ratings.
     */
    public function test_daily_aggregation_computes_exact_metrics(): void
    {
        $yesterday = now()->subDay()->setTime(9, 0, 0);
        $soldOutTime = $yesterday->copy()->subDays(2)->setTime(15, 0, 0);

        $event = $this->createEvent([
            'so_luong_toi_da' => 100,
            'thoi_diem_het_ve' => $soldOutTime,
        ]);

        // Student A: Checked in, checked out, gave feedback (5, 5, 5 => avg 5.0)
        $ticketA = $this->createTicket($event, $this->studentA, [
            'trang_thai' => 'DaCheckOut',
            'da_check_in' => 1,
            'da_check_out' => 1,
            'thoi_gian_check_in' => $event->thoi_gian_bat_dau->copy()->addMinutes(10),
            'thoi_gian_check_out' => $event->thoi_gian_ket_thuc->copy()->subMinutes(5),
            'da_feedback' => 1,
        ]);
        DanhGiaFeedback::create([
            'ma_dang_ky' => $ticketA->ma_dang_ky,
            'ma_su_kien' => $event->ma_su_kien,
            'diem_noi_dung' => 5,
            'diem_dien_gia' => 5,
            'diem_to_chuc' => 5,
            'y_kien_dong_gop' => 'Sự kiện rất tuyệt vời',
            'thoi_gian_gui' => now(),
        ]);

        // Student B: Checked in, checked out, gave feedback (4, 4, 4 => avg 4.0)
        $ticketB = $this->createTicket($event, $this->studentB, [
            'trang_thai' => 'DaCheckOut',
            'da_check_in' => 1,
            'da_check_out' => 1,
            'thoi_gian_check_in' => $event->thoi_gian_bat_dau->copy()->addMinutes(15),
            'thoi_gian_check_out' => $event->thoi_gian_ket_thuc->copy()->subMinutes(5),
            'da_feedback' => 1,
        ]);
        DanhGiaFeedback::create([
            'ma_dang_ky' => $ticketB->ma_dang_ky,
            'ma_su_kien' => $event->ma_su_kien,
            'diem_noi_dung' => 4,
            'diem_dien_gia' => 4,
            'diem_to_chuc' => 4,
            'y_kien_dong_gop' => 'Nội dung bổ ích',
            'thoi_gian_gui' => now(),
        ]);

        // Student C: Absent (No-show)
        $this->createTicket($event, $this->studentC, [
            'trang_thai' => 'DaDangKy',
            'da_check_in' => 0,
            'da_check_out' => 0,
            'vi_pham_no_show' => 1,
        ]);

        $job = new AggregateDailyStatisticsJob($yesterday->toDateString(), 1);
        $summary = $job->handle();

        $this->assertGreaterThanOrEqual(1, $summary['total_records_upserted']);

        $record = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->first();

        $this->assertNotNull($record);
        $this->assertSame(100, $record->tong_ve_phat_hanh);
        $this->assertSame(3, $record->tong_ve_dang_ky);
        $this->assertSame(2, $record->tong_luot_tham_du);
        $this->assertSame(2, $record->tong_luot_check_out);
        $this->assertSame(1, $record->tong_luot_no_show);

        // Feedback average: (5 + 4) / 2 = 4.50
        $this->assertEquals(4.50, (float) $record->diem_hai_long_trung_binh);

        // Minutes to sell out: diff from ngay_cong_bo to thoi_diem_het_ve
        $expectedMinutes = (int) $event->ngay_cong_bo->diffInMinutes($soldOutTime, false);
        $this->assertSame($expectedMinutes, $record->so_phut_chay_ve);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 6
     * Course: Unlimited slot event handling
     * Expected: Unlimited slot events have tong_ve_phat_hanh = null.
     */
    public function test_unlimited_slot_event_stores_null_for_tong_ve_phat_hanh(): void
    {
        $yesterday = now()->subDay()->setTime(10, 0, 0);

        $event = $this->createEvent([
            'khong_gioi_han_slot' => 1,
            'so_luong_toi_da' => null,
            'so_ve_con_lai' => null,
        ]);

        $this->createTicket($event, $this->studentA);

        $job = new AggregateDailyStatisticsJob($yesterday->toDateString(), 1);
        $job->handle();

        $record = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->first();

        $this->assertNotNull($record);
        $this->assertNull($record->tong_ve_phat_hanh);
        $this->assertSame(1, $record->tong_ve_dang_ky);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 6
     * Course: Cancelled ticket exclusion
     * Expected: Cancelled tickets (DaHuy) are excluded from tong_ve_dang_ky.
     */
    public function test_cancelled_tickets_are_excluded_from_total_registered(): void
    {
        $yesterday = now()->subDay()->setTime(9, 0, 0);
        $event = $this->createEvent();

        // 1 active ticket
        $this->createTicket($event, $this->studentA);

        // 1 cancelled ticket
        $this->createTicket($event, $this->studentB, [
            'trang_thai' => 'DaHuy',
            'thoi_gian_huy' => now()->subDay(),
        ]);

        $job = new AggregateDailyStatisticsJob($yesterday->toDateString(), 1);
        $job->handle();

        $record = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->first();

        $this->assertNotNull($record);
        $this->assertSame(1, $record->tong_ve_dang_ky);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 6
     * Course: Idempotent upsert
     * Expected: Running aggregation multiple times does not produce duplicate rows for the same event and date.
     */
    public function test_daily_aggregation_upsert_is_strictly_idempotent(): void
    {
        $yesterday = now()->subDay()->setTime(9, 0, 0);
        $event = $this->createEvent();
        $this->createTicket($event, $this->studentA);

        $job = new AggregateDailyStatisticsJob($yesterday->toDateString(), 1);

        // Run 1
        $job->handle();
        $count1 = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->count();
        $this->assertSame(1, $count1);

        // Run 2
        $job->handle();
        $count2 = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->count();
        $this->assertSame(1, $count2);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 6 (Late No-show reconciliation)
     * Expected: When No-show arrives after initial aggregation, re-aggregating/reconciling updates tong_luot_no_show accurately.
     */
    public function test_reconciliation_updates_late_arriving_noshow_counts(): void
    {
        $yesterday = now()->subDay()->setTime(23, 30, 0);
        $event = $this->createEvent([
            'thoi_gian_bat_dau' => $yesterday->copy(),
            'thoi_gian_ket_thuc' => $yesterday->copy()->addHours(2), // ends next day 01:30
        ]);

        $ticket = $this->createTicket($event, $this->studentA, [
            'vi_pham_no_show' => 0,
        ]);

        $job = new AggregateDailyStatisticsJob($yesterday->toDateString(), 1);

        // 1st run at 01:00 (before no-show was processed)
        $job->handle();
        $recordBefore = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->first();
        $this->assertSame(0, $recordBefore->tong_luot_no_show);

        // No-show scanner runs later at 01:30 and flags the ticket
        $ticket->update(['vi_pham_no_show' => 1]);

        // Reconcile/backfill run
        $job->handle();
        $recordAfter = ThongKeSuKienNgay::where('ngay_thong_ke', $yesterday->toDateString())
            ->where('ma_su_kien', $event->ma_su_kien)
            ->first();
        $this->assertSame(1, $recordAfter->tong_luot_no_show);
    }

    /**
     * @test
     * Target: Command invocation
     * Expected: php artisan ceh:aggregate-daily-stats executes successfully.
     */
    public function test_artisan_command_aggregate_daily_stats_executes_successfully(): void
    {
        $this->artisan('ceh:aggregate-daily-stats', ['--days' => 1])
            ->assertExitCode(0);
    }
}
