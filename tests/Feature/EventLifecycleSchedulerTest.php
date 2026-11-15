<?php

namespace Tests\Feature;

use App\Jobs\TransitionEventLifecycleJob;
use App\Models\ChuyenDe;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\NhatKyKiemDuyet;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EventLifecycleSchedulerTest extends TestCase
{
    use DatabaseTransactions;

    protected DonViToChuc $faculty;

    protected DonViToChuc $hostClub;

    protected User $hostUser;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->faculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_SYS_TEST'],
            [
                'ten_don_vi' => 'Khoa Khoa Học Máy Tính Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->hostClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_SYS_TEST'],
            [
                'ten_don_vi' => 'CLB Hệ Thống Test',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
            ]
        );

        $this->hostUser = User::firstOrCreate(
            ['email' => 'host_sys_test@uit.edu.vn'],
            [
                'ho_ten' => 'Host Sys Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Lifecycle Test'],
            ['mo_ta' => 'Chuyên đề test lifecycle']
        );

        $this->room = PhongHoiTruong::firstOrCreate(
            ['ten_phong' => 'Hội trường Lifecycle Test', 'co_so' => 'CoSo1'],
            [
                'suc_chua_toi_da' => 150,
                'trang_thiet_bi' => ['micro' => 2],
                'trang_thai' => 'KhaDung',
            ]
        );
    }

    protected function createEvent(array $attributes = []): SuKien
    {
        $base = now()->addDays(3);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện Test Lifecycle',
            'mo_ta' => 'Mô tả chi tiết sự kiện lifecycle',
            'ngay_cong_bo' => $base->copy()->subDays(2),
            'thoi_gian_bat_dau' => $base->copy(),
            'thoi_gian_ket_thuc' => $base->copy()->addHours(2),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 50,
            'so_ve_con_lai' => 50,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 3,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'APPROVED',
            'cong_check_in_mo' => 0,
            'cong_check_out_mo' => 0,
        ], $attributes));
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: APPROVED -> PUBLISHED
     * Expected: When NOW >= ngay_cong_bo and NOW < thoi_gian_bat_dau, event becomes PUBLISHED.
     */
    public function test_approved_transitions_to_published_at_announcement_date(): void
    {
        $now = now();

        $event = $this->createEvent([
            'trang_thai' => 'APPROVED',
            'ngay_cong_bo' => $now->copy()->subMinute(),
            'thoi_gian_bat_dau' => $now->copy()->addHours(2),
            'thoi_gian_ket_thuc' => $now->copy()->addHours(4),
        ]);

        $job = new TransitionEventLifecycleJob($now);
        $stats = app()->call([$job, 'handle']);

        $this->assertGreaterThanOrEqual(1, $stats['published']);
        $this->assertSame('PUBLISHED', $event->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: PUBLISHED -> HAPPENING
     * Expected: When NOW >= thoi_gian_bat_dau and NOW < thoi_gian_ket_thuc + 15m, event becomes HAPPENING.
     */
    public function test_published_transitions_to_happening_at_start_time(): void
    {
        $now = now();

        $event = $this->createEvent([
            'trang_thai' => 'PUBLISHED',
            'ngay_cong_bo' => $now->copy()->subHours(5),
            'thoi_gian_bat_dau' => $now->copy()->subMinute(),
            'thoi_gian_ket_thuc' => $now->copy()->addHour(),
        ]);

        $job = new TransitionEventLifecycleJob($now);
        $stats = app()->call([$job, 'handle']);

        $this->assertGreaterThanOrEqual(1, $stats['happening']);
        $this->assertSame('HAPPENING', $event->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: HAPPENING -> COMPLETED
     * Expected: When NOW >= thoi_gian_ket_thuc + 15 minutes, event becomes COMPLETED and gates close.
     */
    public function test_happening_transitions_to_completed_after_15_minutes_and_closes_gates(): void
    {
        $now = now();

        $event = $this->createEvent([
            'trang_thai' => 'HAPPENING',
            'ngay_cong_bo' => $now->copy()->subDays(2),
            'thoi_gian_bat_dau' => $now->copy()->subHours(3),
            'thoi_gian_ket_thuc' => $now->copy()->subMinutes(16),
            'cong_check_in_mo' => 1,
            'cong_check_out_mo' => 1,
        ]);

        $job = new TransitionEventLifecycleJob($now);
        $stats = app()->call([$job, 'handle']);

        $this->assertGreaterThanOrEqual(1, $stats['completed']);
        $fresh = $event->fresh();
        $this->assertSame('COMPLETED', $fresh->trang_thai);
        $this->assertFalse($fresh->cong_check_in_mo);
        $this->assertFalse($fresh->cong_check_out_mo);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: Guardrail - Cancelled and Rejected events remain immutable.
     * Expected: CANCELLED or REJECTED events are never modified by lifecycle transitions.
     */
    public function test_cancelled_and_rejected_events_are_never_reactivated(): void
    {
        $now = now();

        $cancelledEvent = $this->createEvent([
            'trang_thai' => 'CANCELLED',
            'ngay_cong_bo' => $now->copy()->subHours(2),
            'thoi_gian_bat_dau' => $now->copy()->addHour(),
            'thoi_gian_ket_thuc' => $now->copy()->addHours(3),
        ]);

        $rejectedEvent = $this->createEvent([
            'trang_thai' => 'REJECTED',
            'ngay_cong_bo' => $now->copy()->subHours(2),
            'thoi_gian_bat_dau' => $now->copy()->subHour(),
            'thoi_gian_ket_thuc' => $now->copy()->addHour(),
        ]);

        $job = new TransitionEventLifecycleJob($now);
        app()->call([$job, 'handle']);

        $this->assertSame('CANCELLED', $cancelledEvent->fresh()->trang_thai);
        $this->assertSame('REJECTED', $rejectedEvent->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: Auto-reject expired proposals still pending at start time
     * Expected: PENDING_FACULTY or PENDING_ADMIN past start time become REJECTED, room booking cancelled, audit log written.
     */
    public function test_expired_pending_proposals_are_auto_rejected_with_audit_log_and_notification(): void
    {
        $now = now();

        $event = $this->createEvent([
            'trang_thai' => 'PENDING_FACULTY',
            'ngay_cong_bo' => $now->copy()->subDay(),
            'thoi_gian_bat_dau' => $now->copy()->subMinute(),
            'thoi_gian_ket_thuc' => $now->copy()->addHours(2),
        ]);

        $booking = DatPhong::create([
            'ma_phong' => $this->room->ma_phong,
            'ma_su_kien' => $event->ma_su_kien,
            'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
            'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
            'trang_thai' => 'PENDING',
        ]);

        $job = new TransitionEventLifecycleJob($now);
        $stats = app()->call([$job, 'handle']);

        $this->assertGreaterThanOrEqual(1, $stats['auto_rejected']);
        $this->assertSame('REJECTED', $event->fresh()->trang_thai);
        $this->assertSame('CANCELLED', $booking->fresh()->trang_thai);

        // Verify Audit Log
        $audit = NhatKyKiemDuyet::where('ma_su_kien', $event->ma_su_kien)
            ->where('hanh_dong', 'AUTO_REJECT_EXPIRED')
            ->first();
        $this->assertNotNull($audit);
        $this->assertNull($audit->nguoi_thuc_hien);
        $this->assertSame('PENDING_FACULTY', $audit->trang_thai_truoc);
        $this->assertSame('REJECTED', $audit->trang_thai_sau);

        // Verify Host notification
        $notif = ThongBao::where('ma_tai_khoan', $this->hostUser->ma_tai_khoan)
            ->where('loai_thong_bao', 'KET_QUA_KIEM_DUYET')
            ->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString($event->ten_su_kien, $notif->noi_dung);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: Delayed scheduler catch-up
     * Expected: If scheduler ran late and NOW >= thoi_gian_ket_thuc + 15m, APPROVED event transitions straight to COMPLETED.
     */
    public function test_delayed_scheduler_catches_up_to_completed(): void
    {
        $now = now();

        $event = $this->createEvent([
            'trang_thai' => 'APPROVED',
            'ngay_cong_bo' => $now->copy()->subDays(2),
            'thoi_gian_bat_dau' => $now->copy()->subHours(4),
            'thoi_gian_ket_thuc' => $now->copy()->subHour(), // 1 hour past end, which is > 15m buffer
        ]);

        $job = new TransitionEventLifecycleJob($now);
        app()->call([$job, 'handle']);

        $fresh = $event->fresh();
        $this->assertSame('COMPLETED', $fresh->trang_thai);
        $this->assertFalse($fresh->cong_check_in_mo);
        $this->assertFalse($fresh->cong_check_out_mo);
    }

    /**
     * @test
     * Target: UC-SYS-01.Task 4
     * Course: Idempotency check
     * Expected: Running the command multiple times does not alter valid completed or published states.
     */
    public function test_scheduler_repeated_runs_are_idempotent(): void
    {
        $now = now();

        $event = $this->createEvent([
            'trang_thai' => 'APPROVED',
            'ngay_cong_bo' => $now->copy()->subMinute(),
            'thoi_gian_bat_dau' => $now->copy()->addHour(),
            'thoi_gian_ket_thuc' => $now->copy()->addHours(3),
        ]);

        $job = new TransitionEventLifecycleJob($now);
        $stats1 = app()->call([$job, 'handle']);
        $this->assertSame('PUBLISHED', $event->fresh()->trang_thai);

        // Second run at the same time
        $stats2 = app()->call([$job, 'handle']);
        $this->assertSame(0, $stats2['published']);
        $this->assertSame('PUBLISHED', $event->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: Command invocation
     * Expected: php artisan ceh:transition-events exits with SUCCESS.
     */
    public function test_artisan_command_transition_events_executes_successfully(): void
    {
        $this->artisan('ceh:transition-events')
            ->assertExitCode(0);
    }
}
