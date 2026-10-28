<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendRegistrationOtpRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\VerifyForgotPasswordOtpRequest;
use App\Http\Requests\Auth\VerifyRegistrationOtpRequest;
use App\Http\Resources\UserResource;
use App\Mail\ForgotPasswordOtpMailable;
use App\Mail\RegistrationOtpMailable;
use App\Models\DangKyTamThoi;
use App\Models\DonViToChuc;
use App\Models\OtpQuenMatKhau;
use App\Models\User;
use App\Services\CryptoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected CryptoService $cryptoService
    ) {}

    /**
     * UC-AUTH-01: Đăng ký tài khoản Sinh viên qua Email OTP
     * POST /api/v1/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $existing = DangKyTamThoi::where('email', $email)->first();

        // Rate limit check: max 3 attempts within 10 minutes window
        if ($existing && $existing->cua_so_gui_otp_tu) {
            $windowStart = $existing->cua_so_gui_otp_tu;
            if ($windowStart->gt(now()->subMinutes(10))) {
                if ($existing->so_lan_gui_otp >= 3) {
                    $retryAfter = 600 - now()->diffInSeconds($windowStart);

                    return $this->errorResponse(
                        'RATE_LIMIT_EXCEEDED',
                        'Bạn đã vượt quá số lần gửi mã OTP (tối đa 3 lần trong 10 phút). Vui lòng thử lại sau.',
                        ['retry_after' => max(1, $retryAfter)],
                        429,
                        ['Retry-After' => max(1, $retryAfter)]
                    );
                }
            } else {
                // Window expired, reset counter
                $existing->cua_so_gui_otp_tu = now();
                $existing->so_lan_gui_otp = 0;
            }
        }

        // Generate 6-digit OTP code
        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $otpHash = $this->cryptoService->hashOtp($otp);
        $passwordHash = Hash::make($request->input('mat_khau'), ['rounds' => 12]);

        $windowTime = ($existing && $existing->cua_so_gui_otp_tu && $existing->cua_so_gui_otp_tu->gt(now()->subMinutes(10)))
            ? $existing->cua_so_gui_otp_tu
            : now();

        $currentAttempts = $existing && $existing->cua_so_gui_otp_tu && $existing->cua_so_gui_otp_tu->gt(now()->subMinutes(10))
            ? (int) $existing->so_lan_gui_otp + 1
            : 1;

        $maKhoa = $request->input('ma_khoa');
        $khoaName = 'Khoa Hệ thống Thông tin';
        if ($maKhoa) {
            $donVi = DonViToChuc::find($maKhoa);
            if ($donVi) {
                $khoaName = $donVi->ten_don_vi;
            }
        }

        $tempRegistration = DangKyTamThoi::updateOrCreate(
            ['email' => $email],
            [
                'ho_ten' => $request->input('ho_ten'),
                'mssv' => $request->input('mssv'),
                'mat_khau' => $passwordHash,
                'so_dien_thoai' => $request->input('so_dien_thoai'),
                'lop_sinh_hoat' => $request->input('lop_sinh_hoat') ?: 'Chưa cập nhật',
                'ma_khoa' => $maKhoa,
                'khoa' => $khoaName,
                'dong_y_nghi_dinh_13' => true,
                'ma_otp_hash' => $otpHash,
                'het_han_otp' => now()->addMinutes(10),
                'so_lan_nhap_sai' => 0,
                'so_lan_gui_otp' => $currentAttempts,
                'cua_so_gui_otp_tu' => $windowTime,
            ]
        );

        // Queue verification email
        Mail::to($email)->queue(new RegistrationOtpMailable($otp, $request->input('ho_ten')));

        return $this->successResponse([
            'email' => $email,
            'het_han_otp' => $tempRegistration->het_han_otp->setTimezone('+07:00')->toIso8601String(),
            'so_lan_gui_con_lai' => max(0, 3 - $currentAttempts),
        ], 'Mã xác thực OTP đã được gửi đến email sinh viên của bạn. Vui lòng kiểm tra hộp thư (hiệu lực trong 10 phút).', 200);
    }

    /**
     * UC-AUTH-01: Gửi lại mã OTP kích hoạt tài khoản
     * POST /api/v1/auth/resend-registration-otp
     */
    public function resendRegistrationOtp(ResendRegistrationOtpRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $record = DangKyTamThoi::where('email', $email)->first();

        if (! $record) {
            return $this->errorResponse(
                'REGISTRATION_NOT_FOUND',
                'Không tìm thấy thông tin đăng ký chờ xác thực cho email này. Vui lòng đăng ký lại từ đầu.',
                null,
                404
            );
        }

        // Check 10 minutes rate limit window
        $windowStart = $record->cua_so_gui_otp_tu;
        if ($windowStart && $windowStart->gt(now()->subMinutes(10))) {
            if ($record->so_lan_gui_otp >= 3) {
                $retryAfter = 600 - now()->diffInSeconds($windowStart);

                return $this->errorResponse(
                    'RATE_LIMIT_EXCEEDED',
                    'Bạn đã vượt quá số lần gửi lại mã OTP (tối đa 3 lần trong 10 phút). Vui lòng thử lại sau.',
                    ['retry_after' => max(1, $retryAfter)],
                    429,
                    ['Retry-After' => max(1, $retryAfter)]
                );
            }
            $record->so_lan_gui_otp += 1;
        } else {
            $record->cua_so_gui_otp_tu = now();
            $record->so_lan_gui_otp = 1;
        }

        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $record->ma_otp_hash = $this->cryptoService->hashOtp($otp);
        $record->het_han_otp = now()->addMinutes(10);
        $record->so_lan_nhap_sai = 0;
        $record->save();

        Mail::to($email)->queue(new RegistrationOtpMailable($otp, $record->ho_ten));

        return $this->successResponse([
            'email' => $email,
            'het_han_otp' => $record->het_han_otp->setTimezone('+07:00')->toIso8601String(),
            'so_lan_gui_con_lai' => max(0, 3 - $record->so_lan_gui_otp),
        ], 'Mã OTP mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.', 200);
    }

    /**
     * UC-AUTH-01: Xác thực OTP và kích hoạt tài khoản
     * POST /api/v1/auth/verify-registration-otp
     */
    public function verifyRegistrationOtp(VerifyRegistrationOtpRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $otp = $request->input('ma_otp');

        $record = DangKyTamThoi::where('email', $email)->first();

        if (! $record) {
            return $this->errorResponse(
                'REGISTRATION_NOT_FOUND',
                'Không tìm thấy thông tin đăng ký chờ xác thực. Vui lòng thực hiện đăng ký tài khoản.',
                null,
                404
            );
        }

        // Check if OTP has expired
        if (now()->gt($record->het_han_otp)) {
            return $this->errorResponse(
                'OTP_EXPIRED',
                'Mã OTP đã hết hạn hiệu lực (quá 10 phút). Vui lòng yêu cầu gửi lại mã mới.',
                null,
                400
            );
        }

        // Check max attempt failures
        if ($record->so_lan_nhap_sai >= 5) {
            return $this->errorResponse(
                'OTP_ATTEMPTS_EXCEEDED',
                'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu gửi lại mã OTP mới.',
                null,
                400
            );
        }

        // Verify OTP hash with constant time
        $inputHash = $this->cryptoService->hashOtp($otp);
        if (! hash_equals($record->ma_otp_hash, $inputHash)) {
            $record->increment('so_lan_nhap_sai');
            $remaining = max(0, 5 - (int) $record->so_lan_nhap_sai);

            return $this->errorResponse(
                'OTP_INVALID',
                "Mã OTP không chính xác. Bạn còn {$remaining} lần thử.",
                ['so_lan_con_lai' => $remaining],
                400
            );
        }

        // OTP is correct -> Create User in transaction
        $user = DB::transaction(function () use ($record) {
            $newUser = User::create([
                'ho_ten' => $record->ho_ten,
                'mssv' => $record->mssv,
                'email' => $record->email,
                'mat_khau' => $record->mat_khau,
                'so_dien_thoai' => $record->so_dien_thoai,
                'lop_sinh_hoat' => $record->lop_sinh_hoat,
                'ma_khoa' => $record->ma_khoa,
                'loai_tai_khoan' => 'SinhVien',
                'dong_y_nghi_dinh_13' => true,
                'thoi_gian_dong_y_nd13' => now(),
                'buoc_doi_mat_khau' => false,
                'hoat_dong' => true,
            ]);

            $record->delete();

            return $newUser;
        });

        return $this->successResponse(
            new UserResource($user),
            'Xác thực tài khoản thành công! Bạn có thể đăng nhập vào hệ thống ngay bây giờ.',
            201
        );
    }

    /**
     * UC-AUTH-02: Đăng nhập hệ thống (Cookie SPA Sanctum & Single Active Session)
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $loginId = trim($request->input('ten_dang_nhap'));
        $password = $request->input('mat_khau');

        // Brute force rate limiting: 5 attempts per minute
        $throttleKey = 'login:'.Str::lower($loginId).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $retryAfter = RateLimiter::availableIn($throttleKey);

            return $this->errorResponse(
                'RATE_LIMIT_EXCEEDED',
                "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau {$retryAfter} giây.",
                ['retry_after' => $retryAfter],
                429,
                ['Retry-After' => $retryAfter]
            );
        }

        // Find user by MSSV or Email
        $user = User::where('email', $loginId)
            ->orWhere('mssv', $loginId)
            ->first();

        if (! $user || ! Hash::check($password, $user->mat_khau)) {
            RateLimiter::hit($throttleKey, 60);

            return $this->errorResponse(
                'INVALID_CREDENTIALS',
                'Thông tin tài khoản hoặc mật khẩu không chính xác.',
                null,
                401
            );
        }

        // Check account locked status
        if (! (bool) $user->hoat_dong) {
            return $this->errorResponse(
                'ACCOUNT_LOCKED',
                'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
                null,
                403
            );
        }

        RateLimiter::clear($throttleKey);

        // Perform login and session regeneration
        Auth::login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();

            // Enforce Single Active Session for SinhVien
            if ($user->isSinhVien()) {
                $currentSessionId = $request->session()->getId();
                if (! empty($currentSessionId)) {
                    DB::table('sessions')
                        ->where('user_id', $user->ma_tai_khoan)
                        ->where('id', '!=', $currentSessionId)
                        ->delete();
                }
            }
        }

        return $this->successResponse(
            new UserResource($user),
            'Đăng nhập thành công.',
            200
        );
    }

    /**
     * UC-AUTH-05: Đăng xuất an toàn và thu hồi phiên làm việc
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        try {
            if ($request->user()?->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            }
            if (method_exists(Auth::guard('sanctum'), 'forgetUser')) {
                Auth::guard('sanctum')->forgetUser();
            }
        } catch (\Throwable $e) {
            // Ignore if sanctum token/guard is not active
        }

        if ($request->hasSession()) {
            $sessionId = $request->session()->getId();
            if (! empty($sessionId)) {
                DB::table('sessions')->where('id', $sessionId)->delete();
            }
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        Auth::forgetGuards();
        $request->setUserResolver(fn () => null);

        return $this->successResponse(
            null,
            'Đăng xuất thành công.',
            200
        );
    }

    /**
     * UC-AUTH-03: Lấy thông tin tài khoản hiện tại
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse(
                'UNAUTHENTICATED',
                'Vui lòng đăng nhập để truy cập thông tin.',
                null,
                401
            );
        }

        return $this->successResponse(
            new UserResource($user),
            'Lấy thông tin tài khoản thành công.',
            200
        );
    }

    /**
     * UC-AUTH-03: Cập nhật hồ sơ cá nhân
     * PUT /api/v1/auth/profile
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validated();
        $user->fill($validated);
        $user->save();

        return $this->successResponse(
            new UserResource($user),
            'Cập nhật thông tin hồ sơ thành công.',
            200
        );
    }

    /**
     * UC-AUTH-03: Đổi mật khẩu tài khoản (Gỡ bỏ cờ buoc_doi_mat_khau)
     * PUT /api/v1/auth/change-password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->input('mat_khau_hien_tai'), $user->mat_khau)) {
            return $this->errorResponse(
                'INVALID_CURRENT_PASSWORD',
                'Mật khẩu hiện tại không chính xác.',
                null,
                422
            );
        }

        $user->mat_khau = Hash::make($request->input('mat_khau_moi'), ['rounds' => 12]);
        $user->buoc_doi_mat_khau = false;
        $user->save();

        return $this->successResponse(
            new UserResource($user),
            'Đổi mật khẩu thành công. Yêu cầu đổi mật khẩu lần đầu đã được gỡ bỏ.',
            200
        );
    }

    /**
     * UC-AUTH-04: Yêu cầu mã OTP khôi phục mật khẩu
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $user = User::where('email', $email)->first();

        // Always return generic success to prevent email enumeration (SRS UC-AUTH-04, NFR-SEC)
        if ($user && (bool) $user->hoat_dong) {
            $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            $otpHash = $this->cryptoService->hashOtp($otp);

            OtpQuenMatKhau::create([
                'ma_tai_khoan' => $user->ma_tai_khoan,
                'ma_otp_hash' => $otpHash,
                'het_han' => now()->addMinutes(10),
                'da_su_dung' => false,
                'so_lan_thu_sai' => 0,
            ]);

            Mail::to($email)->queue(new ForgotPasswordOtpMailable($otp, $user->ho_ten));
        }

        return $this->successResponse(
            null,
            'Nếu địa chỉ email tồn tại trên hệ thống, mã OTP khôi phục mật khẩu đã được gửi đến hộp thư của bạn (hiệu lực 10 phút).',
            200
        );
    }

    /**
     * UC-AUTH-04: Xác thực mã OTP khôi phục mật khẩu và cấp Reset Token
     * POST /api/v1/auth/verify-forgot-password-otp
     */
    public function verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $otp = $request->input('ma_otp');

        $user = User::where('email', $email)->first();

        if (! $user) {
            return $this->errorResponse(
                'OTP_INVALID',
                'Mã OTP không chính xác hoặc đã hết hạn.',
                null,
                400
            );
        }

        $otpRecord = OtpQuenMatKhau::where('ma_tai_khoan', $user->ma_tai_khoan)
            ->where('da_su_dung', false)
            ->latest('thoi_gian_tao')
            ->first();

        if (! $otpRecord || now()->gt($otpRecord->het_han)) {
            return $this->errorResponse(
                'OTP_EXPIRED',
                'Mã OTP đã hết hạn hiệu lực (quá 10 phút). Vui lòng yêu cầu mã mới.',
                null,
                400
            );
        }

        if ($otpRecord->so_lan_thu_sai >= 5) {
            return $this->errorResponse(
                'OTP_ATTEMPTS_EXCEEDED',
                'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.',
                null,
                400
            );
        }

        $inputHash = $this->cryptoService->hashOtp($otp);
        if (! hash_equals($otpRecord->ma_otp_hash, $inputHash)) {
            $otpRecord->increment('so_lan_thu_sai');
            $remaining = max(0, 5 - (int) $otpRecord->so_lan_thu_sai);

            return $this->errorResponse(
                'OTP_INVALID',
                "Mã OTP không chính xác. Bạn còn {$remaining} lần thử.",
                ['so_lan_con_lai' => $remaining],
                400
            );
        }

        // Generate one-time reset token valid for 15 minutes
        $resetToken = Str::random(64);
        Cache::put('password_reset_'.$resetToken, [
            'user_id' => $user->ma_tai_khoan,
            'otp_id' => $otpRecord->id,
            'email' => $email,
        ], now()->addMinutes(15));

        return $this->successResponse([
            'reset_token' => $resetToken,
            'het_han' => now()->addMinutes(15)->setTimezone('+07:00')->toIso8601String(),
        ], 'Xác thực OTP thành công. Vui lòng đặt mật khẩu mới trong vòng 15 phút.', 200);
    }

    /**
     * UC-AUTH-04: Đặt lại mật khẩu với Reset Token
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $token = $request->input('reset_token');
        $email = $request->input('email');
        $newPassword = $request->input('mat_khau_moi');

        $cachedData = Cache::get('password_reset_'.$token);

        if (! $cachedData || $cachedData['email'] !== $email) {
            return $this->errorResponse(
                'RESET_TOKEN_INVALID',
                'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
                null,
                400
            );
        }

        $user = User::find($cachedData['user_id']);

        if (! $user) {
            return $this->errorResponse(
                'USER_NOT_FOUND',
                'Không tìm thấy thông tin tài khoản người dùng.',
                null,
                404
            );
        }

        DB::transaction(function () use ($user, $newPassword, $cachedData, $token) {
            $user->mat_khau = Hash::make($newPassword, ['rounds' => 12]);
            $user->save();

            // Mark OTP as used
            OtpQuenMatKhau::where('id', $cachedData['otp_id'])->update([
                'da_su_dung' => true,
            ]);

            Cache::forget('password_reset_'.$token);
        });

        return $this->successResponse(
            null,
            'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới của bạn.',
            200
        );
    }
}
