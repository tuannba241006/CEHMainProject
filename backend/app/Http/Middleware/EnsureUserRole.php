<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle incoming request and verify user role against allowed roles.
     * Supports formats:
     * - middleware('role:Admin')
     * - middleware('role:Admin,ToChuc')
     * - middleware('role:Admin', 'role:ToChuc')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'error' => 'UNAUTHENTICATED',
                'message' => 'Vui lòng đăng nhập để thực hiện thao tác này.',
            ], 401);
        }

        // Parse roles supporting comma-separated strings
        $allowedRoles = [];
        foreach ($roles as $roleGroup) {
            foreach (explode(',', $roleGroup) as $role) {
                $trimmed = trim($role);
                if ($trimmed !== '') {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        if (! in_array($user->loai_tai_khoan, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'error' => 'FORBIDDEN',
                'message' => 'Bạn không có quyền thực hiện thao tác này.',
            ], 403);
        }

        return $next($request);
    }
}
