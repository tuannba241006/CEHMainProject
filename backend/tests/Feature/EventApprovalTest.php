<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\TaiKhoanQuyen;
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
    protected User $pctsvGrantor;
    protected User $otherAdmin;

    protected DonViToChuc $faculty;
    protected DonViToChuc $hostClub;
    protected DonViToChuc $otherFaculty;
    protected DonViToChuc $pctsv;

    protected ChuyenDe $topic;
    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * 1. P.CTSV phải có ID cố định = 7
         * Không ghi đè nếu ID 7 đang thuộc đơn vị khác.
         */
        $existingPctsv = DonViToChuc::find(7);

        if ($existingPctsv) {
            $this->assertSame(
                'PCTSV',
                $existingPctsv->ma_dinh_danh,
                'ID 7 đã bị một đơn vị khác chiếm trong database test.'
            );

            $this->pctsv = $existingPctsv;
        } else {
            $this->pctsv = DonViToChuc::create([
                'ma_don_vi_to_chuc' => 7,
                'ma_dinh_danh' => 'PCTSV',
                'ten_don_vi' => 'Phòng Công tác Sinh viên Test',
                'loai_don_vi' => 'PhongBan',
                'hoat_dong' => 1,
            ]);
        }

        /*
         * 2. Tạo Khoa và CLB chủ trì trực thuộc Khoa.
         */
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

        /*
         * 3. Chuyên đề và phòng.
         */
        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Event Approval Test'],
            ['mo_ta' => 'Chuyên đề kiểm thử duyệt sự kiện']
        );

        $this->room = PhongHoiTruong::firstOrCreate(
            [
                'ten_phong' => 'Hội trường Event Approval Test',
                'co_so' => 'CoSo1',
            ],
            [
                'suc_chua_toi_da' => 100,
                'trang_thiet_bi' => ['micro' => 2, 'may_chieu' => 1],
                'trang_thai' => 'KhaDung',
            ]
        );

        /*
         * 4. Tạo tài khoản.
         */
        $this->hostUserA = $this->createUser(
            'host_approval_test@uit.edu.vn',
            'ToChuc',
            $this->hostClub->ma_don_vi_to_chuc
        );

        $this->facultyUser = $this->createUser(
            'faculty_approval_test@uit.edu.vn',
            'ToChuc',
            $this->faculty->ma_don_vi_to_chuc
        );

        $this->wrongFacultyUser = $this->createUser(
            'wrong_faculty_approval_test@uit.edu.vn',
            'ToChuc',
            $this->otherFaculty->ma_don_vi_to_chuc
        );

        $this->pctsvAdmin = $this->createUser(
            'pctsv_admin_approval_test@uit.edu.vn',
            'Admin',
            7
        );

        $this->pctsvGrantor = $this->createUser(
            'pctsv_grantor_approval_test@uit.edu.vn',
            'Admin',
            7
        );

        $this->otherAdmin = $this->createUser(
            'other_admin_approval_test@uit.edu.vn',
            'Admin',
            $this->otherFaculty->ma_don_vi_to_chuc
        );
    }

    protected function createUser(
        string $email,
        string $type,
        int $unitId
    ): User {
        return User::firstOrCreate(
            ['email' => $email],
            [
                'ho_ten' => 'Approval Test User',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => $type,
                'ma_don_vi_to_chuc' => $unitId,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );
    }

    protected function validEventPayload(array $overrides = []): array
    {
        $start = Carbon::now()->addDays(5)->setTime(8, 0, 0);
        $end = $start->copy()->addHours(3);
        $published = Carbon::now()->addDays(2)->setTime(8, 0, 0);

        return array_merge([
            'ten_su_kien' => 'Sự kiện kiểm thử duyệt nhiều cấp',
            'mo_ta' => 'Mô tả sự kiện phục vụ kiểm thử quy trình phê duyệt',
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ngay_cong_bo' => $published->toIso8601String(),
            'thoi_gian_bat_dau' => $start->toIso8601String(),
            'thoi_gian_ket_thuc' => $end->toIso8601String(),
            'khong_gioi_han_slot' => false,
            'so_luong_toi_da' => 80,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0.0,
            'danh_sach_co_host_ids' => [],
        ], $overrides);
    }

    protected function createSubmittedEvent(): int
    {
        $response = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());

        $response->assertStatus(201);

        $eventId = (int) $response->json('data.ma_su_kien');

        $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/submit-approval")
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'PENDING_FACULTY');

        return $eventId;
    }

    protected function createPendingAdminEvent(): int
    {
        $eventId = $this->createSubmittedEvent();

        $this->actingAs($this->facultyUser)
            ->postJson("/api/events/{$eventId}/approve-faculty")
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'PENDING_ADMIN');

        return $eventId;
    }

    protected function grantEmergencyPermission(): void
    {
        TaiKhoanQuyen::create([
            'ma_tai_khoan' => $this->pctsvAdmin->ma_tai_khoan,
            'quyen' => 'emergency_override',
            'nguoi_cap' => $this->pctsvGrantor->ma_tai_khoan,
            'ly_do_cap' => 'Cấp quyền phục vụ kiểm thử duyệt khẩn cấp',
            'thoi_gian_cap' => now(),
        ]);
    }

    protected function assertAudit(
        int $eventId,
        string $action,
        string $previousStatus,
        string $nextStatus,
        int $actorId,
        ?string $reason = null
    ): void {
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $eventId,
            'hanh_dong' => $action,
            'trang_thai_truoc' => $previousStatus,
            'trang_thai_sau' => $nextStatus,
            'nguoi_thuc_hien' => $actorId,
            'ly_do' => $reason,
        ]);
    }

    /**
     * Host B duyệt:
     * PENDING_FACULTY -> PENDING_ADMIN.
     */
    public function test_faculty_can_approve_event_to_pending_admin(): void
    {
        $eventId = $this->createSubmittedEvent();

        $this->actingAs($this->facultyUser)
            ->postJson("/api/events/{$eventId}/approve-faculty")
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'PENDING_ADMIN');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_ADMIN',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING',
        ]);

        $this->assertAudit(
            $eventId,
            'APPROVE_FACULTY',
            'PENDING_FACULTY',
            'PENDING_ADMIN',
            $this->facultyUser->ma_tai_khoan
        );
    }

    /**
     * Host B từ chối:
     * PENDING_FACULTY -> REJECTED_FACULTY.
     */
    public function test_faculty_can_reject_event_and_cancel_booking(): void
    {
        $eventId = $this->createSubmittedEvent();
        $reason = 'Không phù hợp kế hoạch hoạt động của Khoa';

        $this->actingAs($this->facultyUser)
            ->postJson("/api/events/{$eventId}/reject-faculty", [
                'ly_do' => $reason,
            ])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'REJECTED_FACULTY');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'REJECTED_FACULTY',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'CANCELLED',
        ]);

        $this->assertAudit(
            $eventId,
            'REJECT_FACULTY',
            'PENDING_FACULTY',
            'REJECTED_FACULTY',
            $this->facultyUser->ma_tai_khoan,
            $reason
        );
    }

    /**
     * Tài khoản thuộc Khoa khác không được duyệt.
     */
    public function test_wrong_faculty_cannot_approve_event(): void
    {
        $eventId = $this->createSubmittedEvent();

        $this->actingAs($this->wrongFacultyUser)
            ->postJson("/api/events/{$eventId}/approve-faculty")
            ->assertStatus(403)
            ->assertJsonPath('error', 'FACULTY_MISMATCH');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_FACULTY',
        ]);
    }

    /**
     * Admin override trước 48 giờ, không phải emergency -> 409.
     */
    public function test_admin_override_before_48_hours_requires_emergency_permission(): void
    {
        $eventId = $this->createSubmittedEvent();

        $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/events/{$eventId}/admin-override", [
                'ly_do' => 'Khoa chưa xử lý đề xuất này',
            ])
            ->assertStatus(409)
            ->assertJsonPath('error', 'OVERRIDE_WAIT_PERIOD_NOT_PASSED');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_FACULTY',
        ]);
    }

    /**
     * Đánh dấu emergency nhưng không có permission -> 403.
     */
    public function test_emergency_override_without_permission_is_forbidden(): void
    {
        $eventId = $this->createSubmittedEvent();

        $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/events/{$eventId}/admin-override", [
                'ly_do' => 'Cần duyệt khẩn cấp do sự kiện sắp diễn ra',
                'duyet_khan_cap' => true,
            ])
            ->assertStatus(403)
            ->assertJsonPath('error', 'EMERGENCY_OVERRIDE_PERMISSION_REQUIRED');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_FACULTY',
        ]);
    }

    /**
     * Emergency có permission:
     * PENDING_FACULTY -> PENDING_ADMIN.
     */
    public function test_emergency_override_with_permission_succeeds_and_logs_reason(): void
    {
        $eventId = $this->createSubmittedEvent();
        $this->grantEmergencyPermission();

        $reason = 'Cần duyệt khẩn cấp do thời hạn tổ chức sắp đến';

        $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/events/{$eventId}/admin-override", [
                'ly_do' => $reason,
                'duyet_khan_cap' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'PENDING_ADMIN');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_ADMIN',
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $eventId,
            'hanh_dong' => 'APPROVE_FACULTY_BY_ADMIN',
            'trang_thai_truoc' => 'PENDING_FACULTY',
            'trang_thai_sau' => 'PENDING_ADMIN',
            'nguoi_thuc_hien' => $this->pctsvAdmin->ma_tai_khoan,
            'ly_do' => '[DUYỆT KHẨN CẤP] ' . $reason,
        ]);
    }

    /**
     * Đủ 48 giờ:
     * Admin được override mà không cần emergency permission.
     */
    public function test_admin_can_override_after_48_hours_without_emergency_permission(): void
    {
        $submittedAt = Carbon::parse('2026-11-01 08:00:00', 'Asia/Ho_Chi_Minh');
        Carbon::setTestNow($submittedAt);

        try {
            $eventId = $this->createSubmittedEvent();

            Carbon::setTestNow($submittedAt->copy()->addHours(48));

            $reason = 'Khoa chưa phản hồi sau thời gian chờ';

            $this->actingAs($this->pctsvAdmin)
                ->postJson("/api/events/{$eventId}/admin-override", [
                    'ly_do' => $reason,
                ])
                ->assertOk()
                ->assertJsonPath('data.trang_thai', 'PENDING_ADMIN');

            $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
                'ma_su_kien' => $eventId,
                'hanh_dong' => 'APPROVE_FACULTY_BY_ADMIN',
                'trang_thai_truoc' => 'PENDING_FACULTY',
                'trang_thai_sau' => 'PENDING_ADMIN',
                'nguoi_thuc_hien' => $this->pctsvAdmin->ma_tai_khoan,
                'ly_do' => $reason,
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    /**
     * Admin PCTSV duyệt cuối:
     * PENDING_ADMIN -> APPROVED.
     * Booking PENDING -> CONFIRMED.
     */
    public function test_pctsv_admin_can_approve_final_and_confirm_booking(): void
    {
        $eventId = $this->createPendingAdminEvent();

        $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/events/{$eventId}/approve-admin")
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'APPROVED');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'APPROVED',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'CONFIRMED',
            'han_giu_cho_tam' => null,
        ]);

        $this->assertAudit(
            $eventId,
            'APPROVE_ADMIN',
            'PENDING_ADMIN',
            'APPROVED',
            $this->pctsvAdmin->ma_tai_khoan
        );
    }

    /**
     * Admin PCTSV từ chối cấp cuối:
     * PENDING_ADMIN -> REJECTED_ADMIN.
     */
    public function test_pctsv_admin_can_reject_and_cancel_booking(): void
    {
        $eventId = $this->createPendingAdminEvent();
        $reason = 'Không đáp ứng yêu cầu tổ chức cấp trường';

        $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/events/{$eventId}/reject-admin", [
                'ly_do' => $reason,
            ])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', 'REJECTED_ADMIN');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'REJECTED_ADMIN',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'CANCELLED',
            'han_giu_cho_tam' => null,
        ]);

        $this->assertAudit(
            $eventId,
            'REJECT_ADMIN',
            'PENDING_ADMIN',
            'REJECTED_ADMIN',
            $this->pctsvAdmin->ma_tai_khoan,
            $reason
        );
    }

    /**
     * Admin không thuộc P.CTSV không được duyệt cuối.
     */
    public function test_admin_outside_pctsv_cannot_approve_final(): void
    {
        $eventId = $this->createPendingAdminEvent();

        $this->actingAs($this->otherAdmin)
            ->postJson("/api/events/{$eventId}/approve-admin")
            ->assertStatus(403)
            ->assertJsonPath('error', 'FORBIDDEN');

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_ADMIN',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING',
        ]);
    }

/**
 * Không có Faculty Reviewer đang hoạt động:
 * Admin PCTSV được override ngay, không cần emergency permission.
 */
public function test_admin_can_override_immediately_when_faculty_has_no_active_reviewer(): void
{
    $eventId = $this->createSubmittedEvent();

    $this->facultyUser->update(['hoat_dong' => 0]);

    $reason = 'Khoa hiện không có người duyệt sự kiện hoạt động';

    $this->actingAs($this->pctsvAdmin)
        ->postJson("/api/events/{$eventId}/admin-override", [
            'ly_do' => $reason,
        ])
        ->assertOk()
        ->assertJsonPath('data.trang_thai', 'PENDING_ADMIN');

    $this->assertAudit(
        $eventId,
        'APPROVE_FACULTY_BY_ADMIN',
        'PENDING_FACULTY',
        'PENDING_ADMIN',
        $this->pctsvAdmin->ma_tai_khoan,
        $reason
    );
}

/**
 * Tài khoản ToChuc thuộc CLB con không phải Faculty Reviewer.
 * Khi không có Faculty Reviewer thuộc Khoa gốc, Admin được override ngay.
 */
public function test_child_club_account_does_not_count_as_faculty_reviewer(): void
{
    $eventId = $this->createSubmittedEvent();

    $this->facultyUser->update(['hoat_dong' => 0]);

    // Host A thuộc CLB con vẫn hoạt động.
    $this->assertDatabaseHas('tai_khoan', [
        'ma_tai_khoan' => $this->hostUserA->ma_tai_khoan,
        'hoat_dong' => 1,
    ]);

    $reason = 'Khoa không có Faculty Reviewer đang hoạt động';

    $this->actingAs($this->pctsvAdmin)
        ->postJson("/api/events/{$eventId}/admin-override", [
            'ly_do' => $reason,
        ])
        ->assertOk()
        ->assertJsonPath('data.trang_thai', 'PENDING_ADMIN');
}

/**
 * Đã đủ 48 giờ nhưng vẫn đánh dấu emergency:
 * Vẫn phải có emergency_override.
 */
public function test_emergency_override_after_48_hours_still_requires_permission(): void
{
    $submittedAt = Carbon::parse('2026-11-01 08:00:00', 'Asia/Ho_Chi_Minh');
    Carbon::setTestNow($submittedAt);

    try {
        $eventId = $this->createSubmittedEvent();

        Carbon::setTestNow($submittedAt->copy()->addHours(48));

        $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/events/{$eventId}/admin-override", [
                'ly_do' => 'Cần duyệt khẩn cấp dù đã đủ thời gian chờ',
                'duyet_khan_cap' => true,
            ])
            ->assertStatus(403)
            ->assertJsonPath(
                'error',
                'EMERGENCY_OVERRIDE_PERMISSION_REQUIRED'
            );

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $eventId,
            'trang_thai' => 'PENDING_FACULTY',
        ]);
    } finally {
        Carbon::setTestNow();
    }
}

/**
 * Quyền emergency_override đã bị thu hồi:
 * Không thể sử dụng quyền đó để duyệt khẩn cấp.
 */
public function test_revoked_emergency_permission_cannot_be_used(): void
{
    $eventId = $this->createSubmittedEvent();

    $permission = TaiKhoanQuyen::create([
        'ma_tai_khoan' => $this->pctsvAdmin->ma_tai_khoan,
        'quyen' => 'emergency_override',
        'nguoi_cap' => $this->pctsvGrantor->ma_tai_khoan,
        'ly_do_cap' => 'Cấp quyền phục vụ kiểm thử',
        'thoi_gian_cap' => now(),
    ]);

    $permission->update([
        'nguoi_thu_hoi' => $this->pctsvGrantor->ma_tai_khoan,
        'ly_do_thu_hoi' => 'Thu hồi quyền sau kiểm thử',
        'thoi_gian_thu_hoi' => now(),
    ]);

    $this->assertFalse(
        $this->pctsvAdmin->fresh()->hasPermission('emergency_override')
    );

    $this->actingAs($this->pctsvAdmin)
        ->postJson("/api/events/{$eventId}/admin-override", [
            'ly_do' => 'Cần duyệt khẩn cấp do thời hạn tổ chức sắp đến',
            'duyet_khan_cap' => true,
        ])
        ->assertStatus(403)
        ->assertJsonPath(
            'error',
            'EMERGENCY_OVERRIDE_PERMISSION_REQUIRED'
        );
}

/**
 * Admin không hoạt động:
 * Không thể sử dụng emergency_override dù bản ghi quyền còn hiệu lực.
 */
public function test_inactive_admin_cannot_use_emergency_permission(): void
{
    $eventId = $this->createSubmittedEvent();

    $this->grantEmergencyPermission();

    $this->pctsvAdmin->update(['hoat_dong' => 0]);

    $this->assertFalse(
        $this->pctsvAdmin->fresh()->hasPermission('emergency_override')
    );

    $this->actingAs($this->pctsvAdmin)
        ->postJson("/api/events/{$eventId}/admin-override", [
            'ly_do' => 'Cần duyệt khẩn cấp do thời hạn tổ chức sắp đến',
            'duyet_khan_cap' => true,
        ])
        ->assertForbidden();
}

}