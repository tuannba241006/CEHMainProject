<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\SuKienDongToChuc;
use App\Models\User;
use App\Services\CryptoService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class DrlAccreditationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected User $hostOrganizer;

    protected User $otherOrganizer;

    protected User $studentA;

    protected User $studentB;

    protected DonViToChuc $donViHost;

    protected DonViToChuc $donViCohost;

    protected DonViToChuc $donViOther;

    protected ChuyenDe $chuyenDe;

    protected PhongHoiTruong $room;

    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cryptoService = app(CryptoService::class);

        $this->donViHost = DonViToChuc::create([
            'ten_don_vi' => 'Khoa Hệ thống Thông tin '.Str::random(4),
            'ma_dinh_danh' => 'KHTTT_'.Str::random(5),
            'loai_don_vi' => 'Khoa',
        ]);

        $this->donViCohost = DonViToChuc::create([
            'ten_don_vi' => 'CLB WebDev '.Str::random(4),
            'ma_dinh_danh' => 'WEBDEV_'.Str::random(5),
            'loai_don_vi' => 'CLB',
        ]);

        $this->donViOther = DonViToChuc::create([
            'ten_don_vi' => 'Khoa Khoa học Máy tính '.Str::random(4),
            'ma_dinh_danh' => 'KHMT_'.Str::random(5),
            'loai_don_vi' => 'Khoa',
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
            'ma_don_vi_to_chuc' => $this->donViHost->ma_don_vi_to_chuc,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        $this->hostOrganizer = User::create([
            'mssv' => null,
            'email' => 'org_host_'.Str::random(6).'@uit.edu.vn',
            'mat_khau' => Hash::make('OrgPass@123'),
            'ho_ten' => 'BTC Host Khoa HTTT',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => $this->donViHost->ma_don_vi_to_chuc,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        $this->otherOrganizer = User::create([
            'mssv' => null,
            'email' => 'org_other_'.Str::random(6).'@uit.edu.vn',
            'mat_khau' => Hash::make('OrgPass@123'),
            'ho_ten' => 'BTC Khác Khoa KHMT',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => $this->donViOther->ma_don_vi_to_chuc,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        $this->studentA = User::create([
            'mssv' => '2252'.str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT),
            'email' => 'student_a_'.Str::random(6).'@gm.uit.edu.vn',
            'mat_khau' => Hash::make('StudentPass@123'),
            'ho_ten' => 'Nguyễn Văn An',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
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
            'lop_sinh_hoat' => 'KHMT2022',
            'khoa' => 'Khoa Khoa học Máy tính',
            'loai_tai_khoan' => 'SinhVien',
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
            'dong_y_nghi_dinh_13' => true,
        ]);
    }

    /**
     * Helper to create an event with custom completed timing and lock state.
     */
    protected function createEvent(
        string $status = 'COMPLETED',
        int $hoursAgoEnded = 50,
        bool $daChotDrl = false,
        bool $unlimited = false
    ): SuKien {
        $endTime = now()->subHours($hoursAgoEnded);
        $startTime = $endTime->copy()->subHours(2);

        return SuKien::create([
            'ten_su_kien' => 'Hội thảo AI & DRL '.Str::random(5),
            'mo_ta' => 'Hội thảo công nghệ và chuyển đổi số.',
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_don_vi_to_chuc' => $this->donViHost->ma_don_vi_to_chuc,
            'ma_phong' => $this->room->ma_phong,
            'ngay_cong_bo' => $startTime->copy()->subDays(5),
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'so_luong_toi_da' => $unlimited ? null : 100,
            'so_ve_con_lai' => $unlimited ? null : 50,
            'khong_gioi_han_slot' => $unlimited,
            'diem_drl_du_kien' => 5,
            'dieu_khoan_drl' => 'Dieu3',
            'trang_thai' => $status,
            'cong_check_in_mo' => true,
            'cong_check_out_mo' => true,
            'da_chot_drl' => $daChotDrl,
            'thoi_gian_chot_drl' => $daChotDrl ? now()->subHour() : null,
        ]);
    }

    /**
     * Helper to create an attendee ticket eligible for DRL.
     */
    protected function createEligibleTicket(
        SuKien $event,
        User $student,
        float $tiLeDrl = 1.0,
        bool $daCheckOut = true,
        bool $daFeedback = true,
        bool $duDieuKienDrl = true
    ): DangKy {
        $uuid = (string) Str::uuid();
        $hmac = $this->cryptoService->signTicket($uuid, $student->ma_tai_khoan, $event->ma_su_kien);

        $checkInTime = Carbon::parse($event->thoi_gian_bat_dau)->addMinutes(10);
        $checkOutTime = Carbon::parse($event->thoi_gian_ket_thuc)->subMinutes(5);

        return DangKy::create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $student->ma_tai_khoan,
            'ma_ve_uuid' => $uuid,
            'chu_ky_hmac' => $hmac,
            'trang_thai' => $daCheckOut ? 'DaCheckOut' : 'DaCheckIn',
            'da_check_in' => true,
            'da_check_out' => $daCheckOut,
            'thoi_gian_check_in' => $checkInTime,
            'thoi_gian_check_out' => $daCheckOut ? $checkOutTime : null,
            'ti_le_drl' => $tiLeDrl,
            'tham_gia_tron_ven' => $tiLeDrl == 1.0,
            'tham_gia_mot_phan' => $tiLeDrl == 0.5,
            'du_dieu_kien_drl' => $duDieuKienDrl,
            'da_feedback' => $daFeedback,
            'han_an_han_feedback' => null,
            'thoi_gian_dang_ky' => Carbon::parse($event->thoi_gian_bat_dau)->subDays(2),
        ]);
    }

    // =========================================================================
    // UC-DRL-01: GET /api/v1/events/{id}/drl
    // =========================================================================

    /**
     * @test
     * Target: UC-DRL-01 (View DRL List)
     * Course: Normal Course (Host Organizer views DRL list)
     * Expected: HTTP 200, DrlRecord list with correct schema and pagination meta.
     */
    public function test_host_organizer_can_view_drl_list(): void
    {
        $event = $this->createEvent('COMPLETED', 50);
        $this->createEligibleTicket($event, $this->studentA, 1.0);
        $this->createEligibleTicket($event, $this->studentB, 0.5);

        $response = $this->actingAs($this->hostOrganizer)
            ->getJson("/api/v1/events/{$event->ma_su_kien}/drl");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'stt',
                        'mssv',
                        'ho_ten',
                        'lop_sinh_hoat',
                        'khoa',
                        'ten_su_kien',
                        'dieu_drl',
                        'diem_cong_thuc_nhan',
                        'thoi_gian_vao',
                        'thoi_gian_ra',
                        'thoi_luong_tham_du_phut',
                        'ghi_chu_tham_du',
                    ],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'server_time',
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    /**
     * @test
     * Target: UC-DRL-01 (View DRL List)
     * Course: Normal Course (Admin views DRL list)
     * Expected: HTTP 200.
     */
    public function test_admin_can_view_drl_list(): void
    {
        $event = $this->createEvent('COMPLETED', 50);
        $this->createEligibleTicket($event, $this->studentA, 1.0);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/events/{$event->ma_su_kien}/drl");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * @test
     * Target: UC-DRL-01 (View DRL List)
     * Course: Exception (Other organizer cannot view DRL list)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_other_organizer_cannot_view_drl_list(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        $response = $this->actingAs($this->otherOrganizer)
            ->getJson("/api/v1/events/{$event->ma_su_kien}/drl");

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'FORBIDDEN');
    }

    /**
     * @test
     * Target: UC-DRL-01 (View DRL List)
     * Course: Exception (Student cannot view event DRL list)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_student_cannot_view_drl_list(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        $response = $this->actingAs($this->studentA)
            ->getJson("/api/v1/events/{$event->ma_su_kien}/drl");

        $response->assertStatus(403);
    }

    /**
     * @test
     * Target: UC-DRL-01 (View DRL List)
     * Course: Exception (Guest unauthenticated)
     * Expected: HTTP 401 Unauthorized.
     */
    public function test_guest_cannot_view_drl_list_unauthenticated(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        $response = $this->getJson("/api/v1/events/{$event->ma_su_kien}/drl");

        $response->assertStatus(401);
    }

    /**
     * @test
     * Target: UC-DRL-01 (View DRL List)
     * Course: Exception (Event not found)
     * Expected: HTTP 404 Not Found.
     */
    public function test_view_drl_list_returns_404_when_event_not_found(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/events/999999/drl');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'NOT_FOUND');
    }

    // =========================================================================
    // UC-DRL-01: POST /api/v1/events/{id}/drl/lock
    // =========================================================================

    /**
     * @test
     * Target: UC-DRL-01 (Lock DRL)
     * Course: Normal Course (Host locks DRL after 48h)
     * Expected: HTTP 200, da_chot_drl updated, Audit log LOCK_DRL created.
     */
    public function test_host_can_lock_drl_when_completed_and_after_48h(): void
    {
        $event = $this->createEvent('COMPLETED', 50, false);

        $response = $this->actingAs($this->hostOrganizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/lock");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.da_chot_drl', true)
            ->assertJsonPath('data.file_export_url', "/api/v1/events/{$event->ma_su_kien}/drl/export");

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'da_chot_drl' => true,
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'nguoi_thuc_hien' => $this->hostOrganizer->ma_tai_khoan,
            'hanh_dong' => 'LOCK_DRL',
        ]);
    }

    /**
     * @test
     * Target: UC-DRL-01 (Lock DRL)
     * Course: Normal Course (Admin locks DRL)
     * Expected: HTTP 200.
     */
    public function test_admin_can_lock_drl(): void
    {
        $event = $this->createEvent('COMPLETED', 50, false);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/lock");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.da_chot_drl', true);
    }

    /**
     * @test
     * Target: UC-DRL-01 (Lock DRL)
     * Course: Exception (Cannot lock when event not completed)
     * Expected: HTTP 409 DRL_NOT_READY.
     */
    public function test_cannot_lock_drl_when_event_not_completed(): void
    {
        $event = $this->createEvent('PUBLISHED', 50, false);

        $response = $this->actingAs($this->hostOrganizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/lock");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'DRL_NOT_READY');
    }

    /**
     * @test
     * Target: UC-DRL-01 (Lock DRL)
     * Course: Exception (Cannot lock within 48h feedback window)
     * Expected: HTTP 409 DRL_NOT_READY.
     */
    public function test_cannot_lock_drl_within_48h_window(): void
    {
        // Event ended only 2 hours ago (within 48h)
        $event = $this->createEvent('COMPLETED', 2, false);

        $response = $this->actingAs($this->hostOrganizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/lock");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'DRL_NOT_READY');
    }

    /**
     * @test
     * Target: UC-DRL-01 (Lock DRL)
     * Course: Exception (Cannot lock when already locked)
     * Expected: HTTP 409 DRL_LOCKED.
     */
    public function test_cannot_lock_drl_twice(): void
    {
        $event = $this->createEvent('COMPLETED', 50, true);

        $response = $this->actingAs($this->hostOrganizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/lock");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'DRL_LOCKED');
    }

    /**
     * @test
     * Target: UC-DRL-01 (Lock DRL)
     * Course: Exception (Other organizer cannot lock DRL)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_other_organizer_cannot_lock_drl(): void
    {
        $event = $this->createEvent('COMPLETED', 50, false);

        $response = $this->actingAs($this->otherOrganizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/lock");

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'FORBIDDEN');
    }

    // =========================================================================
    // UC-DRL-01.AC.1: POST /api/v1/events/{id}/drl/unlock
    // =========================================================================

    /**
     * @test
     * Target: UC-DRL-01.AC.1 (Admin Unlock DRL)
     * Course: Normal Course (Admin unlocks DRL with valid reason)
     * Expected: HTTP 200, da_chot_drl reset to 0, Audit log UNLOCK_DRL created.
     */
    public function test_admin_can_unlock_drl_with_valid_reason(): void
    {
        $event = $this->createEvent('COMPLETED', 50, true);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/unlock", [
                'ly_do' => 'Cứu xét sai sót hành chính điểm danh bổ sung',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'da_chot_drl' => false,
            'thoi_gian_chot_drl' => null,
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'nguoi_thuc_hien' => $this->admin->ma_tai_khoan,
            'hanh_dong' => 'UNLOCK_DRL',
            'ly_do' => 'Cứu xét sai sót hành chính điểm danh bổ sung',
        ]);
    }

    /**
     * @test
     * Target: UC-DRL-01.AC.1 (Admin Unlock DRL)
     * Course: Exception (Short reason fails validation)
     * Expected: HTTP 422 Validation Error.
     */
    public function test_unlock_drl_fails_with_short_reason(): void
    {
        $event = $this->createEvent('COMPLETED', 50, true);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/unlock", [
                'ly_do' => 'Quá ngắn',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ly_do']);
    }

    /**
     * @test
     * Target: UC-DRL-01.AC.1 (Admin Unlock DRL)
     * Course: Exception (Non-admin cannot unlock DRL)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_non_admin_cannot_unlock_drl(): void
    {
        $event = $this->createEvent('COMPLETED', 50, true);

        $response = $this->actingAs($this->hostOrganizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/unlock", [
                'ly_do' => 'Mở khóa để sửa điểm danh sinh viên',
            ]);

        $response->assertStatus(403);
    }

    /**
     * @test
     * Target: UC-DRL-01.AC.1 (Admin Unlock DRL)
     * Course: Exception (Cannot unlock when not currently locked)
     * Expected: HTTP 409 INVALID_STATE_TRANSITION.
     */
    public function test_cannot_unlock_drl_when_not_locked(): void
    {
        $event = $this->createEvent('COMPLETED', 50, false);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/drl/unlock", [
                'ly_do' => 'Cứu xét sai sót hành chính điểm danh',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'INVALID_STATE_TRANSITION');
    }

    // =========================================================================
    // UC-DRL-01: GET /api/v1/events/{id}/drl/export
    // =========================================================================

    /**
     * @test
     * Target: UC-DRL-01 (Export DRL Excel)
     * Course: Normal Course (Host exports binary XLSX)
     * Expected: HTTP 200, Content-Type openxmlformats, valid ZIP binary header.
     */
    public function test_host_can_export_drl_xlsx_file(): void
    {
        $event = $this->createEvent('COMPLETED', 50);
        $this->createEligibleTicket($event, $this->studentA, 1.0);

        $response = $this->actingAs($this->hostOrganizer)
            ->get("/api/v1/events/{$event->ma_su_kien}/drl/export");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $content = $response->getContent();
        // Standard Zip PK header: "PK\x03\x04"
        $this->assertStringStartsWith("PK\x03\x04", $content);
        $this->assertGreaterThan(1000, strlen($content));
    }

    /**
     * @test
     * Target: UC-DRL-01 (Export DRL CSV)
     * Course: Alternative Course (Host exports CSV with BOM)
     * Expected: HTTP 200, UTF-8 BOM, 12 columns in header row.
     */
    public function test_host_can_export_drl_csv_file(): void
    {
        $event = $this->createEvent('COMPLETED', 50);
        $this->createEligibleTicket($event, $this->studentA, 1.0);

        $response = $this->actingAs($this->hostOrganizer)
            ->get("/api/v1/events/{$event->ma_su_kien}/drl/export?format=csv");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $content = $response->getContent();
        // UTF-8 BOM: \xEF\xBB\xBF
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('STT,MSSV,"Họ và tên"', $content);
        $this->assertStringContainsString($this->studentA->mssv, $content);
    }

    /**
     * @test
     * Target: UC-DRL-01 (Export DRL)
     * Course: Exception (Cannot export when event not completed)
     * Expected: HTTP 409 DRL_NOT_READY.
     */
    public function test_cannot_export_drl_when_event_not_completed(): void
    {
        $event = $this->createEvent('PUBLISHED', 50);

        $response = $this->actingAs($this->hostOrganizer)
            ->getJson("/api/v1/events/{$event->ma_su_kien}/drl/export");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'DRL_NOT_READY');
    }

    /**
     * @test
     * Target: UC-DRL-01 (Export DRL)
     * Course: Exception (Other organizer cannot export DRL)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_other_organizer_cannot_export_drl(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        $response = $this->actingAs($this->otherOrganizer)
            ->getJson("/api/v1/events/{$event->ma_su_kien}/drl/export");

        $response->assertStatus(403);
    }

    // =========================================================================
    // UC-REP-01: GET /api/v1/organizer/events/{id}/analytics
    // =========================================================================

    /**
     * @test
     * Target: UC-REP-01 (Organizer Event Analytics)
     * Course: Normal Course (Host views analytics)
     * Expected: HTTP 200, matching OrganizerDashboard schema.
     */
    public function test_host_can_view_event_analytics(): void
    {
        $event = $this->createEvent('COMPLETED', 50);
        $this->createEligibleTicket($event, $this->studentA, 1.0);
        $this->createEligibleTicket($event, $this->studentB, 0.5);

        $response = $this->actingAs($this->hostOrganizer)
            ->getJson("/api/v1/organizer/events/{$event->ma_su_kien}/analytics");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'ma_su_kien',
                    'khong_gioi_han_slot',
                    'so_luong_toi_da',
                    'tong_ve_dang_ky',
                    'so_luong_check_in',
                    'so_luong_check_out',
                    'ty_le_lap_day_pct',
                    'ty_le_show_up_pct',
                    'so_luong_no_show',
                    'ty_le_no_show_pct',
                    'diem_noi_dung_tb',
                    'diem_dien_gia_tb',
                    'diem_to_chuc_tb',
                    'phan_bo_theo_khoa',
                    'luu_luong_theo_khung_gio',
                ],
                'server_time',
            ]);

        $this->assertEquals(2, $response->json('data.tong_ve_dang_ky'));
        $this->assertEquals(2, $response->json('data.so_luong_check_in'));
        $this->assertEquals(2, $response->json('data.so_luong_check_out'));
    }

    /**
     * @test
     * Target: UC-REP-01 (Organizer Event Analytics)
     * Course: Alternative Course (Confirmed Co-host views analytics)
     * Expected: HTTP 200.
     */
    public function test_confirmed_cohost_can_view_event_analytics(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        SuKienDongToChuc::create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_don_vi_to_chuc' => $this->donViCohost->ma_don_vi_to_chuc,
            'trang_thai_xac_nhan' => 'DONG_Y',
            'thoi_gian_phan_hoi' => now(),
        ]);

        $cohostUser = User::create([
            'mssv' => null,
            'email' => 'cohost_'.Str::random(6).'@uit.edu.vn',
            'mat_khau' => Hash::make('Pass@123'),
            'ho_ten' => 'BTC Co-host',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => $this->donViCohost->ma_don_vi_to_chuc,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        $response = $this->actingAs($cohostUser)
            ->getJson("/api/v1/organizer/events/{$event->ma_su_kien}/analytics");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * @test
     * Target: UC-REP-01 (Organizer Event Analytics)
     * Course: Exception (Unconfirmed Co-host cannot view analytics)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_unconfirmed_cohost_cannot_view_event_analytics(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        SuKienDongToChuc::create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_don_vi_to_chuc' => $this->donViCohost->ma_don_vi_to_chuc,
            'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
        ]);

        $cohostUser = User::create([
            'mssv' => null,
            'email' => 'cohost_pen_'.Str::random(6).'@uit.edu.vn',
            'mat_khau' => Hash::make('Pass@123'),
            'ho_ten' => 'BTC Pending Co-host',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => $this->donViCohost->ma_don_vi_to_chuc,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        $response = $this->actingAs($cohostUser)
            ->getJson("/api/v1/organizer/events/{$event->ma_su_kien}/analytics");

        $response->assertStatus(403);
    }

    /**
     * @test
     * Target: UC-REP-01 (Organizer Event Analytics)
     * Course: Exception (Other club cannot view event analytics)
     * Expected: HTTP 403 Forbidden.
     */
    public function test_other_club_cannot_view_event_analytics(): void
    {
        $event = $this->createEvent('COMPLETED', 50);

        $response = $this->actingAs($this->otherOrganizer)
            ->getJson("/api/v1/organizer/events/{$event->ma_su_kien}/analytics");

        $response->assertStatus(403);
    }

    /**
     * @test
     * Target: UC-REP-01 (Organizer Event Analytics)
     * Course: Alternative Course (Unlimited slot event nullifies no-show stats)
     * Expected: HTTP 200, so_luong_no_show and ty_le_no_show_pct are null.
     */
    public function test_analytics_for_unlimited_slot_event_nullifies_no_show(): void
    {
        $event = $this->createEvent('COMPLETED', 50, false, true);
        $this->createEligibleTicket($event, $this->studentA, 1.0);

        $response = $this->actingAs($this->hostOrganizer)
            ->getJson("/api/v1/organizer/events/{$event->ma_su_kien}/analytics");

        $response->assertStatus(200)
            ->assertJsonPath('data.khong_gioi_han_slot', true)
            ->assertJsonPath('data.so_luong_toi_da', null)
            ->assertJsonPath('data.so_luong_no_show', null)
            ->assertJsonPath('data.ty_le_no_show_pct', null)
            ->assertJsonPath('data.ty_le_lap_day_pct', null);
    }

    public function test_analytics_reports_exact_registration_and_attendance_counts(): void
    {
        $event = $this->createEvent('COMPLETED', 50);
        $this->createEligibleTicket($event, $this->studentA, 1.0);
        $this->createEligibleTicket($event, $this->studentB, 0.5);

        $response = $this->actingAs($this->hostOrganizer)
            ->getJson("/api/v1/organizer/events/{$event->ma_su_kien}/analytics");

        $response->assertOk()
            ->assertJsonPath('data.tong_ve_dang_ky', 2)
            ->assertJsonPath('data.so_luong_check_in', 2)
            ->assertJsonPath('data.so_luong_check_out', 2)
            ->assertJsonPath('data.so_luong_no_show', 0);
    }

    /**
     * @test
     * Target: Cross-package Invariant (PKG-09 & PKG-11)
     * Course: Verify that manual attendance override is blocked when DRL is locked
     * Expected: HTTP 409 DRL_LOCKED.
     */
    public function test_manual_attendance_override_is_blocked_when_drl_is_locked(): void
    {
        $event = $this->createEvent('COMPLETED', 50, true);
        $ticket = $this->createEligibleTicket($event, $this->studentA, 1.0);

        $response = $this->actingAs($this->hostOrganizer)
            ->postJson('/api/v1/attendance/manual-override', [
                'ma_dang_ky' => $ticket->ma_dang_ky,
                'trang_thai_moi' => 'DaCheckOut',
                'ti_le_drl_moi' => 1.0,
                'ly_do' => 'Điều chỉnh điểm danh cho sinh viên sau sự kiện',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'DRL_LOCKED');
    }
}
