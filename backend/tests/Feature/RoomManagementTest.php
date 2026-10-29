<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\Campus;
use App\Enums\RoomStatus;
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

class RoomManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;

    protected User $toChucUserA;

    protected User $toChucUserB;

    protected DonViToChuc $donViA;

    protected DonViToChuc $donViB;

    protected ChuyenDe $chuyenDe;

    protected function setUp(): void
    {
        parent::setUp();

        // Tạo đơn vị tổ chức A & B
        $this->donViA = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_HTTT_TEST'],
            [
                'ten_don_vi' => 'Khoa Hệ thống Thông tin Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        $this->donViB = DonViToChuc::firstOrCreate(
            ['ma_dinh_danh' => 'KHOA_KTPM_TEST'],
            [
                'ten_don_vi' => 'Khoa Kỹ thuật Phần mềm Test',
                'loai_don_vi' => 'Khoa',
                'hoat_dong' => 1,
            ]
        );

        // Tạo chuyên đề
        $this->chuyenDe = ChuyenDe::firstOrCreate(
            ['ten_chuyen_de' => 'Hội thảo Công nghệ Test'],
            ['mo_ta' => 'Chuyên đề hội thảo mẫu']
        );

        // Tạo Admin User
        $this->adminUser = User::firstOrCreate(
            ['email' => 'admin_test_pkg01@uit.edu.vn'],
            [
                'ho_ten' => 'Admin PKG01 Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'Admin',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        // Tạo User Tổ chức Khoa A
        $this->toChucUserA = User::firstOrCreate(
            ['email' => 'tochuc_a_test@uit.edu.vn'],
            [
                'ho_ten' => 'Cán bộ Khoa A Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->donViA->ma_don_vi_to_chuc,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );

        // Tạo User Tổ chức Khoa B
        $this->toChucUserB = User::firstOrCreate(
            ['email' => 'tochuc_b_test@uit.edu.vn'],
            [
                'ho_ten' => 'Cán bộ Khoa B Test',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => $this->donViB->ma_don_vi_to_chuc,
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]
        );
    }

    protected function createRoomHelper(array $attributes = []): PhongHoiTruong
    {
        return PhongHoiTruong::create(array_merge([
            'ten_phong' => 'Hội trường Test ' . uniqid(),
            'co_so' => Campus::CoSo1->value,
            'suc_chua_toi_da' => 150,
            'trang_thiet_bi' => ['may_chieu' => true, 'am_thanh' => true],
            'trang_thai' => RoomStatus::KhaDung->value,
            'da_xoa' => 0,
        ], $attributes));
    }

    protected function createEventHelper(PhongHoiTruong $room, array $attributes = []): SuKien
    {
        $start = isset($attributes['thoi_gian_bat_dau'])
            ? \Illuminate\Support\Carbon::parse($attributes['thoi_gian_bat_dau'])
            : now()->addDays(5)->setTime(8, 0, 0);

        $end = isset($attributes['thoi_gian_ket_thuc'])
            ? \Illuminate\Support\Carbon::parse($attributes['thoi_gian_ket_thuc'])
            : $start->copy()->addHours(2);

        $publish = $start->copy()->subDays(2);

        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->donViA->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->chuyenDe->ma_chuyen_de,
            'ma_phong' => $room->ma_phong,
            'ten_su_kien' => 'Sự kiện Test ' . uniqid(),
            'mo_ta' => 'Mô tả sự kiện test hội trường',
            'ngay_cong_bo' => $publish,
            'thoi_gian_bat_dau' => $start,
            'thoi_gian_ket_thuc' => $end,
            'khong_gioi_han_slot' => 1,
            'trang_thai' => 'APPROVED',
        ], $attributes));
    }

    protected function createBookingHelper(PhongHoiTruong $room, SuKien $event, array $attributes = []): DatPhong
    {
        return DatPhong::create(array_merge([
            'ma_phong' => $room->ma_phong,
            'ma_su_kien' => $event->ma_su_kien,
            'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
            'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
            'trang_thai' => BookingStatus::Confirmed->value,
        ], $attributes));
    }

    /**
     * 1. test_admin_can_create_room
     * POST /api/rooms với payload không có ma_phong
     * 201, envelope.success = true, data.ma_phong là số nguyên.
     */
    public function test_admin_can_create_room(): void
    {
        $this->actingAs($this->adminUser);

        $payload = [
            'ten_phong' => 'Hội trường A ' . uniqid(),
            'co_so' => 'CoSo1',
            'suc_chua_toi_da' => 100,
            'trang_thiet_bi' => ['may_chieu' => true, 'micro' => 2],
        ];

        $response = $this->postJson('/api/rooms', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertIsInt($response->json('data.ma_phong'));
        $this->assertEquals($payload['ten_phong'], $response->json('data.ten_phong'));
        $this->assertEquals('KhaDung', $response->json('data.trang_thai'));
    }

    /**
     * 2. test_create_room_fails_when_capacity_less_than_10
     * suc_chua_toi_da = 9 -> 422, error = VALIDATION_FAILED.
     */
    public function test_create_room_fails_when_capacity_less_than_10(): void
    {
        $this->actingAs($this->adminUser);

        $payload = [
            'ten_phong' => 'Phòng họp nhỏ',
            'co_so' => 'CoSo1',
            'suc_chua_toi_da' => 9,
            'trang_thiet_bi' => ['ban_ghe' => true],
        ];

        $response = $this->postJson('/api/rooms', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $errorCode = $response->json('error.code') ?? $response->json('error');
        $this->assertEquals('VALIDATION_FAILED', $errorCode);
    }

    /**
     * 3. test_non_admin_cannot_create_room
     * user role ToChuc -> 403.
     */
    public function test_non_admin_cannot_create_room(): void
    {
        $this->actingAs($this->toChucUserA);

        $payload = [
            'ten_phong' => 'Phòng tự tạo',
            'co_so' => 'CoSo1',
            'suc_chua_toi_da' => 50,
            'trang_thiet_bi' => [],
        ];

        $response = $this->postJson('/api/rooms', $payload);

        $response->assertStatus(403);
    }

    /**
     * 4. test_update_to_baotri_requires_ly_do
     * PUT trang_thai = BaoTri với bao_tri_tu_ngay, bao_tri_den_ngay nhưng thiếu ly_do_bao_tri -> 422.
     */
    public function test_update_to_baotri_requires_ly_do(): void
    {
        $this->actingAs($this->adminUser);
        $room = $this->createRoomHelper();

        $response = $this->putJson("/api/rooms/{$room->ma_phong}", [
            'trang_thai' => 'BaoTri',
            'bao_tri_tu_ngay' => '2026-11-10 08:00:00',
            'bao_tri_den_ngay' => '2026-11-10 12:00:00',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * 5. test_update_to_baotri_ly_do_min_10_chars
     * ly_do_bao_tri = "ngan qua" (9 ký tự) -> 422.
     */
    public function test_update_to_baotri_ly_do_min_10_chars(): void
    {
        $this->actingAs($this->adminUser);
        $room = $this->createRoomHelper();

        $response = $this->putJson("/api/rooms/{$room->ma_phong}", [
            'trang_thai' => 'BaoTri',
            'bao_tri_tu_ngay' => '2026-11-10 08:00:00',
            'bao_tri_den_ngay' => '2026-11-10 12:00:00',
            'ly_do_bao_tri' => 'ngan qua', // 8 chars
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * 6. test_update_to_baotri_blocks_when_confirmed_event_overlaps
     * tạo dat_phong CONFIRMED overlap khung bảo trì
     * PUT sang BaoTri -> 409, error.code = ROOM_MAINTENANCE_CONFLICT, count(affected_events) >= 1.
     */
    public function test_update_to_baotri_blocks_when_confirmed_event_overlaps(): void
    {
        $this->actingAs($this->adminUser);
        $room = $this->createRoomHelper();

        $eventStart = Carbon::parse('2026-11-10 08:00:00');
        $eventEnd = Carbon::parse('2026-11-10 10:00:00');

        $event = $this->createEventHelper($room, [
            'thoi_gian_bat_dau' => $eventStart,
            'thoi_gian_ket_thuc' => $eventEnd,
        ]);

        $this->createBookingHelper($room, $event, [
            'thoi_gian_bat_dau' => $eventStart,
            'thoi_gian_ket_thuc' => $eventEnd,
            'trang_thai' => BookingStatus::Confirmed->value,
        ]);

        // Cố gắng chuyển sang bảo trì từ 09:00 đến 12:00 (trùng với 08:00 - 10:00)
        $response = $this->putJson("/api/rooms/{$room->ma_phong}", [
            'trang_thai' => 'BaoTri',
            'bao_tri_tu_ngay' => '2026-11-10 09:00:00',
            'bao_tri_den_ngay' => '2026-11-10 12:00:00',
            'ly_do_bao_tri' => 'Bảo trì dàn đèn sân khấu hội trường',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'ROOM_MAINTENANCE_CONFLICT',
                ],
            ]);

        $affectedEvents = $response->json('error.details.affected_events');
        $this->assertIsArray($affectedEvents);
        $this->assertGreaterThanOrEqual(1, count($affectedEvents));
        $this->assertEquals($event->ma_su_kien, $affectedEvents[0]['ma_su_kien']);
    }

    /**
     * 7. test_delete_room_with_booking_history_fails
     * phòng có 1 dat_phong (kể cả CANCELLED) -> DELETE -> 409 ROOM_HAS_BOOKING_HISTORY.
     */
    public function test_delete_room_with_booking_history_fails(): void
    {
        $this->actingAs($this->adminUser);
        $room = $this->createRoomHelper();

        $event = $this->createEventHelper($room);
        $this->createBookingHelper($room, $event, [
            'trang_thai' => BookingStatus::Cancelled->value,
        ]);

        $response = $this->deleteJson("/api/rooms/{$room->ma_phong}");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'ROOM_HAS_BOOKING_HISTORY',
                ],
            ]);
    }

    /**
     * 8. test_availability_buffer_conflict_at_14_minutes
     * booking CONFIRMED kết thúc 10:00
     * POST availability bắt đầu 10:14 -> data.available = false, count(conflicts) = 1.
     */
    public function test_availability_buffer_conflict_at_14_minutes(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        $event = $this->createEventHelper($room, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
        ]);

        $this->createBookingHelper($room, $event, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
            'trang_thai' => BookingStatus::Confirmed->value,
        ]);

        // Yêu cầu từ 10:14 đến 12:00 (cách mốc kết thúc 14 phút < buffer 15 phút)
        $response = $this->postJson("/api/rooms/{$room->ma_phong}/availability", [
            'thoi_gian_bat_dau' => '2026-11-10 10:14:00',
            'thoi_gian_ket_thuc' => '2026-11-10 12:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'available' => false,
                ],
            ]);

        $conflicts = $response->json('data.conflicts');
        $this->assertCount(1, $conflicts);
        $this->assertEquals($event->ma_su_kien, $conflicts[0]['ma_su_kien']);
    }

    /**
     * 9. test_availability_no_conflict_at_15_minutes
     * booking CONFIRMED kết thúc 10:00
     * POST availability bắt đầu 10:15 -> data.available = true.
     */
    public function test_availability_no_conflict_at_15_minutes(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        $event = $this->createEventHelper($room, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
        ]);

        $this->createBookingHelper($room, $event, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
            'trang_thai' => BookingStatus::Confirmed->value,
        ]);

        // Yêu cầu từ 10:15 đến 12:00 (đúng đệm 15 phút, không xung đột)
        $response = $this->postJson("/api/rooms/{$room->ma_phong}/availability", [
            'thoi_gian_bat_dau' => '2026-11-10 10:15:00',
            'thoi_gian_ket_thuc' => '2026-11-10 12:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'available' => true,
                    'conflicts' => [],
                ],
            ]);
    }

    /**
     * 10. test_availability_ignores_expired_pending_hold
     * dat_phong PENDING, han_giu_cho_tam = now()->subHour()
     * overlap cùng giờ -> data.available = true (bị loại trừ).
     */
    public function test_availability_ignores_expired_pending_hold(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        $event = $this->createEventHelper($room, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
        ]);

        // Đặt phòng PENDING nhưng đã hết hạn giữ chỗ tạm 1 tiếng trước
        $this->createBookingHelper($room, $event, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
            'trang_thai' => BookingStatus::Pending->value,
            'han_giu_cho_tam' => now()->subHour(),
        ]);

        $response = $this->postJson("/api/rooms/{$room->ma_phong}/availability", [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'available' => true,
                    'conflicts' => [],
                ],
            ]);
    }

    /**
     * 11. test_availability_excludes_own_event
     * 1 booking CONFIRMED của event 123
     * POST availability với exclude_event_id = 123, cùng giờ -> data.available = true.
     */
    public function test_availability_excludes_own_event(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        // Event do DonViA tạo (user A là host)
        $event = $this->createEventHelper($room, [
            'ma_don_vi_to_chuc' => $this->donViA->ma_don_vi_to_chuc,
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
        ]);

        $this->createBookingHelper($room, $event, [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
            'trang_thai' => BookingStatus::Confirmed->value,
        ]);

        $response = $this->postJson("/api/rooms/{$room->ma_phong}/availability", [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
            'exclude_event_id' => $event->ma_su_kien,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'available' => true,
                    'conflicts' => [],
                ],
            ]);
    }

    /**
     * 12. test_availability_forbidden_when_exclude_not_owner
     * user Khoa A gọi exclude_event_id của event Khoa B -> 403 EXCLUDE_EVENT_FORBIDDEN.
     */
    public function test_availability_forbidden_when_exclude_not_owner(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        // Event thuộc về Khoa B
        $eventOfKhoaB = $this->createEventHelper($room, [
            'ma_don_vi_to_chuc' => $this->donViB->ma_don_vi_to_chuc,
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
        ]);

        $response = $this->postJson("/api/rooms/{$room->ma_phong}/availability", [
            'thoi_gian_bat_dau' => '2026-11-10 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-10 10:00:00',
            'exclude_event_id' => $eventOfKhoaB->ma_su_kien,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'EXCLUDE_EVENT_FORBIDDEN',
                ],
            ]);
    }

    /**
     * 13. test_schedule_range_over_31_days_fails
     * GET schedule range 32 ngày -> 422 DATE_RANGE_TOO_LARGE.
     */
    public function test_schedule_range_over_31_days_fails(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        $response = $this->getJson("/api/rooms/{$room->ma_phong}/schedule?tu_ngay=2026-11-01&den_ngay=2026-12-03");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'DATE_RANGE_TOO_LARGE',
                ],
            ]);
    }

    /**
     * 14. test_availability_response_shape
     * assert response.data có keys: available (bool), conflicts (array), maintenance_conflict (null | object).
     */
    public function test_availability_response_shape(): void
    {
        $this->actingAs($this->toChucUserA);
        $room = $this->createRoomHelper();

        $response = $this->postJson("/api/rooms/{$room->ma_phong}/availability", [
            'thoi_gian_bat_dau' => '2026-11-15 08:00:00',
            'thoi_gian_ket_thuc' => '2026-11-15 10:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'available',
                    'conflicts',
                    'maintenance_conflict',
                ],
                'message',
            ]);

        $this->assertIsBool($response->json('data.available'));
        $this->assertIsArray($response->json('data.conflicts'));
    }
}
