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

class EventLifecycleTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;

    protected User $hostUserA;

    protected User $cohostUserB;

    protected User $facultyUser;

    protected DonViToChuc $donViFaculty;

    protected DonViToChuc $donViHostClubA;

    protected DonViToChuc $donViCohostClubB;

    protected ChuyenDe $chuyenDe;

    protected PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Tạo Khoa và CLB trực thuộc Khoa
        $this->donViFaculty = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_CNTT_TEST'],
            [
                'ten_don_vi' => 'Khoa Công nghệ Thông tin Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->donViHostClubA = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_DEV_A_TEST'],
            [
                'ten_don_vi' => 'CLB Lập trình A Test',
                'loai_don_vi' => 'CLB',
                'ma_don_vi_cha' => $this->donViFaculty->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
            ]
        );

        $this->donViCohostClubB = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_DESIGN_B_TEST'],
            [
                'ten_don_vi' => 'CLB Thiết kế B Test',
                'loai_don_vi' => 'CLB',
                'hoat_dong' => 1,
            ]
        );

        // 2. Chuyên đề
        $this->chuyenDe = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Công nghệ PKG02 Test'],
            ['mo_ta' => 'Chuyên đề test']
        );

        // 3. Phòng hội trường (Sức chứa 100)
        $this->room = PhongHoiTruong::firstOrCreate(
            ['ten_phong' => 'Hội trường Test PKG02', 'co_so' => 'CoSo1'],
            [
                'suc_chua_toi_da' => 100,
                'trang_thiet_bi' => ['micro' => 2, 'may_chieu' => 1],
                'trang_thai' => 'KhaDung',
            ]
        );

        // 4. Users
        $this->adminUser = User::firstOrCreate(
            ['email' => 'admin_pkg02_test@uit.edu.vn'],
            [
                'ho_ten' => 'Admin PKG02 Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'Admin',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->hostUserA = User::firstOrCreate(
            ['email' => 'host_a_test@uit.edu.vn'],
            [
                'ho_ten' => 'Host A User Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->donViHostClubA->ma_don_vi_to_chuc,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->cohostUserB = User::firstOrCreate(
            ['email' => 'cohost_b_test@uit.edu.vn'],
            [
                'ho_ten' => 'Cohost B User Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->donViCohostClubB->ma_don_vi_to_chuc,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        $this->facultyUser = User::firstOrCreate(
            ['email' => 'faculty_cntt_test@uit.edu.vn'],
            [
                'ho_ten' => 'Faculty Reviewer Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->donViFaculty->ma_don_vi_to_chuc,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );
    }

    /**
     * Helper tạo payload sự kiện hợp lệ trong tương lai.
     */
    protected function validEventPayload(array $overrides = []): array
    {
        $start = Carbon::now()->addDays(5)->setTime(8, 0, 0);
        $end = $start->copy()->addHours(3);
        $published = Carbon::now()->addDays(2)->setTime(8, 0, 0);

        return array_merge([
            'ten_su_kien' => 'Hội thảo Công nghệ Mẫu PKG-02',
            'mo_ta' => 'Mô tả chi tiết sự kiện công nghệ cho sinh viên',
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ngay_cong_bo' => $published->toIso8601String(),
            'thoi_gian_bat_dau' => $start->toIso8601String(),
            'thoi_gian_ket_thuc' => $end->toIso8601String(),
            'khong_gioi_han_slot' => false,
            'so_luong_toi_da' => 80,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0.0,
            'danh_sach_co_host_ids' => [$this->donViCohostClubB->ma_don_vi_to_chuc],
        ], $overrides);
    }

    public function test_create_event_draft_success(): void
    {
        $payload = $this->validEventPayload();

        $response = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Lưu bản nháp sự kiện thành công',
                'data' => [
                    'ten_su_kien' => $payload['ten_su_kien'],
                    'trang_thai' => 'DRAFT',
                    'so_luong_toi_da' => 80,
                    'so_ve_con_lai' => 80,
                ],
            ]);

        $this->assertDatabaseHas('su_kien', [
            'ten_su_kien' => $payload['ten_su_kien'],
            'trang_thai' => 'DRAFT',
            'ma_don_vi_to_chuc' => $this->donViHostClubA->ma_don_vi_to_chuc,
        ]);

        $this->assertDatabaseHas('su_kien_dong_to_chuc', [
            'ma_don_vi_to_chuc' => $this->donViCohostClubB->ma_don_vi_to_chuc,
            'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
        ]);
    }

    public function test_create_event_draft_fails_when_start_time_in_past(): void
    {
        $payload = $this->validEventPayload([
            'thoi_gian_bat_dau' => Carbon::now()->subDay()->toIso8601String(),
            'thoi_gian_ket_thuc' => Carbon::now()->addHours(2)->toIso8601String(),
            'ngay_cong_bo' => Carbon::now()->subDays(2)->toIso8601String(),
        ]);

        $response = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $payload);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'START_IN_PAST',
            ]);
    }

    public function test_create_event_draft_fails_when_capacity_exceeds_room(): void
    {
        // Room capacity = 100, payload asks for 150
        $payload = $this->validEventPayload([
            'so_luong_toi_da' => 150,
        ]);

        $response = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $payload);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'CAPACITY_EXCEEDS_ROOM',
            ]);
    }

    public function test_create_event_draft_fails_when_topic_deleted(): void
    {
        $deletedTopic = ChuyenDe::create([
            'ten_chuyen_de' => 'Chuyên đề Đã Xóa Test',
            'da_xoa' => 1,
        ]);

        $payload = $this->validEventPayload([
            'ma_chuyen_de' => $deletedTopic->ma_chuyen_de,
        ]);

        $response = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'TOPIC_DELETED',
            ]);
    }

    public function test_create_event_draft_fails_when_cohost_contains_host_unit(): void
    {
        $payload = $this->validEventPayload([
            'danh_sach_co_host_ids' => [
                $this->donViHostClubA->ma_don_vi_to_chuc, // trùng host
                $this->donViCohostClubB->ma_don_vi_to_chuc,
            ],
        ]);

        $response = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);
    }

    public function test_update_event_draft_success(): void
    {
        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());
        $eventId = $createResponse->json('data.ma_su_kien');

        $updatePayload = $this->validEventPayload([
            'ten_su_kien' => 'Tiêu đề sự kiện đã được cập nhật',
            'so_luong_toi_da' => 90,
            'danh_sach_co_host_ids' => [], // Xóa co-hosts
        ]);

        $response = $this->actingAs($this->hostUserA)
            ->putJson("/api/events/{$eventId}", $updatePayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Cập nhật bản nháp sự kiện thành công',
                'data' => [
                    'ten_su_kien' => 'Tiêu đề sự kiện đã được cập nhật',
                    'so_luong_toi_da' => 90,
                    'so_ve_con_lai' => 90,
                ],
            ]);

        $this->assertDatabaseMissing('su_kien_dong_to_chuc', [
            'ma_su_kien' => $eventId,
        ]);
    }

    public function test_update_event_draft_fails_when_not_in_draft_state(): void
    {
        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());
        $eventId = $createResponse->json('data.ma_su_kien');

        // Giả lập chuyển trạng thái sang WAITING_COHOST_CONFIRM
        SuKien::where('ma_su_kien', $eventId)->update(['trang_thai' => 'WAITING_COHOST_CONFIRM']);

        $response = $this->actingAs($this->hostUserA)
            ->putJson("/api/events/{$eventId}", $this->validEventPayload());

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'INVALID_STATE_TRANSITION',
            ]);
    }

    public function test_submit_approval_with_cohost_transitions_to_waiting_cohost_and_sets_48h_hold(): void
    {
        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());
        $eventId = $createResponse->json('data.ma_su_kien');

        $response = $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/submit-approval");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Đã gửi đề xuất phê duyệt sự kiện',
                'data' => [
                    'trang_thai' => 'WAITING_COHOST_CONFIRM',
                ],
            ]);

        // Kiểm tra dat_phong được tạo với trạng thái PENDING và hạn giữ chỗ ~48h
        $datPhong = DatPhong::where('ma_su_kien', $eventId)->first();
        $this->assertNotNull($datPhong);
        $this->assertEquals('PENDING', $datPhong->trang_thai);
        $this->assertNotNull($datPhong->han_giu_cho_tam);
        $this->assertTrue(Carbon::parse($datPhong->han_giu_cho_tam)->isFuture());

        // Kiểm tra audit log
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $eventId,
            'hanh_dong' => 'SUBMIT',
            'trang_thai_truoc' => 'DRAFT',
            'trang_thai_sau' => 'WAITING_COHOST_CONFIRM',
        ]);
    }

    public function test_submit_approval_without_cohost_routes_to_pending_faculty_for_club(): void
    {
        // Host A là CLB có ma_don_vi_cha (Khoa CNTT)
        $payload = $this->validEventPayload([
            'danh_sach_co_host_ids' => [],
        ]);

        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $payload);
        $eventId = $createResponse->json('data.ma_su_kien');

        $response = $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/submit-approval");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trang_thai' => 'PENDING_FACULTY',
                ],
            ]);
    }

    public function test_cohost_respond_accept_clears_soft_hold_when_100_percent_agreed(): void
    {
        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());
        $eventId = $createResponse->json('data.ma_su_kien');

        // Gửi duyệt
        $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/submit-approval");

        // Co-host B đồng ý
        $response = $this->actingAs($this->cohostUserB)
            ->postJson("/api/events/{$eventId}/co-host-respond", [
                'trang_thai_xac_nhan' => 'DONG_Y',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trang_thai' => 'PENDING_FACULTY',
                ],
            ]);

        // Kiểm tra han_giu_cho_tam đã được xóa về NULL
        $datPhong = DatPhong::where('ma_su_kien', $eventId)->first();
        $this->assertNull($datPhong->han_giu_cho_tam);

        // Kiểm tra trạng thái lời mời đã là DONG_Y
        $this->assertDatabaseHas('su_kien_dong_to_chuc', [
            'ma_su_kien' => $eventId,
            'ma_don_vi_to_chuc' => $this->donViCohostClubB->ma_don_vi_to_chuc,
            'trang_thai_xac_nhan' => 'DONG_Y',
        ]);
    }

    public function test_cohost_respond_reject_cancels_booking_and_moves_to_cohost_rejected(): void
    {
        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());
        $eventId = $createResponse->json('data.ma_su_kien');

        $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/submit-approval");

        // Co-host B từ chối với lý do >= 5 ký tự
        $response = $this->actingAs($this->cohostUserB)
            ->postJson("/api/events/{$eventId}/co-host-respond", [
                'trang_thai_xac_nhan' => 'TU_CHOI',
                'ghi_chu_tu_choi' => 'Trùng lịch đại hội CLB Thiết kế',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trang_thai' => 'COHOST_REJECTED',
                ],
            ]);

        // Kiểm tra dat_phong bị CANCELLED
        $datPhong = DatPhong::where('ma_su_kien', $eventId)->first();
        $this->assertEquals('CANCELLED', $datPhong->trang_thai);

        // Kiểm tra audit log
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $eventId,
            'hanh_dong' => 'COHOST_REJECT',
            'trang_thai_sau' => 'COHOST_REJECTED',
            'ly_do' => 'Trùng lịch đại hội CLB Thiết kế',
        ]);
    }

    public function test_withdraw_proposal_resets_event_to_draft_and_cancels_hold(): void
    {
        $createResponse = $this->actingAs($this->hostUserA)
            ->postJson('/api/events', $this->validEventPayload());
        $eventId = $createResponse->json('data.ma_su_kien');

        $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/submit-approval");

        // Host A rút đề xuất
        $response = $this->actingAs($this->hostUserA)
            ->postJson("/api/events/{$eventId}/withdraw", [
                'ly_do_rut' => 'Cần bổ sung thêm diễn giả mới',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trang_thai' => 'DRAFT',
                ],
            ]);

        // Kiểm tra dat_phong bị CANCELLED
        $datPhong = DatPhong::where('ma_su_kien', $eventId)->first();
        $this->assertEquals('CANCELLED', $datPhong->trang_thai);

        // Kiểm tra audit log WITHDRAW_PROPOSAL
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $eventId,
            'hanh_dong' => 'WITHDRAW_PROPOSAL',
            'trang_thai_truoc' => 'WAITING_COHOST_CONFIRM',
            'trang_thai_sau' => 'DRAFT',
            'ly_do' => 'Cần bổ sung thêm diễn giả mới',
        ]);
    }
}
