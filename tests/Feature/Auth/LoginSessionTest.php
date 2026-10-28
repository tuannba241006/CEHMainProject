<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginSessionTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('login:22520001@gm.uit.edu.vn|127.0.0.1');
        RateLimiter::clear('login:22520001|127.0.0.1');
        RateLimiter::clear('login:admin@uit.edu.vn|127.0.0.1');
        RateLimiter::clear('login:pctsv@uit.edu.vn|127.0.0.1');
    }

    public function test_user_can_login_with_email_or_mssv(): void
    {
        $password = 'TestPassword@123';
        $user = User::create([
            'ho_ten' => 'Sinh Viên Đăng Nhập',
            'mssv' => '22528888',
            'email' => '22528888@gm.uit.edu.vn',
            'mat_khau' => Hash::make($password, ['rounds' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => true,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);

        // Login with Email
        $responseEmail = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => '22528888@gm.uit.edu.vn',
            'mat_khau' => $password,
        ]);

        $responseEmail->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => '22528888@gm.uit.edu.vn',
                    'mssv' => '22528888',
                ],
            ]);

        // Login with MSSV
        $responseMssv = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => '22528888',
            'mat_khau' => $password,
        ]);

        $responseMssv->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => '22528888@gm.uit.edu.vn',
                    'mssv' => '22528888',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => '22520001@gm.uit.edu.vn',
            'mat_khau' => 'SaiMatKhau@999',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => 'INVALID_CREDENTIALS',
            ]);
    }

    public function test_login_rate_limiting_blocks_after_5_failed_attempts(): void
    {
        $tenDangNhap = '22529999@gm.uit.edu.vn';

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'ten_dang_nhap' => $tenDangNhap,
                'mat_khau' => 'SaiMatKhau',
            ])->assertStatus(401);
        }

        // 6th attempt should be blocked by rate limiter
        $blockedResponse = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => $tenDangNhap,
            'mat_khau' => 'SaiMatKhau',
        ]);

        $blockedResponse->assertStatus(429)
            ->assertJson([
                'success' => false,
                'error' => 'RATE_LIMIT_EXCEEDED',
            ])
            ->assertHeader('Retry-After');
    }

    public function test_login_fails_when_account_is_locked(): void
    {
        $password = 'Secret@123';
        User::create([
            'ho_ten' => 'Tài Khoản Bị Khóa',
            'mssv' => '22527771',
            'email' => '22527771@gm.uit.edu.vn',
            'mat_khau' => Hash::make($password),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => true,
            'hoat_dong' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => '22527771@gm.uit.edu.vn',
            'mat_khau' => $password,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'ACCOUNT_LOCKED',
            ]);
    }

    public function test_student_login_enforces_single_active_session(): void
    {
        $password = 'Password@123';
        $student = User::create([
            'ho_ten' => 'Sinh Viên Single Session',
            'mssv' => '22526662',
            'email' => '22526662@gm.uit.edu.vn',
            'mat_khau' => Hash::make($password),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => true,
            'hoat_dong' => true,
        ]);

        // Insert an existing previous session into sessions table
        DB::table('sessions')->insert([
            'id' => 'previous_active_session_token_123',
            'user_id' => $student->ma_tai_khoan,
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0 Android',
            'payload' => serialize(['test' => true]),
            'last_activity' => time(),
        ]);

        $this->assertDatabaseHas('sessions', [
            'id' => 'previous_active_session_token_123',
            'user_id' => $student->ma_tai_khoan,
        ]);

        // Login new session on another device
        $response = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => '22526662@gm.uit.edu.vn',
            'mat_khau' => $password,
        ]);

        $response->assertStatus(200);

        // Previous session must be revoked
        $this->assertDatabaseMissing('sessions', [
            'id' => 'previous_active_session_token_123',
        ]);
    }

    public function test_admin_and_organizer_preserve_multiple_concurrent_sessions(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->assertNotNull($admin);

        // Insert existing session for admin
        DB::table('sessions')->insert([
            'id' => 'admin_session_device_1',
            'user_id' => $admin->ma_tai_khoan,
            'ip_address' => '10.0.0.1',
            'user_agent' => 'Mozilla/5.0 Desktop',
            'payload' => serialize(['admin' => true]),
            'last_activity' => time(),
        ]);

        // Login admin again (using actingAs or login API)
        $response = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => $admin->email,
            'mat_khau' => 'Admin@123',
        ]);

        $response->assertStatus(200);

        // Admin's previous session must still exist
        $this->assertDatabaseHas('sessions', [
            'id' => 'admin_session_device_1',
            'user_id' => $admin->ma_tai_khoan,
        ]);
    }

    public function test_user_can_logout_and_session_is_destroyed(): void
    {
        $student = User::where('loai_tai_khoan', 'SinhVien')->first();
        $this->assertNotNull($student);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => $student->email,
            'mat_khau' => 'Student@123',
        ]);

        $loginResponse->assertStatus(200);

        // Call /auth/logout
        $logoutResponse = $this->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Now calling /auth/me must return 401 UNAUTHENTICATED
        $meResponse = $this->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => 'UNAUTHENTICATED',
            ]);
    }
}
