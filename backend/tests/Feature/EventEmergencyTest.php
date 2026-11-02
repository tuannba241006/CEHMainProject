<?php

namespace Tests\Feature;

use App\Mail\EventEmergencyMailable;
use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\HangDoiWaitlist;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class EventEmergencyTest extends TestCase
{
    use DatabaseTransactions;

    protected User $hostUser;

    protected User $otherHostUser;

    protected User $pctsvAdmin;

    protected User $studentUser1;

    protected User $studentUser2;

    protected DonViToChuc $hostClub;

    protected DonViToChuc $otherClub;

    protected DonViToChuc $pctsv;

    protected ChuyenDe $topic;

    protected PhongHoiTruong $room1;

    protected PhongHoiTruong $room2;

    protected PhongHoiTruong $smallRoom;

    protected PhongHoiTruong $maintenanceRoom;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pctsv = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'PCTSV'],
            [
                'ma_don_vi_to_chuc' => 7,
                'ten_don_vi' => 'Phòng Công tác Sinh viên Test',
                'loai_don_vi' => 'PhongBan',
                'hoat_dong' => 1,
            ]
        );

        $this->hostClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_EMERGENCY_HOST'],
            [
                'ten_don_vi' => 'CLB Emergency Host',
                'loai_don_vi' => 'CLB',
                'hoat_dong' => 1,
            ]
        );

        $this->otherClub = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'CLB_EMERGENCY_OTHER'],
            [
                'ten_don_vi' => 'CLB Emergency Other',
                'loai_don_vi' => 'CLB',
                'hoat_dong' => 1,
            ]
        );

        $this->topic = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Chuyên đề Emergency Test'],
            ['mo_ta' => 'Chuyên đề kiểm thử hủy khẩn cấp và đổi phòng']
        );

        $this->room1 = PhongHoiTruong::firstOrCreate(
            ['ma_phong' => 981],
            [
                'ten_phong' => 'Hội trường Test 981',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 300,
                'trang_thai' => 'KhaDung',
                'da_xoa' => 0,
            ]
        );

        $this->room2 = PhongHoiTruong::firstOrCreate(
            ['ma_phong' => 982],
            [
                'ten_phong' => 'Hội trường Test 982',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 350,
                'trang_thai' => 'KhaDung',
                'da_xoa' => 0,
            ]
        );

        $this->smallRoom = PhongHoiTruong::firstOrCreate(
            ['ma_phong' => 983],
            [
                'ten_phong' => 'Phòng nhỏ Test 983',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 30, // Nhỏ hơn 100 vé
                'trang_thai' => 'KhaDung',
                'da_xoa' => 0,
            ]
        );

        $this->maintenanceRoom = PhongHoiTruong::firstOrCreate(
            ['ma_phong' => 984],
            [
                'ten_phong' => 'Phòng bảo trì Test 984',
                'co_so' => 'CoSo1',
                'suc_chua_toi_da' => 400,
                'trang_thai' => 'BaoTri',
                'bao_tri_tu_ngay' => Carbon::now()->subDay(),
                'bao_tri_den_ngay' => Carbon::now()->addDays(10),
                'ly_do_bao_tri' => 'Bảo trì hệ thống âm thanh ánh sáng toàn diện',
                'da_xoa' => 0,
            ]
        );

        $this->hostUser = User::firstOrCreate(
            ['email' => 'host.emergency@uit.edu.vn'],
            [
                'ho_ten' => 'Host Emergency Leader',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->otherHostUser = User::firstOrCreate(
            ['email' => 'other.host.emergency@uit.edu.vn'],
            [
                'ho_ten' => 'Other Host Leader',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->otherClub->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->pctsvAdmin = User::firstOrCreate(
            ['email' => 'pctsv.admin.emergency@uit.edu.vn'],
            [
                'ho_ten' => 'P.CTSV Admin Emergency',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'Admin',
                'ma_don_vi_to_chuc' => $this->pctsv->ma_don_vi_to_chuc,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->studentUser1 = User::firstOrCreate(
            ['email' => 'student1.emergency@gm.uit.edu.vn'],
            [
                'ho_ten' => 'Student Ticket Holder 1',
                'mssv' => '99001122',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'SinhVien',
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->studentUser2 = User::firstOrCreate(
            ['email' => 'student2.emergency@gm.uit.edu.vn'],
            [
                'ho_ten' => 'Student Waitlist 2',
                'mssv' => '99001133',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'SinhVien',
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );
    }

    protected function createApprovedEvent(string $status = 'APPROVED'): SuKien
    {
        $startTime = Carbon::now()->addDays(7)->setTime(9, 0, 0);
        $endTime = $startTime->copy()->addHours(3);

        $event = SuKien::create([
            'ten_su_kien' => 'Hội thảo Công nghệ Khẩn cấp '.uniqid(),
            'mo_ta' => 'Sự kiện mô phỏng thử nghiệm hủy khẩn cấp và đổi phòng',
            'ma_phong' => $this->room1->ma_phong,
            'ma_don_vi_to_chuc' => $this->hostClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ngay_cong_bo' => Carbon::now()->addHour(),
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 99,
            'trang_thai' => $status,
        ]);

        DatPhong::create([
            'ma_phong' => $this->room1->ma_phong,
            'ma_su_kien' => $event->ma_su_kien,
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $endTime,
            'trang_thai' => 'CONFIRMED',
        ]);

        // Tạo 1 vé đã đăng ký
        DangKy::create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $this->studentUser1->ma_tai_khoan,
            'ma_ve_uuid' => (string) Str::uuid(),
            'chu_ky_hmac' => hash_hmac('sha256', 'ticket_test', 'secret'),
            'trang_thai' => 'DaDangKy',
            'thoi_gian_dang_ky' => now(),
        ]);

        // Tạo 1 sinh viên trong hàng đợi waitlist
        HangDoiWaitlist::create([
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $this->studentUser2->ma_tai_khoan,
            'so_thu_tu' => 1,
            'trang_thai' => 'WAITING',
            'thoi_gian_dang_ky' => now(),
        ]);

        return $event;
    }

    /**
     * Test POST /api/v1/events/{id}/emergency-cancel
     */
    public function test_host_can_emergency_cancel_approved_event(): void
    {
        Mail::fake();

        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->hostUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/emergency-cancel", [
                'ly_do_huy' => 'Diễn giả chính gặp sự cố sức khỏe đột xuất',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'trang_thai' => 'CANCELLED',
                ],
            ]);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CANCELLED',
        ]);

        // Kiểm tra vé chuyển sang DaHuy và không bị tính No-show
        $this->assertDatabaseHas('dang_ky', [
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $this->studentUser1->ma_tai_khoan,
            'trang_thai' => 'DaHuy',
            'vi_pham_no_show' => 0,
        ]);

        // Kiểm tra waitlist chuyển sang CANCELLED
        $this->assertDatabaseHas('hang_doi_waitlist', [
            'ma_su_kien' => $event->ma_su_kien,
            'ma_tai_khoan' => $this->studentUser2->ma_tai_khoan,
            'trang_thai' => 'CANCELLED',
        ]);

        // Kiểm tra Audit Log
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'CANCEL_EVENT',
            'trang_thai_truoc' => 'APPROVED',
            'trang_thai_sau' => 'CANCELLED',
            'nguoi_thuc_hien' => $this->hostUser->ma_tai_khoan,
        ]);

        // Kiểm tra phát thông báo
        $this->assertDatabaseHas('thong_bao', [
            'ma_tai_khoan' => $this->studentUser1->ma_tai_khoan,
            'loai_thong_bao' => 'HUY_SU_KIEN',
        ]);

        Mail::assertQueued(EventEmergencyMailable::class, 2);
    }

    public function test_host_can_emergency_cancel_published_event(): void
    {
        Mail::fake();

        $event = $this->createApprovedEvent('PUBLISHED');

        $response = $this->actingAs($this->hostUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/emergency-cancel", [
                'ly_do_huy' => 'The speaker is unavailable due to an emergency',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.trang_thai', 'CANCELLED');
    }

    public function test_admin_can_emergency_cancel_event(): void
    {
        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/emergency-cancel", [
                'ly_do_huy' => 'Nhà trường trưng dụng cơ sở phục vụ kỳ thi quốc gia',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'CANCELLED',
        ]);
    }

    public function test_other_club_cannot_cancel_event(): void
    {
        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->otherHostUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/emergency-cancel", [
                'ly_do_huy' => 'Cố tình can thiệp trái phép',
            ]);

        $response->assertStatus(403);
    }

    public function test_cannot_emergency_cancel_draft_event(): void
    {
        $event = $this->createApprovedEvent();
        $event->update(['trang_thai' => 'DRAFT']);

        $response = $this->actingAs($this->hostUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/emergency-cancel", [
                'ly_do_huy' => 'Lý do hủy hợp lệ',
            ]);

        $response->assertStatus(409);
    }

    /**
     * Test POST /api/v1/events/{id}/change-room
     */
    public function test_admin_can_change_room_successfully(): void
    {
        Mail::fake();

        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->room2->ma_phong,
                'ly_do' => 'Hội trường cũ cần bảo trì hệ thống máy lạnh đột xuất',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ma_su_kien' => $event->ma_su_kien,
                    'phong' => [
                        'ma_phong' => $this->room2->ma_phong,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'ma_phong' => $this->room2->ma_phong,
        ]);

        $this->assertDatabaseHas('dat_phong', [
            'ma_su_kien' => $event->ma_su_kien,
            'ma_phong' => $this->room2->ma_phong,
            'trang_thai' => 'CONFIRMED',
        ]);

        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'ma_su_kien' => $event->ma_su_kien,
            'hanh_dong' => 'CHANGE_ROOM',
        ]);

        $this->assertDatabaseHas('thong_bao', [
            'ma_tai_khoan' => $this->studentUser1->ma_tai_khoan,
            'loai_thong_bao' => 'DOI_PHONG_KHAN_CAP',
        ]);

        Mail::assertQueued(EventEmergencyMailable::class, 2);
    }

    public function test_admin_can_change_room_for_published_event(): void
    {
        $event = $this->createApprovedEvent('PUBLISHED');

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->room2->ma_phong,
                'ly_do' => 'The original room needs emergency repairs',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('su_kien', [
            'ma_su_kien' => $event->ma_su_kien,
            'ma_phong' => $this->room2->ma_phong,
        ]);
    }

    public function test_cannot_change_room_to_same_room(): void
    {
        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->room1->ma_phong,
                'ly_do' => 'Đổi sang cùng phòng',
            ]);

        $response->assertStatus(409);
    }

    public function test_cannot_change_room_if_new_room_capacity_is_too_small(): void
    {
        $event = $this->createApprovedEvent();

        // Phòng 983 có sức chứa 30, trong khi sự kiện phát hành 100 vé
        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->smallRoom->ma_phong,
                'ly_do' => 'Chuyển sang phòng nhỏ',
            ]);

        $response->assertStatus(409);
    }

    public function test_cannot_change_room_if_new_room_is_in_maintenance(): void
    {
        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->maintenanceRoom->ma_phong,
                'ly_do' => 'Chuyển sang phòng bảo trì',
            ]);

        $response->assertStatus(409);
    }

    public function test_cannot_change_room_if_new_room_has_schedule_conflict(): void
    {
        $event = $this->createApprovedEvent();

        // Tạo 1 sự kiện khác đang chiếm phòng room2 trùng khung giờ (bao gồm buffer 15p)
        $conflictingEvent = SuKien::create([
            'ten_su_kien' => 'Sự kiện Trùng Lịch '.uniqid(),
            'mo_ta' => 'Chiếm phòng 982',
            'ma_phong' => $this->room2->ma_phong,
            'ma_don_vi_to_chuc' => $this->otherClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ngay_cong_bo' => Carbon::now()->addHour(),
            'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau->copy()->addMinutes(30),
            'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc->copy()->addHour(),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 50,
            'so_ve_con_lai' => 50,
            'trang_thai' => 'APPROVED',
        ]);

        DatPhong::create([
            'ma_phong' => $this->room2->ma_phong,
            'ma_su_kien' => $conflictingEvent->ma_su_kien,
            'thoi_gian_bat_dau' => $conflictingEvent->thoi_gian_bat_dau,
            'thoi_gian_ket_thuc' => $conflictingEvent->thoi_gian_ket_thuc,
            'trang_thai' => 'CONFIRMED',
        ]);

        $response = $this->actingAs($this->pctsvAdmin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->room2->ma_phong,
                'ly_do' => 'Chuyển sang phòng bị trùng lịch',
            ]);

        $response->assertStatus(409);
    }

    public function test_non_admin_cannot_change_room(): void
    {
        $event = $this->createApprovedEvent();

        $response = $this->actingAs($this->hostUser)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/change-room", [
                'ma_phong_moi' => $this->room2->ma_phong,
                'ly_do' => 'BTC tự ý chuyển phòng',
            ]);

        $response->assertStatus(403);
    }
}
