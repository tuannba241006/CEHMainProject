<?php

namespace Tests\Feature\Auth;

use App\Mail\RegistrationOtpMailable;
use App\Models\DangKyTamThoi;
use App\Models\User;
use App\Services\CryptoService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use DatabaseTransactions;

    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cryptoService = app(CryptoService::class);
    }

    public function test_student_can_register_and_receive_otp(): void
    {
        Mail::fake();

        $payload = [
            'ho_ten' => 'Nguyễn Văn Test',
            'mssv' => '22529999',
            'email' => '22529999@gm.uit.edu.vn',
            'mat_khau' => 'MatKhau@123456',
            'xac_nhan_mat_khau' => 'MatKhau@123456',
            'dong_y_nghi_dinh_13' => true,
            'so_dien_thoai' => '0901234567',
            'lop_sinh_hoat' => 'HTTT2022',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => '22529999@gm.uit.edu.vn',
                ],
            ]);

        $this->assertDatabaseHas('dang_ky_tam_thoi', [
            'email' => '22529999@gm.uit.edu.vn',
            'mssv' => '22529999',
            'so_lan_gui_otp' => 1,
        ]);

        Mail::assertQueued(RegistrationOtpMailable::class, function ($mail) {
            return $mail->hasTo('22529999@gm.uit.edu.vn');
        });
    }

    public function test_registration_fails_when_mssv_does_not_match_email(): void
    {
        $payload = [
            'ho_ten' => 'Trần Văn Fake',
            'mssv' => '22529999',
            'email' => '22528888@gm.uit.edu.vn',
            'mat_khau' => 'MatKhau@123456',
            'xac_nhan_mat_khau' => 'MatKhau@123456',
            'dong_y_nghi_dinh_13' => true,
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);

        $this->assertArrayHasKey('mssv', $response->json('errors'));
    }

    public function test_registration_fails_without_nghi_dinh_13_consent(): void
    {
        $payload = [
            'ho_ten' => 'Lê Văn Không Đồng Ý',
            'mssv' => '22521111',
            'email' => '22521111@gm.uit.edu.vn',
            'mat_khau' => 'MatKhau@123456',
            'xac_nhan_mat_khau' => 'MatKhau@123456',
            'dong_y_nghi_dinh_13' => false,
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);

        $this->assertArrayHasKey('dong_y_nghi_dinh_13', $response->json('errors'));
    }

    public function test_registration_fails_when_email_already_registered(): void
    {
        $existing = User::where('loai_tai_khoan', 'SinhVien')->first();
        $this->assertNotNull($existing);

        $payload = [
            'ho_ten' => 'Người Trùng Lặp',
            'mssv' => $existing->mssv,
            'email' => $existing->email,
            'mat_khau' => 'MatKhau@123456',
            'xac_nhan_mat_khau' => 'MatKhau@123456',
            'dong_y_nghi_dinh_13' => true,
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
            ]);
    }

    public function test_can_resend_registration_otp_within_limit(): void
    {
        Mail::fake();

        $plainOtp = '123456';
        DangKyTamThoi::create([
            'email' => '22527777@gm.uit.edu.vn',
            'ho_ten' => 'Nguyễn Cần Gửi Lại',
            'mssv' => '22527777',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'mat_khau' => Hash::make('Secret@123'),
            'dong_y_nghi_dinh_13' => true,
            'ma_otp_hash' => $this->cryptoService->hashOtp($plainOtp),
            'het_han_otp' => now()->addMinutes(10),
            'so_lan_nhap_sai' => 0,
            'so_lan_gui_otp' => 1,
            'cua_so_gui_otp_tu' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/resend-registration-otp', [
            'email' => '22527777@gm.uit.edu.vn',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => '22527777@gm.uit.edu.vn',
                    'so_lan_gui_con_lai' => 1,
                ],
            ]);

        Mail::assertQueued(RegistrationOtpMailable::class);
    }

    public function test_resend_registration_otp_fails_when_rate_limit_exceeded(): void
    {
        DangKyTamThoi::create([
            'email' => '22526666@gm.uit.edu.vn',
            'ho_ten' => 'Spam OTP',
            'mssv' => '22526666',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'mat_khau' => Hash::make('Secret@123'),
            'dong_y_nghi_dinh_13' => true,
            'ma_otp_hash' => $this->cryptoService->hashOtp('123456'),
            'het_han_otp' => now()->addMinutes(10),
            'so_lan_nhap_sai' => 0,
            'so_lan_gui_otp' => 3,
            'cua_so_gui_otp_tu' => now()->subMinutes(2),
        ]);

        $response = $this->postJson('/api/v1/auth/resend-registration-otp', [
            'email' => '22526666@gm.uit.edu.vn',
        ]);

        $response->assertStatus(429)
            ->assertJson([
                'success' => false,
                'error' => 'RATE_LIMIT_EXCEEDED',
            ]);
    }

    public function test_verify_registration_otp_fails_with_invalid_code(): void
    {
        DangKyTamThoi::create([
            'email' => '22525555@gm.uit.edu.vn',
            'ho_ten' => 'Nhập Sai OTP',
            'mssv' => '22525555',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'mat_khau' => Hash::make('Secret@123'),
            'dong_y_nghi_dinh_13' => true,
            'ma_otp_hash' => $this->cryptoService->hashOtp('654321'),
            'het_han_otp' => now()->addMinutes(10),
            'so_lan_nhap_sai' => 0,
            'so_lan_gui_otp' => 1,
            'cua_so_gui_otp_tu' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'email' => '22525555@gm.uit.edu.vn',
            'ma_otp' => '000000',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'OTP_INVALID',
            ]);

        $this->assertDatabaseHas('dang_ky_tam_thoi', [
            'email' => '22525555@gm.uit.edu.vn',
            'so_lan_nhap_sai' => 1,
        ]);
    }

    public function test_verify_registration_otp_locks_after_5_failures(): void
    {
        DangKyTamThoi::create([
            'email' => '22524444@gm.uit.edu.vn',
            'ho_ten' => 'Nhập Sai Quá Hạn',
            'mssv' => '22524444',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'mat_khau' => Hash::make('Secret@123'),
            'dong_y_nghi_dinh_13' => true,
            'ma_otp_hash' => $this->cryptoService->hashOtp('654321'),
            'het_han_otp' => now()->addMinutes(10),
            'so_lan_nhap_sai' => 5,
            'so_lan_gui_otp' => 1,
            'cua_so_gui_otp_tu' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'email' => '22524444@gm.uit.edu.vn',
            'ma_otp' => '654321',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'OTP_ATTEMPTS_EXCEEDED',
            ]);
    }

    public function test_verify_registration_otp_fails_when_expired(): void
    {
        DangKyTamThoi::create([
            'email' => '22523333@gm.uit.edu.vn',
            'ho_ten' => 'OTP Quá Hạn',
            'mssv' => '22523333',
            'lop_sinh_hoat' => 'HTTT2022',
            'khoa' => 'Khoa Hệ thống Thông tin',
            'mat_khau' => Hash::make('Secret@123'),
            'dong_y_nghi_dinh_13' => true,
            'ma_otp_hash' => $this->cryptoService->hashOtp('111222'),
            'het_han_otp' => now()->subMinute(),
            'so_lan_nhap_sai' => 0,
            'so_lan_gui_otp' => 1,
            'cua_so_gui_otp_tu' => now()->subMinutes(15),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'email' => '22523333@gm.uit.edu.vn',
            'ma_otp' => '111222',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'OTP_EXPIRED',
            ]);
    }

    public function test_verify_registration_otp_success_creates_user_and_removes_temp(): void
    {
        $plainOtp = '987654';

        DangKyTamThoi::create([
            'email' => '22522222@gm.uit.edu.vn',
            'ho_ten' => 'Sinh Viên Thành Công',
            'mssv' => '22522222',
            'lop_sinh_hoat' => 'KHMT2022',
            'khoa' => 'Khoa Khoa học Máy tính',
            'mat_khau' => Hash::make('MatKhau@123', ['rounds' => 12]),
            'so_dien_thoai' => '0912345678',
            'ma_khoa' => 1,
            'dong_y_nghi_dinh_13' => true,
            'ma_otp_hash' => $this->cryptoService->hashOtp($plainOtp),
            'het_han_otp' => now()->addMinutes(10),
            'so_lan_nhap_sai' => 0,
            'so_lan_gui_otp' => 1,
            'cua_so_gui_otp_tu' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'email' => '22522222@gm.uit.edu.vn',
            'ma_otp' => $plainOtp,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => '22522222@gm.uit.edu.vn',
                    'mssv' => '22522222',
                    'ho_ten' => 'Sinh Viên Thành Công',
                    'loai_tai_khoan' => 'SinhVien',
                    'dong_y_nghi_dinh_13' => true,
                ],
            ]);

        $this->assertDatabaseHas('tai_khoan', [
            'email' => '22522222@gm.uit.edu.vn',
            'mssv' => '22522222',
            'loai_tai_khoan' => 'SinhVien',
            'hoat_dong' => 1,
        ]);

        $this->assertDatabaseMissing('dang_ky_tam_thoi', [
            'email' => '22522222@gm.uit.edu.vn',
        ]);
    }
}
