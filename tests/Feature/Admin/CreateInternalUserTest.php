<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateInternalUserTest extends TestCase
{
    use DatabaseTransactions;

    public function test_non_admin_cannot_create_internal_user(): void
    {
        // 1. Student attempting admin endpoint
        $student = User::where('loai_tai_khoan', 'SinhVien')->first();
        if (! $student) {
            $student = User::create([
                'ho_ten' => 'Sinh Viên Test',
                'mssv' => '22528801',
                'email' => '22528801@gm.uit.edu.vn',
                'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'SinhVien',
                'lop_sinh_hoat' => 'HTTT2022',
                'khoa' => 'Khoa Hệ thống Thông tin',
                'buoc_doi_mat_khau' => 0,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]);
        }

        $this->actingAs($student);

        $response = $this->postJson('/api/v1/admin/users/create-internal', [
            'ho_ten' => 'Cán Bộ Khoa Mới',
            'email' => 'cbkhoamoi@uit.edu.vn',
            'mat_khau' => 'TempPass@123',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => 1,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN',
            ]);
    }

    public function test_admin_can_successfully_create_internal_organizer_user(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->assertNotNull($admin);

        $this->actingAs($admin);

        $userData = [
            'ho_ten' => 'Cán Bộ Đoàn Thanh Niên',
            'email' => 'doanthanhnien@uit.edu.vn',
            'mat_khau' => 'InitialAdminPass@123',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => 1,
            'so_dien_thoai' => '0909888777',
        ];

        $response = $this->postJson('/api/v1/admin/users/create-internal', $userData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ho_ten' => 'Cán Bộ Đoàn Thanh Niên',
                    'email' => 'doanthanhnien@uit.edu.vn',
                    'loai_tai_khoan' => 'ToChuc',
                    'buoc_doi_mat_khau' => true,
                    'dong_y_nghi_dinh_13' => true,
                    'hoat_dong' => true,
                ],
            ]);

        // Verify DB state
        $newUser = User::where('email', 'doanthanhnien@uit.edu.vn')->first();
        $this->assertNotNull($newUser);
        $this->assertTrue((bool) $newUser->buoc_doi_mat_khau);
        $this->assertTrue((bool) $newUser->dong_y_nghi_dinh_13);
        $this->assertTrue((bool) $newUser->hoat_dong);
        $this->assertTrue(Hash::check('InitialAdminPass@123', $newUser->mat_khau));

        // Verify Audit Log was recorded
        $this->assertDatabaseHas('nhat_ky_kiem_duyet', [
            'hanh_dong' => 'GRANT_ORGANIZER',
            'nguoi_thuc_hien' => $admin->ma_tai_khoan,
            'ma_tai_khoan_muc_tieu' => $newUser->ma_tai_khoan,
        ]);
    }

    public function test_create_internal_user_validates_uit_email_domain(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->actingAs($admin);

        // Student email domain @gm.uit.edu.vn should be rejected for internal users
        $response = $this->postJson('/api/v1/admin/users/create-internal', [
            'ho_ten' => 'Tài Khoản Sai Domain',
            'email' => '22521111@gm.uit.edu.vn',
            'mat_khau' => 'TempPass@123',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);
    }

    public function test_create_internal_user_requires_organization_for_tochuc_role(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->actingAs($admin);

        // Missing ma_don_vi_to_chuc for ToChuc role
        $response = $this->postJson('/api/v1/admin/users/create-internal', [
            'ho_ten' => 'Tài Khoản Thiếu Đơn Vị',
            'email' => 'thieudonvi@uit.edu.vn',
            'mat_khau' => 'TempPass@123',
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => null,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);
    }
}
