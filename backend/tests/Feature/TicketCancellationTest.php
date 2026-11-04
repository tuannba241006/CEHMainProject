<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\HangDoiWaitlist;
use App\Models\NhatKyKiemDuyet;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\User;
use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class TicketCancellationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $studentA;

    protected User $studentB;

    protected PhongHoiTruong $room;

    protected DonViToChuc $donVi;

    protected ChuyenDe $chuyenDe;

    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cryptoService = app(CryptoService::class);

        $this->donVi = DonViToChuc::first() ?? DonViToChuc::create([
            'ten_don_vi' => 'Khoa Khoa học Máy tính',
            'loai_don_vi' => 'Khoa',
            'email_lien_he' => 'cs_cancel@uit.edu.vn',
        ]);

        $this->room = PhongHoiTruong::where('trang_thai', 'KhaDung')->first()
            ?? PhongHoiTruong::create([
                'ten_phong' => 'Hội trường Test Cancellation',
                'suc_chua_toi_da' => 100,
                'co_so' => 'CoSo1',
                'trang_thai' => 'KhaDung',
            ]);

        $this->chuyenDe = ChuyenDe::first() ?? ChuyenDe::create([
            'ten_chuyen_de' => 'Chuyên đề Test Hủy Vé',
            'mo_ta' => 'Mô tả test hủy vé',
            'da_xoa' => 0,
        ]);

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_cancel@gm.uit.edu.vn'],
            [
                'mssv' => '22528201',
                'ho_ten' => 'Sinh Viên Hủy Vé A',
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
            ['email' => 'student_b_cancel@gm.uit.edu.vn'],
            [
                'mssv' => '22528202',
                'ho_ten' => 'Sinh Viên Waitlist B',
                'lop_sinh_hoat' => 'KHMT2022',
                'khoa' => 'Khoa học Máy tính',
                'mat_khau' => Hash::make('Password123@'),
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );
    }

    protected function createEvent(array $overrides = []): SuKien
    {
        $start = Carbon::now()->addHours(6); // Default 6 hours in future (> 4 hours)
        $end = $start->copy()->addHours(3);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->donVi->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện Test Hủy Vé '.Str::random(5),
            'mo_ta' => 'Mô tả test hủy vé',
            'ngay_cong_bo' => Carbon::now()->subDays(1),
            'thoi_gian_bat_dau' => $start,
            'thoi_gian_ket_thuc' => $end,
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 50,
            'so_ve_con_lai' => 10,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'PUBLISHED',
        ], $overrides));
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
     * Target: UC-TCK-02 / FR-18 (Huy ve hop le truoc T-4h)
     * Course: Normal Course
     * Expected: HTTP 200, trang_thai = DaHuy, Audit Log CANCEL_TICKET, ThongBao in-app
     */
    public function test_student_can_cancel_ticket_before_t_minus_4h_successfully(): void
    {
        // Event starts in 6 hours (cutoff is at T-4h = in 2 hours -> now is valid)
        $event = $this->createEvent(['so_ve_con_lai' => 5]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Có lịch thi học kỳ đột xuất',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Hủy vé tham dự thành công')
            ->assertJsonPath('data.trang_thai', 'DaHuy');

        // Check DB state
        $ticket->refresh();
        $this->assertEquals('DaHuy', $ticket->trang_thai);
        $this->assertNotNull($ticket->thoi_gian_huy);
        $this->assertEquals('Có lịch thi học kỳ đột xuất', $ticket->ly_do_huy);

        // Check slot incremented when waitlist empty
        $this->assertEquals(6, $event->fresh()->so_ve_con_lai);

        // Check Audit Log
        $audit = NhatKyKiemDuyet::where('ma_dang_ky', $ticket->ma_dang_ky)
            ->where('hanh_dong', 'CANCEL_TICKET')
            ->latest('thoi_gian_tao')
            ->first();
        $this->assertNotNull($audit);
        $this->assertEquals('DaDangKy', $audit->trang_thai_truoc);
        $this->assertEquals('DaHuy', $audit->trang_thai_sau);
        $this->assertEquals('Có lịch thi học kỳ đột xuất', $audit->ly_do);
        $this->assertEquals($this->studentA->ma_tai_khoan, $audit->nguoi_thuc_hien);

        // Check notification created
        $notif = ThongBao::where('ma_tai_khoan', $this->studentA->ma_tai_khoan)
            ->latest('thoi_gian_gui')
            ->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString('Hủy vé', $notif->tieu_de);
    }

    /**
     * @test
     * Target: UC-TCK-02.EX.1 (Huy ve dung moc T-4h bi chan)
     * Course: Boundary Exception (now == thoi_gian_bat_dau - 4h)
     * Expected: HTTP 409 Conflict, CANNOT_CANCEL_WITHIN_4_HOURS
     */
    public function test_cancel_ticket_at_exactly_t_minus_4h_is_rejected(): void
    {
        // Event starts in exactly 4 hours -> now is exactly at deadline
        $event = $this->createEvent([
            'thoi_gian_bat_dau' => Carbon::now()->addHours(4),
            'thoi_gian_ket_thuc' => Carbon::now()->addHours(7),
        ]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Bận đột xuất',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'CANNOT_CANCEL_WITHIN_4_HOURS');

        $this->assertEquals('DaDangKy', $ticket->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-TCK-02.EX.1 (Huy ve sau moc T-4h bi chan)
     * Course: Exception (now > thoi_gian_bat_dau - 4h)
     * Expected: HTTP 409 Conflict, CANNOT_CANCEL_WITHIN_4_HOURS
     */
    public function test_cancel_ticket_after_t_minus_4h_is_rejected(): void
    {
        // Event starts in 3 hours -> past the 4h cutoff
        $event = $this->createEvent([
            'thoi_gian_bat_dau' => Carbon::now()->addHours(3),
            'thoi_gian_ket_thuc' => Carbon::now()->addHours(6),
        ]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Bận đột xuất',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'CANNOT_CANCEL_WITHIN_4_HOURS');

        $this->assertEquals('DaDangKy', $ticket->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-TCK-02 (Khong the huy ve da check-in)
     * Course: Exception (trang_thai = DaCheckIn)
     * Expected: HTTP 409 Conflict, INVALID_STATE_TRANSITION
     */
    public function test_cannot_cancel_already_checked_in_ticket(): void
    {
        $event = $this->createEvent();
        $ticket = $this->createTicket($this->studentA, $event, 'DaCheckIn');

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Lý do kiểm thử',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'INVALID_STATE_TRANSITION');
    }

    /**
     * @test
     * Target: UC-TCK-02 (Khong the huy ve da huy truoc do)
     * Course: Exception (trang_thai = DaHuy)
     * Expected: HTTP 409 Conflict, INVALID_STATE_TRANSITION
     */
    public function test_cannot_cancel_already_cancelled_ticket(): void
    {
        $event = $this->createEvent();
        $ticket = $this->createTicket($this->studentA, $event, 'DaHuy');

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Hủy lần hai',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'INVALID_STATE_TRANSITION');
    }

    /**
     * @test
     * Target: UC-TCK-02 (Chong IDOR khi huy ve)
     * Course: Exception (Sinh vien B huy ve cua Sinh vien A)
     * Expected: HTTP 403 Forbidden
     */
    public function test_non_owner_student_cannot_cancel_ticket(): void
    {
        $event = $this->createEvent();
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentB)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Hủy trộm vé',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'FORBIDDEN');

        $this->assertEquals('DaDangKy', $ticket->fresh()->trang_thai);
    }

    /**
     * @test
     * Target: UC-TCK-02 (Su kien khong gioi han slot)
     * Course: Normal Course (khong_gioi_han_slot = 1)
     * Expected: HTTP 200, so_ve_con_lai van la null
     */
    public function test_cancel_ticket_for_unlimited_slot_event_does_not_modify_slots(): void
    {
        $event = $this->createEvent([
            'khong_gioi_han_slot' => 1,
            'so_luong_toi_da' => null,
            'so_ve_con_lai' => null,
            'so_slot_dong_bang' => 0,
        ]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Bận thi online',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNull($event->fresh()->so_ve_con_lai);
    }

    /**
     * @test
     * Target: UC-TCK-02 / UC-BOOK-03 (Drain Window & Waitlist Priority)
     * Course: Normal Course (Co nguoi cho WAITING trong hang doi)
     * Expected: Nguoi dau Waitlist chuyen sang OFFERED, so_ve_con_lai KHONG duoc cong tang
     */
    public function test_cancel_ticket_offers_slot_to_first_student_in_waitlist_without_incrementing_public_slots(): void
    {
        $event = $this->createEvent(['so_ve_con_lai' => 0]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        // Student B is in waitlist with status WAITING
        $waitlistB = HangDoiWaitlist::create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $this->studentB->ma_tai_khoan,
            'so_thu_tu' => 1,
            'trang_thai' => 'WAITING',
            'thoi_gian_dang_ky' => now(),
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Nhường slot cho người đợi',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Verify Student B waitlist entry transitioned to OFFERED
        $waitlistB->refresh();
        $this->assertEquals('OFFERED', $waitlistB->trang_thai);
        $this->assertNotNull($waitlistB->han_chot_xac_nhan);

        // Verify public slots NOT incremented
        $this->assertEquals(0, $event->fresh()->so_ve_con_lai);

        // Verify notification sent to Student B
        $notif = ThongBao::where('ma_tai_khoan', $this->studentB->ma_tai_khoan)
            ->where('loai_thong_bao', 'CLAIM_SLOT')
            ->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString('nhận được suất', $notif->tieu_de);
    }

    /**
     * @test
     * Target: UC-TCK-02 / NFR-RELI-01 (Idempotency Key voi cung payload)
     * Course: Normal Course (Client retry mang lai cung ket qua)
     * Expected: HTTP 200, khong cong slot hai lan
     */
    public function test_idempotency_key_with_same_payload_returns_cached_result(): void
    {
        $event = $this->createEvent(['so_ve_con_lai' => 5]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');
        $idempotencyKey = (string) Str::uuid();

        // First attempt
        $res1 = $this->actingAs($this->studentA)
            ->withHeader('Idempotency-Key', $idempotencyKey)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Lý do retry hợp lệ',
            ]);

        $res1->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(6, $event->fresh()->so_ve_con_lai);

        // Second attempt with exact same key and payload
        $res2 = $this->actingAs($this->studentA)
            ->withHeader('Idempotency-Key', $idempotencyKey)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Lý do retry hợp lệ',
            ]);

        $res2->assertOk()
            ->assertJsonPath('success', true);

        // Crucial: slots must still be 6 (NOT 7)
        $this->assertEquals(6, $event->fresh()->so_ve_con_lai);
    }

    /**
     * @test
     * Target: UC-TCK-02 / NFR-RELI-01 (Idempotency Key voi khac payload)
     * Course: Exception
     * Expected: HTTP 409 Conflict, IDEMPOTENCY_CONFLICT
     */
    public function test_idempotency_key_with_different_payload_returns_409_conflict(): void
    {
        $event = $this->createEvent(['so_ve_con_lai' => 5]);
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');
        $idempotencyKey = (string) Str::uuid();

        // First attempt
        $res1 = $this->actingAs($this->studentA)
            ->withHeader('Idempotency-Key', $idempotencyKey)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Lý do thứ nhất',
            ]);

        $res1->assertOk();

        // Second attempt with same key but different reason
        $res2 = $this->actingAs($this->studentA)
            ->withHeader('Idempotency-Key', $idempotencyKey)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'Lý do thứ hai khác biệt',
            ]);

        $res2->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'IDEMPOTENCY_CONFLICT');
    }

    /**
     * @test
     * Target: UC-TCK-02 (Kiem tra du lieu dau vao)
     * Course: Validation Error
     * Expected: HTTP 422 Unprocessable Content
     */
    public function test_cancel_ticket_validation_errors(): void
    {
        $event = $this->createEvent();
        $ticket = $this->createTicket($this->studentA, $event, 'DaDangKy');

        // Missing ly_do_huy
        $res1 = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", []);
        $res1->assertStatus(422)
            ->assertJsonPath('success', false);

        // Reason too short (< 3 chars)
        $res2 = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/cancel", [
                'ly_do_huy' => 'ab',
            ]);
        $res2->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
