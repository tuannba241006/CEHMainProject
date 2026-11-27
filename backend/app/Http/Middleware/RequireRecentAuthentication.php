<?php

namespace App\Http\Middleware;

use App\Support\StepUpProof;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Protects sensitive endpoints after an explicit password reconfirmation. */
final class RequireRecentAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        // Rollout switch defaults to OFF until React UI / integration tests are ready.
        if (! config('ceh_security.step_up_enabled', false)) {
            return $next($request);
        }
        $user = $request->user();
        $ok = $user && $request->hasSession() && Auth::guard('web')->check()
            && (string) Auth::guard('web')->id() === (string) $user->getAuthIdentifier()
            && (string) $request->session()->get('ceh_step_up_user_id', '') === (string) $user->getAuthIdentifier()
            && is_string($request->session()->get(StepUpProof::FINGERPRINT_KEY))
            && hash_equals(StepUpProof::fingerprint($user), $request->session()->get(StepUpProof::FINGERPRINT_KEY))
            && (int) $request->session()->get('ceh_step_up_expires_at', 0) > now()->timestamp;
        if (! $ok) {
            return response()->json([
                'success' => false,
                'error' => 'REAUTHENTICATION_REQUIRED',
                'message' => 'Vui lòng xác thực lại trước khi thực hiện thao tác nhạy cảm.',
            ], 428);
        }

        return $next($request);
    }
}
