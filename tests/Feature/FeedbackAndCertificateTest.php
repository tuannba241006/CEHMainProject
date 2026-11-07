<?php

namespace Tests\Feature;

use App\Models\ChungNhan;
use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DanhGiaFeedback;
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

class FeedbackAndCertificateTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected User $studentA;

    protected User $studentB;

    protected DonViToChuc $donVi;

    protected ChuyenDe $chuyenDe;

    protected PhongHoiTruong $room;

    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cryptoService = app(CryptoService::class);

        $this->donVi = DonViToChuc::first() ?? DonViToChuc::create([
            'ten_don_vi' => 'Khoa Hệ thống Thông tin',
            'ma_dinh_danh' => 'KHTTT_'.Str::random(5),
            'loai_don_vi' => 'Khoa',
            'email' => 'httt_'.Str::random(5).'@uit.edu.vn',
        ]);

        $this->chuyenDe = ChuyenDe::first() ?? ChuyenDe::create([
            'ten_chuyen_de' => 'Học thuật '.Str::random(5),
            'da_xoa' => false,
        ]);

        $this->room = PhongHoiTruong::first() ?? PhongHoiTruong::create([
            'ma_phong' => 'E_'.Str::random(4),
            'ten_phong' => 'Hội trường E',
            'co_so' => 'CoSo1',
            'suc_chua_toi_da' => 200,
            'trang_thai' => 'KhaDung',
        ]);

        $this->admin = User::create([
            'mssv' => null,
            'email' => 'admin_'.Str::random(6).'@uit.edu.vn',
            'mat_khau' => Hash::make('AdminPass@123'),
            'ho_ten' => 'Ban Quản Trị P.CTSV',
            'loai_tai_khoan' => 'Admin',
            'ma_don_vi_to_chuc' => $this->donVi->ma_don_vi_to_chuc,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        $this->studentA = User::create([
            'mssv' => '2252'.str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT),
            'email' => 'student_a_'.Str::random(6).'@gm.uit.edu.vn',
            'mat_khau' => Hash::make('StudentPass@123'),
            'ho_ten' => 'Nguyễn Văn An',
            'loai_tai_khoan' => 'SinhVien',
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
            'dong_y_nghi_dinh_13' => true,
        ]);

        $this->studentB = User::create([
            'mssv' => '2252'.str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT),
            'email' => 'student_b_'.Str::random(6).'@gm.uit.edu.vn',
            'mat_khau' => Hash::make('StudentPass@123'),
            'ho_ten' => 'Trần Thị Bình',
            'loai_tai_khoan' => 'SinhVien',
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
            'dong_y_nghi_dinh_13' => true,
        ]);
    }

    /**
     * Helper to create a completed event.
     */
    protected function createCompletedEvent(int $hoursAgoEnded = 2): SuKien
    {
        $endTime = now()->subHours($hoursAgoEnded);
        $startTime = $endTime->copy()->subHours(2);

        return SuKien::create([
            'ten_su_kien' => 'Hội thảo AI trong Kỹ nghệ Phần mềm '.Str::random(5),
            'mo_ta' => 'Hội thảo chuyên môn về Generative AI.',
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_don_vi_to_chuc' => $this->donVi->ma_don_vi_to_chuc,
            'ma_phong' => $this->room->ma_phong,
            'ngay_cong_bo' => $startTime->copy()->subDays(5),
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 50,
            'khong_gioi_han_slot' => false,
            'diem_drl_du_kien' => 5,
            'dieu_khoan_drl' => 'Dieu3',
            'trang_thai' => 'COMPLETED',
            'cong_check_in_mo' => true,
            'cong_check_out_mo' => true,
            'da_chot_drl' => false,
        ]);
    }

    /**
     * Helper to create a ticket for a student.
     */
    protected function createTicket(
        SuKien $event,
        User $student,
        string $status = 'DaCheckOut',
        float $tiLeDrl = 1.0,
        bool $daCheckOut = true,
        bool $daFeedback = false,
        bool $duDieuKienDrl = false
    ): DangKy {
        $uuid = (string) Str::uuid();
        $hmac = $this->cryptoService->signTicket($uuid, $student->ma_tai_khoan, $event->ma_su_kien);

        return DangKy::create([
            'ma_ve_uuid' => $uuid,
            'chu_ky_hmac' => $hmac,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'trang_thai' => $status,
            'da_check_in' => true,
            'da_check_out' => $daCheckOut,
            'thoi_gian_check_in' => $event->thoi_gian_bat_dau,
            'thoi_gian_check_out' => $daCheckOut ? $event->thoi_gian_ket_thuc : null,
            'ti_le_drl' => $tiLeDrl,
            'da_feedback' => $daFeedback,
            'du_dieu_kien_drl' => $duDieuKienDrl,
            'vi_pham_no_show' => false,
            'nghi_van_gian_lan' => false,
            'thoi_gian_dang_ky' => now()->subDays(2),
        ]);
    }

    // =========================================================================
    // TASK 1: CEH-P2-FEED-01 (Feedback 48h & Admin Grace Period)
    // =========================================================================

    /**
     * @test
     * Target: UC-FEED-01 (Event Feedback Survey 48h)
     * Course: Normal Course
     * Expected: HTTP 201 Created, feedback recorded, da_feedback=1, du_dieu_kien_drl=1
     */
    public function test_student_can_submit_feedback_for_completed_event_within_48h(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true);

        $payload = [
            'diem_noi_dung' => 5,
            'diem_dien_gia' => 5,
            'diem_to_chuc' => 4,
            'y_kien_dong_gop' => 'Hội thảo rất bổ ích, mong khoa tổ chức thêm.',
        ];

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_dang_ky' => $ticket->ma_dang_ky,
                    'da_feedback' => true,
                    'du_dieu_kien_drl' => true,
                ],
            ]);

        $this->assertDatabaseHas('danh_gia_feedback', [
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_su_kien' => $event->ma_su_kien,
            'diem_noi_dung' => 5,
            'diem_dien_gia' => 5,
            'diem_to_chuc' => 4,
        ]);

        $freshTicket = $ticket->fresh();
        $this->assertTrue((bool) $freshTicket->da_feedback);
        $this->assertTrue((bool) $freshTicket->du_dieu_kien_drl);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Event not in COMPLETED status)
     * Expected: HTTP 409 Conflict, NOT_ELIGIBLE
     */
    public function test_submit_feedback_fails_when_event_not_completed(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 1);
        $event->update(['trang_thai' => 'HAPPENING']);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 5,
                'diem_dien_gia' => 5,
                'diem_to_chuc' => 5,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'NOT_ELIGIBLE',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Student has not completed check-out)
     * Expected: HTTP 403 Forbidden, NOT_ELIGIBLE
     */
    public function test_submit_feedback_fails_when_student_has_not_checked_out(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 2);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckIn', tiLeDrl: 0.0, daCheckOut: false);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 5,
                'diem_dien_gia' => 5,
                'diem_to_chuc' => 5,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'NOT_ELIGIBLE',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Student attendance ratio ti_le_drl is 0)
     * Expected: HTTP 403 Forbidden, NOT_ELIGIBLE
     */
    public function test_submit_feedback_fails_when_student_ti_le_drl_is_zero(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 2);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 0.0, daCheckOut: true);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 5,
                'diem_dien_gia' => 5,
                'diem_to_chuc' => 5,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'NOT_ELIGIBLE',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Student does not own ticket for the event)
     * Expected: HTTP 403 Forbidden, FORBIDDEN
     */
    public function test_submit_feedback_fails_when_student_does_not_own_ticket(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 2);

        $response = $this->actingAs($this->studentB)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 5,
                'diem_dien_gia' => 5,
                'diem_to_chuc' => 5,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Feedback already submitted)
     * Expected: HTTP 409 Conflict, FEEDBACK_ALREADY_SUBMITTED
     */
    public function test_submit_feedback_fails_when_already_submitted(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 5);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true);

        DanhGiaFeedback::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_su_kien' => $event->ma_su_kien,
            'diem_noi_dung' => 5,
            'diem_dien_gia' => 5,
            'diem_to_chuc' => 5,
            'thoi_gian_gui' => now(),
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 4,
                'diem_dien_gia' => 4,
                'diem_to_chuc' => 4,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'FEEDBACK_ALREADY_SUBMITTED',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception UC-FEED-01.EX.1 (48h window expired, no grace period)
     * Expected: HTTP 409 Conflict, FEEDBACK_WINDOW_CLOSED
     */
    public function test_submit_feedback_fails_when_48h_window_expired(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 49);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 5,
                'diem_dien_gia' => 5,
                'diem_to_chuc' => 5,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'FEEDBACK_WINDOW_CLOSED',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Alternative Course UC-FEED-01.AC.1 (Admin grants 24h grace)
     * Expected: HTTP 200 OK, han_an_han_feedback set, audit log recorded
     */
    public function test_admin_can_grant_24h_feedback_grace_period(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 50);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/tickets/{$ticket->ma_dang_ky}/feedback-grace", [
                'ly_do' => 'Cứu xét khiếu nại điểm danh sau 48h, mở ân hạn 24h để hoàn tất khảo sát',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_dang_ky' => $ticket->ma_dang_ky,
                ],
            ]);

        $freshTicket = $ticket->fresh();
        $this->assertNotNull($freshTicket->han_an_han_feedback);
        $this->assertTrue(Carbon::parse($freshTicket->han_an_han_feedback)->gt(now()->addHours(23)));

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'hanh_dong' => 'GRANT_FEEDBACK_GRACE',
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan_muc_tieu' => $this->studentA->ma_tai_khoan,
            'nguoi_thuc_hien' => $this->admin->ma_tai_khoan,
        ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Alternative Course UC-FEED-01.AC.1
     * Expected: Student can submit feedback within grace period after 48h
     */
    public function test_student_can_submit_feedback_within_admin_granted_grace_period_after_48h(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 50);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true);

        // Grant 24h grace
        $ticket->update(['han_an_han_feedback' => now()->addHours(24)]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/feedback", [
                'diem_noi_dung' => 5,
                'diem_dien_gia' => 4,
                'diem_to_chuc' => 5,
                'y_kien_dong_gop' => 'Nộp khảo sát trong thời gian ân hạn hợp lệ.',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'da_feedback' => true,
                    'du_dieu_kien_drl' => true,
                ],
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Non-admin cannot grant grace)
     * Expected: HTTP 403 Forbidden
     */
    public function test_non_admin_cannot_grant_feedback_grace(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 50);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/admin/tickets/{$ticket->ma_dang_ky}/feedback-grace", [
                'ly_do' => 'Tự xin ân hạn không được phép',
            ]);

        $response->assertStatus(403);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Cannot grant grace if student already submitted feedback)
     * Expected: HTTP 409 Conflict, FEEDBACK_ALREADY_SUBMITTED
     */
    public function test_grant_feedback_grace_fails_if_feedback_already_submitted(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/tickets/{$ticket->ma_dang_ky}/feedback-grace", [
                'ly_do' => 'Cấp ân hạn thừa',
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'FEEDBACK_ALREADY_SUBMITTED',
            ]);
    }

    /**
     * @test
     * Target: UC-FEED-01
     * Course: Exception (Cannot grant grace if DRL is locked)
     * Expected: HTTP 409 Conflict, DRL_LOCKED
     */
    public function test_grant_feedback_grace_fails_if_event_drl_locked(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 50);
        $event->update([
            'da_chot_drl' => true,
            'thoi_gian_chot_drl' => now(),
        ]);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/tickets/{$ticket->ma_dang_ky}/feedback-grace", [
                'ly_do' => 'Cấp ân hạn khi đã chốt sổ ĐRL',
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'DRL_LOCKED',
            ]);
    }

    // =========================================================================
    // TASK 2: CEH-P2-CERT-01 (e-Certificate HMAC, PII Masking & Revocation)
    // =========================================================================

    /**
     * @test
     * Target: UC-CERT-01 (e-Certificate Issue)
     * Course: Normal Course
     * Expected: HTTP 201 Created, certificate issued with HMAC hash, da_thu_hoi=0
     */
    public function test_student_can_issue_certificate_when_eligible(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket(
            $event,
            $this->studentA,
            status: 'DaCheckOut',
            tiLeDrl: 1.0,
            daCheckOut: true,
            daFeedback: true,
            duDieuKienDrl: true
        );

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/certificate");

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Khởi tạo Giấy chứng nhận số thành công',
                'data' => [
                    'ma_dang_ky' => $ticket->ma_dang_ky,
                    'ma_tai_khoan' => $this->studentA->ma_tai_khoan,
                    'ma_su_kien' => $event->ma_su_kien,
                    'da_thu_hoi' => false,
                    'ty_le_tham_du_pct' => 100.0,
                    'diem_drl_thuc_nhan' => 5.0,
                ],
            ]);

        $certHash = $response->json('data.ma_hash');
        $this->assertEquals(64, strlen($certHash));

        // Verify HMAC signature via CryptoService
        $this->assertTrue($this->cryptoService->verifyCertificate(
            $certHash,
            $ticket->ma_dang_ky,
            $this->studentA->ma_tai_khoan,
            $event->ma_su_kien
        ));

        $this->assertDatabaseHas('chung_nhan', [
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $certHash,
            'da_thu_hoi' => false,
        ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Normal Course (Idempotency)
     * Expected: HTTP 200 OK on repeated calls with identical certificate
     */
    public function test_issue_certificate_is_idempotent(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        // First call -> 201 Created
        $firstResponse = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/certificate");
        $firstResponse->assertStatus(201);
        $firstHash = $firstResponse->json('data.ma_hash');

        // Second call -> 200 OK with same certificate
        $secondResponse = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/certificate");
        $secondResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Lấy thông tin Giấy chứng nhận thành công',
                'data' => [
                    'ma_hash' => $firstHash,
                ],
            ]);

        $this->assertEquals(1, ChungNhan::where('ma_dang_ky', $ticket->ma_dang_ky)->count());
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Exception (Student not eligible: du_dieu_kien_drl is false or ti_le_drl < 0.5)
     * Expected: HTTP 403 Forbidden, NOT_ELIGIBLE
     */
    public function test_cannot_issue_certificate_when_not_eligible(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        // du_dieu_kien_drl is false
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 0.0, daCheckOut: true, daFeedback: false, duDieuKienDrl: false);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/certificate");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'NOT_ELIGIBLE',
            ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Exception (Student B attempts to issue certificate for Student A's ticket)
     * Expected: HTTP 403 Forbidden, FORBIDDEN
     */
    public function test_cannot_issue_certificate_for_another_students_ticket(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $response = $this->actingAs($this->studentB)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/certificate");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN',
            ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Normal Course (My Certificates List)
     * Expected: HTTP 200 OK, paginated list of student's certificates
     */
    public function test_student_can_view_my_certificates(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
        ]);

        $response = $this->actingAs($this->studentA)
            ->getJson('/api/v1/certificates/my-certificates');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'ma_dang_ky',
                        'ma_hash',
                        'ten_su_kien',
                        'don_vi_to_chuc',
                        'ngay_cap',
                        'da_thu_hoi',
                    ],
                ],
                'meta' => [
                    'trang_hien_tai',
                    'tong_so_trang',
                    'tong_so_ban_ghi',
                    'kich_thuoc_trang',
                ],
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Normal Course (Download PDF)
     * Expected: HTTP 200 OK, Content-Type: application/pdf, starts with %PDF-
     */
    public function test_student_can_download_certificate_pdf(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
        ]);

        $response = $this->actingAs($this->studentA)
            ->get("/api/v1/certificates/{$cert->id}/download");

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringStartsWith('%PDF-1.4', $response->getContent());
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Exception (Non-owner student cannot download PDF)
     * Expected: HTTP 403 Forbidden, FORBIDDEN
     */
    public function test_non_owner_student_cannot_download_certificate_pdf(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
        ]);

        $response = $this->actingAs($this->studentB)
            ->getJson("/api/v1/certificates/{$cert->id}/download");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN',
            ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Alternative Course UC-CERT-01.AC.1 (Public Verification & Decree 13 PII Masking)
     * Expected: HTTP 200 OK, masked name (Nguyễn V** A) and MSSV (2252****)
     */
    public function test_public_verification_returns_masked_pii_under_decree_13(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
        ]);

        // Public call without authentication
        $response = $this->getJson("/api/v1/certificates/verify/{$hash}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trang_thai' => 'HOP_LE',
                    'da_thu_hoi' => false,
                    'ho_ten_che_mo' => 'Nguyễn V** A',
                    'mssv_che_mo' => substr($this->studentA->mssv, 0, 4).'****',
                    'ten_su_kien' => $event->ten_su_kien,
                    'don_vi_to_chuc' => $this->donVi->ten_don_vi,
                ],
            ]);

        // Ensure real email or internal IDs are NEVER leaked
        $json = $response->getContent();
        $this->assertStringNotContainsString($this->studentA->email, $json);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Exception (Unknown certificate hash)
     * Expected: HTTP 404 Not Found
     */
    public function test_public_verification_returns_404_for_unknown_hash(): void
    {
        $unknownHash = str_repeat('a', 64);
        $response = $this->getJson("/api/v1/certificates/verify/{$unknownHash}");

        $response->assertStatus(404);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Alternative Course UC-CERT-01.AC.2 (Admin revokes certificate)
     * Expected: HTTP 200 OK, da_thu_hoi=1, audit log recorded with REVOKE_CERTIFICATE
     */
    public function test_admin_can_revoke_certificate(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/certificates/{$cert->id}/revoke", [
                'ly_do_thu_hoi' => 'Phát hiện vi phạm quy chế điểm danh sau hậu kiểm CTSV',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Đã thu hồi Giấy chứng nhận số',
                'data' => [
                    'id' => $cert->id,
                    'da_thu_hoi' => true,
                ],
            ]);

        $freshCert = $cert->fresh();
        $this->assertTrue((bool) $freshCert->da_thu_hoi);
        $this->assertNotNull($freshCert->thoi_gian_thu_hoi);
        $this->assertEquals($this->admin->ma_tai_khoan, $freshCert->nguoi_thu_hoi);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'hanh_dong' => 'REVOKE_CERTIFICATE',
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan_muc_tieu' => $this->studentA->ma_tai_khoan,
            'nguoi_thuc_hien' => $this->admin->ma_tai_khoan,
        ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Alternative Course UC-CERT-01.AC.1 + AC.2
     * Expected: Public verify of revoked cert returns DA_THU_HOI and null for all PII fields
     */
    public function test_revoked_certificate_shows_da_thu_hoi_and_null_pii_on_public_verify(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => true,
            'thoi_gian_thu_hoi' => now(),
            'nguoi_thu_hoi' => $this->admin->ma_tai_khoan,
        ]);

        $response = $this->getJson("/api/v1/certificates/verify/{$hash}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trang_thai' => 'DA_THU_HOI',
                    'da_thu_hoi' => true,
                    'ho_ten_che_mo' => null,
                    'mssv_che_mo' => null,
                    'ten_su_kien' => null,
                    'don_vi_to_chuc' => null,
                    'ngay_cap' => null,
                ],
            ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Exception (Cannot download PDF of revoked certificate)
     * Expected: HTTP 403 Forbidden, CERT_REVOKED
     */
    public function test_cannot_download_revoked_certificate_pdf(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        $cert = ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => true,
            'thoi_gian_thu_hoi' => now(),
            'nguoi_thu_hoi' => $this->admin->ma_tai_khoan,
        ]);

        $response = $this->actingAs($this->studentA)
            ->getJson("/api/v1/certificates/{$cert->id}/download");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'CERT_REVOKED',
            ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Exception (Cannot fetch or reissue revoked certificate via /tickets/{id}/certificate)
     * Expected: HTTP 403 Forbidden, CERT_REVOKED
     */
    public function test_cannot_fetch_or_reissue_revoked_certificate(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticket = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        $hash = $this->cryptoService->signCertificate($ticket->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien);
        ChungNhan::create([
            'ma_dang_ky' => $ticket->ma_dang_ky,
            'ma_hash' => $hash,
            'ngay_cap' => now(),
            'da_thu_hoi' => true,
            'thoi_gian_thu_hoi' => now(),
            'nguoi_thu_hoi' => $this->admin->ma_tai_khoan,
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/tickets/{$ticket->ma_dang_ky}/certificate");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'CERT_REVOKED',
            ]);
    }

    /**
     * @test
     * Target: UC-CERT-01
     * Course: Normal Course (Admin list certificates with filters)
     * Expected: HTTP 200 OK, paginated list matching query
     */
    public function test_admin_can_list_certificates_with_filter_and_search(): void
    {
        $event = $this->createCompletedEvent(hoursAgoEnded: 10);
        $ticketA = $this->createTicket($event, $this->studentA, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);
        $ticketB = $this->createTicket($event, $this->studentB, status: 'DaCheckOut', tiLeDrl: 1.0, daCheckOut: true, daFeedback: true, duDieuKienDrl: true);

        ChungNhan::create([
            'ma_dang_ky' => $ticketA->ma_dang_ky,
            'ma_hash' => $this->cryptoService->signCertificate($ticketA->ma_dang_ky, $this->studentA->ma_tai_khoan, $event->ma_su_kien),
            'ngay_cap' => now(),
            'da_thu_hoi' => false,
        ]);

        ChungNhan::create([
            'ma_dang_ky' => $ticketB->ma_dang_ky,
            'ma_hash' => $this->cryptoService->signCertificate($ticketB->ma_dang_ky, $this->studentB->ma_tai_khoan, $event->ma_su_kien),
            'ngay_cap' => now(),
            'da_thu_hoi' => true,
            'thoi_gian_thu_hoi' => now(),
            'nguoi_thu_hoi' => $this->admin->ma_tai_khoan,
        ]);

        // Search by student A's MSSV
        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/certificates?q={$this->studentA->mssv}&da_thu_hoi=false");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($ticketA->ma_dang_ky, $response->json('data.0.ma_dang_ky'));
    }
}
