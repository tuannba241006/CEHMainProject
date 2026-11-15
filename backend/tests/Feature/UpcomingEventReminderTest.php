<?php

namespace Tests\Feature;

use App\Jobs\SendUpcomingEventReminderJob;
use App\Mail\UpcomingEventReminderMail;
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

class UpcomingEventReminderTest extends TestCase
{
    use DatabaseTransactions;

    protected DonViToChuc $faculty;

    protected DonViToChuc $hostClub;

    protected User $studentA;

    protected User $studentB;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->faculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_REMIND_TEST'],
            [
                'ten_don_vi' => 'Khoa Nhắc Nhở Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->hostClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_REMIND_TEST'],
            [
                'ten_don_vi' => 'CLB Nhắc Nhở Test',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
            ]
        );

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_remind@uit.edu.vn'],
            [
                'ho_ten' => 'Nguyen Van Remind A',
                'mssv' => '21520201',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->studentB = User::firstOrCreate(
            ['email' => 'student_b_remind@uit.edu.vn'],
            [
                'ho_ten' => 'Tran Thi Remind B',
                'mssv' => '21520202',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Reminder Test'],
            ['mo_ta' => 'Chuyên đề test nhắc lịch 24h']
        );

        $this->room = PhongHoiTruong::firstOrCreate(
            ['ten_phong' => 'Hội trường Reminder Test', 'co_so' => 'CoSo1'],
            [
                'suc_chua_toi_da' => 120,
                'trang_thiet_bi' => ['micro' => 2],
                'trang_thai' => 'KhaDung',
            ]
        );
    }

    protected function createEvent(array $attributes = []): SuKien
    {
        $base = now()->addHours(12);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện Nhắc Hẹn 24h Test',
            'mo_ta' => 'Mô tả test nhắc hẹn sự kiện sắp diễn ra',
            'ngay_cong_bo' => now()->subDays(2),
            'thoi_gian_bat_dau' => $base->copy(),
            'thoi_gian_ket_thuc' => $base->copy()->addHours(3),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 60,
            'so_ve_con_lai' => 58,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 3,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'PUBLISHED',
            'cong_check_in_mo' => 0,
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
            'thoi_gian_dang_ky' => now()->subDay(),
            'da_check_in' => 0,
            'da_check_out' => 0,
            'nghi_van_gian_lan' => 0,
            'vi_pham_no_show' => 0,
            'da_gui_nhac_nho' => 0,
        ], $attributes));
    }

    /**
     * @test
     * Target: UC-NOTIF-01
     * Course: Sliding 24h window reminder dispatch
     * Expected: Tickets in published events starting within 24 hours receive in-app notification and queued email.
     */
    public function test_tickets_in_24h_window_receive_reminders_and_email(): void
    {
        Mail::fake();

        $event = $this->createEvent([
            'thoi_gian_bat_dau' => now()->addHours(10),
            'thoi_gian_ket_thuc' => now()->addHours(13),
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new SendUpcomingEventReminderJob;
        $results = app()->call([$job, 'handle']);

        $this->assertGreaterThanOrEqual(1, $results['reminders_sent']);
        $this->assertTrue((bool) $ticket->fresh()->da_gui_nhac_nho);

        // Verify In-app notification
        $notif = ThongBao::where('ma_tai_khoan', $this->studentA->ma_tai_khoan)
            ->where('loai_thong_bao', 'NHAC_HEN')
            ->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString($event->ten_su_kien, $notif->noi_dung);
        $this->assertStringContainsString((string) $ticket->ma_dang_ky, $notif->lien_ket);

        // Verify Mail Queued with correct payload
        Mail::assertQueued(UpcomingEventReminderMail::class, function ($mail) use ($ticket) {
            return $mail->hasTo($this->studentA->email)
                && $mail->ticketUuid === $ticket->ma_ve_uuid
                && $mail->canCancel === true;
        });
    }

    /**
     * @test
     * Target: UC-NOTIF-01
     * Course: Boundary check beyond 24 hours
     * Expected: Events starting > 24 hours in the future are not reminded yet.
     */
    public function test_events_starting_beyond_24h_are_not_reminded(): void
    {
        Mail::fake();

        $event = $this->createEvent([
            'thoi_gian_bat_dau' => now()->addHours(26),
            'thoi_gian_ket_thuc' => now()->addHours(29),
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new SendUpcomingEventReminderJob;
        $results = app()->call([$job, 'handle']);

        $this->assertSame(0, $results['reminders_sent']);
        $this->assertFalse((bool) $ticket->fresh()->da_gui_nhac_nho);
        Mail::assertNothingQueued();
    }

    /**
     * @test
     * Target: UC-NOTIF-01
     * Course: Exclusion of cancelled tickets
     * Expected: Cancelled tickets (DaHuy) are never sent reminder emails or in-app notifications.
     */
    public function test_cancelled_tickets_are_never_reminded(): void
    {
        Mail::fake();

        $event = $this->createEvent([
            'thoi_gian_bat_dau' => now()->addHours(8),
            'thoi_gian_ket_thuc' => now()->addHours(11),
        ]);

        $ticket = $this->createTicket($event, $this->studentA, [
            'trang_thai' => 'DaHuy',
            'thoi_gian_huy' => now()->subDay(),
        ]);

        $job = new SendUpcomingEventReminderJob;
        $results = app()->call([$job, 'handle']);

        $this->assertSame(0, $results['reminders_sent']);
        $this->assertFalse((bool) $ticket->fresh()->da_gui_nhac_nho);
        Mail::assertNothingQueued();
    }

    /**
     * @test
     * Target: UC-NOTIF-01
     * Course: Idempotency & concurrency check
     * Expected: Repeated runs do not duplicate reminders for already reminded tickets.
     */
    public function test_reminders_are_strictly_idempotent_and_never_duplicated(): void
    {
        Mail::fake();

        $event = $this->createEvent([
            'thoi_gian_bat_dau' => now()->addHours(10),
            'thoi_gian_ket_thuc' => now()->addHours(13),
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new SendUpcomingEventReminderJob;

        // 1st run
        $results1 = app()->call([$job, 'handle']);
        $this->assertGreaterThanOrEqual(1, $results1['reminders_sent']);

        // 2nd run
        $results2 = app()->call([$job, 'handle']);
        $this->assertSame(0, $results2['reminders_sent']);

        Mail::assertQueued(UpcomingEventReminderMail::class, 1);
    }

    /**
     * @test
     * Target: UC-NOTIF-01
     * Course: Cancellation notice based on T-4h threshold
     * Expected: When within 4 hours of start, mail indicates deadline has passed (canCancel = false).
     */
    public function test_reminder_within_4h_indicates_deadline_has_passed(): void
    {
        Mail::fake();

        // Event starting in 2 hours (passed T-4h threshold)
        $event = $this->createEvent([
            'thoi_gian_bat_dau' => now()->addHours(2),
            'thoi_gian_ket_thuc' => now()->addHours(5),
        ]);

        $ticket = $this->createTicket($event, $this->studentA);

        $job = new SendUpcomingEventReminderJob;
        app()->call([$job, 'handle']);

        Mail::assertQueued(UpcomingEventReminderMail::class, function ($mail) {
            return $mail->canCancel === false;
        });

        $notif = ThongBao::where('ma_tai_khoan', $this->studentA->ma_tai_khoan)
            ->where('loai_thong_bao', 'NHAC_HEN')
            ->first();
        $this->assertStringContainsString('Đã qua thời hạn cho phép tự hủy vé', $notif->noi_dung);
    }

    /**
     * @test
     * Target: Command invocation
     * Expected: php artisan events:send-reminders executes successfully.
     */
    public function test_artisan_command_events_send_reminders_executes_successfully(): void
    {
        $this->artisan('events:send-reminders')
            ->assertExitCode(0);
    }
}
