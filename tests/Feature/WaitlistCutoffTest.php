<?php

namespace Tests\Feature;

use App\Jobs\ExpireSoftHoldJob;
use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\HangDoiWaitlist;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\SuKienDongToChuc;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CryptoService;
use App\Services\NotificationService;
use App\Services\WaitlistService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class WaitlistCutoffTest extends TestCase
{
    protected DonViToChuc $unit;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-05 08:00:00'));
        $this->unit = DonViToChuc::query()->firstOrFail();
        $this->topic = ChuyenDe::query()->firstOrFail();
        $this->room = PhongHoiTruong::query()->where('trang_thai', 'KhaDung')->firstOrFail();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * @test
     * Target: UC-BOOK-03 (15-minute minimum offer window)
     * Course: A released slot is processed with fourteen minutes remaining to the T-2h cutoff.
     * Expected: no new offer; a waiting queue freezes one slot and preserves public inventory.
     */
    public function test_offer_below_fifteen_minutes_freezes_slot_while_waiters_remain(): void
    {
        $event = $this->createEvent([
            'so_luong_toi_da' => 2,
            'so_ve_con_lai' => 0,
            'thoi_gian_bat_dau' => now()->addHours(2)->addMinutes(14),
            'thoi_gian_ket_thuc' => now()->addHours(4)->addMinutes(14),
        ]);
        $this->createTicket($this->createStudent(), $event);
        $waiting = $this->createEntry($this->createStudent(), $event, 'WAITING');

        $this->offer($event);

        $fresh = $event->fresh();
        $this->assertSame('WAITING', $waiting->fresh()->trang_thai);
        $this->assertSame(1, $fresh->so_slot_dong_bang);
        $this->assertSame(0, $fresh->so_ve_con_lai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03 (15-minute minimum offer window)
     * Course: A released slot is processed with fourteen minutes remaining and no waiting students.
     * Expected: no offer; the slot returns to public inventory.
     */
    public function test_offer_below_fifteen_minutes_returns_slot_when_queue_is_empty(): void
    {
        $event = $this->createEvent([
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
            'thoi_gian_bat_dau' => now()->addHours(2)->addMinutes(14),
            'thoi_gian_ket_thuc' => now()->addHours(4)->addMinutes(14),
        ]);

        $this->offer($event);

        $this->assertSame(1, $event->fresh()->so_ve_con_lai);
        $this->assertSame(0, $event->fresh()->so_slot_dong_bang);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-BOOK-03 (15-minute minimum offer boundary)
     * Course: A released slot is processed with exactly fifteen minutes remaining to cutoff.
     * Expected: the offer is created with deadline at the T-2h cutoff.
     */
    public function test_offer_is_allowed_at_exactly_fifteen_minutes_before_cutoff(): void
    {
        $event = $this->createEvent([
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
            'thoi_gian_bat_dau' => now()->addHours(2)->addMinutes(15),
            'thoi_gian_ket_thuc' => now()->addHours(4)->addMinutes(15),
        ]);
        $entry = $this->createEntry($this->createStudent(), $event, 'WAITING');

        $this->offer($event);

        $this->assertSame('OFFERED', $entry->fresh()->trang_thai);
        $this->assertTrue($entry->fresh()->han_chot_xac_nhan->equalTo($event->thoi_gian_bat_dau->copy()->subHours(2)));
        $this->assertSame(0, $event->fresh()->so_slot_dong_bang);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-SYS-01 Task 2 / UC-BOOK-03 (Cutoff reconciliation)
     * Course: At T-2h, close WAITING, expire OFFERED, return frozen and offered slots.
     * Expected: correct statuses and slot total; a second run makes no further changes.
     */
    public function test_reconcile_cutoff_closes_waitlist_returns_slots_and_is_idempotent(): void
    {
        $event = $this->createEvent([
            'so_luong_toi_da' => 4,
            'so_ve_con_lai' => 1,
            'so_slot_dong_bang' => 1,
            'thoi_gian_bat_dau' => now()->addHours(2),
            'thoi_gian_ket_thuc' => now()->addHours(4),
        ]);
        $this->createTicket($this->createStudent(), $event);
        $waiting = $this->createEntry($this->createStudent(), $event, 'WAITING', null, 1);
        $offered = $this->createEntry($this->createStudent(), $event, 'OFFERED', now()->addMinutes(10), 2);

        $service = app(WaitlistService::class);
        $this->assertSame(1, $service->reconcileCutoff(now()));

        $this->assertSame('CLOSED_WAITLIST', $waiting->fresh()->trang_thai);
        $this->assertSame('EXPIRED', $offered->fresh()->trang_thai);
        $this->assertSame(0, $event->fresh()->so_slot_dong_bang);
        $this->assertSame(3, $event->fresh()->so_ve_con_lai);
        $this->assertSlotInvariant($event);

        $this->assertSame(0, $service->reconcileCutoff(now()));
        $this->assertSame(3, $event->fresh()->so_ve_con_lai);
        $this->assertSlotInvariant($event);
    }

    /**
     * @test
     * Target: UC-SYS-01 Task 3 / UC-EVT-02.AC.2 (Expire soft hold)
     * Course: Expired pending room holds for WAITING_COHOST_CONFIRM events.
     * Expected: event COHOST_REJECTED, room booking CANCELLED, system audit actor NULL, host notified,
     * and unresolved cohost invitation remains CHO_XAC_NHAN.
     */
    public function test_soft_hold_job_releases_room_audits_and_preserves_unanswered_cohost(): void
    {
        $host = User::query()->where('loai_tai_khoan', 'ToChuc')->firstOrFail();
        $event = $this->createEvent([
            'ma_don_vi_to_chuc' => $host->ma_don_vi_to_chuc,
            'trang_thai' => 'WAITING_COHOST_CONFIRM',
        ]);
        $booking = $this->createPendingBooking($event, now()->subMinute());
        $cohost = SuKienDongToChuc::query()->create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_don_vi_to_chuc' => DonViToChuc::query()
                ->where('ma_don_vi_to_chuc', '!=', $host->ma_don_vi_to_chuc)
                ->firstOrFail()->ma_don_vi_to_chuc,
            'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
        ]);

        app(ExpireSoftHoldJob::class)->handle(app(AuditLogService::class), app(NotificationService::class));

        $this->assertSame('COHOST_REJECTED', $event->fresh()->trang_thai);
        $this->assertSame('CANCELLED', $booking->fresh()->trang_thai);
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'EXPIRE_COHOST_HOLD',
            'nguoi_thuc_hien' => null,
        ]);
        $this->assertSame('CHO_XAC_NHAN', $cohost->fresh()->trang_thai_xac_nhan);
        $this->assertDatabaseHas('thong_bao', [
            'ma_tai_khoan' => $host->ma_tai_khoan,
            'loai_thong_bao' => 'KET_QUA_KIEM_DUYET',
        ]);
    }

    protected function offer(SuKien $event): void
    {
        DB::transaction(function () use ($event) {
            SuKien::query()->whereKey($event->ma_su_kien)->lockForUpdate()->firstOrFail();
            app(WaitlistService::class)->offerNext((int) $event->ma_su_kien, now());
        });
    }

    protected function createStudent(): User
    {
        return User::query()->create([
            'mssv' => str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT),
            'email' => Str::uuid().'@gm.uit.edu.vn',
            'ho_ten' => 'Waitlist Cutoff Student',
            'lop_sinh_hoat' => 'HTTT2022',
            'mat_khau' => Hash::make('Password123@'),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => 1,
            'hoat_dong' => 1,
            'buoc_doi_mat_khau' => 0,
        ]);
    }

    protected function createEvent(array $overrides = []): SuKien
    {
        $start = now()->addHours(10);

        return SuKien::query()->create(array_merge([
            'ma_don_vi_to_chuc' => $this->unit->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Waitlist Cutoff Event '.Str::random(8),
            'mo_ta' => 'Feature test event for cutoff jobs',
            'ngay_cong_bo' => now()->subDay(),
            'thoi_gian_bat_dau' => $start,
            'thoi_gian_ket_thuc' => $start->copy()->addHours(2),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'trang_thai' => 'PUBLISHED',
        ], $overrides));
    }

    protected function createEntry(User $student, SuKien $event, string $status, ?Carbon $deadline = null, int $sequence = 1): HangDoiWaitlist
    {
        return HangDoiWaitlist::query()->create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'so_thu_tu' => $sequence,
            'trang_thai' => $status,
            'thoi_gian_dang_ky' => now(),
            'han_chot_xac_nhan' => $deadline,
        ]);
    }

    protected function createTicket(User $student, SuKien $event): DangKy
    {
        $uuid = (string) Str::uuid();

        return DangKy::query()->create([
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_ve_uuid' => $uuid,
            'chu_ky_hmac' => app(CryptoService::class)->signTicket($uuid, (int) $student->ma_tai_khoan, (int) $event->ma_su_kien),
            'trang_thai' => 'DaDangKy',
            'thoi_gian_dang_ky' => now(),
        ]);
    }

    protected function createPendingBooking(SuKien $event, Carbon $deadline): DatPhong
    {
        return DatPhong::query()->create([
            'ma_phong' => $event->ma_phong,
            'ma_su_kien' => $event->ma_su_kien,
            'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
            'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
            'trang_thai' => 'PENDING',
            'han_giu_cho_tam' => $deadline,
        ]);
    }

    protected function assertSlotInvariant(SuKien $event): void
    {
        $fresh = $event->fresh();
        $validTickets = DangKy::query()->where('ma_su_kien', $event->ma_su_kien)->where('trang_thai', '!=', 'DaHuy')->count();
        $offered = HangDoiWaitlist::query()->where('ma_su_kien', $event->ma_su_kien)->where('trang_thai', 'OFFERED')->count();

        $this->assertSame(
            (int) $fresh->so_luong_toi_da,
            $validTickets + $offered + (int) $fresh->so_slot_dong_bang + (int) $fresh->so_ve_con_lai
        );
    }
}
