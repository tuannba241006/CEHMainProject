<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class TicketWalletTest extends TestCase
{
    use DatabaseTransactions;

    protected User $studentA;

    protected User $studentB;

    protected User $admin;

    protected PhongHoiTruong $room;

    protected DonViToChuc $donVi;

    protected ChuyenDe $chuyenDe;

    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cryptoService = app(CryptoService::class);

        $this->donVi = DonViToChuc::first() ?? DonViToChuc::create([
            'ten_don_vi' => 'Khoa Kỹ thuật Phần mềm',
            'loai_don_vi' => 'Khoa',
            'email_lien_he' => 'ktpm_wallet@uit.edu.vn',
        ]);

        $this->room = PhongHoiTruong::where('trang_thai', 'KhaDung')->first()
            ?? PhongHoiTruong::create([
                'ten_phong' => 'Hội trường Test Wallet',
                'suc_chua_toi_da' => 100,
                'co_so' => 'CoSo1',
                'trang_thai' => 'KhaDung',
            ]);

        $this->chuyenDe = ChuyenDe::first() ?? ChuyenDe::create([
            'ten_chuyen_de' => 'Chuyên đề Test Wallet',
            'mo_ta' => 'Mô tả test ví vé',
            'da_xoa' => 0,
        ]);

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_wallet@gm.uit.edu.vn'],
            [
                'mssv' => '22528001',
                'ho_ten' => 'Nguyễn Sinh Viên A',
                'lop_sinh_hoat' => 'KTPM2022',
                'khoa' => 'Kỹ thuật Phần mềm',
                'mat_khau' => Hash::make('Password123@'),
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->studentB = User::firstOrCreate(
            ['email' => 'student_b_wallet@gm.uit.edu.vn'],
            [
                'mssv' => '22528002',
                'ho_ten' => 'Trần Sinh Viên B',
                'lop_sinh_hoat' => 'KHMT2022',
                'khoa' => 'Khoa học Máy tính',
                'mat_khau' => Hash::make('Password123@'),
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->admin = User::firstOrCreate(
            ['email' => 'admin_wallet@uit.edu.vn'],
            [
                'ho_ten' => 'Admin Wallet Test',
                'lop_sinh_hoat' => 'N/A',
                'khoa' => 'N/A',
                'mat_khau' => Hash::make('Password123@'),
                'loai_tai_khoan' => 'Admin',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );
    }

    protected function createEvent(string $status = 'PUBLISHED', ?Carbon $start = null): SuKien
    {
        $startTime = $start ?? Carbon::now()->addDays(3)->setTime(8, 0, 0);
        $endTime = $startTime->copy()->addHours(3);

        return SuKien::create([
            'ma_don_vi_to_chuc' => $this->donVi->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện Test Wallet '.Str::random(5),
            'mo_ta' => 'Mô tả test ví vé',
            'ngay_cong_bo' => Carbon::now()->subDays(1),
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 50,
            'so_ve_con_lai' => 50,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => $status,
        ]);
    }

    protected function createTicket(User $user, SuKien $event, string $status = 'DaDangKy'): DangKy
    {
        $uuid = (string) Str::uuid();
        $signature = $this->cryptoService->signTicket($uuid, $user->ma_tai_khoan, $event->ma_su_kien);

        $data = [
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_ve_uuid' => $uuid,
            'chu_ky_hmac' => $signature,
            'trang_thai' => $status,
            'thoi_gian_dang_ky' => now(),
            'da_check_in' => in_array($status, ['DaCheckIn', 'DaCheckOut'], true) ? 1 : 0,
            'da_check_out' => $status === 'DaCheckOut' ? 1 : 0,
            'ti_le_drl' => $status === 'DaCheckOut' ? 1.0 : 0.0,
            'tham_gia_tron_ven' => $status === 'DaCheckOut' ? 1 : 0,
        ];

        if ($status === 'DaCheckIn') {
            $data['thoi_gian_check_in'] = now()->subMinutes(30);
        } elseif ($status === 'DaCheckOut') {
            $data['thoi_gian_check_in'] = now()->subHours(2);
            $data['thoi_gian_check_out'] = now()->subMinutes(10);
        } elseif ($status === 'DaHuy') {
            $data['thoi_gian_huy'] = now();
            $data['ly_do_huy'] = 'Lý do hủy kiểm thử';
        }

        return DangKy::create($data);
    }

    /**
     * @test
     * Target: UC-TCK-01 (Tra cuu ve ca nhan)
     * Course: Normal Course (Tab upcoming vs tab history)
     * Expected: HTTP 200, danh sach ve duoc phan loai chinh xac
     */
    public function test_student_can_view_own_tickets_in_upcoming_and_history_tabs(): void
    {
        $upcomingEvent = $this->createEvent('PUBLISHED');
        $completedEvent = $this->createEvent('COMPLETED');

        $ticketUpcoming = $this->createTicket($this->studentA, $upcomingEvent, 'DaDangKy');
        $ticketCompleted = $this->createTicket($this->studentA, $completedEvent, 'DaCheckOut');
        $ticketCancelled = $this->createTicket($this->studentA, $upcomingEvent, 'DaHuy');

        // 1. Query tab upcoming
        $responseUpcoming = $this->actingAs($this->studentA)
            ->getJson('/api/v1/tickets/my-tickets?tab=upcoming');

        $responseUpcoming->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.ma_dang_ky', $ticketUpcoming->ma_dang_ky);

        $upcomingTicketIds = collect($responseUpcoming->json('data'))->pluck('ma_dang_ky')->all();
        $this->assertContains($ticketUpcoming->ma_dang_ky, $upcomingTicketIds);
        $this->assertNotContains($ticketCompleted->ma_dang_ky, $upcomingTicketIds);
        $this->assertNotContains($ticketCancelled->ma_dang_ky, $upcomingTicketIds);

        // 2. Query tab history
        $responseHistory = $this->actingAs($this->studentA)
            ->getJson('/api/v1/tickets/my-tickets?tab=history');

        $responseHistory->assertOk();
        $historyTicketIds = collect($responseHistory->json('data'))->pluck('ma_dang_ky')->all();
        $this->assertContains($ticketCompleted->ma_dang_ky, $historyTicketIds);
        $this->assertContains($ticketCancelled->ma_dang_ky, $historyTicketIds);
        $this->assertNotContains($ticketUpcoming->ma_dang_ky, $historyTicketIds);
    }

    /**
     * @test
     * Target: UC-TCK-01 (Chong IDOR & Bao mat)
     * Course: Exception (Sinh vien A co tinh truy cap ve cua Sinh vien B)
     * Expected: HTTP 403 Forbidden
     */
    public function test_student_cannot_view_another_student_ticket_idor_protection(): void
    {
        $event = $this->createEvent('PUBLISHED');
        $ticketB = $this->createTicket($this->studentB, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->getJson("/api/v1/tickets/{$ticketB->ma_dang_ky}");

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'FORBIDDEN');
    }

    /**
     * @test
     * Target: UC-TCK-01 (Xac thuc)
     * Course: Exception (Khach chua dang nhap truy cap ve)
     * Expected: HTTP 401 Unauthenticated
     */
    public function test_guest_cannot_view_my_tickets_unauthenticated(): void
    {
        $response = $this->getJson('/api/v1/tickets/my-tickets');

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'UNAUTHENTICATED');
    }

    /**
     * @test
     * Target: UC-TCK-01 (Quyen Admin)
     * Course: Normal Course (Admin xem chi tiet bat ky ve nao de kiem tra)
     * Expected: HTTP 200 OK
     */
    public function test_admin_can_view_any_ticket_detail(): void
    {
        $event = $this->createEvent('PUBLISHED');
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/tickets/{$ticket->ma_dang_ky}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ma_dang_ky', $ticket->ma_dang_ky)
            ->assertJsonPath('data.ma_ve_uuid', $ticket->ma_ve_uuid);
    }

    /**
     * @test
     * Target: UC-TCK-01 (Ve khong ton tai)
     * Course: Exception
     * Expected: HTTP 404 Not Found
     */
    public function test_ticket_detail_returns_404_when_ticket_does_not_exist(): void
    {
        $response = $this->actingAs($this->studentA)
            ->getJson('/api/v1/tickets/99999999');

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    /**
     * @test
     * Target: UC-TCK-01 (Phan trang & Bo loc)
     * Course: Normal Course
     * Expected: HTTP 200, meta phan trang chuan OpenAPI
     */
    public function test_pagination_and_filters_work_on_my_tickets(): void
    {
        $event1 = $this->createEvent('PUBLISHED');
        $event2 = $this->createEvent('PUBLISHED');
        $this->createTicket($this->studentA, $event1, 'DaDangKy');
        $this->createTicket($this->studentA, $event2, 'DaCheckIn');

        $response = $this->actingAs($this->studentA)
            ->getJson('/api/v1/tickets/my-tickets?limit=1&page=1');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
                'meta' => [
                    'trang_hien_tai',
                    'tong_so_trang',
                    'tong_so_ban_ghi',
                    'kich_thuoc_trang',
                ],
                'server_time',
            ])
            ->assertJsonPath('meta.kich_thuoc_trang', 1)
            ->assertJsonPath('meta.trang_hien_tai', 1);
    }

    /**
     * @test
     * Target: UC-TCK-01 / NFR-SEC-02 (QR HMAC Verification)
     * Course: Normal Course (Chu ky HMAC dung chuan)
     * Expected: payload_qr chua chu ky hop le, xac thuc thanh cong qua CryptoService
     */
    public function test_qr_hmac_payload_is_valid_and_verifiable_via_crypto_service(): void
    {
        $event = $this->createEvent('PUBLISHED');
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->getJson("/api/v1/tickets/{$ticket->ma_dang_ky}");

        $response->assertOk();
        $payloadQr = $response->json('data.payload_qr');
        $chuKyHmac = $response->json('data.chu_ky_hmac');
        $maVeUuid = $response->json('data.ma_ve_uuid');

        $this->assertStringStartsWith('CEH1.', $payloadQr);
        $this->assertTrue(
            $this->cryptoService->verifyTicket($chuKyHmac, $maVeUuid, $this->studentA->ma_tai_khoan, $event->ma_su_kien)
        );
    }

    /**
     * @test
     * Target: UC-TCK-01 / NFR-SEC-02 (Anti-Tampering QR)
     * Course: Exception (Chu ky bi gia mao)
     * Expected: Xac thuc CryptoService that bai
     */
    public function test_tampered_qr_hmac_fails_verification(): void
    {
        $event = $this->createEvent('PUBLISHED');
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $tamperedSignature = 'fake_signature_'.Str::random(32);

        $this->assertFalse(
            $this->cryptoService->verifyTicket($tamperedSignature, $ticket->ma_ve_uuid, $this->studentA->ma_tai_khoan, $event->ma_su_kien)
        );
    }

    /**
     * @test
     * Target: UC-TCK-01 / NFR-USAB-01 (Screen Wake Lock requirement)
     * Course: Normal Course
     * Expected: yeu_cau_wake_lock = true
     */
    public function test_ticket_response_includes_wake_lock_requirement(): void
    {
        $event = $this->createEvent('PUBLISHED');
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->getJson("/api/v1/tickets/{$ticket->ma_dang_ky}");

        $response->assertOk()
            ->assertJsonPath('data.yeu_cau_wake_lock', true);
    }
}
