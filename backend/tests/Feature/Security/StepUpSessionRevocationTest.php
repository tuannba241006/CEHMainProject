<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StepUpSessionRevocationTest extends TestCase
{
    public function test_reset_password_removes_all_database_sessions_for_the_account(): void
    {
        $this->assertSame('database', config('session.driver'), 'Test requires SESSION_DRIVER=database');

        $user = User::where('loai_tai_khoan', 'Admin')->firstOrFail();
        $user->mat_khau = Hash::make('BeforeReset#2026');
        $user->save();

        foreach (['ceh-r3-session-a', 'ceh-r3-session-b'] as $id) {
            DB::table('sessions')->insert([
                'id' => $id,
                'user_id' => $user->getAuthIdentifier(),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'R3 QA test',
                'payload' => base64_encode('a:0:{}'),
                'last_activity' => time(),
            ]);
        }

        // Reset token must reference a valid, unused OTP record.
        $otpId = DB::table('otp_quen_mat_khau')->insertGetId([
            'ma_tai_khoan' => $user->getAuthIdentifier(),
            'ma_otp_hash' => hash('sha256', '123456'),
            'het_han' => now()->addMinutes(10),
            'da_su_dung' => false,
            'so_lan_thu_sai' => 0,
            'thoi_gian_tao' => now(),
        ]);
        $token = 'r3-test-password-reset-token';
        Cache::put('password_reset_'.$token, [
            'user_id' => $user->getAuthIdentifier(),
            'otp_id' => $otpId,
            'email' => $user->email,
        ], now()->addMinutes(10));

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'reset_token' => $token,
            'mat_khau_moi' => 'AfterReset#2026',
            'xac_nhan_mat_khau_moi' => 'AfterReset#2026',
        ])->assertOk();

        $this->assertSame(0, DB::table('sessions')->where('user_id', $user->getAuthIdentifier())->count());
        $this->assertTrue(Hash::check('AfterReset#2026', $user->fresh()->mat_khau));
    }
}
