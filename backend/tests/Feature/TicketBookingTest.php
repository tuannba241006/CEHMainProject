<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TicketBookingTest extends TestCase
{
    use DatabaseTransactions;

    protected User $studentA;

    protected User $studentB;

    protected User $organizer;

    protected User $admin;

    protected DonViToChuc $donViFaculty;

    protected DonViToChuc $donViClub;

    protected PhongHoiTruong $room;

    protected ChuyenDe $chuyenDe;

    protected function setUp(): void
    {
        parent::setUp();

        $this->donViClub = DonViToChuc::where('loai_don_vi', 'CLB')->first()
            ?? DonViToChuc::first();
        $this->donViFaculty = $this->donViClub->donViCha ?? DonViToChuc::where('loai_don_vi', 'Khoa')->first();

        $this->room = PhongHoiTruong::where('trang_thai', 'KhaDung')->where('suc_chua_toi_da', '>=', 50)->first()
            ?? PhongHoiTruong::first();

        $this->chuyenDe = ChuyenDe::first() ?? ChuyenDe::create([
            'ten_chuyen_de' => 'Hội thảo Công nghệ Booking',
            'mo_ta' => 'Chuyên đề test đặt vé',
            'da_xoa' => 0,
        ]);

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_bkg@gm.uit.edu.vn'],
            [
                'mssv' => '22529901',
                'ho_ten' => 'Nguyễn Văn Test A',
                'lop_sinh_hoat' => 'KTPM2022',
                'khoa' => 'Kỹ thuật Phần mềm',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->studentB = User::firstOrCreate(
            ['email' => 'student_b_bkg@gm.uit.edu.vn'],
            [
                'mssv' => '22529902',
                'ho_ten' => 'Trần Thị Test B',
                'lop_sinh_hoat' => 'KHMT2022',
                'khoa' => 'Khoa học Máy tính',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->organizer = User::firstOrCreate(
            ['email' => 'org_bkg@uit.edu.vn'],
            [
                'ho_ten' => 'Ban Tổ Chức Test',
                'lop_sinh_hoat' => 'N/A',
                'khoa' => 'N/A',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->donViClub->ma_don_vi_to_chuc,
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );

        $this->admin = User::firstOrCreate(
            ['email' => 'admin_bkg@uit.edu.vn'],
            [
                'ho_ten' => 'Quản trị viên Test',
                'lop_sinh_hoat' => 'N/A',
                'khoa' => 'N/A',
                'mat_khau' => Hash::make('Password@123'),
                'loai_tai_khoan' => 'Admin',
                'dong_y_nghi_dinh_13' => 1,
                'hoat_dong' => 1,
                'buoc_doi_mat_khau' => 0,
            ]
        );
    }

    protected function createPublishedEvent(array $overrides = []): SuKien
    {
        $start = Carbon::now()->addDays(5)->setTime(9, 0, 0);
        $end = Carbon::now()->addDays(5)->setTime(12, 0, 0);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->donViClub->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'Sự kiện Đặt vé Chuẩn Test',
            'mo_ta' => 'Mô tả sự kiện phục vụ test đặt vé tương tranh',
            'ngay_cong_bo' => Carbon::now()->subDays(1),
            'thoi_gian_bat_dau' => $start,
            'thoi_gian_ket_thuc' => $end,
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 10,
            'so_ve_con_lai' => 10,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'Dieu3',
            'diem_drl_du_kien' => 5,
            'gio_tinh_nguyen' => 0.0,
            'trang_thai' => 'PUBLISHED',
        ], $overrides));
    }

    public function test_student_can_book_limited_slot_event_successfully(): void
    {
        $event = $this->createPublishedEvent([
            'so_luong_toi_da' => 5,
            'so_ve_con_lai' => 5,
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Đăng ký vé tham dự thành công',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'server_time',
                'data' => [
                    'ma_dang_ky',
                    'ma_ve_uuid',
                    'ma_su_kien',
                    'ten_su_kien',
                    'trang_thai_su_kien',
                    'thoi_gian_bat_dau',
                    'thoi_gian_ket_thuc',
                    'ten_phong',
                    'co_so',
                    'trang_thai',
                    'thoi_gian_dang_ky',
                    'cho_phep_huy',
                    'ti_le_drl',
                    'diem_drl_du_kien',
                    'da_feedback',
                    'chu_ky_hmac',
                    'payload_qr',
                    'yeu_cau_wake_lock',
                ],
            ]);

        $responseData = $response->json('data');
        $this->assertEquals($event->ma_su_kien, $responseData['ma_su_kien']);
        $this->assertEquals('DaDangKy', $responseData['trang_thai']);
        $this->assertTrue($responseData['yeu_cau_wake_lock']);
        $this->assertMatchesRegularExpression(
            '/^CEH1\.[0-9a-fA-F-]{36}\.[0-9]+\.[0-9]+\.[0-9a-f]{64}$/',
            $responseData['payload_qr']
        );

        // Check DB state: remaining tickets decremented by 1
        $event->refresh();
        $this->assertEquals(4, $event->so_ve_con_lai);

        $this->assertDatabaseHas('dang_ky', [
            'ma_tai_khoan' => $this->studentA->ma_tai_khoan,
            'ma_su_kien' => $event->ma_su_kien,
            'trang_thai' => 'DaDangKy',
        ]);
    }

    public function test_student_can_book_unlimited_slot_event_successfully(): void
    {
        $event = $this->createPublishedEvent([
            'khong_gioi_han_slot' => 1,
            'so_luong_toi_da' => null,
            'so_ve_con_lai' => null,
            'so_slot_dong_bang' => 0,
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Đăng ký vé tham dự thành công',
            ]);

        $event->refresh();
        $this->assertNull($event->so_ve_con_lai);
    }

    public function test_double_booking_by_same_student_fails_with_already_registered(): void
    {
        $event = $this->createPublishedEvent();

        // First booking succeeds
        $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book")
            ->assertStatus(201);

        // Second booking fails
        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'ALREADY_REGISTERED',
            ]);
    }

    public function test_booking_fails_when_slot_sold_out(): void
    {
        $event = $this->createPublishedEvent([
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 0,
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'SLOT_SOLD_OUT',
            ]);
    }

    public function test_event_records_thoi_diem_het_ve_when_last_ticket_is_booked(): void
    {
        $event = $this->createPublishedEvent([
            'so_luong_toi_da' => 1,
            'so_ve_con_lai' => 1,
            'thoi_diem_het_ve' => null,
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(201);

        $event->refresh();
        $this->assertEquals(0, $event->so_ve_con_lai);
        $this->assertNotNull($event->thoi_diem_het_ve);
    }

    public function test_booking_fails_after_t_minus_2h_cutoff(): void
    {
        $event = $this->createPublishedEvent([
            'thoi_gian_bat_dau' => Carbon::now()->addHour(1), // Starts in 1 hour (< 2h)
            'thoi_gian_ket_thuc' => Carbon::now()->addHours(4),
            'ngay_cong_bo' => Carbon::now()->subDays(1),
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'REGISTRATION_CLOSED',
            ]);
    }

    public function test_booking_fails_before_ngay_cong_bo(): void
    {
        $event = $this->createPublishedEvent([
            'ngay_cong_bo' => Carbon::now()->addDays(1), // Open tomorrow
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'REGISTRATION_CLOSED',
            ]);
    }

    public function test_booking_fails_when_event_not_published(): void
    {
        $event = $this->createPublishedEvent([
            'trang_thai' => 'APPROVED',
        ]);

        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'REGISTRATION_CLOSED',
            ]);
    }

    public function test_schedule_conflict_hard_block_between_two_limited_slot_events(): void
    {
        // Event 1: Limited slot, 08:00 - 11:00 on Day 5
        $event1 = $this->createPublishedEvent([
            'ten_su_kien' => 'Sự kiện Gốc A',
            'thoi_gian_bat_dau' => Carbon::now()->addDays(5)->setTime(8, 0, 0),
            'thoi_gian_ket_thuc' => Carbon::now()->addDays(5)->setTime(11, 0, 0),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 20,
            'so_ve_con_lai' => 20,
        ]);

        // Event 2: Limited slot, 09:00 - 12:00 on Day 5 (Overlaps 09:00 - 11:00)
        $event2 = $this->createPublishedEvent([
            'ten_su_kien' => 'Sự kiện Trùng Giờ B',
            'thoi_gian_bat_dau' => Carbon::now()->addDays(5)->setTime(9, 0, 0),
            'thoi_gian_ket_thuc' => Carbon::now()->addDays(5)->setTime(12, 0, 0),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 20,
            'so_ve_con_lai' => 20,
        ]);

        // Student A books Event 1 successfully
        $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event1->ma_su_kien}/book")
            ->assertStatus(201);

        // Student A attempts to book Event 2 -> Hard Block 409
        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event2->ma_su_kien}/book");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => 'SCHEDULE_CONFLICT_HARD',
            ])
            ->assertJsonPath('chi_tiet.su_kien_trung.ma_su_kien', $event1->ma_su_kien)
            ->assertJsonPath('chi_tiet.su_kien_trung.ten_su_kien', $event1->ten_su_kien);
    }

    public function test_schedule_conflict_soft_warning_allowed_if_one_event_is_unlimited_slot(): void
    {
        // Event 1: Limited slot, 08:00 - 11:00
        $event1 = $this->createPublishedEvent([
            'ten_su_kien' => 'Sự kiện Giới Hạn Slot',
            'thoi_gian_bat_dau' => Carbon::now()->addDays(5)->setTime(8, 0, 0),
            'thoi_gian_ket_thuc' => Carbon::now()->addDays(5)->setTime(11, 0, 0),
            'khong_gioi_han_slot' => 0,
            'so_luong_toi_da' => 20,
            'so_ve_con_lai' => 20,
        ]);

        // Event 2: Unlimited slot, 09:00 - 12:00
        $event2 = $this->createPublishedEvent([
            'ten_su_kien' => 'Sự kiện Mở Tự Do',
            'thoi_gian_bat_dau' => Carbon::now()->addDays(5)->setTime(9, 0, 0),
            'thoi_gian_ket_thuc' => Carbon::now()->addDays(5)->setTime(12, 0, 0),
            'khong_gioi_han_slot' => 1,
            'so_luong_toi_da' => null,
            'so_ve_con_lai' => null,
            'so_slot_dong_bang' => 0,
        ]);

        // Student A books Event 1 successfully
        $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event1->ma_su_kien}/book")
            ->assertStatus(201);

        // Student A books Event 2 -> Allowed because Event 2 is unlimited slot
        $response = $this->actingAs($this->studentA)
            ->postJson("/api/v1/events/{$event2->ma_su_kien}/book");

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Đăng ký vé tham dự thành công',
            ]);
    }

    public function test_non_student_cannot_book_ticket(): void
    {
        $event = $this->createPublishedEvent();

        // Organizer role -> 403 Forbidden
        $response = $this->actingAs($this->organizer)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(403);

        // Admin role -> 403 Forbidden
        $adminResponse = $this->actingAs($this->admin)
            ->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $adminResponse->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_book_ticket(): void
    {
        $event = $this->createPublishedEvent();

        $response = $this->postJson("/api/v1/events/{$event->ma_su_kien}/book");

        $response->assertStatus(401);
    }
}
