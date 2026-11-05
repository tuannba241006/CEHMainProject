<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\NhanVienCheckIn;
use App\Models\PhongHoiTruong;
use App\Models\PhienKiosk;
use App\Models\SuKien;
use App\Models\User;
use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class KioskAndAttendanceTest extends TestCase
{
    use DatabaseTransactions;

    protected User $student;

    protected User $organizer;

    protected SuKien $event;

    protected function setUp(): void
    {
        parent::setUp();
        $unit = DonViToChuc::first() ?? DonViToChuc::create(['ten_don_vi' => 'Khoa Kiosk Test', 'loai_don_vi' => 'Khoa', 'email_lien_he' => 'kiosk@test.uit.edu.vn']);
        $room = PhongHoiTruong::where('trang_thai', 'KhaDung')->first() ?? PhongHoiTruong::create(['ten_phong' => 'Kiosk Test', 'suc_chua_toi_da' => 100, 'co_so' => 'CoSo1', 'trang_thai' => 'KhaDung']);
        $topic = ChuyenDe::first() ?? ChuyenDe::create(['ten_chuyen_de' => 'Kiosk', 'mo_ta' => 'Kiosk test', 'da_xoa' => 0]);
        $this->organizer = User::firstOrCreate(['email' => 'kiosk-organizer@test.uit.edu.vn'], ['ho_ten' => 'Kiosk Organizer', 'mat_khau' => Hash::make('Password123@'), 'loai_tai_khoan' => 'ToChuc', 'ma_don_vi_to_chuc' => $unit->ma_don_vi_to_chuc, 'dong_y_nghi_dinh_13' => 1, 'hoat_dong' => 1, 'buoc_doi_mat_khau' => 0]);
        $this->student = User::firstOrCreate(['email' => 'kiosk-student@test.uit.edu.vn'], ['mssv' => '22529991', 'ho_ten' => 'Kiosk Student', 'mat_khau' => Hash::make('Password123@'), 'loai_tai_khoan' => 'SinhVien', 'dong_y_nghi_dinh_13' => 1, 'hoat_dong' => 1, 'buoc_doi_mat_khau' => 0]);
        $start = now()->addMinutes(10);
        $this->event = SuKien::create(['ma_don_vi_to_chuc' => $unit->ma_don_vi_to_chuc, 'ma_chuyen_de' => $topic->ma_chuyen_de, 'ma_phong' => $room->ma_phong, 'ten_su_kien' => 'Kiosk attendance test', 'mo_ta' => 'Kiosk attendance test', 'ngay_cong_bo' => now()->subDay(), 'thoi_gian_bat_dau' => $start, 'thoi_gian_ket_thuc' => $start->copy()->addHours(2), 'khong_gioi_han_slot' => 0, 'so_luong_toi_da' => 100, 'so_ve_con_lai' => 99, 'dieu_khoan_drl' => 'Dieu3', 'diem_drl_du_kien' => 5, 'trang_thai' => 'PUBLISHED']);
        $uuid = (string) Str::uuid();
        DangKy::create(['ma_tai_khoan' => $this->student->ma_tai_khoan, 'ma_su_kien' => $this->event->ma_su_kien, 'ma_ve_uuid' => $uuid, 'chu_ky_hmac' => app(CryptoService::class)->signTicket($uuid, $this->student->ma_tai_khoan, $this->event->ma_su_kien), 'trang_thai' => 'DaDangKy', 'thoi_gian_dang_ky' => now()]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * @test
     * Target: UC-OPS-01 / CEH-P2-OPS-01 (Kiosk session and RFC 6238 TOTP stream)
     * Course: Normal course; session token is independent and QR payload is six digits.
     * Expected: HTTP 200 with CEH1K payload and an opaque kiosk token.
     */
    public function test_kiosk_session_returns_rotating_six_digit_totp_and_hashes_token(): void
    {
        $response = $this->actingAs($this->organizer)->postJson("/api/events/{$this->event->ma_su_kien}/kiosk/start");
        $response->assertOk()->assertJsonPath('success', true)->assertJsonPath('data.ma_su_kien', $this->event->ma_su_kien);
        $token = $response->json('data.kiosk_token');
        $session = PhienKiosk::where('ma_su_kien', $this->event->ma_su_kien)->firstOrFail();
        $this->assertSame(hash('sha256', $token), $session->kiosk_token_hash);
        $this->assertNotSame($token, $session->kiosk_token_hash);
        $stream = $this->withHeader('X-Kiosk-Token', $token)->getJson('/api/kiosk/totp-stream');
        $stream->assertOk()->assertJsonPath('data.qr_payload', fn ($value) => preg_match('/^CEH1K\.\d+\.\d{6}$/', $value) === 1);
        $this->assertGreaterThanOrEqual(1, $stream->json('data.expires_in_seconds'));
        $this->assertLessThanOrEqual(30, $stream->json('data.expires_in_seconds'));
    }

    /**
     * @test
     * Target: UC-OPS-02 / CEH-P2-OPS-02 (HMAC staff scan)
     * Course: Exception; altered signature must be rejected before attendance mutation.
     * Expected: HTTP 400 TICKET_INVALID_SIGNATURE.
     */
    public function test_tampered_hmac_is_rejected_before_ticket_lookup(): void
    {
        $ticket = DangKy::where('ma_su_kien', $this->event->ma_su_kien)->first();
        $payload = "CEH1.{$ticket->ma_ve_uuid}.{$ticket->ma_tai_khoan}.{$ticket->ma_su_kien}.".str_repeat('a', 64);
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', ['ma_su_kien' => $this->event->ma_su_kien, 'che_do_quet' => 'CHECK_IN', 'chuoi_qr_ve' => $payload])->assertStatus(400)->assertJsonPath('error', 'TICKET_INVALID_SIGNATURE');
    }

    /**
     * @test
     * Target: UC-OPS-02 / UC-OPS-05 (Event-scoped HMAC scan and replay protection)
     * Course: Normal scan followed by replay of the same QR payload.
     * Expected: first scan is accepted; replay is rejected with TICKET_ALREADY_USED.
     */
    public function test_staff_scan_is_event_scoped_and_replay_safe(): void
    {
        $this->event->update(['cong_check_in_mo' => true]);
        NhanVienCheckIn::create(['ma_tai_khoan' => $this->student->ma_tai_khoan, 'ma_su_kien' => $this->event->ma_su_kien, 'nguoi_phan_cong' => $this->organizer->ma_tai_khoan]);
        $ticket = DangKy::where('ma_su_kien', $this->event->ma_su_kien)->first();
        $payload = "CEH1.{$ticket->ma_ve_uuid}.{$ticket->ma_tai_khoan}.{$ticket->ma_su_kien}.{$ticket->chu_ky_hmac}";
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', ['ma_su_kien' => $this->event->ma_su_kien, 'che_do_quet' => 'CHECK_IN', 'chuoi_qr_ve' => $payload])
            ->assertOk()
            ->assertJsonStructure(['success', 'data' => ['ma_dang_ky', 'sinh_vien' => ['ho_ten', 'mssv', 'khoa'], 'canh_bao_doi_soat_the_sv', 'trang_thai_ve', 'thoi_gian_quet']])
            ->assertJsonPath('data.trang_thai_ve', 'DaCheckIn');
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', ['ma_su_kien' => $this->event->ma_su_kien, 'che_do_quet' => 'CHECK_IN', 'chuoi_qr_ve' => $payload])->assertStatus(409)->assertJsonPath('error', 'TICKET_ALREADY_USED');
    }

    /**
     * @test
     * A staff desk checkout must use the same event-duration scoring rules as self checkout.
     */
    public function test_staff_checkout_calculates_attendance_score_for_each_threshold(): void
    {
        $start = Carbon::parse('2026-11-05 10:00:00');
        $end = $start->copy()->addHours(2);
        $this->event->update(['trang_thai' => 'HAPPENING', 'thoi_gian_bat_dau' => $start, 'thoi_gian_ket_thuc' => $end, 'cong_check_out_mo' => true]);
        NhanVienCheckIn::create(['ma_tai_khoan' => $this->student->ma_tai_khoan, 'ma_su_kien' => $this->event->ma_su_kien, 'nguoi_phan_cong' => $this->organizer->ma_tai_khoan]);
        $ticket = DangKy::where('ma_su_kien', $this->event->ma_su_kien)->firstOrFail();
        $payload = "CEH1.{$ticket->ma_ve_uuid}.{$ticket->ma_tai_khoan}.{$ticket->ma_su_kien}.{$ticket->chu_ky_hmac}";

        foreach ([
            ['minutes' => 30, 'score' => 0.0, 'full' => false, 'partial' => false],
            ['minutes' => 60, 'score' => 0.5, 'full' => false, 'partial' => true],
            ['minutes' => 90, 'score' => 1.0, 'full' => true, 'partial' => false],
        ] as $scenario) {
            Carbon::setTestNow($start->copy()->addMinutes($scenario['minutes']));
            DangKy::whereKey($ticket->ma_dang_ky)->update([
                'trang_thai' => 'DaCheckIn',
                'da_check_in' => true,
                'thoi_gian_check_in' => $start,
                'da_check_out' => false,
                'thoi_gian_check_out' => null,
                'tham_gia_tron_ven' => false,
                'tham_gia_mot_phan' => false,
                'ti_le_drl' => 0,
            ]);

            $response = $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', [
                'ma_su_kien' => $this->event->ma_su_kien,
                'che_do_quet' => 'CHECK_OUT',
                'chuoi_qr_ve' => $payload,
            ]);

            $response->assertOk();
            $this->assertEquals($scenario['score'], $response->json('data.ti_le_drl'));
            $this->assertSame($scenario['full'], $ticket->fresh()->tham_gia_tron_ven);
            $this->assertSame($scenario['partial'], $ticket->fresh()->tham_gia_mot_phan);
        }
    }

    /**
     * @test
     * Opening checkout early records the effective end time used for attendance scoring.
     */
    public function test_early_checkout_gate_records_effective_event_end(): void
    {
        $end = Carbon::parse('2026-11-05 12:00:00');
        Carbon::setTestNow($end->copy()->subMinutes(15));
        $this->event->update(['thoi_gian_bat_dau' => $end->copy()->subHours(2), 'thoi_gian_ket_thuc' => $end]);

        $this->actingAs($this->organizer)
            ->postJson("/api/events/{$this->event->ma_su_kien}/kiosk/open-checkout", ['ma_xac_nhan' => 'CONFIRM'])
            ->assertOk();

        $this->assertTrue($this->event->fresh()->cong_check_out_mo);
        $this->assertTrue($this->event->fresh()->thoi_gian_ket_thuc_thuc_te->equalTo(now()));
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', ['ma_su_kien' => $this->event->ma_su_kien, 'hanh_dong' => 'EARLY_CHECKOUT_CONFIRM']);
    }

    /**
     * @test
     * The scheduled fallback opens checkout and writes a system audit log at planned event end.
     */
    public function test_fallback_command_opens_checkout_and_logs_automatically(): void
    {
        $start = Carbon::parse('2026-11-05 10:00:00');
        $end = $start->copy()->addHours(2);
        Carbon::setTestNow($end->copy()->addSecond());
        $this->event->update(['trang_thai' => 'HAPPENING', 'thoi_gian_bat_dau' => $start, 'thoi_gian_ket_thuc' => $end]);

        Artisan::call('ceh:open-checkout-fallback');

        $this->assertTrue($this->event->fresh()->cong_check_out_mo);
        $this->assertTrue($this->event->fresh()->thoi_gian_ket_thuc_thuc_te->equalTo($end));
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $this->event->ma_su_kien,
            'nguoi_thuc_hien' => null,
            'hanh_dong' => 'AUTO_OPEN_CHECKOUT',
        ]);
    }

    /**
     * @test
     * A valid ticket for a different event is rejected using the documented error code.
     */
    public function test_ticket_from_another_event_returns_wrong_event_error(): void
    {
        $ticket = DangKy::where('ma_su_kien', $this->event->ma_su_kien)->firstOrFail();
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', [
            'ma_su_kien' => $this->event->ma_su_kien + 1,
            'che_do_quet' => 'CHECK_IN',
            'chuoi_qr_ve' => "CEH1.{$ticket->ma_ve_uuid}.{$ticket->ma_tai_khoan}.{$ticket->ma_su_kien}.{$ticket->chu_ky_hmac}",
        ])->assertStatus(400)->assertJsonPath('error', 'TICKET_WRONG_EVENT');
    }
}
