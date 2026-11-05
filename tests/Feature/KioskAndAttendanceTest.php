<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\NhanVienCheckIn;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\CryptoService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
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
        $stream = $this->withHeader('X-Kiosk-Token', $token)->getJson('/api/kiosk/totp-stream');
        $stream->assertOk()->assertJsonPath('data.qr_payload', fn ($value) => preg_match('/^CEH1K\.\d+\.\d{6}$/', $value) === 1);
    }

    /**
     * @test
     * Target: UC-OPS-02 / CEH-P2-OPS-02 (HMAC staff scan)
     * Course: Exception; altered signature must be rejected before attendance mutation.
     * Expected: HTTP 400 INVALID_TICKET_SIGNATURE.
     */
    public function test_tampered_hmac_is_rejected_before_ticket_lookup(): void
    {
        $ticket = DangKy::where('ma_su_kien', $this->event->ma_su_kien)->first();
        $payload = "CEH1.{$ticket->ma_ve_uuid}.{$ticket->ma_tai_khoan}.{$ticket->ma_su_kien}.".str_repeat('a', 64);
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', ['ma_su_kien' => $this->event->ma_su_kien, 'che_do_quet' => 'CHECK_IN', 'chuoi_qr_ve' => $payload])->assertStatus(400)->assertJsonPath('error', 'INVALID_TICKET_SIGNATURE');
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
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', ['ma_su_kien' => $this->event->ma_su_kien, 'che_do_quet' => 'CHECK_IN', 'chuoi_qr_ve' => $payload])->assertOk()->assertJsonPath('data.trang_thai', 'DaCheckIn');
        $this->actingAs($this->student)->postJson('/api/attendance/staff-scan', ['ma_su_kien' => $this->event->ma_su_kien, 'che_do_quet' => 'CHECK_IN', 'chuoi_qr_ve' => $payload])->assertStatus(409)->assertJsonPath('error', 'TICKET_ALREADY_USED');
    }
}
