<?php

namespace Tests\Feature;

use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use DatabaseTransactions;

    protected User $studentA;

    protected User $studentB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->studentA = User::firstOrCreate(
            ['email' => 'student_a_notif@gm.uit.edu.vn'],
            [
                'mssv' => '22528101',
                'ho_ten' => 'Nguyễn Thông Báo A',
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
            ['email' => 'student_b_notif@gm.uit.edu.vn'],
            [
                'mssv' => '22528102',
                'ho_ten' => 'Trần Thông Báo B',
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

    protected function createNotification(User $user, array $overrides = []): ThongBao
    {
        return ThongBao::create(array_merge([
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'tieu_de' => 'Nhắc nhở sự kiện',
            'noi_dung' => 'Nội dung thông báo kiểm thử',
            'loai_thong_bao' => 'NHAC_HEN',
            'lien_ket' => '/my-tickets',
            'da_doc' => false,
            'thoi_gian_gui' => now(),
        ], $overrides));
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Danh sach thong bao & dem so luong chua doc)
     * Course: Normal Course
     * Expected: HTTP 200, meta.so_luong_chua_doc chinh xac
     */
    public function test_user_can_list_own_notifications_with_unread_counter(): void
    {
        $this->createNotification($this->studentA, ['da_doc' => false]);
        $this->createNotification($this->studentA, ['da_doc' => false]);
        $this->createNotification($this->studentA, ['da_doc' => true]);

        $response = $this->actingAs($this->studentA)
            ->getJson('/api/v1/notifications');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'tieu_de',
                        'noi_dung',
                        'loai_thong_bao',
                        'lien_ket',
                        'da_doc',
                        'thoi_gian_gui',
                    ],
                ],
                'meta' => [
                    'trang_hien_tai',
                    'tong_so_trang',
                    'tong_so_ban_ghi',
                    'kich_thuoc_trang',
                    'so_luong_chua_doc',
                ],
            ]);

        $this->assertGreaterThanOrEqual(2, $response->json('meta.so_luong_chua_doc'));
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Bao mat da nguoi dung)
     * Course: Exception (User A khong thay thong bao cua User B)
     * Expected: HTTP 200 nhung khong chua thong bao cua User B
     */
    public function test_user_cannot_see_other_users_notifications(): void
    {
        $notifB = $this->createNotification($this->studentB, ['tieu_de' => 'Rieng tu cua B']);

        $response = $this->actingAs($this->studentA)
            ->getJson('/api/v1/notifications');

        $response->assertOk();
        $notifIds = collect($response->json('data'))->pluck('id')->all();
        $this->assertNotContains($notifB->id, $notifIds);
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Bo loc chua_doc va loai_thong_bao)
     * Course: Normal Course
     * Expected: Ket qua duoc loc dung tieu chi
     */
    public function test_user_can_filter_notifications_by_type_and_unread_status(): void
    {
        $notifUnread = $this->createNotification($this->studentA, [
            'da_doc' => false,
            'loai_thong_bao' => 'CLAIM_SLOT',
        ]);
        $notifRead = $this->createNotification($this->studentA, [
            'da_doc' => true,
            'loai_thong_bao' => 'HE_THONG',
        ]);

        $response = $this->actingAs($this->studentA)
            ->getJson('/api/v1/notifications?chua_doc=true&loai_thong_bao=CLAIM_SLOT');

        $response->assertOk();
        $items = $response->json('data');
        foreach ($items as $item) {
            $this->assertFalse($item['da_doc']);
            $this->assertEquals('CLAIM_SLOT', $item['loai_thong_bao']);
        }
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Danh dau da doc 1 thong bao)
     * Course: Normal Course
     * Expected: HTTP 200, da_doc = true
     */
    public function test_user_can_mark_single_notification_as_read(): void
    {
        $notif = $this->createNotification($this->studentA, ['da_doc' => false]);

        $response = $this->actingAs($this->studentA)
            ->putJson("/api/v1/notifications/{$notif->id}/read");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $notif->id)
            ->assertJsonPath('data.da_doc', true);

        $this->assertTrue($notif->fresh()->da_doc);
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Chong IDOR danh dau doc)
     * Course: Exception (User A co tinh danh dau thong bao cua User B)
     * Expected: HTTP 403 Forbidden
     */
    public function test_user_cannot_mark_other_users_notification_as_read(): void
    {
        $notifB = $this->createNotification($this->studentB, ['da_doc' => false]);

        $response = $this->actingAs($this->studentA)
            ->putJson("/api/v1/notifications/{$notifB->id}/read");

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error', 'FORBIDDEN');

        $this->assertFalse($notifB->fresh()->da_doc);
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Thong bao khong ton tai)
     * Course: Exception
     * Expected: HTTP 404 Not Found
     */
    public function test_user_marking_nonexistent_notification_returns_404(): void
    {
        $response = $this->actingAs($this->studentA)
            ->putJson('/api/v1/notifications/99999999/read');

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Danh dau doc tat ca thong bao)
     * Course: Normal Course
     * Expected: HTTP 200, so_luong_cap_nhat dung so luong chua doc
     */
    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $notif1 = $this->createNotification($this->studentA, ['da_doc' => false]);
        $notif2 = $this->createNotification($this->studentA, ['da_doc' => false]);
        $notifOther = $this->createNotification($this->studentB, ['da_doc' => false]);

        $response = $this->actingAs($this->studentA)
            ->putJson('/api/v1/notifications/read-all');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['so_luong_cap_nhat'],
            ]);

        $this->assertTrue($notif1->fresh()->da_doc);
        $this->assertTrue($notif2->fresh()->da_doc);
        // Ensure student B's unread notification was untouched
        $this->assertFalse($notifOther->fresh()->da_doc);
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Goi lap read-all khi khong con thong bao chua doc)
     * Course: Idempotent Alternative Course
     * Expected: HTTP 200, so_luong_cap_nhat = 0
     */
    public function test_idempotent_mark_all_as_read_when_all_already_read(): void
    {
        $this->actingAs($this->studentA)->putJson('/api/v1/notifications/read-all');

        $response = $this->actingAs($this->studentA)
            ->putJson('/api/v1/notifications/read-all');

        $response->assertOk()
            ->assertJsonPath('data.so_luong_cap_nhat', 0);
    }

    /**
     * @test
     * Target: UC-NOTIF-01 (Xac thuc quyen)
     * Course: Exception (Chua dang nhap)
     * Expected: HTTP 401 Unauthenticated
     */
    public function test_unauthenticated_user_cannot_access_notifications(): void
    {
        $response = $this->getJson('/api/v1/notifications');
        $response->assertStatus(401);
    }
}
