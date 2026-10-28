<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordEnforcementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_with_buoc_doi_mat_khau_is_blocked_from_general_endpoints(): void
    {
        $user = User::where('buoc_doi_mat_khau', 1)->first();
        if (! $user) {
            $user = User::create([
                'ho_ten' => 'Người Dùng Mới',
                'email' => 'newuser@uit.edu.vn',
                'mat_khau' => Hash::make('Initial@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 1,
                'buoc_doi_mat_khau' => 1,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]);
        }

        $this->actingAs($user);

        // Accessing general protected endpoint like update profile should be blocked
        $response = $this->putJson('/api/v1/auth/profile', [
            'so_dien_thoai' => '0988776655',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'PASSWORD_CHANGE_REQUIRED',
            ]);
    }

    public function test_whitelisted_endpoints_are_accessible_when_buoc_doi_mat_khau_is_true(): void
    {
        $user = User::where('buoc_doi_mat_khau', 1)->first();
        if (! $user) {
            $user = User::create([
                'ho_ten' => 'Người Dùng Mới',
                'email' => 'whitelisted@uit.edu.vn',
                'mat_khau' => Hash::make('Initial@123', ['rounds' => 12]),
                'loai_tai_khoan' => 'ToChuc',
                'ma_don_vi_to_chuc' => 1,
                'buoc_doi_mat_khau' => 1,
                'hoat_dong' => 1,
                'dong_y_nghi_dinh_13' => 1,
            ]);
        }

        $this->actingAs($user);

        // 1. /api/v1/auth/me should succeed
        $meResponse = $this->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'buoc_doi_mat_khau' => true,
                ],
            ]);

        // 2. /api/v1/auth/logout should succeed
        $logoutResponse = $this->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_change_password_validates_current_password_and_new_password_rules(): void
    {
        $user = User::create([
            'ho_ten' => 'Người Dùng Test Đổi Pass',
            'email' => 'changepass@uit.edu.vn',
            'mat_khau' => Hash::make('OldPassword@123', ['rounds' => 12]),
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => 1,
            'buoc_doi_mat_khau' => 1,
            'hoat_dong' => 1,
            'dong_y_nghi_dinh_13' => 1,
        ]);

        $this->actingAs($user);

        // 1. Wrong current password
        $response = $this->putJson('/api/v1/auth/change-password', [
            'mat_khau_hien_tai' => 'WrongPassword@123',
            'mat_khau_moi' => 'NewPassword@123',
            'xac_nhan_mat_khau_moi' => 'NewPassword@123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'INVALID_CURRENT_PASSWORD',
            ]);

        // 2. New password identical to old password
        $responseSame = $this->putJson('/api/v1/auth/change-password', [
            'mat_khau_hien_tai' => 'OldPassword@123',
            'mat_khau_moi' => 'OldPassword@123',
            'xac_nhan_mat_khau_moi' => 'OldPassword@123',
        ]);

        $responseSame->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);
    }

    public function test_successful_password_change_clears_buoc_doi_mat_khau_flag(): void
    {
        $user = User::create([
            'ho_ten' => 'Người Dùng Test Đổi Pass Thành Công',
            'email' => 'passsuccess@uit.edu.vn',
            'mat_khau' => Hash::make('OldPassword@123', ['rounds' => 12]),
            'loai_tai_khoan' => 'ToChuc',
            'ma_don_vi_to_chuc' => 1,
            'buoc_doi_mat_khau' => 1,
            'hoat_dong' => 1,
            'dong_y_nghi_dinh_13' => 1,
        ]);

        $this->actingAs($user);

        $response = $this->putJson('/api/v1/auth/change-password', [
            'mat_khau_hien_tai' => 'OldPassword@123',
            'mat_khau_moi' => 'BrandNewPassword@123',
            'xac_nhan_mat_khau_moi' => 'BrandNewPassword@123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'buoc_doi_mat_khau' => false,
                ],
            ]);

        // Verify DB update
        $user->refresh();
        $this->assertFalse((bool) $user->buoc_doi_mat_khau);
        $this->assertTrue(Hash::check('BrandNewPassword@123', $user->mat_khau));

        // Now general protected endpoints can be accessed
        $profileResponse = $this->putJson('/api/v1/auth/profile', [
            'so_dien_thoai' => '0988112233',
        ]);

        $profileResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'so_dien_thoai' => '0988112233',
                ],
            ]);
    }
}
