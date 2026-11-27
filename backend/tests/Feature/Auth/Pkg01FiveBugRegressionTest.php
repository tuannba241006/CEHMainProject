<?php

namespace Tests\Feature\Auth;

use App\Mail\ForgotPasswordOtpMailable;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class Pkg01FiveBugRegressionTest extends TestCase
{
    use DatabaseTransactions;

    private function makeStudent(string $studentId): User
    {
        return User::create([
            'ho_ten' => 'PKG01 Regression Student',
            'mssv' => $studentId,
            'email' => $studentId.'@gm.uit.edu.vn',
            'mat_khau' => Hash::make('OldPassword@123'),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => 1,
            'hoat_dong' => 1,
            'buoc_doi_mat_khau' => 0,
        ]);
    }

    private function makeToken(User $user, string $token, int $otpId): void
    {
        Cache::put('password_reset_'.$token, [
            'user_id' => $user->getAuthIdentifier(),
            'otp_id' => $otpId,
            'email' => $user->email,
        ], now()->addMinutes(15));
    }

    private function makeOtp(User $user): int
    {
        return DB::table('otp_quen_mat_khau')->insertGetId([
            'ma_tai_khoan' => $user->getAuthIdentifier(),
            'ma_otp_hash' => hash('sha256', '123456'),
            'het_han' => now()->addMinutes(10),
            'so_lan_thu_sai' => 0,
            'da_su_dung' => 0,
            'thoi_gian_tao' => now(),
        ]);
    }

    private function resetPayload(User $user, string $token, string $pass): array
    {
        return [
            'email' => $user->email,
            'reset_token' => $token,
            'mat_khau_moi' => $pass,
            'xac_nhan_mat_khau_moi' => $pass,
        ];
    }

    /** BUG-PKG01-01: sibling tokens for same OTP cannot reset twice. */
    public function test_used_reset_otp_revokes_sibling_tokens(): void
    {
        $user = $this->makeStudent('25528101');
        $otpId = $this->makeOtp($user);
        $tokenA = 'test-reset-token-A-';
        // A/B use distinct valid cache tokens pointing to one OTP.
        $tokenA .= bin2hex(random_bytes(6));
        $tokenB = 'test-reset-token-B-'.bin2hex(random_bytes(6));
        $this->makeToken($user, $tokenA, $otpId);
        $this->makeToken($user, $tokenB, $otpId);
        try {
            $this->postJson('/api/v1/auth/reset-password',
                $this->resetPayload($user, $tokenA, 'FirstPassword@123'))
                ->assertStatus(200);
            $this->postJson('/api/v1/auth/reset-password',
                $this->resetPayload($user, $tokenB, 'SecondPassword@123'))
                ->assertStatus(400)
                ->assertJsonPath('error', 'RESET_TOKEN_INVALID');
            $this->assertTrue(Hash::check('FirstPassword@123', $user->fresh()->mat_khau));
            $this->assertFalse(Hash::check('SecondPassword@123', $user->fresh()->mat_khau));
        } finally {
            Cache::forget('password_reset_'.$tokenA);
            Cache::forget('password_reset_'.$tokenB);
        }
    }

    /** BUG-PKG01-02: a previous browser session is deleted by password reset. */
    public function test_reset_revokes_previous_database_sessions(): void
    {
        $user = $this->makeStudent('25528102');
        $otpId = $this->makeOtp($user);
        $token = 'test-reset-session-'.bin2hex(random_bytes(6));
        $this->makeToken($user, $token, $otpId);
        $oldSessionId = 'pkg01_old_session_'.bin2hex(random_bytes(8));
        DB::table('sessions')->insert([
            'id' => $oldSessionId,
            'user_id' => $user->getAuthIdentifier(),
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PKG01-Test',
            'payload' => 'test',
            'last_activity' => time(),
        ]);
        try {
            $this->postJson('/api/v1/auth/reset-password',
                $this->resetPayload($user, $token, 'ChangedPassword@123'))
                ->assertStatus(200);
            $this->assertDatabaseMissing('sessions', ['id' => $oldSessionId]);
        } finally {
            Cache::forget('password_reset_'.$token);
            DB::table('sessions')->where('id', $oldSessionId)->delete();
        }
    }

    /** BUG-PKG01-03: 4th forgot-password request within 10m is 429; no queued mail. */
    public function test_forgot_password_is_limited_to_three_requests_per_ten_minutes(): void
    {
        Mail::fake();
        $user = $this->makeStudent('25528103');
        $key = 'forgot-password:'.hash('sha256', strtolower($user->email));
        RateLimiter::clear($key);
        try {
            for ($i = 0; $i < 3; $i++) {
                $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
                    ->assertStatus(200);
            }
            $res = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email]);
            $res->assertStatus(429)->assertJsonPath('error', 'RATE_LIMIT_EXCEEDED')
                ->assertHeader('Retry-After');
            $this->assertGreaterThan(0, (int) $res->headers->get('Retry-After'));
            Mail::assertQueued(ForgotPasswordOtpMailable::class, 3);
        } finally {
            RateLimiter::clear($key);
        }
    }

    /** BUG-PKG01-04: 5 wrong attempts must lock next login for ~300s. */
    public function test_login_lockout_lasts_five_minutes(): void
    {
        $email = '25528104@gm.uit.edu.vn';
        $key = 'login:'.$email.'|127.0.0.1';
        RateLimiter::clear($key);
        try {
            for ($i = 0; $i < 5; $i++) {
                $this->postJson('/api/v1/auth/login', [
                    'ten_dang_nhap' => $email,
                    'mat_khau' => 'WrongPassword@123',
                ])->assertStatus(401);
            }
            $res = $this->postJson('/api/v1/auth/login', [
                'ten_dang_nhap' => $email,
                'mat_khau' => 'WrongPassword@123',
            ]);
            $res->assertStatus(429)->assertJsonPath('error', 'RATE_LIMIT_EXCEEDED')
                ->assertHeader('Retry-After');
            $this->assertGreaterThanOrEqual(270, (int) $res->headers->get('Retry-After'));
        } finally {
            RateLimiter::clear($key);
        }
    }

    /** BUG-PKG01-05: POST with OpenAPI v3.2.3's mat_khau_cu must work. */
    public function test_change_password_accepts_published_openapi_payload(): void
    {
        $user = $this->makeStudent('25528105');
        $this->actingAs($user);
        $this->postJson('/api/v1/auth/change-password', [
            'mat_khau_cu' => 'OldPassword@123',
            'mat_khau_moi' => 'NewPassword@123',
            'xac_nhan_mat_khau_moi' => 'NewPassword@123',
        ])->assertStatus(200);
        $this->assertTrue(Hash::check('NewPassword@123', $user->fresh()->mat_khau));
    }
}
