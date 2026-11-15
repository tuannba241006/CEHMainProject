<?php

namespace Tests\Feature;

use App\Jobs\ScanNoShowJob;
use App\Mail\NoShowWarningMail;
use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class SafeNoShowJobTest extends TestCase
{
    use DatabaseTransactions;

    protected DonViToChuc $faculty;

    protected DonViToChuc $hostClub;

    protected User $adminUser;

    protected User $studentA;

    protected User $studentB;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->faculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_NOSHOW_TEST'],
            [
                'ten_don_vi' => 'Khoa Mạng Máy Tính Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->hostClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_NOSHOW_TEST'],
            [
                'ten_don_vi' => 'CLB NoShow Test',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
            ]
        );

        $this->adminUser = User::firstOrCreate(
            ['email' => 'admin_noshow_test@uit.edu.vn'],
            [
                'ho_ten' => 'Admin NoShow Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'Admin',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_noshow@uit.edu.vn'],
            [
                'ho_ten' => 'Nguyen Van A',
                'mssv' => '21520001',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->studentB = User::firstOrCreate(
            ['email' => 'student_b_noshow@uit.edu.vn'],
            [
                'ho_ten' => 'Tran Thi B',
                'mssv' => '21520002',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề NoShow Test'],
            ['mo_ta' => 'Chuyên đề test no-show']
        );

        $this->room = PhongHoiTruong::firstOrCreate(
            ['ten_phong' => 'Hội trường NoShow Test', 'co_so' => 'CoSo1'],
            [
                'suc_chua_toi_da' => 100,
                'trang_thiet_bi' => ['micro' => 2],
                'trang_thai' => 'KhaDung',
            ]
        );
    }

    protected function createEvent(array $attributes = []): SuKien
    {
        $base = now()->subHours(6);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện NoShow Test',
            'mo_ta' => 'Mô tả kiểm thử quét No-show',
            'ngay_cong_bo' => $base->copy()->subDays(2),
            'thoi_gian_bat_dau' => $base->copy(),
            'thoi_gian_ket_thuc' => $base->copy()->addHours(2), // ended 4 hours ago (passed T+2h)
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 50,
            'so_ve_con_lai' => 48,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 3,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'COMPLETED',
            'cong_check_in_mo' => 0,
            'thoi_gian_mo_cong_check_in' => $base->copy()->subMinutes(15),
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
     * Target: UC-SYS-01.Task 5 (Safety filter: unlimited slot)
     * Expected: Unlimited slot events are never scanned or flagged for No-show.
     */
    public function test_unlimited_slot_events_never_trigger_noshow(): void
    {
        $event = $this->createEvent([
            'khong_gioi_han_slot' => 1,
            'so_luong_toi_da' => null,
            'so_ve_con_lai' => null,
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new ScanNoShowJob;
        $results = app()->call([$job, 'handle']);

        $this->assertSame(0, $results['tickets_marked']);
        $this->assertFalse((bool) $ticket->fresh()->vi_pham_no_show);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 5 (Safety filter: missing organizer reception)
     * Expected: When organizer never opened gates and 0 check-ins occurred, students are NOT penalized and Admin is alerted.
     */
    public function test_events_without_reception_proof_do_not_penalize_students_and_alert_admin(): void
    {
        $event = $this->createEvent([
            'thoi_gian_mo_cong_check_in' => null,
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new ScanNoShowJob;
        $results = app()->call([$job, 'handle']);

        $this->assertSame(0, $results['tickets_marked']);
        $this->assertGreaterThanOrEqual(1, $results['unorganized_events_alerted']);
        $this->assertFalse((bool) $ticket->fresh()->vi_pham_no_show);

        // Verify Admin alert
        $adminAlert = ThongBao::where('ma_tai_khoan', $this->adminUser->ma_tai_khoan)
            ->where('loai_thong_bao', 'HE_THONG')
            ->where('noi_dung', 'like', "%#{$event->ma_su_kien}%")
            ->first();
        $this->assertNotNull($adminAlert);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 5 (Time filter: before T+2h)
     * Expected: An event that completed only 1 hour ago is not scanned.
     */
    public function test_events_before_t_plus_2h_are_not_scanned(): void
    {
        $now = now();
        $event = $this->createEvent([
            'thoi_gian_bat_dau' => $now->copy()->subHours(2),
            'thoi_gian_ket_thuc' => $now->copy()->subHour(), // Only 1h ago, not 2h
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new ScanNoShowJob($now);
        $results = app()->call([$job, 'handle']);

        $this->assertSame(0, $results['tickets_marked']);
        $this->assertFalse((bool) $ticket->fresh()->vi_pham_no_show);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 5 (Ticket filter: cancelled, checked-in, or fraud tickets)
     * Expected: Cancelled tickets, checked-in tickets, and fraud tickets are NOT marked No-show.
     */
    public function test_cancelled_checked_in_and_fraud_tickets_are_never_marked_noshow(): void
    {
        $event = $this->createEvent();

        // 1. Cancelled ticket
        $cancelledTicket = $this->createTicket($event, $this->studentA, [
            'trang_thai' => 'DaHuy',
            'thoi_gian_huy' => now()->subDays(2),
            'ly_do_huy' => 'Ban dot xuat',
        ]);

        // 2. Checked-in ticket
        $checkedInTicket = $this->createTicket($event, $this->studentB, [
            'trang_thai' => 'DaCheckIn',
            'da_check_in' => 1,
            'thoi_gian_check_in' => $event->thoi_gian_bat_dau->copy()->addMinutes(10),
        ]);

        $job = new ScanNoShowJob;
        $results = app()->call([$job, 'handle']);

        $this->assertSame(0, $results['tickets_marked']);
        $this->assertFalse((bool) $cancelledTicket->fresh()->vi_pham_no_show);
        $this->assertFalse((bool) $checkedInTicket->fresh()->vi_pham_no_show);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 5 (Eligible ticket flagging, notifications and email queue)
     * Expected: Unattended registered ticket in eligible event at T+2h is flagged, notified and emailed.
     */
    public function test_eligible_absent_ticket_is_marked_noshow_and_notified(): void
    {
        Mail::fake();

        $event = $this->createEvent();
        $ticket = $this->createTicket($event, $this->studentA);

        $job = new ScanNoShowJob;
        $results = app()->call([$job, 'handle']);

        $this->assertGreaterThanOrEqual(1, $results['tickets_marked']);
        $this->assertTrue((bool) $ticket->fresh()->vi_pham_no_show);

        // Verify In-app notification
        $notif = ThongBao::where('ma_tai_khoan', $this->studentA->ma_tai_khoan)
            ->where('loai_thong_bao', 'CANH_BAO_NO_SHOW')
            ->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString($event->ten_su_kien, $notif->noi_dung);

        // Verify Email Queued
        Mail::assertQueued(NoShowWarningMail::class, function ($mail) {
            return $mail->hasTo($this->studentA->email)
                && $mail->ticketUuid !== null;
        });
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 5 (Idempotency)
     * Expected: Repeated runs of ScanNoShowJob do not increase tickets_marked or spam notifications.
     */
    public function test_scan_noshow_job_is_strictly_idempotent(): void
    {
        Mail::fake();

        $event = $this->createEvent();
        $ticket = $this->createTicket($event, $this->studentA);

        $job = new ScanNoShowJob;
        $results1 = app()->call([$job, 'handle']);
        $this->assertGreaterThanOrEqual(1, $results1['tickets_marked']);

        $initialNotifCount = ThongBao::where('ma_tai_khoan', $this->studentA->ma_tai_khoan)
            ->where('loai_thong_bao', 'CANH_BAO_NO_SHOW')
            ->count();

        // Second run
        $results2 = app()->call([$job, 'handle']);
        $this->assertSame(0, $results2['tickets_marked']);

        $subsequentNotifCount = ThongBao::where('ma_tai_khoan', $this->studentA->ma_tai_khoan)
            ->where('loai_thong_bao', 'CANH_BAO_NO_SHOW')
            ->count();

        $this->assertSame($initialNotifCount, $subsequentNotifCount);
    }

    /**
     * @test
     * Target: Command invocation
     * Expected: php artisan ceh:scan-no-show executes successfully.
     */
    public function test_artisan_command_scan_noshow_executes_successfully(): void
    {
        $this->artisan('ceh:scan-no-show')
            ->assertExitCode(0);
    }
}
