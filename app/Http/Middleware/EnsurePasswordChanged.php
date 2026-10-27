<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Whitelisted endpoints exempt from the buoc_doi_mat_khau flag (OpenAPI v3.2.3, UC-AUTH-02, UC-ADM-01).
     */
    protected const WHITELISTED_PATHS = [
        'api/v1/auth/me',
        'api/v1/auth/change-password',
        'api/v1/auth/logout',
        'api/auth/me',
        'api/auth/change-password',
        'api/auth/logout',
    ];

    protected const WHITELISTED_ROUTE_NAMES = [
        'auth.me',
        'auth.change-password',
        'auth.logout',
    ];

    /**
     * Handle incoming request:
     * 1. Check if user account is locked (hoat_dong = 0) -> 403 ACCOUNT_LOCKED
     * 2. Check if user must change password (buoc_doi_mat_khau = 1) -> 403 PASSWORD_CHANGE_REQUIRED
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // 1. Account locked check
        if (! (bool) $user->hoat_dong) {
            return response()->json([
                'success' => false,
                'error' => 'ACCOUNT_LOCKED',
                'message' => 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
            ], 403);
        }

        // 2. Mandatory password change check
        if ((bool) $user->buoc_doi_mat_khau) {
            $isWhitelisted = $request->is(self::WHITELISTED_PATHS) || $request->routeIs(self::WHITELISTED_ROUTE_NAMES);

            if (! $isWhitelisted) {
                return response()->json([
                    'success' => false,
                    'error' => 'PASSWORD_CHANGE_REQUIRED',
                    'message' => 'Bạn bắt buộc phải đổi mật khẩu lần đầu trước khi tiếp tục.',
                ], 403);
            }
        }

        return $next($request);
    }
}
