<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EventApprovalTest extends TestCase
{
    use DatabaseTransactions;

    protected User $hostUserA;

    protected User $facultyUser;

    protected User $wrongFacultyUser;

    protected User $pctsvAdmin;

    protected User $otherAdmin;

    protected User $studentUser;

    protected DonViToChuc $faculty;

    protected DonViToChuc $hostClub;

    protected DonViToChuc $otherFaculty;

    protected DonViToChuc $pctsv;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. P.CTSV unit
        $this->pctsv = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'PCTSV'],
            [
                'ma_don_vi_to_chuc' => 7,
                'ten_don_vi' => 'Phòng Công tác Sinh viên Test',
                'loai_don_vi' => 'PhongBan',
                'hoat_dong' => 1,
            ]
        );

        // 2. Faculty and Host Club
        $this->faculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_APPROVAL_TEST'],
            [
                'ten_don_vi' => 'Khoa Approval Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->hostClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_APPROVAL_TEST'],
            [
                'ten_don_vi' => 'CLB Approval Test',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
            ]
        );

        $this->otherFaculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_OTHER_APPROVAL_TEST'],
            [
                'ten_don_vi' => 'Khoa Other Approval Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        // 3. Topic and Room
        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Event Approval Test'],
            ['mo_ta' => 'Chuyên đề kiểm thử duyệt sự kiện']
        );

        $this->room = PhongHoiTruong::firstOrCreate(
            ['ma_phong' => 991],
            [
                'ten_phong' => 'Hội trường Test 991',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 200,
                'trang_thai' => 'KhaDung',
                'da_xoa' => 0,
            ]
        );

        // 4. Test Users
        $this->hostUserA = User::firstOrCreate(
            ['email' => 'host.approval.test@uit.edu.vn'],
            [
                'ho_ten' => 'Host Club Leader',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->facultyUser = User::firstOrCreate(
            ['email' => 'faculty.approval.test@uit.edu.vn'],
            [
                'ho_ten' => 'Faculty Representative',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->wrongFacultyUser = User::firstOrCreate(
            ['email' => 'wrong.faculty.approval.test@uit.edu.vn'],
            [
                'ho_ten' => 'Other Faculty Representative',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->otherFaculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->pctsvAdmin = User::firstOrCreate(
            ['email' => 'pctsv.admin.approval.test@uit.edu.vn'],
            [
                'ho_ten' => 'P.CTSV Admin Official',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => $this->pctsv->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->otherAdmin = User::firstOrCreate(
            ['email' => 'other.admin.approval.test@uit.edu.vn'],
            [
                'ho_ten' => 'Other Unit Admin',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => $this->faculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->studentUser = User::firstOrCreate(
            ['email' => 'student.test@gm.uit.edu.vn'],
            [
                'ho_ten' => 'Test Student',
                'mssv' => '99887766',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'SinhVien',
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );
    }

    protected function createTestEvent(string $status = 'PENDING_FACULTY'): SuKien
    {
        $startTime = Carbon::now()->addDays(5);
        $endTime = $startTime->copy()->addHours(3);

        $event = SuKien::create([
            'ten_su_kien' => 'Sự kiện Test Duyệt Đa Cấp '.uniqid(),
            'mo_ta' => 'Mô tả sự kiện phục vụ bài kiểm thử tích hợp',
            'ma_phong' => $this->room->ma_phong,
            'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ngay_cong_bo' => Carbon::now()->addHour(),
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 100,
            'trang_thai' => $status,
        ]);

        DatPhong::create([
            'ma_phong' => $this->room->ma_phong,
            'ma_su_kien' => $event->ma_su_kien,
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'trang_thai' => $status === 'APPROVED' ? 'CONFIRMED' : 'PENDING',
        ]);

        return $event;
    }

    /**
     * Test GET /api/v1/events/review-queue
     */
    public function test_review_queue_rejects_status_outside_openapi_enum(): void
    {
        $response = $this->actingAs($this->pctsvAdmin)
            ->getJson('/api/v1/events/review-queue?trang_thai=DRAFT');

        $response->assertStatus(422);
    }

    public function test_faculty_can_access_review_queue_for_own_clubs(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->facultyUser)
            ->getJson('/api/v1/events/review-queue');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $eventIds = collect($response->json('data'))->pluck('ma_su_kien')->all();
        $this->assertContains($event->ma_su_kien, $eventIds);
    }

    public function test_pctsv_admin_can_access_review_queue(): void
    {
        $event = $this->createTestEvent('PENDING_ADMIN');

        $response = $this->actingAs($this->pctsvAdmin)
            ->getJson('/api/v1/events/review-queue?trang_thai=PENDING_ADMIN');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $eventIds = collect($response->json('data'))->pluck('ma_su_kien')->all();
        $this->assertContains($event->ma_su_kien, $eventIds);
    }

    public function test_student_cannot_access_review_queue(): void
    {
        $response = $this->actingAs($this->studentUser)
            ->getJson('/api/v1/events/review-queue');

        $response->assertStatus(403);
    }

    /**
     * Test POST /api/v1/events/{id}/review - APPROVE_FACULTY
     */
    public function test_faculty_can_approve_event_via_review_endpoint(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->facultyUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_FACULTY',
                'ly_do' => 'Khoa đồng ý thông qua kế hoạch tổ chức',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'trang_thai' => 'PENDING_ADMIN',
                ],
            ]);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'PENDING_ADMIN',
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'APPROVE_FACULTY',
            'trang_thai_truoc' => 'PENDING_FACULTY',
            'trang_thai_sau' => 'PENDING_ADMIN',
            'nguoi_thuc_hien' => $this->facultyUser->ma_tai_khoan,
        ]);
    }

    public function test_wrong_faculty_cannot_approve_event(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->wrongFacultyUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_FACULTY',
                'ly_do' => 'Khoa khác cố tình duyệt sự kiện',
            ]);

        $response->assertStatus(403);
    }

    public function test_faculty_cannot_execute_approve_admin_action(): void
    {
        $event = $this->createTestEvent('PENDING_ADMIN');

        $response = $this->actingAs($this->facultyUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_ADMIN',
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test POST /api/v1/events/{id}/review - APPROVE_FACULTY_BY_ADMIN
     */
    public function test_pctsv_admin_can_override_faculty_approval(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_FACULTY_BY_ADMIN',
                'ly_do' => 'P.CTSV duyệt thay do đại diện Khoa đi công tác đột xuất',
                'duyet_luon_cap_phong' => false,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'trang_thai' => 'PENDING_ADMIN',
                ],
            ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'APPROVE_FACULTY_BY_ADMIN',
            'trang_thai_truoc' => 'PENDING_FACULTY',
            'trang_thai_sau' => 'PENDING_ADMIN',
            'nguoi_thuc_hien' => $this->pctsvAdmin->ma_tai_khoan,
        ]);
    }

    public function test_pctsv_admin_can_override_faculty_and_approve_final_in_one_step(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_FACULTY_BY_ADMIN',
                'ly_do' => 'P.CTSV duyệt thay cấp Khoa và cấp phòng trực tiếp',
                'duyet_luon_cap_phong' => true,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'trang_thai' => 'APPROVED',
                ],
            ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CONFIRMED',
        ]);
    }

    /**
     * Test POST /api/v1/events/{id}/review - APPROVE_ADMIN
     */
    public function test_pctsv_admin_can_approve_final_and_confirm_booking(): void
    {
        $event = $this->createTestEvent('PENDING_ADMIN');

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_ADMIN',
                'ly_do' => 'P.CTSV duyệt kế hoạch và phân bổ hội trường',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'trang_thai' => 'APPROVED',
                ],
            ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CONFIRMED',
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'APPROVE_ADMIN',
            'trang_thai_truoc' => 'PENDING_ADMIN',
            'trang_thai_sau' => 'APPROVED',
        ]);
    }

    public function test_admin_outside_pctsv_cannot_approve_final(): void
    {
        $event = $this->createTestEvent('PENDING_ADMIN');

        $response = $this->actingAs($this->otherAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'APPROVE_ADMIN',
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test POST /api/v1/events/{id}/review - REJECT_FACULTY & REJECT_ADMIN
     */
    public function test_faculty_can_reject_event_with_valid_reason(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->facultyUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'REJECT_FACULTY',
                'ly_do' => 'Nội dung chương trình chưa đáp ứng định hướng học thuật của Khoa',
            ]);

        $response->assertStatus(200);

        // In SSOT, status MUST be REJECTED (not REJECTED_FACULTY)
        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'REJECTED',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'REJECT_FACULTY',
            'trang_thai_sau' => 'REJECTED',
        ]);
    }

    public function test_reject_requires_at_least_10_characters(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->facultyUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'REJECT_FACULTY',
                'ly_do' => 'Quá ngắn',
            ]);

        $response->assertStatus(422);
    }

    public function test_pctsv_admin_can_reject_event(): void
    {
        $event = $this->createTestEvent('PENDING_ADMIN');

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'REJECT_ADMIN',
                'ly_do' => 'Không đủ điều kiện tổ chức theo quy định của Nhà trường',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'REJECTED',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CANCELLED',
        ]);
    }

    /**
     * Test POST /api/v1/events/{id}/review - REQUEST_EDIT
     */
    public function test_reviewer_can_request_edit_returning_event_to_draft(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->facultyUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/review", [
                'hanh_dong' => 'REQUEST_EDIT',
                'ly_do' => 'Vui lòng bổ sung kế hoạch chi tiết',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'DRAFT',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'REQUEST_EDIT',
            'trang_thai_truoc' => 'PENDING_FACULTY',
            'trang_thai_sau' => 'DRAFT',
        ]);
    }

    /**
     * Test POST /api/v1/events/{id}/reopen
     */
    public function test_host_can_reopen_rejected_event_to_draft(): void
    {
        $event = $this->createTestEvent('REJECTED');

        $response = $this->actingAs($this->hostUserA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/reopen");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'trang_thai' => 'DRAFT',
                ],
            ]);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'DRAFT',
        ]);
    }

    public function test_cannot_reopen_event_in_non_rejected_state(): void
    {
        $event = $this->createTestEvent('PENDING_FACULTY');

        $response = $this->actingAs($this->hostUserA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/reopen");

        $response->assertStatus(409);
    }
}
