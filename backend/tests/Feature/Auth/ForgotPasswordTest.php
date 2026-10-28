<?php

namespace Tests\Feature\Auth;

use App\Mail\ForgotPasswordOtpMailable;
use App\Models\User;
use App\Services\CryptoService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use DatabaseTransactions;

    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cryptoService = app(CryptoService::class);
    }

    public function test_forgot_password_for_non_existent_email_prevents_enumeration_without_sending_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nonexistent999@gm.uit.edu.vn',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        Mail::assertNothingQueued();
    }

    public function test_forgot_password_generates_otp_and_queues_email(): void
    {
        Mail::fake();

        $user = User::create([
            'ho_ten' => 'Sinh Viên Quên Mật Khẩu',
            'mssv' => '22529901',
            'email' => '22529901@gm.uit.edu.vn',
            'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'buoc_doi_mat_khau' => 0,
            'hoat_dong' => 1,
            'dong_y_nghi_dinh_13' => 1,
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        Mail::assertQueued(ForgotPasswordOtpMailable::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });

        $this->assertDatabaseHas('otp_quen_mat_khau', [
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'da_su_dung' => 0,
        ]);
    }

    public function test_verify_forgot_password_otp_fails_with_wrong_code(): void
    {
        $user = User::create([
            'ho_ten' => 'Sinh Viên Quên Mật Khẩu 2',
            'mssv' => '22529902',
            'email' => '22529902@gm.uit.edu.vn',
            'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'buoc_doi_mat_khau' => 0,
            'hoat_dong' => 1,
            'dong_y_nghi_dinh_13' => 1,
        ]);

        $otpHash = $this->cryptoService->hashOtp('123456');

        DB::table('otp_quen_mat_khau')->insert([
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'ma_otp_hash' => $otpHash,
            'het_han' => now()->addMinutes(10),
            'so_lan_thu_sai' => 0,
            'da_su_dung' => 0,
            'thoi_gian_tao' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-forgot-password-otp', [
            'email' => $user->email,
            'ma_otp' => '999999', // Wrong code
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'OTP_INVALID',
            ]);

        $record = DB::table('otp_quen_mat_khau')
            ->where('ma_tai_khoan', $user->ma_tai_khoan)
            ->first();

        $this->assertEquals(1, $record->so_lan_thu_sai);
    }

    public function test_verify_forgot_password_otp_success_returns_reset_token(): void
    {
        $user = User::create([
            'ho_ten' => 'Sinh Viên Quên Mật Khẩu 3',
            'mssv' => '22529903',
            'email' => '22529903@gm.uit.edu.vn',
            'mat_khau' => Hash::make('Password@123', ['rounds' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'buoc_doi_mat_khau' => 0,
            'hoat_dong' => 1,
            'dong_y_nghi_dinh_13' => 1,
        ]);

        $plainOtp = '654321';
        $otpHash = $this->cryptoService->hashOtp($plainOtp);

        DB::table('otp_quen_mat_khau')->insert([
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'ma_otp_hash' => $otpHash,
            'het_han' => now()->addMinutes(10),
            'so_lan_thu_sai' => 0,
            'da_su_dung' => 0,
            'thoi_gian_tao' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-forgot-password-otp', [
            'email' => $user->email,
            'ma_otp' => $plainOtp,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertNotEmpty($response->json('data.reset_token'));
    }

    public function test_full_forgot_password_and_reset_password_lifecycle(): void
    {
        $user = User::create([
            'ho_ten' => 'Sinh Viên Quên Mật Khẩu 4',
            'mssv' => '22529904',
            'email' => '22529904@gm.uit.edu.vn',
            'mat_khau' => Hash::make('OldSecret@123', ['rounds' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'buoc_doi_mat_khau' => 0,
            'hoat_dong' => 1,
            'dong_y_nghi_dinh_13' => 1,
        ]);

        $plainOtp = '888999';
        $otpHash = $this->cryptoService->hashOtp($plainOtp);

        $otpId = DB::table('otp_quen_mat_khau')->insertGetId([
            'ma_tai_khoan' => $user->ma_tai_khoan,
            'ma_otp_hash' => $otpHash,
            'het_han' => now()->addMinutes(10),
            'so_lan_thu_sai' => 0,
            'da_su_dung' => 0,
            'thoi_gian_tao' => now(),
        ]);

        // 1. Verify OTP
        $verifyResponse = $this->postJson('/api/v1/auth/verify-forgot-password-otp', [
            'email' => $user->email,
            'ma_otp' => $plainOtp,
        ]);

        $verifyResponse->assertStatus(200);
        $resetToken = $verifyResponse->json('data.reset_token');

        // 2. Reset password using reset token
        $resetResponse = $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'reset_token' => $resetToken,
            'mat_khau_moi' => 'NewResetPassword@123',
            'xac_nhan_mat_khau_moi' => 'NewResetPassword@123',
        ]);

        $resetResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // 3. Verify OTP record is marked as used
        $otpRecord = DB::table('otp_quen_mat_khau')->where('id', $otpId)->first();
        $this->assertEquals(1, $otpRecord->da_su_dung);

        // 4. Try using the same token again -> should fail
        $reusedResponse = $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'reset_token' => $resetToken,
            'mat_khau_moi' => 'AnotherPassword@123',
            'xac_nhan_mat_khau_moi' => 'AnotherPassword@123',
        ]);

        $reusedResponse->assertStatus(400);

        // 5. User can login with new password
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'ten_dang_nhap' => $user->email,
            'mat_khau' => 'NewResetPassword@123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
