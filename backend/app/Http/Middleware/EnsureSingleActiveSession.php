<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleActiveSession
{
    /**
     * Enforce Single Active Session for 'SinhVien' users (NFR-SEC-01, UC-AUTH-02).
     * Admin and ToChuc roles are permitted multiple concurrent sessions.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->loai_tai_khoan === 'SinhVien' && $request->hasSession()) {
            $currentSessionId = $request->session()->getId();

            if (! empty($currentSessionId)) {
                DB::table('sessions')
                    ->where('user_id', $user->ma_tai_khoan)
                    ->where('id', '!=', $currentSessionId)
                    ->delete();
            }
        }

        return $next($request);
    }
}
